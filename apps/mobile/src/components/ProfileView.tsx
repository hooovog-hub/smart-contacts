// A Smart Contacts profile exactly as other users see it. With `owner` it also shows empty sections and "+"
// controls so the owner can fill everything in place (Мой профиль). Brands/memberships/awards/needs are
// visible to others only for Pro profiles (RLS private.is_paid).
// Spec: docs/01-product/features/profile.md · Mockup: docs/02-design/mockups/package-v2.png
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Avatar, Pill, Section, st } from "@/components/ui";
import { messenger } from "@/lib/completeness.logic";
import { PROFILE_COLUMNS, profilePhone } from "@/lib/profileData";
import { supabase } from "@/lib/supabase";
import type { Brand, Membership, Profile } from "@/lib/types";
import { c, r } from "@/theme/tokens";
import type { SheetTarget } from "./ProfileSheets";

type Award = { id: string; title: string; kind: string; year?: number | null; source?: string | null };
type Seek = { id: string; text: string; resolved_at: string | null };
export type FullProfile = Profile & {
  brands: Brand[];
  memberships: Membership[];
  awards: Award[];
  helps?: string[] | null;
  profile_seeks: Seek[];
};

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

export function linkUrl(k: string, v: string) {
  if (k === "instagram") return `https://instagram.com/${v.replace("@", "")}`;
  if (k === "telegram")
    return v.startsWith("@") ? `https://t.me/${v.slice(1)}` : `https://t.me/${v.replace(/[^\d+]/g, "")}`;
  if (k === "whatsapp") return `https://wa.me/${v.replace(/\D/g, "")}`;
  if (k === "email") return `mailto:${v}`;
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Loads a profile as other users see it. Bump `version` to reload (e.g. after the owner edits it). */
export function useProfile(id?: string | null, version = 0) {
  const [p, setP] = useState<FullProfile | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true; // ignore a slower, older response arriving after a newer one
    Promise.all([
      supabase
        .from("profiles")
        .select(`${PROFILE_COLUMNS}, brands(*), memberships(*), awards(*), profile_seeks(id, text, resolved_at)`)
        .eq("id", id)
        .single(),
      profilePhone(id),
    ]).then(([{ data }, phone]) => {
      if (!data || !alive) return;
      const d = { ...(data as unknown as FullProfile), phone };
      d.brands = [...(d.brands ?? [])].sort((a, b) => a.position - b.position);
      d.profile_seeks = (d.profile_seeks ?? []).filter((s) => !s.resolved_at);
      setP(d);
    });
    return () => {
      alive = false;
    };
  }, [id, version]);
  return p;
}

/** Contact links others can use. WhatsApp/Telegram fall back to the phone unless hidden. */
function publicLinks(p: FullProfile): [string, string][] {
  const out: [string, string][] = [];
  for (const k of ["whatsapp", "telegram"] as const) {
    const m = messenger(p, k);
    if (m.value) out.push([k, m.value]);
  }
  for (const k of ["instagram", "linkedin", "site", "email", "facebook"] as const) {
    const v = p.links?.[k];
    if (v) out.push([k, v]);
  }
  return out;
}

/** Dashed placeholder shown only to the owner for an empty section. */
function Empty({ icon, title, hint, onPress }: { icon: string; title: string; hint: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Добавить: ${title}`}
      style={{
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "#3A3A3F",
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.ink, fontSize: 14 }}>{title}</Text>
        <Text style={{ color: c.muted, fontSize: 12.5 }}>{hint}</Text>
      </View>
      <Text style={{ color: c.accentInk, fontSize: 13.5 }}>+ Добавить</Text>
    </Pressable>
  );
}

const AddLink = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 8 }}>
    <Text style={{ color: c.accentInk, fontSize: 13.5 }}>+ {title}</Text>
  </Pressable>
);

const Chip = ({ text, onPress }: { text: string; onPress?: () => void }) => (
  <Pressable
    disabled={!onPress}
    onPress={onPress}
    style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: r.pill, backgroundColor: c.surface2 }}
  >
    <Text style={{ color: c.ink, fontSize: 13 }}>{text}</Text>
  </Pressable>
);

export function ProfileView({
  id,
  header = true,
  afterHeader,
  headerRight,
  version = 0,
  owner,
  onEdit,
  onPhoto,
  onLoaded,
}: {
  id: string;
  header?: boolean;
  /** Owner-only controls rendered right under the header (actions, completeness). */
  afterHeader?: ReactNode;
  /** Rendered on the header next to the photo (e.g. "Add to Apple Wallet"). */
  headerRight?: ReactNode;
  version?: number;
  /** Owner editing mode: empty sections and "+" controls. */
  owner?: boolean;
  onEdit?: (t: SheetTarget) => void;
  onPhoto?: () => void;
  onLoaded?: (p: FullProfile) => void;
}) {
  const p = useProfile(id, version);
  useEffect(() => {
    if (p) onLoaded?.(p);
  }, [p, onLoaded]);
  // Still loading or offline: keep the owner's controls usable.
  if (!p) return afterHeader ? <View>{afterHeader}</View> : null;

  const edit = owner && onEdit ? onEdit : undefined;
  const links = publicLinks(p);
  const seeks = p.profile_seeks ?? [];
  const helps = p.helps ?? [];

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
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
              <Pressable
                disabled={!owner || !onPhoto}
                onPress={onPhoto}
                accessibilityRole={owner ? "button" : undefined}
                accessibilityLabel={owner ? "Изменить фото" : undefined}
                style={{ borderWidth: 4, borderColor: c.surface, borderRadius: 44 }}
              >
                <Avatar name={p.full_name} seed={p.id} size={80} uri={p.avatar_url} />
                {owner ? (
                  <View
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: c.ink,
                      borderWidth: 3,
                      borderColor: c.surface,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>📷</Text>
                  </View>
                ) : null}
              </Pressable>
              {headerRight}
            </View>
            <Pressable disabled={!edit} onPress={() => edit?.({ kind: "field", column: "full_name" })}>
              <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700", letterSpacing: -0.5, marginTop: 6 }}>
                {p.full_name} {p.plan !== "free" ? <Text style={{ color: c.accent, fontSize: 14 }}>PRO</Text> : null}
              </Text>
            </Pressable>
            <Pressable disabled={!edit} onPress={() => edit?.({ kind: "field", column: "role" })}>
              <Text style={{ color: p.role || !owner ? c.muted : c.accentInk, fontSize: 14 }}>
                {[p.role, ...p.brands.map((b) => b.name)].filter(Boolean).join(" · ") ||
                  (owner ? "+ Чем занимаетесь" : "")}
              </Text>
            </Pressable>
            <Pressable disabled={!edit} onPress={() => edit?.({ kind: "field", column: "city" })}>
              {p.city ? (
                <Text style={st.meta}>{p.city}</Text>
              ) : owner ? (
                <Text style={{ color: c.accentInk, fontSize: 12.5 }}>+ Город</Text>
              ) : null}
            </Pressable>
            {owner && edit ? (
              <Pressable onPress={() => edit({ kind: "field", column: "phone" })} accessibilityRole="button">
                <Text style={{ color: p.phone ? c.muted : c.accentInk, fontSize: 12.5 }}>
                  {p.phone ? `📞 ${p.phone}` : "+ Телефон"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      {afterHeader}

      {/* Сейчас ищу */}
      {seeks.length || owner ? (
        <Section
          right={edit && seeks.length ? <AddLink title="Добавить" onPress={() => edit({ kind: "seek" })} /> : null}
        >
          Сейчас ищу
        </Section>
      ) : null}
      {seeks.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {seeks.map((s) => (
            <Chip
              key={s.id}
              text={s.text}
              onPress={edit ? () => edit({ kind: "seek", id: s.id, text: s.text }) : undefined}
            />
          ))}
        </View>
      ) : owner && edit ? (
        <Empty
          icon="🔎"
          title="Что вам сейчас нужно"
          hint="«Дистрибьютор в Грузии», «Инвестор»"
          onPress={() => edit({ kind: "seek" })}
        />
      ) : null}

      {/* Чем могу помочь */}
      {helps.length || owner ? (
        <Section
          right={edit && helps.length ? <AddLink title="Добавить" onPress={() => edit({ kind: "help" })} /> : null}
        >
          Чем могу помочь
        </Section>
      ) : null}
      {helps.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {helps.map((h, i) => (
            <Chip key={h + i} text={h} onPress={edit ? () => edit({ kind: "help", index: i }) : undefined} />
          ))}
        </View>
      ) : owner && edit ? (
        <Empty
          icon="🤝"
          title="Чем вы полезны людям"
          hint="«Маркетинг для ресторанов»"
          onPress={() => edit({ kind: "help" })}
        />
      ) : null}

      {/* О себе */}
      {p.bio ? (
        <>
          {owner ? <Section>О себе</Section> : null}
          <Pressable disabled={!edit} onPress={() => edit?.({ kind: "field", column: "bio" })}>
            <Text style={[st.text, { fontSize: 16, color: "#D1D1D6", marginTop: owner ? 0 : 16 }]}>{p.bio}</Text>
          </Pressable>
        </>
      ) : owner && edit ? (
        <>
          <Section>О себе</Section>
          <Empty
            icon="✍️"
            title="Пара предложений о себе"
            hint="Чем занимаетесь и чем можете помочь"
            onPress={() => edit({ kind: "field", column: "bio" })}
          />
        </>
      ) : null}

      {/* Контакты и соцсети */}
      {owner && edit ? (
        <>
          <Section>Контакты и соцсети</Section>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["whatsapp", "telegram", "instagram", "linkedin", "email"] as const).map((k) => {
              const m = k === "whatsapp" || k === "telegram" ? messenger(p, k) : null;
              const value = m ? m.value : p.links?.[k];
              const sub = m?.mode === "same" ? "тот же номер" : m?.mode === "hidden" ? "не показывать" : value;
              const on = !!value || m?.mode === "hidden";
              return (
                <Pressable
                  key={k}
                  onPress={() => edit({ kind: "link", key: k })}
                  accessibilityRole="button"
                  style={{
                    width: "48.5%",
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: on ? c.surface : "transparent",
                    borderWidth: on ? 0 : 1.5,
                    borderStyle: "dashed",
                    borderColor: "#3A3A3F",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: on ? c.ink : c.muted, fontSize: 13 }}>{LINK_NAMES[k]}</Text>
                    {on && sub ? (
                      <Text numberOfLines={1} style={{ color: c.muted, fontSize: 11 }}>
                        {sub}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={{ color: on ? c.muted : c.accentInk }}>{on ? "›" : "+"}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : links.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
          {links.map(([k, v]) => (
            <Pressable key={k} onPress={() => Linking.openURL(linkUrl(k, v))}>
              <Text style={{ color: c.accentInk, fontSize: 14 }}>{LINK_NAMES[k] ?? k} ↗</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Бренды */}
      {p.brands.length || owner ? (
        <Section>Бренды и компании{p.brands.length ? ` · ${p.brands.length}` : ""}</Section>
      ) : null}
      <View style={{ gap: 8 }}>
        {p.brands.map((b, i) => (
          <Pressable
            key={b.id ?? i}
            disabled={!edit}
            onPress={() => edit?.({ kind: "brand", brand: b })}
            style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 14, gap: 4 }}
          >
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
          </Pressable>
        ))}
      </View>
      {edit ? (
        p.brands.length ? (
          <AddLink title="Добавить бренд" onPress={() => edit({ kind: "brand" })} />
        ) : (
          <Empty
            icon="🏷"
            title="Добавьте свой бизнес"
            hint="Название, сфера и ссылки бренда"
            onPress={() => edit({ kind: "brand" })}
          />
        )
      ) : null}

      {/* Членство */}
      {p.memberships.length || owner ? <Section>Членство в организациях</Section> : null}
      {p.memberships.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: r.card, overflow: "hidden" }}>
          {p.memberships.map((o, i) => (
            <Pressable
              key={o.id ?? i}
              disabled={!edit}
              onPress={() => edit?.({ kind: "membership", membership: o })}
              style={st.row}
            >
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{o.org_name}</Text>
                <Text style={st.meta}>
                  {[o.status_title, o.since_year ? `с ${o.since_year}` : null].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Pill text={o.verified ? "✓ Подтверждено" : "Не подтверждено"} tone={o.verified ? "ok" : "mute"} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {edit ? (
        p.memberships.length ? (
          <AddLink title="Добавить" onPress={() => edit({ kind: "membership" })} />
        ) : (
          <Empty
            icon="🏛"
            title="Клубы и ассоциации"
            hint="Например, «Манташянц» или палата"
            onPress={() => edit({ kind: "membership" })}
          />
        )
      ) : null}

      {/* Награды (read-only for now) */}
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
