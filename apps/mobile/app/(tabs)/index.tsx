// "Сегодня" (replaces the meetings home; rooms moved to the backlog). A daily reason to open the app:
// meet someone (QR), birthdays, people worth writing to today, recent acquaintances.
// Spec: docs/01-product/features/today.md · Mockup: docs/02-design/mockups/package-v2.png
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Avatar, Section, st } from "@/components/ui";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import {
  type BirthdayContact,
  birthdayMessage,
  localDay,
  type UpcomingBirthday,
  upcomingBirthdays,
  whatsappUrl,
  whenLabel,
} from "@/lib/today.logic";
import { c, r } from "@/theme/tokens";

type Pick = {
  contact_id: string;
  reason: string;
  message: string;
  contacts: { display_name: string; role: string | null; phone: string | null } | null;
};
type Recent = { id: string; display_name: string; role: string | null; note: string | null; created_at: string };

const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

async function openMessage(phone: string | null | undefined, text: string) {
  const wa = whatsappUrl(phone, text);
  if (wa && (await Linking.canOpenURL("whatsapp://send").catch(() => false))) return Linking.openURL(wa);
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  if (digits)
    return Linking.openURL(`sms:${digits}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(text)}`);
  Alert.alert("Нет номера", "У этого контакта нет телефона.");
}

export default function Today() {
  const router = useRouter();
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  const load = useCallback(async () => {
    const day = localDay();
    const [{ data: bd }, { data: rc }] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, display_name, phone, birthday")
        .not("birthday", "is", null)
        .eq("archived", false)
        .eq("is_demo", false),
      supabase
        .from("contacts")
        .select("id, display_name, role, note, created_at")
        .neq("source", "phonebook")
        .eq("archived", false)
        .eq("is_demo", false)
        .gte("created_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    setBirthdays(upcomingBirthdays((bd as BirthdayContact[]) ?? [], day));
    setRecent((rc as Recent[]) ?? []);
    const { data, error } = await supabase.functions.invoke<{ picks: Pick[] }>("daily-picks", { body: { day } });
    if (error) {
      reportError(error, { context: { kind: "daily-picks" } });
      setPicks([]);
    } else setPicks(data?.picks ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const now = new Date();
  const addNote = (x: Recent) =>
    Alert.prompt?.(
      "Где познакомились?",
      `Пара слов о ${x.display_name}: где встретились, о чём говорили.`,
      async (text) => {
        if (!text?.trim()) return;
        const note = [x.note, text.trim()].filter(Boolean).join("\n");
        await supabase.from("contacts").update({ note, met_at: new Date().toISOString() }).eq("id", x.id);
        load();
      },
      "plain-text",
    );

  const Row = ({
    id,
    name,
    meta,
    action,
    onPress,
    onAction,
  }: {
    id: string;
    name: string;
    meta: string;
    action: string;
    onPress?: () => void;
    onAction: () => void;
  }) => (
    <Pressable onPress={onPress} style={[st.row, { gap: 10 }]}>
      <Avatar name={name} seed={id} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={st.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={st.meta} numberOfLines={2}>
          {meta}
        </Text>
      </View>
      <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
        <Text style={{ color: c.accentInk, fontSize: 13.5 }}>{action}</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={st.title}>Сегодня</Text>
        <Text style={st.sub}>
          {WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert("Познакомиться", undefined, [
              { text: "Показать мой QR", onPress: () => router.push("/profile/qr") },
              { text: "Сканировать визитку собеседника", onPress: () => router.push("/scan") },
              { text: "Отмена", style: "cancel" },
            ])
          }
          accessibilityRole="button"
          style={{ marginTop: 14 }}
        >
          <LinearGradient
            colors={["#FFB547", "#FF7A59", "#E85BC4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 27,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <Icon name="qr" size={20} color={c.onGrad} />
            <Text style={{ color: c.onGrad, fontSize: 16, fontWeight: "700" }}>Познакомиться</Text>
          </LinearGradient>
        </Pressable>
        <Text style={[st.meta, { textAlign: "center", marginTop: 6 }]}>
          Показать мой QR или отсканировать визитку собеседника
        </Text>

        {birthdays.length ? (
          <>
            <Section>🎂 Дни рождения</Section>
            <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
              {birthdays.map((b) => (
                <Row
                  key={b.contact.id}
                  id={b.contact.id}
                  name={b.contact.display_name}
                  meta={[whenLabel(b.inDays), b.age ? `${b.age} лет` : null].filter(Boolean).join(" · ")}
                  action={b.inDays === 0 ? "Поздравить" : "Написать"}
                  onPress={() => router.push(`/contact/${b.contact.id}`)}
                  onAction={() => openMessage(b.contact.phone, birthdayMessage(b.contact.display_name))}
                />
              ))}
            </View>
          </>
        ) : null}

        <Section right={picks?.length ? <Text style={st.meta}>{picks.length}</Text> : null}>
          ✉️ Стоит написать сегодня
        </Section>
        {picks === null ? (
          <ActivityIndicator color={c.muted} style={{ marginVertical: 16 }} />
        ) : picks.length ? (
          <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
            {picks.map((p) => (
              <Row
                key={p.contact_id}
                id={p.contact_id}
                name={p.contacts?.display_name ?? "Контакт"}
                meta={p.reason}
                action="Написать"
                onPress={() => router.push(`/contact/${p.contact_id}`)}
                onAction={() => openMessage(p.contacts?.phone, p.message)}
              />
            ))}
          </View>
        ) : (
          <Text style={st.meta}>
            Когда книжка разложена по разделам и появятся новые знакомства, здесь каждый день будут 3 человека, которым
            стоит написать.
          </Text>
        )}

        {recent.length ? (
          <>
            <Section>🤝 Новые знакомства</Section>
            <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
              {recent.map((x) => (
                <Row
                  key={x.id}
                  id={x.id}
                  name={x.display_name}
                  meta={x.note ? x.note.split("\n").pop()! : x.role || "Добавлен недавно"}
                  action={x.note ? "Открыть" : "Где познакомились?"}
                  onPress={() => router.push(`/contact/${x.id}`)}
                  onAction={() => (x.note ? router.push(`/contact/${x.id}`) : addNote(x))}
                />
              ))}
            </View>
          </>
        ) : null}

        <Pressable
          onPress={() => router.push("/invite")}
          style={{
            marginTop: 22,
            backgroundColor: c.surface,
            borderRadius: r.card,
            padding: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20 }}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.name}>Пригласите 10 друзей</Text>
            <Text style={st.meta}>и получите месяц Pro бесплатно</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: 18 }}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
