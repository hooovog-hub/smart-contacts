// SC-100: consent before any data goes to the AI provider (Apple 5.1.2(i)).
// A row in ai_consents = allowed (migration 0013); the server refuses AI calls without it (guard.ts → consume()).
// Before the first AI action the app asks with a sheet; the profile has a switch to turn AI off and on.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { c } from "@/theme/tokens";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

type Ctx = {
  /** null while loading. */
  consent: boolean | null;
  /** Resolves true if AI may be used: already allowed, or the user taps «Разрешить» now. */
  requireAiConsent: () => Promise<boolean>;
  /** Profile switch. Returns false if saving failed. */
  setAiConsent: (on: boolean) => Promise<boolean>;
};

const AiConsentCtx = createContext<Ctx>({
  consent: null,
  requireAiConsent: async () => false,
  setAiConsent: async () => false,
});

export const AI_CONSENT_POINTS = [
  "Имена, должности и компании ваших контактов, ваши заметки и названия разделов.",
  "Ваши вопросы помощнику.",
];

export function AiConsentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [consent, setConsent] = useState<boolean | null>(null);
  const [asking, setAsking] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    let alive = true;
    setConsent(null);
    if (!userId) return;
    supabase
      .from("ai_consents")
      .select("profile_id")
      .eq("profile_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (alive) setConsent(error ? false : !!data);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const setAiConsent = useCallback(
    async (on: boolean) => {
      if (!userId) return false;
      const { error } = on
        ? await supabase.from("ai_consents").upsert({ profile_id: userId }, { onConflict: "profile_id" })
        : await supabase.from("ai_consents").delete().eq("profile_id", userId);
      if (!error) setConsent(on);
      return !error;
    },
    [userId],
  );

  const requireAiConsent = useCallback(() => {
    if (consent) return Promise.resolve(true);
    if (!userId) return Promise.resolve(false);
    pending.current?.(false);
    setAsking(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
  }, [consent, userId]);

  const answer = useCallback(
    async (allow: boolean) => {
      const ok = allow ? await setAiConsent(true) : false;
      setAsking(false);
      pending.current?.(ok);
      pending.current = null;
    },
    [setAiConsent],
  );

  const value = useMemo(() => ({ consent, requireAiConsent, setAiConsent }), [consent, requireAiConsent, setAiConsent]);
  return (
    <AiConsentCtx.Provider value={value}>
      {children}
      <AiConsentSheet visible={asking} onAnswer={answer} />
    </AiConsentCtx.Provider>
  );
}

export const useAiConsent = () => useContext(AiConsentCtx);

function AiConsentSheet({ visible, onAnswer }: { visible: boolean; onAnswer: (allow: boolean) => Promise<void> }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const press = async (allow: boolean) => {
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
        <Text style={{ color: c.ink, fontSize: 20, fontWeight: "700" }}>Включить AI-помощника?</Text>
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
          Выключить можно в любой момент: «Профиль» → «AI-помощник».
        </Text>
        <Button kind="grad" title="Разрешить" loading={busy} onPress={() => press(true)} style={{ marginTop: 6 }} />
        <Button kind="ghost" title="Не сейчас" disabled={busy} onPress={() => press(false)} />
      </View>
    </Modal>
  );
}
