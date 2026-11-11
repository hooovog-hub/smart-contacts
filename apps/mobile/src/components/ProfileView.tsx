// Read-only view of someone's Smart Contacts profile: header, bio, brands, memberships, awards.
// Brands, memberships and awards are visible only for Pro profiles (RLS in supabase/migrations/0001_init.sql).
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Avatar, Pill, Section, st } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import type { Brand, Membership, Profile } from "@/lib/types";
import { c, r } from "@/theme/tokens";

type Award = { id: string; title: string; kind: string; year?: number | null; source?: string | null };
type Full = Profile & { brands: Brand[]; memberships: Membership[]; awards: Award[]; helps?: string[] | null };

const LINK_NAMES: Record<string, string> = {
  instagram: "Instagram",
  site: "Сайт",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Email",
  youtube: "YouTube",
};
const AWARD_ICON: Record<string, string> = { medal: "🏅", cert: "📜", press: "📰", talk: "🎤", case: "⭐️" };

function linkUrl(k: string, v: string) {
  if (k === "instagram") return `https://instagram.com/${v.replace("@", "")}`;
  if (k === "telegram") return `https://t.me/${v.replace("@", "")}`;
  if (k === "whatsapp") return `https://wa.me/${v.replace(/\D/g, "")}`;
  if (k === "email") return `mailto:${v}`;
  return v.startsWith("http") ? v : `https://${v}`;
}

export function useProfile(id?: string | null) {
  const [p, setP] = useState<Full | null>(null);
  useEffect(() => {
    if (!id) return;
    supabase
      .from("profiles")
      .select("*, brands(*), memberships(*), awards(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const d = data as Full;
        d.brands = [...(d.brands ?? [])].sort((a, b) => a.position - b.position);
        setP(d);
      });
  }, [id]);
  return p;
}

export function ProfileView({ id, header = true }: { id: string; header?: boolean }) {
  const p = useProfile(id);
  if (!p) return null;
  const links = Object.entries(p.links ?? {}).filter(([, v]) => v) as [string, string][];
  return (
    <View>
      {header ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 20, overflow: "hidden" }}>
          <LinearGradient
            colors={["#6E7BFF", "#E85BC4", "#FF8A3D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 96 }}
          />
          <View style={{ padding: 16, paddingTop: 0, marginTop: -40, gap: 4 }}>
            <View style={{ borderWidth: 4, borderColor: c.surface, borderRadius: 44, alignSelf: "flex-start" }}>
              <Avatar name={p.full_name} seed={p.id} size={80} />
            </View>
            <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700", letterSpacing: -0.5, marginTop: 6 }}>
              {p.full_name} {p.plan !== "free" ? <Text style={{ color: c.accent, fontSize: 14 }}>PRO</Text> : null}
            </Text>
            <Text style={{ color: c.muted, fontSize: 14 }}>
              {[p.role, ...p.brands.map((b) => b.name)].filter(Boolean).join(" · ")}
            </Text>
            {p.city ? <Text style={st.meta}>{p.city}</Text> : null}
          </View>
        </View>
      ) : null}
      {p.bio ? <Text style={[st.text, { fontSize: 16, color: "#D1D1D6", marginTop: 16 }]}>{p.bio}</Text> : null}
      {p.helps?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {p.helps.map((h) => (
            <View
              key={h}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: r.pill, backgroundColor: c.surface2 }}
            >
              <Text style={{ color: c.ink, fontSize: 13 }}>{h}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {links.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
          {links.map(([k, v]) => (
            <Pressable key={k} onPress={() => Linking.openURL(linkUrl(k, v))}>
              <Text style={{ color: c.accentInk, fontSize: 14 }}>{LINK_NAMES[k] ?? k} ↗</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {p.brands.length ? <Section>Бренды и компании · {p.brands.length}</Section> : null}
      <View style={{ gap: 8 }}>
        {p.brands.map((b, i) => (
          <View key={b.id ?? i} style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 4 }}>
            <Text style={st.name}>{b.name}</Text>
            <Text style={st.meta}>
              {[b.sphere, b.founded_year ? `с ${b.founded_year}` : null].filter(Boolean).join(" · ")}
            </Text>
            {b.description ? <Text style={[st.text, { fontSize: 14 }]}>{b.description}</Text> : null}
            {b.offer ? (
              <Text style={{ color: c.accentInk, fontSize: 13.5, fontWeight: "600" }}>🎁 {b.offer}</Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(b.links ?? {})
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <Pressable key={k} onPress={() => Linking.openURL(linkUrl(k, String(v)))}>
                    <Text style={{ color: c.accentInk, fontSize: 13 }}>{LINK_NAMES[k] ?? k} ↗</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        ))}
      </View>

      {p.memberships.length ? <Section>Членство в организациях</Section> : null}
      {p.memberships.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
          {p.memberships.map((o, i) => (
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
      ) : null}

      {p.awards.length ? <Section>Награды и достижения</Section> : null}
      {p.awards.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
          {p.awards.map((a) => (
            <View key={a.id} style={st.row}>
              <Text style={{ fontSize: 20 }}>{AWARD_ICON[a.kind] ?? "⭐️"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{a.title}</Text>
                <Text style={st.meta}>{[a.year, a.source].filter(Boolean).join(" · ")}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
