import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button, Section, Title, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { c, r } from "@/theme/tokens";

type Room = { id: string; title: string; kind: string | null; place: string | null; starts_at: string; room_members: { count: number }[] };
const MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

// Spec: docs/01-product/features/meetings-rooms.md
export default function Meetings() {
  const router = useRouter();
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  useFocusEffect(useCallback(() => {
    supabase.from("rooms").select("id, title, kind, place, starts_at, room_members(count)").order("starts_at", { ascending: false })
      .then(({ data }) => setRooms((data as Room[]) ?? []));
  }, []));
  const now = Date.now();
  const upcoming = rooms.filter((x) => new Date(x.starts_at).getTime() > now).reverse();
  const past = rooms.filter((x) => new Date(x.starts_at).getTime() <= now);

  const RoomRow = ({ x }: { x: Room }) => {
    const d = new Date(x.starts_at);
    const others = Math.max(0, (x.room_members?.[0]?.count ?? 1) - 1);
    return (
      <Pressable onPress={() => router.push(`/room/${x.id}`)} style={st.row}>
        <View style={{ width: 48, height: 52, borderRadius: 14, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: c.ink, fontSize: 19, fontWeight: "700" }}>{d.getDate()}</Text>
          <Text style={{ color: c.muted, fontSize: 11.5 }}>{MON[d.getMonth()]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.name} numberOfLines={1}>{x.title}</Text>
          <Text style={st.meta} numberOfLines={1}>{[x.place, `${others} чел.`].filter(Boolean).join(" · ")}</Text>
        </View>
        <Text style={{ color: c.muted, fontSize: 18 }}>›</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Title sub={`Привет, ${profile?.full_name.split(" ")[0] ?? ""}`}>Знакомства</Title>
        <LinearGradient colors={["#3A4BD8", "#E85BC4", "#FF8A3D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, gap: 8 }}>
          <Text style={{ color: "#fff", opacity: 0.85, fontSize: 12, fontWeight: "600", letterSpacing: 0.6 }}>ВАША ВИЗИТКА</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", letterSpacing: -0.5 }}>Покажите QR — и вас сохранят</Text>
          <Text style={{ color: "#fff", opacity: 0.85 }}>Собеседник откроет ваш профиль без приложения.</Text>
          <Button title="Мой QR" onPress={() => router.push("/profile/qr")} style={{ marginTop: 6, alignSelf: "flex-start" }} small />
        </LinearGradient>
        <Pressable onPress={() => router.push("/assistant")} style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 25, backgroundColor: c.surface }}>
          <Icon name="spark" size={18} color={c.accent} />
          <Text style={{ color: c.muted }}>Спросите AI: «Нужно решить вопрос с дверями»</Text>
        </Pressable>

        {upcoming.length ? <Section>Скоро</Section> : null}
        {upcoming.length ? <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>{upcoming.map((x) => <RoomRow key={x.id} x={x} />)}</View> : null}
        <Section>Встречи · {past.length}</Section>
        {past.length ? (
          <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>{past.map((x) => <RoomRow key={x.id} x={x} />)}</View>
        ) : (
          <View style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14 }}>
            <Text style={st.name}>Пока нет встреч</Text>
            <Text style={[st.meta, { marginTop: 4 }]}>Покажите QR на встрече — все участники сохранятся с профилями.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
