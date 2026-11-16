import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import { SITE_URL } from "./config";
import { reportError } from "./errorReport";
import { supabase } from "./supabase";

/**
 * Apple Wallet card (SC-050): the server returns a 5-minute link, opened in an in-app Safari sheet that shows
 * "Add to Apple Wallet" and closes back into the app (no leftover Safari tab).
 */
export async function addToWallet(isPaid: boolean) {
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
