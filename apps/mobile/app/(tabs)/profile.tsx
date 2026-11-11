import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/Icon";
import { Avatar, Button, Pill, Section, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { c, r } from "@/theme/tokens";

const LINK_NAMES: Record<string, string> = {
  instagram: "Instagram",
  site: "Сайт",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Email",
};

// Spec: docs/01-product/features/profile.md
export default function MyProfile() {
  const { profile } = useAuth();
  const router = useRouter();
  if (!profile) return null;
  const url = `${SITE_URL}/${profile.handle}`;
  const brands = profile.brands ?? [];
  const orgs = profile.memberships ?? [];
  const action = (icon: IconName, label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon name={icon} size={20} />
      <Text style={{ color: c.ink, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: "hidden" }}>
          <LinearGradient
            colors={["#6E7BFF", "#E85BC4", "#FF8A3D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 110 }}
          />
          <View style={{ padding: 16, paddingTop: 0, marginTop: -40, gap: 4 }}>
            <View style={{ borderWidth: 4, borderColor: c.surface, borderRadius: 44, alignSelf: "flex-start" }}>
              <Avatar name={profile.full_name} seed={profile.id} size={80} />
            </View>
            <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700", letterSpacing: -0.5, marginTop: 6 }}>
              {profile.full_name}{" "}
              {profile.plan !== "free" ? <Text style={{ color: c.accent, fontSize: 14 }}>PRO</Text> : null}
            </Text>
            <Text style={{ color: c.muted, fontSize: 14 }}>
              {[profile.role, ...brands.map((b) => b.name)].filter(Boolean).join(" · ")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center" }}>
              <Pill text="✓ Профиль проверен" />
              {profile.city ? <Text style={st.meta}>{profile.city}</Text> : null}
            </View>
            {orgs.length ? (
              <Text style={{ color: "#D1D1D6", fontSize: 13, marginTop: 6 }}>
                🏛 {orgs[0].org_name}
                {orgs.length > 1 ? ` и ещё ${orgs.length - 1}` : ""}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {action("qr", "Мой QR", () => router.push("/profile/qr"))}
          {action("edit", "Изменить", () => router.push("/profile/edit"))}
          {action("share", "Поделиться", () => Share.share({ message: `${profile.full_name} — ${url}` }))}
        </View>
        {profile.plan === "free" ? (
          <Text style={[st.meta, { marginTop: 10 }]}>
            Бренды и членство видны другим только в Pro. Сейчас они видят имя, роль и телефон.
          </Text>
        ) : null}
        {profile.bio ? (
          <Text style={[st.text, { fontSize: 16, color: "#D1D1D6", marginTop: 16 }]}>{profile.bio}</Text>
        ) : null}
        {brands.length ? <Section>Бренды и компании · {brands.length}</Section> : null}
        <View style={{ gap: 8 }}>
          {brands.map((b, i) => (
            <View key={b.id ?? i} style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 4 }}>
              <Text style={st.name}>{b.name}</Text>
              {b.sphere ? <Text style={st.meta}>{b.sphere}</Text> : null}
              {b.description ? <Text style={[st.text, { fontSize: 14 }]}>{b.description}</Text> : null}
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                {Object.entries(b.links ?? {})
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <Pressable
                      key={k}
                      onPress={() =>
                        Linking.openURL(
                          k === "instagram"
                            ? `https://instagram.com/${String(v).replace("@", "")}`
                            : String(v).startsWith("http")
                              ? String(v)
                              : `https://${v}`,
                        )
                      }
                    >
                      <Text style={{ color: c.accentInk, fontSize: 13 }}>{LINK_NAMES[k] ?? k} ↗</Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ))}
        </View>
        {orgs.length ? <Section>Членство в организациях</Section> : null}
        <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
          {orgs.map((o, i) => (
            <View key={o.id ?? i} style={st.row}>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{o.org_name}</Text>
                <Text style={st.meta}>
                  {[o.status_title, o.since_year ? `с ${o.since_year}` : null].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Pill text={o.verified ? "✓ Подтверждено" : "Не подтверждено"} tone={o.verified ? "ok" : "mute"} />
            </View>
          ))}
        </View>
        <Section>Ссылка на профиль</Section>
        <Pressable onPress={() => Linking.openURL(url)}>
          <Text style={{ color: c.accentInk }}>{url.replace("https://", "")}</Text>
        </Pressable>
        <Button kind="ghost" small title="Выйти" onPress={() => supabase.auth.signOut()} style={{ marginTop: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
