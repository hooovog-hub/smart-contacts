import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth";
import { c } from "@/theme/tokens";

function Gate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const top = segments[0] as string | undefined;
    if (!session && top !== "sign-in") router.replace("/sign-in");
    else if (session && !profile && top !== "onboarding") router.replace("/onboarding");
    else if (session && profile && (top === "sign-in" || top === "onboarding")) router.replace("/");
  }, [session, profile, loading, segments, router]);

  if (loading) return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.ink} /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Gate />
    </AuthProvider>
  );
}
