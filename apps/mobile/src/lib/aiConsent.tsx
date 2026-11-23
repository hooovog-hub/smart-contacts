// SC-100: consent before any data goes to the AI provider (Apple 5.1.2(i)).
// A row in ai_consents = allowed (migration 0013); the server refuses AI calls without it (guard.ts → consume(),
// 403 `ai_consent_required`). Before the first AI action the app asks with a sheet; the profile has a switch.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Alert, AppState, Linking, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { c } from "@/theme/tokens";
import { useAuth } from "./auth";
import { PRIVACY_URL } from "./legal";
import { supabase } from "./supabase";

type Ctx = {
  /** null while unknown (loading or offline). */
  consent: boolean | null;
  /** Resolves true if AI may be used: already allowed, or the user taps «Разрешить» now. */
  requireAiConsent: () => Promise<boolean>;
  /** Profile switch. Returns false if saving failed. */
  setAiConsent: (on: boolean) => Promise<boolean>;
  /** The server answered 403 ai_consent_required (e.g. AI was switched off on another device). */
  consentRevoked: () => void;
};

const AiConsentCtx = createContext<Ctx>({
  consent: null,
  requireAiConsent: async () => false,
  setAiConsent: async () => false,
  consentRevoked: () => {},
});

export const AI_CONSENT_POINTS = [
  "Имена, должности и компании ваших контактов, ваши заметки и названия разделов.",
  "Ваши вопросы помощнику.",
];

/** True if a Supabase Functions error is the server's "no AI consent" answer. */
export function isConsentRequired(error: unknown): boolean {
  return (error as { context?: Response } | null)?.context?.status === 403;
}

export function AiConsentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [consent, setConsent] = useState<boolean | null>(null);
  const consentRef = useRef<boolean | null>(null);
  const loading = useRef<Promise<boolean | null> | null>(null);
  const [asking, setAsking] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  const apply = useCallback((v: boolean | null) => {
    consentRef.current = v;
    setConsent(v);
  }, []);

  /** Reads consent from the database. On a network error it stays unknown (null), not "refused". */
  const load = useCallback(() => {
    if (!userId) return Promise.resolve(null);
    if (!loading.current) {
      loading.current = Promise.resolve(
        supabase.from("ai_consents").select("profile_id").eq("profile_id", userId).maybeSingle(),
      ).then(({ data, error }) => {
        loading.current = null;
        const v = error ? null : !!data;
        if (!error) apply(v);
        return v;
      });
    }
    return loading.current;
  }, [userId, apply]);

  // New user (or sign-out): forget the old answer and close a sheet that may still be open.
  useEffect(() => {
    apply(null);
    loading.current = null;
    setAsking(false);
    pending.current?.(false);
    pending.current = null;
    load();
  }, [load, apply]);

  // Unknown after an offline start: try again when the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active" && consentRef.current === null) load();
    });
    return () => sub.remove();
  }, [load]);

  const setAiConsent = useCallback(
    async (on: boolean) => {
      if (!userId) return false;
      // ignoreDuplicates = ON CONFLICT DO NOTHING: no UPDATE policy needed if the row already exists.
      const { error } = on
        ? await supabase
            .from("ai_consents")
            .upsert({ profile_id: userId }, { onConflict: "profile_id", ignoreDuplicates: true })
        : await supabase.from("ai_consents").delete().eq("profile_id", userId);
      if (!error) apply(on);
      return !error;
    },
    [userId, apply],
  );

  const requireAiConsent = useCallback(async () => {
    if (!userId) return false;
    if (consentRef.current === null) await load();
    if (consentRef.current) return true;
    pending.current?.(false);
    setAsking(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, [userId, load]);

  const consentRevoked = useCallback(() => apply(false), [apply]);

  /** Returns false if saving failed: the sheet then stays open. */
  const answer = useCallback(
    async (allow: boolean) => {
      if (allow && !(await setAiConsent(true))) {
        Alert.alert("Не получилось сохранить", "Проверьте интернет и нажмите «Разрешить» ещё раз.");
        return false;
      }
      setAsking(false);
      pending.current?.(allow);
      pending.current = null;
      return true;
    },
    [setAiConsent],
  );

  const value = useMemo(
    () => ({ consent, requireAiConsent, setAiConsent, consentRevoked }),
    [consent, requireAiConsent, setAiConsent, consentRevoked],
  );
  return (
    <AiConsentCtx.Provider value={value}>
      {children}
      <AiConsentSheet visible={asking} onAnswer={answer} />
    </AiConsentCtx.Provider>
  );
}

export const useAiConsent = () => useContext(AiConsentCtx);

function AiConsentSheet({ visible, onAnswer }: { visible: boolean; onAnswer: (allow: boolean) => Promise<boolean> }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const press = async (allow: boolean) => {
    if (busy) return; // a backdrop tap while saving must not cancel the action
    setBusy(true);
    try {
      await onAnswer(allow);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => press(false)}>
      <Pressable
        style={{ flex: 1, backgroundColor: "#0008" }}
        onPress={() => press(false)}
        accessibilityRole="button"
        accessibilityLabel="Не сейчас"
      />
      <View
        accessibilityViewIsModal
        style={{
          backgroundColor: "#1C1C1E",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: 20 + insets.bottom,
          gap: 12,
        }}
      >
        <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 20, fontWeight: "700" }}>
          Включить AI-помощника?
        </Text>
        <Text style={{ color: c.muted, fontSize: 15, lineHeight: 21 }}>
          AI подсказывает, кому написать, раскладывает контакты по разделам и ищет нужного человека. Для этого BeContact
          отправляет в Anthropic (Claude):
        </Text>
        {AI_CONSENT_POINTS.map((t) => (
          <Text key={t} style={{ color: c.ink, fontSize: 15, lineHeight: 21 }}>
            • {t}
          </Text>
        ))}
        <Text style={{ color: c.ink, fontSize: 15, lineHeight: 21 }}>
          <Text style={{ fontWeight: "700" }}>Телефоны и email контактов не отправляются.</Text> Anthropic не обучает
          модели на этих данных.
        </Text>
        <Text style={{ color: c.muted, fontSize: 13.5, lineHeight: 19 }}>
          Выключить можно в любой момент: «Профиль» → «AI-помощник».{" "}
          <Text
            onPress={() => Linking.openURL(PRIVACY_URL)} // Safari: an in-app sheet cannot open over this modal
            accessibilityRole="link"
            style={{ color: c.accentInk, textDecorationLine: "underline" }}
          >
            Политика конфиденциальности
          </Text>
        </Text>
        <Button kind="grad" title="Разрешить" loading={busy} onPress={() => press(true)} style={{ marginTop: 6 }} />
        <Button kind="ghost" title="Не сейчас" disabled={busy} onPress={() => press(false)} />
      </View>
    </Modal>
  );
}
