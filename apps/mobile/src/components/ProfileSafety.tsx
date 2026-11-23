// SC-101 (Apple 1.2): «Пожаловаться» and «Заблокировать» under someone else's profile.
// Reports go to profile_reports (the team reviews them within 24 hours); a block hides your profile and phone
// from that person (migration 0014).
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

type Reason = "spam" | "abuse" | "fake" | "other";
const REASONS: { key: Reason; label: string }[] = [
  { key: "spam", label: "Спам или реклама" },
  { key: "abuse", label: "Оскорбления или угрозы" },
  { key: "fake", label: "Чужое имя, фейковый профиль" },
  { key: "other", label: "Другое" },
];

export function ProfileSafety({
  profileId,
  name,
  onBlocked,
}: {
  profileId: string;
  name: string;
  onBlocked?: () => void;
}) {
  const { session } = useAuth();
  const me = session?.user.id;
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!me || me === profileId) return;
    supabase
      .from("profile_blocks")
      .select("blocked_id")
      .eq("blocker_id", me)
      .eq("blocked_id", profileId)
      .maybeSingle()
      .then(({ data, error }) => setBlocked(error ? null : !!data));
  }, [me, profileId]);

  if (!me || me === profileId) return null;

  async function sendReport(reason: Reason) {
    const { error } = await supabase.from("profile_reports").insert({ reporter_id: me, target_id: profileId, reason });
    if (error) {
      reportError(error, { context: { kind: "profile_report" } });
      return Alert.alert("Не получилось отправить", "Проверьте интернет и попробуйте ещё раз.");
    }
    Alert.alert(
      "Жалоба отправлена",
      "Спасибо. Мы проверим профиль в течение 24 часов. Можно сразу заблокировать человека.",
      blocked
        ? [{ text: "OK" }]
        : [
            { text: "Готово", style: "cancel" },
            { text: "Заблокировать", style: "destructive", onPress: block },
          ],
    );
  }

  function report() {
    Alert.alert(`Пожаловаться на ${name}?`, "Что не так с профилем?", [
      ...REASONS.map((r) => ({ text: r.label, onPress: () => sendReport(r.key) })),
      { text: "Отмена", style: "cancel" as const },
    ]);
  }

  async function block() {
    const { error } = await supabase.from("profile_blocks").insert({ blocker_id: me, blocked_id: profileId });
    if (error && error.code !== "23505") {
      reportError(error, { context: { kind: "profile_block" } });
      return Alert.alert("Не получилось", "Проверьте интернет и попробуйте ещё раз.");
    }
    setBlocked(true);
    onBlocked?.();
  }

  function confirmBlock() {
    Alert.alert(
      `Заблокировать ${name}?`,
      "Этот человек больше не увидит ваш профиль и номер. Он не узнает о блокировке. Разблокировать можно здесь же.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Заблокировать", style: "destructive", onPress: block },
      ],
    );
  }

  async function unblock() {
    const { error } = await supabase.from("profile_blocks").delete().eq("blocker_id", me).eq("blocked_id", profileId);
    if (error) return Alert.alert("Не получилось", "Проверьте интернет и попробуйте ещё раз.");
    setBlocked(false);
  }

  return (
    <View style={{ marginTop: 28, gap: 4, alignItems: "center" }}>
      {blocked ? (
        <Text style={{ color: c.muted, fontSize: 13, textAlign: "center", marginBottom: 4 }}>
          Вы заблокировали этого человека: он не видит ваш профиль и номер.
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 24 }}>
        <Pressable onPress={report} accessibilityRole="button" hitSlop={8} style={{ paddingVertical: 8 }}>
          <Text style={{ color: c.muted, fontSize: 14 }}>Пожаловаться</Text>
        </Pressable>
        <Pressable
          onPress={blocked ? unblock : confirmBlock}
          accessibilityRole="button"
          hitSlop={8}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ color: blocked ? c.muted : c.danger, fontSize: 14 }}>
            {blocked ? "Разблокировать" : "Заблокировать"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
