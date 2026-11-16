import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dock } from "@/components/Dock";
import { Avatar, Chip, Pill, Section, Title, st } from "@/components/ui";
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
  const [book, setBook] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      supabase.from("ai_tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("contacts").select("id", { count: "exact", head: true }).eq("archived", false),
    ]);
    setTasks((data as AiTask[]) ?? []);
    setBook(count ?? 0);
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
      router.push(res.seek ? `/task/${res.taskId}?seek=${encodeURIComponent(res.seek)}` : `/task/${res.taskId}`);
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
        <Title sub={tasks.length ? "Скажите задачу — найду, кому позвонить" : undefined}>AI-помощник</Title>
        {tasks.length ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label={`Все ${tasks.length}`} active={f === "all"} onPress={() => setF("all")} />
              {used.map((k) => (
                <Chip key={k.key} label={k.name} active={f === k.key} onPress={() => setF(k.key)} />
              ))}
            </ScrollView>
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
              {recent.map((t) => (
                <Card key={t.id} t={t} />
              ))}
              {arch ? rest.map((t) => <Card key={t.id} t={t} />) : null}
            </View>
            <Section>Попробуйте</Section>
            <Examples onPick={send} disabled={busy} />
          </>
        ) : (
          <Intro book={book} onPick={send} busy={busy} />
        )}
      </ScrollView>
      <Dock placeholder="Напишите или скажите задачу" onSend={send} busy={busy} />
    </SafeAreaView>
  );
}

const EXAMPLES = [
  "⚖️ Нужен хороший юрист",
  "🛠 Ремонт в офисе",
  "💰 Ищу инвестора",
  "🩺 Нужен кардиолог",
  "✈️ Помощь с визой в США",
];

function Examples({ onPick, disabled }: { onPick: (t: string) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {EXAMPLES.map((e) => (
        <Pressable
          key={e}
          disabled={disabled}
          onPress={() => onPick(e.replace(/^\S+\s/, ""))}
          accessibilityRole="button"
          style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: c.surface2 }}
        >
          <Text style={{ color: c.ink, fontSize: 13 }}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Empty state that sells the assistant: the user's own number, a sample answer, one-tap tasks. */
function Intro({ book, onPick, busy }: { book: number | null; onPick: (t: string) => void; busy: boolean }) {
  const sample = [
    { n: "Арам Оганесян", kind: "Напрямую", color: c.ok, why: "юрист, сделки с жильём" },
    { n: "Сона Манукян", kind: "Может знать", color: c.accentInk, why: "риелтор, работает с юристами" },
  ];
  return (
    <View>
      <Text style={{ color: c.ink, fontSize: 20, fontWeight: "700", lineHeight: 27, marginTop: 4 }}>
        {book ? (
          <>
            В вашей книжке <Text style={{ color: c.accent }}>{book.toLocaleString("ru-RU")} человек</Text>.{"\n"}
          </>
        ) : null}
        Скажите, что нужно — найду, кто поможет.
      </Text>
      <Section>Так выглядит ответ</Section>
      <View style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 10 }}>
        <Text style={st.meta}>«Нужен юрист по недвижимости»</Text>
        {sample.map((p) => (
          <View key={p.n} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar name={p.n} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{p.n}</Text>
              <Text style={st.meta}>
                <Text style={{ color: p.color }}>{p.kind}</Text> · {p.why}
              </Text>
            </View>
            <Text style={{ color: c.accentInk, fontSize: 13 }}>Написать</Text>
          </View>
        ))}
        <Text style={[st.meta, { fontSize: 11.5 }]}>Пример. Ответ строится по вашим контактам.</Text>
      </View>
      <Section>Попробуйте</Section>
      <Examples onPick={onPick} disabled={busy} />
      <Text style={[st.meta, { textAlign: "center", marginTop: 18 }]}>
        Можно сказать голосом · 10 запросов в сутки · телефоны в AI не отправляются
      </Text>
    </View>
  );
}
