// Sign in with Apple token revocation on account deletion (Apple TN3194, App Review 5.1.1(v)).
// Needs Edge Function secrets: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (.p8 contents), APPLE_CLIENT_ID.
// The .p8 key lives only in Supabase secrets — never in the repo or the app.
import { importPKCS8, SignJWT } from "npm:jose@5.9.6";

const APPLE = "https://appleid.apple.com";

export type RevokeResult = "revoked" | "not_configured" | "sub_mismatch" | "failed";

/**
 * Exchanges a fresh authorization code (from the app's Apple sheet) for a refresh token and revokes it.
 * `expectedSub` is the user's Apple id from Supabase identities: a code of a different Apple account is ignored.
 * Never throws: account deletion must go on even if Apple is unreachable.
 */
export async function revokeAppleTokens(code: string, expectedSub: string | null): Promise<RevokeResult> {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY");
  const clientId = Deno.env.get("APPLE_CLIENT_ID") ?? "am.smartcontacts.app";
  if (!teamId || !keyId || !privateKey) return "not_configured";

  try {
    const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setSubject(clientId)
      .setAudience(APPLE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(key);

    const tokenRes = await fetch(`${APPLE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return "failed";
    const tokens = (await tokenRes.json()) as { refresh_token?: string; access_token?: string; id_token?: string };

    if (expectedSub && subOf(tokens.id_token) !== expectedSub) return "sub_mismatch";

    const token = tokens.refresh_token ?? tokens.access_token;
    if (!token) return "failed";
    const revokeRes = await fetch(`${APPLE}/auth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token,
        token_type_hint: tokens.refresh_token ? "refresh_token" : "access_token",
      }),
    });
    return revokeRes.ok ? "revoked" : "failed";
  } catch {
    return "failed";
  }
}

/** Reads `sub` from a JWT payload without verifying it (it comes straight from Apple over TLS). */
function subOf(jwt: string | undefined): string | null {
  try {
    const part = jwt?.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}
