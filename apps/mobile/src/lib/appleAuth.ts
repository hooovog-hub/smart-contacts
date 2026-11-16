// Sign in with Apple (SC-011). Native Apple sheet → identity token → Supabase session.
// Supabase must have the Apple provider enabled with Client IDs: am.smartcontacts.app (and host.exp.Exponent
// for testing in Expo Go). See docs/01-product/features/sign-in.md.
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { supabase } from "./supabase";

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync());
}

/**
 * Shows the Apple sheet again (Face ID) and returns a fresh authorization code for token revocation
 * on account deletion. Returns null if the user cancelled.
 */
export async function getAppleAuthorizationCode(): Promise<string | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    return credential.authorizationCode ?? null;
  } catch (e) {
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return null;
    throw e;
  }
}

/** Returns true when signed in, false when the user cancelled the Apple sheet. Throws on real errors. */
export async function signInWithApple(): Promise<boolean> {
  // Replay protection: Apple gets the SHA-256 of a one-time nonce, Supabase checks it against the raw value.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return false;
    throw e;
  }
  if (!credential.identityToken) throw new Error("Apple did not return an identity token");

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple sends the name only on the very first sign-in; keep it so onboarding can prefill it.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
  // Not critical: a failure here must not show "sign-in failed" to a user who is already signed in.
  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => undefined);
  return true;
}
