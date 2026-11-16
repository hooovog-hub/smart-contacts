// One-field bottom sheet for "+ Instagram", "+ О себе", "+ Город" … on "Мой профиль".
// Saves straight to profiles (own row; RLS allows only the owner). Spec: docs/01-product/features/profile.md
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneField } from "@/components/PhoneField";
import { Button, st } from "@/components/ui";
import { type AddKind, normalizeLink } from "@/lib/completeness.logic";
import { isPlausible } from "@/lib/phone.logic";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { c } from "@/theme/tokens";

type Target = Extract<AddKind, { kind: "field" } | { kind: "link" }>;

const COPY: Record<string, { title: string; hint: string; placeholder: string }> = {
  role: {
    title: "Чем занимаетесь",
    hint: "Коротко: должность и компания.",
    placeholder: "Основатель, Digital Factory",
  },
  bio: {
    title: "О себе",
    hint: "Пара предложений: чем занимаетесь и чем можете помочь.",
    placeholder: "Строю цифровые продукты для бизнеса…",
  },
  city: { title: "Город", hint: "Где вас можно встретить.", placeholder: "Ереван" },
  phone: { title: "Телефон", hint: "По нему вам позвонят и напишут в WhatsApp.", placeholder: "" },
  instagram: { title: "Instagram", hint: "Ссылка появится в профиле и визитке.", placeholder: "@username" },
  linkedin: { title: "LinkedIn", hint: "Имя профиля или ссылка.", placeholder: "linkedin.com/in/…" },
  site: { title: "Сайт", hint: "Сайт вашей компании или личный.", placeholder: "example.am" },
};

export function QuickAddSheet({
  profile,
  target,
  onClose,
  onSaved,
}: {
  profile: Profile;
  target: Target | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setText("");
    setPhone(profile.phone ?? null);
    setErr(null);
    // Only when the sheet opens/closes: a background profile reload must not wipe what the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (!target) return null;
  const key = target.kind === "field" ? target.column : target.key;
  const copy = COPY[key];

  async function save() {
    if (!target) return;
    let patch: Partial<Profile>;
    if (target.kind === "link") {
      const v = normalizeLink(target.key, text);
      if (!v) return setErr("Проверьте ссылку или имя профиля.");
      // Merge into the freshest links from the server, not the possibly stale copy in memory.
      const { data: cur, error: readErr } = await supabase
        .from("profiles")
        .select("links")
        .eq("id", profile.id)
        .single();
      if (readErr) return setErr("Не сохранилось. Проверьте интернет и попробуйте ещё раз.");
      patch = { links: { ...((cur?.links as Profile["links"]) ?? {}), [target.key]: v } };
    } else if (target.column === "phone") {
      if (!phone || !isPlausible(phone)) return setErr("Проверьте номер телефона.");
      patch = { phone };
    } else {
      if (!text.trim()) return setErr("Поле пустое.");
      patch = { [target.column]: text.trim() };
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return setErr("Не сохранилось. Проверьте интернет и попробуйте ещё раз.");
    onSaved();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#0008" }} onPress={onClose} accessibilityLabel="Закрыть" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: "#1C1C1E",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            paddingBottom: 16 + insets.bottom,
          }}
          accessibilityViewIsModal
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ color: c.ink, fontSize: 18, fontWeight: "700", flex: 1 }}>{copy.title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
              <Text style={{ color: c.accentInk, fontSize: 16 }}>Отмена</Text>
            </Pressable>
          </View>
          <Text style={{ color: c.muted, fontSize: 13.5, marginBottom: 14 }}>{copy.hint}</Text>
          {key === "phone" ? (
            <PhoneField label={null} value={phone} onChange={setPhone} />
          ) : (
            <TextInput
              autoFocus
              value={text}
              onChangeText={(t) => {
                setText(t);
                setErr(null);
              }}
              placeholder={copy.placeholder}
              placeholderTextColor={c.muted}
              autoCapitalize={target.kind === "link" ? "none" : "sentences"}
              autoCorrect={target.kind !== "link"}
              keyboardType={key === "site" ? "url" : "default"}
              multiline={key === "bio"}
              style={[st.input, key === "bio" && { height: 100, paddingTop: 12, textAlignVertical: "top" }]}
            />
          )}
          {err ? <Text style={{ color: c.danger, marginTop: 8 }}>{err}</Text> : null}
          <Button kind="grad" title="Сохранить" onPress={save} loading={busy} style={{ marginTop: 14 }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
