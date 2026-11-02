import * as Contacts from "expo-contacts";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Avatar, Button, Chip, Section, Title, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { TEMP_RE, classify, orderedSections, sectionOf } from "@/lib/sections";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/lib/types";
import { c, r } from "@/theme/tokens";

// Spec: docs/01-product/features/contacts-book.md
export default function ContactsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [list, setList] = useState<Contact[]>([]);
  const [mode, setMode] = useState<"sec" | "az">("sec");
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("contacts").select("*").eq("archived", false).order("display_name");
    setList((data as Contact[]) ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function importPhone() {
    if (!session) return;
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") return Alert.alert("Нет доступа", "Разрешите доступ к контактам в настройках iPhone.");
    setBusy(true);
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Company, Contacts.Fields.JobTitle] });
    const existing = new Set(list.map((x) => (x.phone ?? "").replace(/\D/g, "")));
    const rows = data
      .filter((p) => p.name && p.phoneNumbers?.[0]?.number)
      .map((p) => {
        const phone = p.phoneNumbers![0].number!;
        const text = [p.name, p.company, p.jobTitle].filter(Boolean).join(" ");
        return { owner_id: session.user.id, display_name: p.name!, phone, role: [p.jobTitle, p.company].filter(Boolean).join(", ") || null, category_key: classify(text), source: "phonebook", is_temporary: TEMP_RE.test(text) };
      })
      .filter((x) => !existing.has(x.phone.replace(/\D/g, "")));
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from("contacts").insert(rows.slice(i, i + 200));
      if (error) { setBusy(false); return Alert.alert("Ошибка импорта", error.message); }
    }
    setBusy(false);
    await load();
    const sorted = rows.filter((x) => x.category_key !== "unsorted").length;
    Alert.alert("Готово", `Добавлено ${rows.length}. Разложено по разделам: ${sorted}.`);
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? list.filter((x) => [x.display_name, x.role, x.note, sectionOf(x.category_key).name].join(" ").toLowerCase().includes(s)) : list;
  }, [list, q]);
  const counts = useMemo(() => shown.reduce<Record<string, number>>((a, x) => ((a[x.category_key] = (a[x.category_key] ?? 0) + 1), a), {}), [shown]);
  const sections = orderedSections(counts);

  const Row = ({ x, showCat }: { x: Contact; showCat?: boolean }) => (
    <Pressable onPress={() => router.push(`/contact/${x.id}`)} style={st.row}>
      <Avatar name={x.display_name} seed={x.id} />
      <View style={{ flex: 1 }}>
        <Text style={st.name} numberOfLines={1}>{x.display_name}</Text>
        <Text style={st.meta} numberOfLines={1}>{[x.role, showCat ? sectionOf(x.category_key).name : null].filter(Boolean).join(" · ") || x.phone}</Text>
      </View>
    </Pressable>
  );
  const Group = ({ items, showCat }: { items: Contact[]; showCat?: boolean }) => (
    <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>{items.map((x) => <Row key={x.id} x={x} showCat={showCat} />)}</View>
  );

  let body;
  if (!list.length) {
    body = (
      <View style={{ marginTop: 24, gap: 12 }}>
        <Text style={[st.text, { color: c.muted }]}>Книжка пока пустая. Импортируйте контакты из телефона — разложим их по разделам: Семья, Работа, Друзья, Ремонт…</Text>
        <Button kind="grad" title="Импортировать из телефона" onPress={importPhone} loading={busy} />
      </View>
    );
  } else if (mode === "az" || q) {
    const groups = new Map<string, Contact[]>();
    shown.forEach((x) => { const L = (x.display_name[0] ?? "#").toUpperCase(); groups.set(L, [...(groups.get(L) ?? []), x]); });
    body = [...groups.entries()].map(([L, items]) => (<View key={L}><Text style={{ color: c.accent, fontWeight: "700", marginTop: 16, marginBottom: 6, marginLeft: 2 }}>{L}</Text><Group items={items} showCat /></View>));
  } else if (cat) {
    const s = sectionOf(cat);
    body = (<><Section right={<Pressable onPress={() => setCat(null)}><Text style={{ color: c.muted }}>‹ Все разделы</Text></Pressable>}>{s.name} · {counts[cat] ?? 0}</Section><Group items={shown.filter((x) => x.category_key === cat)} /></>);
  } else {
    body = sections.map((s) => {
      const items = shown.filter((x) => x.category_key === s.key);
      return (
        <View key={s.key}>
          <Section right={items.length > 3 ? <Pressable onPress={() => setCat(s.key)}><Text style={{ color: c.muted }}>Все ›</Text></Pressable> : null}>
            <Text style={{ color: s.color }}>● </Text>{s.name} · {items.length}
          </Section>
          <Group items={items.slice(0, 3)} />
        </View>
      );
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Title sub={`${list.length} человек`}>Контакты</Title>
          <View style={{ flexDirection: "row", backgroundColor: c.surface, borderRadius: r.pill, padding: 3 }}>
            {(["sec", "az"] as const).map((m) => (
              <Pressable key={m} onPress={() => { setMode(m); setCat(null); }} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.pill, backgroundColor: mode === m ? c.ink : "transparent" }}>
                <Text style={{ color: mode === m ? "#000" : c.muted, fontWeight: "600", fontSize: 12.5 }}>{m === "sec" ? "Разделы" : "А–Я"}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderRadius: r.pill, height: 44, paddingHorizontal: 14 }}>
          <Icon name="search" size={18} color={c.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Имя, роль или «кто чинит двери»" placeholderTextColor={c.muted} style={{ flex: 1, color: c.ink, fontSize: 15 }} />
        </View>
        {mode === "sec" && list.length > 0 && !q ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
            <Chip label={`Все ${list.length}`} active={!cat} onPress={() => setCat(null)} />
            {sections.map((s) => <Chip key={s.key} label={`${s.name} ${counts[s.key]}`} color={s.color} active={cat === s.key} onPress={() => setCat(s.key)} />)}
          </ScrollView>
        ) : null}
        {body}
        {list.length > 0 ? <Button kind="ghost" small title="Импортировать ещё из телефона" onPress={importPhone} loading={busy} style={{ marginTop: 20 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
