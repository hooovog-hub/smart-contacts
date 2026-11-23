import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AiConsentProvider } from "@/lib/aiConsent";
import { AuthProvider, useAuth } from "@/lib/auth";
import { installGlobalErrorHandler, reportError } from "@/lib/errorReport";
import { rememberInvite } from "@/lib/invite";
import { c } from "@/theme/tokens";

installGlobalErrorHandler();

/** Expo Router error boundary: a crashed screen shows a retry button instead of a blank screen, and is reported. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    reportError(error, { fatal: false, context: { kind: "boundary" } });
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: c.ink, fontSize: 20, fontWeight: "600", marginBottom: 8 }}>Что-то пошло не так</Text>
      <Text style={{ color: c.muted, textAlign: "center", marginBottom: 24 }}>
        Мы уже получили отчёт об ошибке. Попробуйте ещё раз.
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        style={{ backgroundColor: c.ink, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 }}
      >
        <Text style={{ color: c.bg, fontWeight: "600" }}>Попробовать снова</Text>
      </Pressable>
    </View>
  );
}

function Gate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Invite links (smartcontacts://i/<code>): remember the code until onboarding (src/lib/invite.ts).
  const url = Linking.useURL();
  useEffect(() => {
    if (!loading && !profile) rememberInvite(url); // only a new user can be "invited"
  }, [url, loading, profile]);

  useEffect(() => {
    if (loading) return;
    const top = segments[0] as string | undefined;
    if (top === "i") return router.replace(session ? "/" : "/sign-in"); // invite deep link: code already saved
    if (!session && top !== "sign-in") router.replace("/sign-in");
    else if (session && !profile && top !== "onboarding") router.replace("/onboarding");
    else if (session && profile && (top === "sign-in" || top === "onboarding")) router.replace("/");
  }, [session, profile, loading, segments, router]);

  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.ink} />
      </View>
    );
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AiConsentProvider>
        <StatusBar style="light" />
        <Gate />
      </AiConsentProvider>
    </AuthProvider>
  );
}
