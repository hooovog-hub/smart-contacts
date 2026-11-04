import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Avatar, Button, Chip, Field, Section } from "@/components/ui";
import { ProfileView } from "@/components/ProfileView";
import { useSections } from "@/lib/sections";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/lib/types";
import { c } from "@/theme/tokens";

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [x, setX] = useState<Contact | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const { sections } = useSections();

  const [room, setRoom] = useState<{ id: string; title: string; starts_at: string } | null>(null);
  useEffect(() => {
    supabase.from("contacts").select("*").eq("id", id).single().then(({ data }) => {
      const cx = data as Contact;
      setX(cx); setNote(cx?.note ?? "");
      if (cx?.met_room_id) supabase.from("rooms").select("id, title, starts_at").eq("id", cx.met_room_id).single().then(({ data: r }) => setRoom(r));
    });
  }, [id]);
  if (!x) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  // A hand-picked section is locked: the AI never moves this contact again.
  async function setCat(k: string) { setX({ ...x!, category_key: k }); await supabase.from("contacts").update({ category_key: k, category_locked: true }).eq("id", x!.id); }
  async function saveNote() { await supabase.from("contacts").update({ note: note.trim() || null }).eq("id", x!.id); setSaved(true); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="back" size={18} /></Pressable>
        {x.linked_profile_id ? <ProfileView id={x.linked_profile_id} /> : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Avatar name={x.display_name} seed={x.id} size={80} />
            <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700" }}>{x.display_name}</Text>
            {x.role ? <Text style={{ color: c.muted }}>{x.role}</Text> : null}
          </View>
        )}
        {x.phone ? <Button kind="grad" title={`Позвонить ${x.phone}`} onPress={() => Linking.openURL(`tel:${x.phone!.replace(/\s/g, "")}`)} style={{ marginTop: 18 }} /> : null}
        {room ? (
          <Pressable onPress={() => router.push(`/room/${room.id}`)} style={{ marginTop: 10, backgroundColor: c.surface, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="cal" size={18} />
            <Text style={{ color: c.ink, flex: 1 }}>Познакомились: {room.title}, {new Date(room.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</Text>
            <Text style={{ color: c.muted }}>›</Text>
          </Pressable>
        ) : null}
        <Section>Раздел</Section>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {sections.map((s) => <Chip key={s.key} label={s.name} color={s.color} active={x.category_key === s.key} onPress={() => setCat(s.key)} />)}
        </View>
        <Section>Моя заметка (видите только вы)</Section>
        <Field label="" value={note} onChangeText={(v) => { setNote(v); setSaved(false); }} multiline placeholder="Где познакомились, о чём говорили…" />
        <Button kind="ghost" small title={saved ? "Сохранено ✓" : "Сохранить заметку"} onPress={saveNote} />
      </ScrollView>
    </SafeAreaView>
  );
}
