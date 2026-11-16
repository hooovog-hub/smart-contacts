// "Пригласить друзей": progress to the bonus, personal link, share sheet, and one SMS to selected contacts.
// Also opened right after importing contacts (?from=import). Spec: docs/01-product/features/invites.md
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SMS from "expo-sms";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Avatar, Button, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { INVITES_PER_REWARD, inviteLink, inviteMessage, type InviteStats, myInviteStats } from "@/lib/invite";
import { supabase } from "@/lib/supabase";
import { c, grad, r } from "@/theme/tokens";

type Row = { id: string; display_name: string; phone: string | null; category_key: string };
const MAX_SMS = 50;

export default function Invite() {
  const { profile } = useAuth();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [stats, setStats] = useState<InviteStats>({ joined: 0, counted: 0, rewards: 0 });
  const [rows, setRows] = useState<Row[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  useEffect(() => {
    myInviteStats().then(setStats);
    supabase
      .from("contacts")
      .select("id, display_name, phone, category_key")
      .eq("archived", false)
      .eq("is_demo", false)
      .not("phone", "is", null)
      .order("display_name")
      .limit(3000)
      .then(({ data }) => setRows((data as Row[]) ?? []));
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = needle ? rows.filter((x) => x.display_name.toLowerCase().includes(needle)) : rows;
    // Sorted people first (they are more likely real acquaintances), then the rest.
    return [...f].sort((a, b) => Number(a.category_key === "unsorted") - Number(b.category_key === "unsorted"));
  }, [rows, q]);

  if (!profile) return null;
  const code = profile.invite_code ?? "";
  const link = code ? inviteLink(code) : "";
  const progress = stats.counted % INVITES_PER_REWARD;

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SMS) next.add(id);
      else Alert.alert("Не больше 50 за раз", "Отправьте этим, потом выберите следующих.");
      return next;
    });

  const sendSms = async () => {
    if (!(await SMS.isAvailableAsync())) return Alert.alert("SMS недоступны на этом устройстве");
    const phones = rows.filter((x) => picked.has(x.id) && x.phone).map((x) => x.phone!.replace(/\s/g, ""));
    const { result } = await SMS.sendSMSAsync(phones, inviteMessage(profile.full_name, code));
    if (result === "sent") setPicked(new Set());
  };

  const header = (
    <View>
      <Pressable
        onPress={() => (from === "import" ? router.replace("/contacts") : router.back())}
        accessibilityRole="button"
        accessibilityLabel="Закрыть"
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon name="x" size={18} />
      </Pressable>
      <Text style={st.title}>{from === "import" ? "Пригласите знакомых" : "Пригласить друзей"}</Text>
      <Text style={[st.sub, { marginBottom: 14 }]}>
        {INVITES_PER_REWARD} друзей с заполненным профилем = +1 месяц Pro
      </Text>

      <View style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: c.ink, fontWeight: "700" }}>
            {progress} из {INVITES_PER_REWARD}
          </Text>
          <Text style={st.meta}>до +1 месяца Pro</Text>
        </View>
        <View style={{ height: 7, borderRadius: 4, backgroundColor: c.surface2, overflow: "hidden" }}>
          <View
            style={{ width: `${(progress / INVITES_PER_REWARD) * 100}%`, height: "100%", backgroundColor: grad[1] }}
          />
        </View>
        <Text style={st.meta}>
          Зарегистрировались: {stats.joined} · засчитано: {stats.counted}
          {stats.rewards ? ` · бонусов: ${stats.rewards}` : ""}
        </Text>
      </View>

      <Text style={[st.label, { marginTop: 16 }]}>Ваша ссылка</Text>
      <Pressable
        onPress={async () => {
          await Clipboard.setStringAsync(link);
          Alert.alert("Ссылка скопирована");
        }}
        style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, flexDirection: "row" }}
      >
        <Text style={{ color: c.ink, flex: 1 }} numberOfLines={1}>
          {link.replace("https://", "")}
        </Text>
        <Text style={{ color: c.accentInk }}>Копировать</Text>
      </Pressable>
      <Button
        kind="grad"
        title="Поделиться ссылкой"
        onPress={() => Share.share({ message: inviteMessage(profile.full_name, code) })}
        style={{ marginTop: 10 }}
      />
      <Text style={[st.label, { marginTop: 18 }]}>Пригласить из контактов</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Поиск по имени"
        placeholderTextColor={c.muted}
        style={[st.input, { marginBottom: 8 }]}
        returnKeyType="search"
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(x) => x.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 16, paddingBottom: picked.size ? 110 : 40 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        renderItem={({ item }) => {
          const on = picked.has(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[st.row, { gap: 10 }]}
            >
              <Text style={{ color: on ? c.accent : c.muted, fontSize: 18 }}>{on ? "☑" : "☐"}</Text>
              <Avatar name={item.display_name} seed={item.id} size={36} />
              <Text style={[st.name, { flex: 1 }]} numberOfLines={1}>
                {item.display_name}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={st.meta}>Импортируйте контакты, чтобы пригласить знакомых по SMS.</Text>}
      />
      {picked.size ? (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 30 }}>
          <Button kind="white" title={`Отправить SMS выбранным (${picked.size})`} onPress={sendSms} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
