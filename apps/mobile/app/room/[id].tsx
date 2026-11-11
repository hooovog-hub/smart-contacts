import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Avatar, Pill, Section, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { c, r } from "@/theme/tokens";

type Room = { id: string; title: string; kind: string | null; place: string | null; starts_at: string; code: string };
type Member = {
  id: string;
  profile_id: string | null;
  guest_name: string | null;
  guest_role: string | null;
  profiles: { id: string; full_name: string; role: string | null; plan: string } | null;
};

// One meeting: who was there, who you talked to. Spec: docs/01-product/features/meetings-rooms.md
export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [talked, setTalked] = useState<Set<string>>(new Set());
  const [book, setBook] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    supabase
      .from("rooms")
      .select("id, title, kind, place, starts_at, code")
      .eq("id", id)
      .single()
      .then(({ data }) => setRoom(data as Room));
    supabase
      .from("room_members")
      .select("id, profile_id, guest_name, guest_role, profiles(id, full_name, role, plan)")
      .eq("room_id", id)
      .order("joined_at")
      .then(({ data }) => {
        const list = ((data as unknown as Member[]) ?? []).filter((m) => m.profile_id !== session?.user.id);
        setMembers(list);
        const ids = list.map((m) => m.profile_id).filter(Boolean) as string[];
        if (ids.length)
          supabase
            .from("contacts")
            .select("id, linked_profile_id")
            .in("linked_profile_id", ids)
            .then(({ data: cs }) =>
              setBook(new Map((cs ?? []).map((x) => [x.linked_profile_id as string, x.id as string]))),
            );
        supabase
          .from("meeting_marks")
          .select("member_id, talked")
          .in(
            "member_id",
            list.map((m) => m.id),
          )
          .then(({ data: ms }) =>
            setTalked(new Set((ms ?? []).filter((x) => x.talked).map((x) => x.member_id as string))),
          );
      });
  }, [id, session?.user.id]);

  if (!room) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const d = new Date(room.starts_at);
  const upcoming = d.getTime() > Date.now();

  async function toggleTalked(m: Member) {
    const on = !talked.has(m.id);
    const next = new Set(talked);
    if (on) next.add(m.id);
    else next.delete(m.id);
    setTalked(next);
    await supabase.from("meeting_marks").upsert({ owner_id: session!.user.id, member_id: m.id, talked: on });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: c.surface,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Icon name="back" size={18} />
        </Pressable>
        <Text style={{ color: c.muted, fontSize: 13, fontWeight: "600", letterSpacing: 0.4 }}>
          {(room.kind ?? "Встреча").toUpperCase()}
          {upcoming ? " · СКОРО" : ""}
        </Text>
        <Text style={{ color: c.ink, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, marginTop: 4 }}>
          {room.title}
        </Text>
        <Text style={[st.meta, { fontSize: 14, marginTop: 4 }]}>
          {d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })},{" "}
          {d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          {room.place ? ` · ${room.place}` : ""}
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <Pill text={`${members.length} участников`} tone="mute" />
          {!upcoming ? <Pill text={`Говорили: ${talked.size}`} /> : null}
          <Pill text={`Код ${room.code}`} tone="mute" />
        </View>

        <Section>{upcoming ? "Кто придёт" : "Кто был"}</Section>
        <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
          {members.map((m) => {
            const name = m.profiles?.full_name ?? m.guest_name ?? "Гость";
            const role = m.profiles?.role ?? m.guest_role ?? "";
            const contactId = m.profile_id ? book.get(m.profile_id) : undefined;
            const open = () =>
              contactId
                ? router.push(`/contact/${contactId}`)
                : m.profile_id
                  ? router.push(`/person/${m.profile_id}`)
                  : undefined;
            return (
              <View key={m.id} style={st.row}>
                <Pressable onPress={open} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={name} seed={m.profile_id ?? m.id} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.name} numberOfLines={1}>
                      {name}
                      {m.profiles && m.profiles.plan !== "free" ? (
                        <Text style={{ color: c.accent, fontSize: 11 }}> PRO</Text>
                      ) : null}
                    </Text>
                    <Text style={st.meta} numberOfLines={1}>
                      {role}
                    </Text>
                  </View>
                </Pressable>
                {!upcoming ? (
                  <Pressable
                    onPress={() => toggleTalked(m)}
                    accessibilityLabel="Говорили"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: talked.has(m.id) ? c.okBg : c.surface2,
                    }}
                  >
                    <Icon name="check" size={16} color={talked.has(m.id) ? c.ok : c.muted} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
        {!upcoming ? (
          <Text style={[st.meta, { marginTop: 8 }]}>
            Отметьте ✓ тех, с кем говорили — так легче вспомнить их потом.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
