import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button, Field, Section } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Brand, Links, Membership } from "@/lib/types";
import { c, r } from "@/theme/tokens";

export default function EditProfile() {
  const { profile, reloadProfile } = useAuth();
  const router = useRouter();
  const [p, setP] = useState(() => ({
    full_name: profile?.full_name ?? "",
    role: profile?.role ?? "",
    bio: profile?.bio ?? "",
    city: profile?.city ?? "",
    phone: profile?.phone ?? "",
  }));
  const [links, setLinks] = useState<Links>(profile?.links ?? {});
  const [brands, setBrands] = useState<Brand[]>(profile?.brands ?? []);
  const [orgs, setOrgs] = useState<Membership[]>(profile?.memberships ?? []);
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  async function save() {
    setBusy(true);
    const uid = profile!.id;
    const { error } = await supabase
      .from("profiles")
      .update({ ...p, links, updated_at: new Date().toISOString() })
      .eq("id", uid);
    if (error) {
      setBusy(false);
      return Alert.alert("Не сохранилось", error.message);
    }
    // Brands and memberships: replace the set (simple and safe for a handful of rows)
    await supabase.from("brands").delete().eq("profile_id", uid);
    const bs = brands
      .filter((b) => b.name.trim())
      .map((b, i) => ({
        profile_id: uid,
        name: b.name.trim(),
        sphere: b.sphere || null,
        description: b.description || null,
        links: b.links ?? {},
        position: i,
      }));
    if (bs.length) await supabase.from("brands").insert(bs);
    await supabase.from("memberships").delete().eq("profile_id", uid);
    const ms = orgs
      .filter((o) => o.org_name.trim())
      .map((o) => ({
        profile_id: uid,
        org_name: o.org_name.trim(),
        status_title: o.status_title || "Член",
        since_year: o.since_year || null,
      }));
    if (ms.length) await supabase.from("memberships").insert(ms);
    await reloadProfile();
    setBusy(false);
    router.back();
  }

  const upd = (i: number, patch: Partial<Brand>) => setBrands(brands.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const updO = (i: number, patch: Partial<Membership>) =>
    setOrgs(orgs.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="back" size={18} />
          </Pressable>
          <Text style={{ color: c.ink, fontSize: 20, fontWeight: "700" }}>Редактировать профиль</Text>
        </View>
        <Field label="Имя" value={p.full_name} onChangeText={(v) => setP({ ...p, full_name: v })} />
        <Field label="Роль" value={p.role} onChangeText={(v) => setP({ ...p, role: v })} placeholder="Основатель" />
        <Field
          label="Описание о себе (видно всем сразу)"
          value={p.bio}
          onChangeText={(v) => setP({ ...p, bio: v })}
          multiline
        />
        <Field label="Город" value={p.city} onChangeText={(v) => setP({ ...p, city: v })} placeholder="Ереван" />
        <Field
          label="Телефон"
          value={p.phone}
          onChangeText={(v) => setP({ ...p, phone: v })}
          keyboardType="phone-pad"
        />
        <Section>Контакты и соцсети</Section>
        {(["whatsapp", "telegram", "instagram", "linkedin", "site", "email"] as const).map((k) => (
          <Field
            key={k}
            label={k[0].toUpperCase() + k.slice(1)}
            value={links[k] ?? ""}
            onChangeText={(v) => setLinks({ ...links, [k]: v })}
            autoCapitalize="none"
          />
        ))}
        <Section>Бренды и компании</Section>
        {brands.map((b, i) => (
          <View key={i} style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 12, marginBottom: 10 }}>
            <Field label="Название" value={b.name} onChangeText={(v) => upd(i, { name: v })} />
            <Field label="Сфера" value={b.sphere ?? ""} onChangeText={(v) => upd(i, { sphere: v })} />
            <Field label="Что делаете" value={b.description ?? ""} onChangeText={(v) => upd(i, { description: v })} />
            <Field
              label="Instagram"
              value={b.links?.instagram ?? ""}
              onChangeText={(v) => upd(i, { links: { ...b.links, instagram: v } })}
              autoCapitalize="none"
            />
            <Field
              label="Сайт"
              value={b.links?.site ?? ""}
              onChangeText={(v) => upd(i, { links: { ...b.links, site: v } })}
              autoCapitalize="none"
            />
            <Button kind="ghost" small title="Убрать" onPress={() => setBrands(brands.filter((_, j) => j !== i))} />
          </View>
        ))}
        {brands.length < 5 ? (
          <Button
            kind="ghost"
            title="+ Бренд или компания"
            onPress={() => setBrands([...brands, { name: "", links: {}, position: brands.length }])}
          />
        ) : null}
        <Section>Членство в организациях</Section>
        {orgs.map((o, i) => (
          <View key={i} style={{ backgroundColor: c.surface, borderRadius: r.card, padding: 12, marginBottom: 10 }}>
            <Field
              label="Организация"
              value={o.org_name}
              onChangeText={(v) => updO(i, { org_name: v })}
              placeholder="Бизнес-клуб «Манташянц»"
            />
            <Field
              label="Статус"
              value={o.status_title ?? ""}
              onChangeText={(v) => updO(i, { status_title: v })}
              placeholder="Член"
            />
            <Field
              label="С какого года"
              value={o.since_year ? String(o.since_year) : ""}
              onChangeText={(v) => updO(i, { since_year: Number(v) || null })}
              keyboardType="number-pad"
            />
            <Button kind="ghost" small title="Убрать" onPress={() => setOrgs(orgs.filter((_, j) => j !== i))} />
          </View>
        ))}
        <Button
          kind="ghost"
          title="+ Клуб, палата или ассоциация"
          onPress={() => setOrgs([...orgs, { org_name: "", status_title: "Член" }])}
        />
        <Button kind="grad" title="Сохранить" onPress={save} loading={busy} style={{ marginTop: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
