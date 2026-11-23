import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dock } from "@/components/Dock";
import { Icon } from "@/components/Icon";
import { Avatar, Button, Pill, st } from "@/components/ui";
import { addSeekFromAi, AiLimitError, askAssistant, catName } from "@/features/assistant";
import { isConsentRequired, useAiConsent } from "@/lib/aiConsent";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { AiMessage, AiTask, Contact } from "@/lib/types";
import { c, r } from "@/theme/tokens";

export default function TaskScreen() {
  const { id, seek: seekParam } = useLocalSearchParams<{ id: string; seek?: string }>();
  const { requireAiConsent, consentRevoked } = useAiConsent();
  const router = useRouter();
  const { profile } = useAuth();
  // "Сейчас ищу" offer from the AI (spec: docs/01-product/features/ai-assistant.md). Nothing is saved without "Добавить".
  const [seek, setSeek] = useState<string | null>(seekParam ?? null);
  const [task, setTask] = useState<AiTask | null>(null);
  const [msgs, setMsgs] = useState<AiMessage[]>([]);
  const [people, setPeople] = useState<Record<string, Contact>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from("ai_tasks").select("*").eq("id", id).single(),
      supabase.from("ai_messages").select("*").eq("task_id", id).order("created_at"),
    ]);
    setTask(t as AiTask);
    setMsgs((m as AiMessage[]) ?? []);
    const ids = [...new Set(((m as AiMessage[]) ?? []).flatMap((x) => x.people.map((p) => p.contactId)))];
    if (ids.length) {
      const { data: cs } = await supabase.from("contacts").select("*").in("id", ids);
      setPeople(Object.fromEntries(((cs as Contact[]) ?? []).map((x) => [x.id, x])));
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  async function send(t: string) {
    if (!(await requireAiConsent())) return;
    setBusy(true);
    try {
      const res = await askAssistant(t, id);
      if (res.seek) setSeek(res.seek);
    } catch (e) {
      if (e instanceof AiLimitError) Alert.alert("Лимит AI", e.message);
      else if (isConsentRequired(e)) {
        consentRevoked(); // AI was switched off elsewhere: ask again
        requireAiConsent();
      } else Alert.alert("AI не ответил", "Попробуйте ещё раз.");
    }
    setBusy(false);
    load();
  }
  async function acceptSeek() {
    if (!profile || !seek) return;
    try {
      await addSeekFromAi(profile.id, seek);
      setSeek(null);
      Alert.alert("Добавлено в профиль", `«${seek}» теперь в разделе «Сейчас ищу».`);
    } catch (e) {
      const limit = e instanceof Error && e.message.includes("seeks_limit");
      Alert.alert(
        "Не добавилось",
        limit ? "В «Сейчас ищу» уже 5 пунктов — отметьте найденное." : "Попробуйте ещё раз.",
      );
    }
  }
  async function done() {
    await supabase
      .from("ai_tasks")
      .update({ status: task?.status === "done" ? "open" : "done" })
      .eq("id", id);
    load();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 220 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
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
            <Icon name="back" size={18} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.ink, fontSize: 18, fontWeight: "700" }} numberOfLines={2}>
              {task?.title ?? ""}
            </Text>
            <Text style={st.meta}>
              {task ? `${catName(task.category)} · ${task.status === "done" ? "решено" : "в работе"}` : ""}
            </Text>
          </View>
        </View>
        <Button
          kind="ghost"
          small
          title={task?.status === "done" ? "Вернуть в работу" : "✓ Отметить решённой"}
          onPress={done}
        />
        <View style={{ gap: 14, marginTop: 14 }}>
          {msgs.map((m) =>
            m.role === "user" ? (
              <View
                key={m.id}
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  backgroundColor: c.surface2,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                }}
              >
                <Text style={st.text}>{m.content}</Text>
              </View>
            ) : (
              <View key={m.id} style={{ gap: 10 }}>
                <Text style={[st.text, { color: "#E5E5EA" }]}>{m.content}</Text>
                {m.people.map((p) => {
                  const x = people[p.contactId];
                  if (!x) return null;
                  return (
                    <View
                      key={p.contactId}
                      style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 8 }}
                    >
                      <Pressable
                        onPress={() => router.push(`/contact/${x.id}`)}
                        style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
                      >
                        <Avatar name={x.display_name} seed={x.id} />
                        <View style={{ flex: 1 }}>
                          <Text style={st.name}>{x.display_name}</Text>
                          <Text style={st.meta}>{x.role ?? ""}</Text>
                        </View>
                        <Pill
                          text={p.kind === "direct" ? "Напрямую" : "Может знать"}
                          tone={p.kind === "direct" ? "ok" : "warn"}
                        />
                      </Pressable>
                      {p.why ? <Text style={[st.text, { color: "#D1D1D6", fontSize: 14 }]}>{p.why}</Text> : null}
                      {p.ask ? (
                        <View style={{ backgroundColor: c.surface2, borderRadius: 12, padding: 10 }}>
                          <Text style={{ color: "#C7C7CC", fontSize: 13.5 }}>«{p.ask}»</Text>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                        {x.phone ? (
                          <Button
                            small
                            title="Позвонить"
                            onPress={() => Linking.openURL(`tel:${x.phone!.replace(/\s/g, "")}`)}
                          />
                        ) : null}
                        {p.ask ? (
                          <Button
                            small
                            kind="ghost"
                            title="Копировать сообщение"
                            onPress={async () => {
                              await Clipboard.setStringAsync(p.ask);
                              Alert.alert("Скопировано");
                            }}
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ),
          )}
          {busy ? <Text style={{ color: c.muted }}>Смотрю ваши контакты…</Text> : null}
        </View>
      </ScrollView>
      {seek ? (
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 104,
            backgroundColor: c.surface2,
            borderRadius: r.card,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ color: c.ink, fontSize: 14.5 }}>
            Добавить в профиль «Сейчас ищу: <Text style={{ fontWeight: "700" }}>{seek}</Text>»? Так вас быстрее найдут
            те, кто может помочь.
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button kind="grad" small title="Добавить" onPress={acceptSeek} style={{ flex: 1 }} />
            <Button kind="ghost" small title="Нет" onPress={() => setSeek(null)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}
      <Dock placeholder="Уточнить задачу…" onSend={send} busy={busy} />
    </SafeAreaView>
  );
}
