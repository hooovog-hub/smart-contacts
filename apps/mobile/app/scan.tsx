// Scan someone's Smart Contacts QR (smart-contacts.vercel.app/<handle>) and save them to the book in one step.
// Spec: docs/01-product/features/today.md («Познакомиться»)
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

/** Profile handle from a Smart Contacts QR, or null for any other code. */
export function handleFromQr(data: string): string | null {
  const host = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const m = data.trim().match(new RegExp(`^https?://${host.replace(/\./g, "\\.")}/([a-z0-9_.]{3,30})/?$`, "i"));
  return m ? m[1].toLowerCase() : null;
}

export default function Scan() {
  const router = useRouter();
  const { session } = useAuth();
  const [perm, requestPerm] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  async function onCode(data: string) {
    if (handled.current || !session) return;
    const handle = handleFromQr(data);
    if (!handle) return; // not our QR: keep scanning
    handled.current = true;
    setBusy(true);
    try {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone")
        .eq("handle", handle)
        .maybeSingle();
      if (!p) throw new Error("not_found");
      if (p.id === session.user.id) {
        Alert.alert("Это ваш QR 🙂", undefined, [{ text: "OK", onPress: () => (handled.current = false) }]);
        return;
      }
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("linked_profile_id", p.id)
        .eq("archived", false)
        .limit(1);
      if (!existing?.length) {
        const { error: insErr } = await supabase.from("contacts").insert({
          owner_id: session.user.id,
          linked_profile_id: p.id,
          display_name: p.full_name,
          role: p.role,
          phone: p.phone,
          source: "qr",
          met_at: new Date().toISOString(),
        });
        if (insErr) throw insErr;
      }
      router.replace(`/person/${p.id}`);
    } catch (e) {
      if (!(e instanceof Error && e.message === "not_found")) reportError(e, { context: { kind: "scan" } });
      const notFound = e instanceof Error && e.message === "not_found";
      Alert.alert(
        notFound ? "Профиль не найден" : "Не сохранилось",
        notFound ? "Этот QR не ведёт на профиль BeContact." : "Проверьте интернет и попробуйте ещё раз.",
        [{ text: "OK", onPress: () => (handled.current = false) }],
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        style={{
          position: "absolute",
          top: 56,
          left: 16,
          zIndex: 2,
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="x" size={18} />
      </Pressable>
      {!perm ? null : !perm.granted ? (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 14 }}>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: "700", textAlign: "center" }}>Нужна камера</Text>
          <Text style={{ color: c.muted, textAlign: "center" }}>Чтобы сканировать QR-визитки собеседников.</Text>
          <Button
            kind="grad"
            title={perm.canAskAgain ? "Разрешить" : "Открыть настройки"}
            onPress={() => (perm.canAskAgain ? requestPerm() : Linking.openSettings())}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={busy ? undefined : ({ data }) => onCode(data)}
          />
          <View style={{ position: "absolute", bottom: 60, left: 24, right: 24 }}>
            <Text style={{ color: "#fff", textAlign: "center", fontSize: 15 }}>
              Наведите на QR-визитку BeContact — контакт сохранится в книжку
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
