import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dock } from "@/components/Dock";
import { Chip, Pill, Section, Title, st } from "@/components/ui";
import { AiLimitError, askAssistant, catName, TASK_CATS } from "@/features/assistant";
import { supabase } from "@/lib/supabase";
import type { AiTask } from "@/lib/types";
import { c, r } from "@/theme/tokens";

export default function Assistant() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [f, setF] = useState("all");
  const [arch, setArch] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("ai_tasks").select("*").order("created_at", { ascending: false });
    setTasks((data as AiTask[]) ?? []);
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function send(t: string) {
    setBusy(true);
    try {
      const res = await askAssistant(t);
      router.push(`/task/${res.taskId}`);
    } catch (e) {
      if (e instanceof AiLimitError) Alert.alert("Лимит AI", e.message);
      else Alert.alert("AI не ответил", "Попробуйте ещё раз через минуту.");
    } finally {
      setBusy(false);
      load();
    }
  }

  const list = tasks.filter((t) => f === "all" || t.category === f);
  const recent = list.slice(0, 2),
    rest = list.slice(2);
  const used = TASK_CATS.filter((k) => tasks.some((t) => t.category === k.key));
  const Card = ({ t }: { t: AiTask }) => (
    <Pressable
      onPress={() => router.push(`/task/${t.id}`)}
      style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 8 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <Text style={[st.name, { flex: 1, fontWeight: "600" }]}>{t.title}</Text>
        <Pill text={catName(t.category)} tone="mute" />
      </View>
      <Text style={st.meta}>
        {t.status === "done"
          ? "✓ Решено"
          : new Date(t.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 220 }}>
        <Title sub="Скажите задачу — найду, кому позвонить">AI-помощник</Title>
        {tasks.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Chip label={`Все ${tasks.length}`} active={f === "all"} onPress={() => setF("all")} />
            {used.map((k) => (
              <Chip key={k.key} label={k.name} active={f === k.key} onPress={() => setF(k.key)} />
            ))}
          </ScrollView>
        ) : null}
        <Section
          right={
            rest.length ? (
              <Pressable onPress={() => setArch(!arch)}>
                <Text style={{ color: c.accentInk, fontWeight: "600", fontSize: 13 }}>
                  {arch ? "Скрыть архив ⌃" : `Архив · ${rest.length} ⌄`}
                </Text>
              </Pressable>
            ) : null
          }
        >
          Последние
        </Section>
        <View style={{ gap: 10 }}>
          {recent.length ? (
            recent.map((t) => <Card key={t.id} t={t} />)
          ) : (
            <Text style={[st.text, { color: c.muted }]}>
              Здесь пока пусто. Напишите задачу внизу, например: «Нужно решить вопрос с дверями».
            </Text>
          )}
          {arch ? rest.map((t) => <Card key={t.id} t={t} />) : null}
        </View>
      </ScrollView>
      <Dock placeholder="Напишите или скажите задачу" onSend={send} busy={busy} />
    </SafeAreaView>
  );
}
