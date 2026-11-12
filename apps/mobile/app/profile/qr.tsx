import { useRouter } from "expo-router";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { Alert, Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

/**
 * Apple Wallet card (SC-050): the server returns a 5-minute link, opened in an in-app Safari sheet that shows
 * "Add to Apple Wallet" and closes back into the app (no leftover Safari tab).
 */
async function addToWallet(isPaid: boolean) {
  if (!isPaid) {
    Alert.alert("Карта в Apple Wallet", "Доступна на тарифе Pro: визитка с QR всегда под рукой в Wallet.");
    return;
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  try {
    const res = await fetch(`${SITE_URL}/api/wallet`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
    if (res.ok && body.url) {
      await WebBrowser.openBrowserAsync(body.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        dismissButtonStyle: "close",
      });
      return;
    }
    if (res.status >= 500 && res.status !== 503)
      reportError(new Error(`wallet ${res.status}`), { context: { fn: "wallet" } });
    Alert.alert("Карта в Apple Wallet", body.message ?? "Не получилось. Попробуйте позже.");
  } catch (e) {
    reportError(e, { context: { fn: "wallet" } });
    Alert.alert("Карта в Apple Wallet", "Нет связи с сервером. Попробуйте позже.");
  }
}

export default function MyQR() {
  const { profile } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  const isPaid = profile.plan === "pro" || profile.plan === "business";
  const url = `${SITE_URL}/${profile.handle}`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
      <Pressable
        onPress={() => router.back()}
        style={{
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700" }}>{profile.full_name}</Text>
        <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 24 }}>
          <QRCode value={url} size={240} />
        </View>
        <Text style={{ color: c.muted, textAlign: "center" }}>
          Наведите камеру — откроется ваш профиль{"\n"}с кнопкой «Сохранить контакт»
        </Text>
        <Button
          kind="grad"
          title="Отправить ссылку"
          onPress={() => Share.share({ message: url })}
          style={{ alignSelf: "stretch" }}
        />
        <Button
          kind="ghost"
          title={isPaid ? "Добавить в Apple Wallet" : "Добавить в Apple Wallet · Pro"}
          loading={busy}
          onPress={async () => {
            setBusy(true);
            await addToWallet(isPaid);
            setBusy(false);
          }}
          style={{ alignSelf: "stretch" }}
        />
      </View>
    </SafeAreaView>
  );
}
