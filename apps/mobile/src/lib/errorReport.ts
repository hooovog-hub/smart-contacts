// Crash reports → Supabase table public.client_errors (read them in the Supabase dashboard).
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { buildReport, createThrottle } from "@/lib/errorReport.logic";

const allow = createThrottle();
const appVersion = Constants.expoConfig?.version ?? null;
const platform = `${Platform.OS} ${String(Platform.Version)}`;

/** Send an error report. Never throws and never blocks the UI. */
export function reportError(err: unknown, opts: { fatal?: boolean; context?: Record<string, unknown> } = {}) {
  try {
    const row = buildReport(err, { ...opts, appVersion, platform });
    if (__DEV__) console.warn("[reportError]", row.message);
    if (!allow(row.message)) return;
    supabase
      .from("client_errors")
      .insert(row)
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    /* reporting must never crash the app */
  }
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsT = { getGlobalHandler(): GlobalHandler; setGlobalHandler(h: GlobalHandler): void };

let installed = false;
/** Report uncaught JS errors, then let React Native handle them as before (red box in dev, crash in prod). */
export function installGlobalErrorHandler() {
  const eu = (globalThis as { ErrorUtils?: ErrorUtilsT }).ErrorUtils;
  if (installed || !eu) return;
  installed = true;
  const previous = eu.getGlobalHandler();
  eu.setGlobalHandler((error, isFatal) => {
    reportError(error, { fatal: Boolean(isFatal), context: { kind: "global" } });
    previous(error, isFatal);
  });
}
