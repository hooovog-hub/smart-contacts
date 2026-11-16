// Bottom sheets that edit "Мой профиль" in place (replaces the old long "Изменить" screen).
// Spec: docs/01-product/features/profile.md · Mockup: docs/02-design/mockups/package-v2.png
import { type ReactNode, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhoneField } from "@/components/PhoneField";
import { Button, Field } from "@/components/ui";
import { HIDDEN, type LinkKey, messenger, normalizeLink } from "@/lib/completeness.logic";
import { isPlausible } from "@/lib/phone.logic";
import { supabase } from "@/lib/supabase";
import type { Brand, Membership, Profile } from "@/lib/types";
import { c } from "@/theme/tokens";

export type SheetTarget =
  | { kind: "field"; column: "full_name" | "role" | "bio" | "city" | "phone" }
  | { kind: "link"; key: LinkKey }
  | { kind: "seek"; id?: string; text?: string }
  | { kind: "help"; index?: number }
  | { kind: "brand"; brand?: Brand }
  | { kind: "membership"; membership?: Membership };

const FIELD_COPY: Record<string, { title: string; hint: string; placeholder: string }> = {
  full_name: { title: "Имя и фамилия", hint: "Как вас представить.", placeholder: "Ованнес Казарян" },
  role: {
    title: "Чем занимаетесь",
    hint: "Коротко: должность и компания.",
    placeholder: "Основатель, Digital Factory",
  },
  bio: {
    title: "О себе",
    hint: "Пара предложений: чем занимаетесь и чем полезны людям.",
    placeholder: "Строю цифровые продукты для бизнеса…",
  },
  city: { title: "Город", hint: "Где вас можно встретить.", placeholder: "Ереван" },
  phone: { title: "Телефон", hint: "По нему вам позвонят и напишут.", placeholder: "" },
  instagram: { title: "Instagram", hint: "Ссылка появится в профиле и визитке.", placeholder: "@username" },
  linkedin: { title: "LinkedIn", hint: "Имя профиля или ссылка.", placeholder: "linkedin.com/in/…" },
  email: { title: "Email", hint: "Для деловых писем.", placeholder: "you@company.am" },
  whatsapp: { title: "WhatsApp", hint: "Обычно это тот же номер, что и телефон.", placeholder: "+374 …" },
  telegram: { title: "Telegram", hint: "Номер или @username.", placeholder: "@username" },
  seek: {
    title: "Сейчас ищу",
    hint: "Коротко и конкретно, что нужно сейчас: «Дистрибьютор в Грузии», «Бухгалтер на аутсорс».",
    placeholder: "Дистрибьютор в Грузии",
  },
  help: {
    title: "Чем могу помочь",
    hint: "В чём вы полезны людям: «Маркетинг для ресторанов», «Знаю всех в логистике».",
    placeholder: "Маркетинг для ресторанов",
  },
};

/** Sheet frame: dimmed backdrop, title row with "Отмена", keyboard-aware, safe-area padding. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#0008" }} onPress={onClose} accessibilityLabel="Закрыть" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: "#1C1C1E",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 16,
            paddingBottom: 16 + insets.bottom,
            maxHeight: 640,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <Text style={{ color: c.ink, fontSize: 18, fontWeight: "700", flex: 1 }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
              <Text style={{ color: c.accentInk, fontSize: 16 }}>Отмена</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const Hint = ({ children }: { children: ReactNode }) => (
  <Text style={{ color: c.muted, fontSize: 13.5, marginBottom: 12 }}>{children}</Text>
);
const Err = ({ text }: { text: string | null }) =>
  text ? <Text style={{ color: c.danger, marginBottom: 8 }}>{text}</Text> : null;

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: c.surface2, borderRadius: 12, padding: 3, marginBottom: 12 }}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o.value }}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 10,
            alignItems: "center",
            backgroundColor: value === o.value ? "#3A3A3F" : "transparent",
          }}
        >
          <Text style={{ color: value === o.value ? c.ink : c.muted, fontSize: 13 }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const saveErr = "Не сохранилось. Проверьте интернет и попробуйте ещё раз.";

/** Merge one key into the freshest links from the server (not a possibly stale copy in memory). */
async function patchLinks(profileId: string, key: string, value: string | null) {
  const { data, error } = await supabase.from("profiles").select("links").eq("id", profileId).single();
  if (error) return error;
  const links = { ...((data?.links as Record<string, string>) ?? {}) };
  if (value === null) delete links[key];
  else links[key] = value;
  return (await supabase.from("profiles").update({ links, updated_at: new Date().toISOString() }).eq("id", profileId))
    .error;
}

export function ProfileSheet({
  profile,
  helps,
  target,
  onClose,
  onSaved,
}: {
  profile: Profile;
  helps: string[];
  target: SheetTarget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!target) return null;
  const props = { profile, onClose, onSaved };
  switch (target.kind) {
    case "brand":
      return <BrandSheet {...props} brand={target.brand} />;
    case "membership":
      return <MembershipSheet {...props} membership={target.membership} />;
    case "seek":
      return <SeekSheet {...props} id={target.id} initial={target.text} />;
    case "help":
      return <HelpSheet {...props} helps={helps} index={target.index} />;
    default:
      return <FieldSheet {...props} target={target} />;
  }
}

type Base = { profile: Profile; onClose: () => void; onSaved: () => void };

function FieldSheet({
  profile,
  target,
  onClose,
  onSaved,
}: Base & { target: Extract<SheetTarget, { kind: "field" | "link" }> }) {
  const key = target.kind === "field" ? target.column : target.key;
  const copy = FIELD_COPY[key];
  const isMessenger = target.kind === "link" && (target.key === "whatsapp" || target.key === "telegram");
  const current =
    target.kind === "field"
      ? String(profile[target.column] ?? "")
      : isMessenger
        ? messenger(profile, target.key as "whatsapp" | "telegram").mode === "custom"
          ? (profile.links?.[target.key] ?? "")
          : ""
        : (profile.links?.[target.key] ?? "");
  const [text, setText] = useState(current);
  const [phone, setPhone] = useState<string | null>(profile.phone ?? null);
  const [mode, setMode] = useState<"same" | "custom" | "hidden">(
    isMessenger
      ? messenger(profile, target.key as "whatsapp" | "telegram").mode === "custom"
        ? "custom"
        : messenger(profile, target.key as "whatsapp" | "telegram").mode === "hidden"
          ? "hidden"
          : "same"
      : "custom",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    let error: unknown;
    setBusy(true);
    if (target.kind === "field") {
      let value: string | null;
      if (target.column === "phone") {
        if (phone && !isPlausible(phone)) {
          setBusy(false);
          return setErr("Проверьте номер телефона.");
        }
        value = phone;
      } else {
        value = text.trim() || null;
        if (target.column === "full_name" && (!value || value.length < 2)) {
          setBusy(false);
          return setErr("Введите имя.");
        }
      }
      ({ error } = await supabase
        .from("profiles")
        .update({ [target.column]: value, updated_at: new Date().toISOString() })
        .eq("id", profile.id));
    } else if (isMessenger && mode !== "custom") {
      error = await patchLinks(profile.id, target.key, mode === "hidden" ? HIDDEN : null);
    } else {
      const v = text.trim() ? normalizeLink(target.key, text) : null;
      if (text.trim() && !v) {
        setBusy(false);
        return setErr("Проверьте ссылку или имя профиля.");
      }
      error = await patchLinks(profile.id, target.key, v);
    }
    setBusy(false);
    if (error) return setErr(saveErr);
    onSaved();
  }

  return (
    <Sheet title={copy.title} onClose={onClose}>
      <Hint>{copy.hint}</Hint>
      {isMessenger ? (
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "same", label: "Тот же номер" },
            { value: "custom", label: "Другой" },
            { value: "hidden", label: "Не показывать" },
          ]}
        />
      ) : null}
      {key === "phone" ? (
        <PhoneField label={null} value={phone} onChange={setPhone} />
      ) : !isMessenger || mode === "custom" ? (
        <Field
          label={null}
          autoFocus
          value={text}
          onChangeText={(t) => {
            setText(t);
            setErr(null);
          }}
          placeholder={copy.placeholder}
          autoCapitalize={target.kind === "link" ? "none" : "sentences"}
          autoCorrect={target.kind !== "link"}
          keyboardType={key === "email" ? "email-address" : key === "whatsapp" ? "phone-pad" : "default"}
          multiline={key === "bio"}
          onSubmitEditing={key === "bio" ? undefined : save}
        />
      ) : mode === "same" ? (
        <Text style={{ color: c.ink, marginBottom: 12 }}>{profile.phone ?? "Сначала добавьте телефон в профиль."}</Text>
      ) : null}
      <Err text={err} />
      <Button kind="grad" title="Сохранить" onPress={save} loading={busy} />
    </Sheet>
  );
}

function SeekSheet({ profile, id, initial, onClose, onSaved }: Base & { id?: string; initial?: string }) {
  const [text, setText] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const copy = FIELD_COPY.seek;

  async function save() {
    const t = text.trim();
    if (t.length < 2) return setErr("Напишите, что ищете.");
    setBusy(true);
    const { error } = id
      ? await supabase.from("profile_seeks").update({ text: t }).eq("id", id)
      : await supabase.from("profile_seeks").insert({ profile_id: profile.id, text: t.slice(0, 80) });
    setBusy(false);
    if (error) return setErr(error.message.includes("seeks_limit") ? "Можно не больше 5 пунктов." : saveErr);
    onSaved();
  }
  async function resolve(remove: boolean) {
    if (!id) return;
    setBusy(true);
    const { error } = remove
      ? await supabase.from("profile_seeks").delete().eq("id", id)
      : await supabase.from("profile_seeks").update({ resolved_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    if (error) return setErr(saveErr);
    onSaved();
  }

  return (
    <Sheet title={copy.title} onClose={onClose}>
      <Hint>{copy.hint}</Hint>
      <Field
        label={null}
        autoFocus={!id}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setErr(null);
        }}
        placeholder={copy.placeholder}
        maxLength={80}
        onSubmitEditing={save}
      />
      <Err text={err} />
      <Button kind="grad" title={id ? "Сохранить" : "Добавить"} onPress={save} loading={busy} />
      {id ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <Button kind="ghost" small title="✓ Нашёл" onPress={() => resolve(false)} style={{ flex: 1 }} />
          <Button kind="ghost" small title="Удалить" onPress={() => resolve(true)} style={{ flex: 1 }} />
        </View>
      ) : null}
    </Sheet>
  );
}

function HelpSheet({ profile, helps, index, onClose, onSaved }: Base & { helps: string[]; index?: number }) {
  const [text, setText] = useState(index !== undefined ? (helps[index] ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const copy = FIELD_COPY.help;

  /** Applies the change to the freshest list from the server (never to a stale copy in memory). */
  async function write(change: (cur: string[]) => string[] | string) {
    setBusy(true);
    const { data, error: readErr } = await supabase.from("profiles").select("helps").eq("id", profile.id).single();
    if (readErr) {
      setBusy(false);
      return setErr(saveErr);
    }
    const next = change([...((data?.helps as string[]) ?? [])]);
    if (typeof next === "string") {
      setBusy(false);
      return setErr(next);
    }
    const { error } = await supabase
      .from("profiles")
      .update({ helps: next, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return setErr(saveErr);
    onSaved();
  }
  const original = index !== undefined ? helps[index] : undefined;
  const save = () => {
    const t = text.trim().slice(0, 80);
    if (t.length < 2) return setErr("Напишите, чем можете помочь.");
    write((cur) => {
      if (original === undefined) return cur.length >= 5 ? "Можно не больше 5 пунктов." : [...cur, t];
      const i = cur.indexOf(original);
      if (i >= 0) cur[i] = t;
      else cur.push(t);
      return cur;
    });
  };
  const removeHelp = () => write((cur) => cur.filter((x) => x !== original));

  return (
    <Sheet title={copy.title} onClose={onClose}>
      <Hint>{copy.hint}</Hint>
      <Field
        label={null}
        autoFocus={index === undefined}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setErr(null);
        }}
        placeholder={copy.placeholder}
        maxLength={80}
        onSubmitEditing={save}
      />
      <Err text={err} />
      <Button kind="grad" title={index === undefined ? "Добавить" : "Сохранить"} onPress={save} loading={busy} />
      {index !== undefined ? (
        <Button kind="ghost" small title="Удалить" onPress={removeHelp} style={{ marginTop: 10 }} />
      ) : null}
    </Sheet>
  );
}

function BrandSheet({ profile, brand, onClose, onSaved }: Base & { brand?: Brand }) {
  const [name, setName] = useState(brand?.name ?? "");
  const [sphere, setSphere] = useState(brand?.sphere ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [instagram, setInstagram] = useState(brand?.links?.instagram ?? "");
  const [site, setSite] = useState(brand?.links?.site ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (name.trim().length < 2) return setErr("Введите название.");
    const ig = instagram.trim() ? normalizeLink("instagram", instagram) : null;
    if (instagram.trim() && !ig) return setErr("Проверьте Instagram бренда.");
    const row = {
      profile_id: profile.id,
      name: name.trim(),
      sphere: sphere.trim() || null,
      description: description.trim() || null,
      // Keep other brand links (facebook, linkedin…) saved earlier; only instagram/site are edited here.
      links: (() => {
        const l: Record<string, string> = { ...((brand?.links as Record<string, string>) ?? {}) };
        delete l.instagram;
        delete l.site;
        if (ig) l.instagram = ig;
        const st = site.trim() ? normalizeLink("site", site) : null;
        if (st) l.site = st;
        return l;
      })(),
    };
    setBusy(true);
    const { error } = brand?.id
      ? await supabase.from("brands").update(row).eq("id", brand.id)
      : await supabase.from("brands").insert({ ...row, position: (profile.brands ?? []).length });
    setBusy(false);
    if (error) return setErr(saveErr);
    onSaved();
  }
  const remove = () =>
    Alert.alert("Удалить бренд?", brand?.name, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("brands").delete().eq("id", brand!.id!);
          if (error) setErr(saveErr);
          else onSaved();
        },
      },
    ]);

  return (
    <Sheet title={brand ? "Бренд" : "Новый бренд"} onClose={onClose}>
      <Field label="Название" value={name} onChangeText={setName} placeholder="Digital Factory" autoFocus={!brand} />
      <Field label="Сфера" value={sphere} onChangeText={setSphere} placeholder="Маркетинг" />
      <Field label="Коротко о бренде" value={description} onChangeText={setDescription} multiline />
      <Field
        label="Instagram"
        value={instagram}
        onChangeText={setInstagram}
        autoCapitalize="none"
        placeholder="@brand"
      />
      <Field
        label="Сайт"
        value={site}
        onChangeText={setSite}
        autoCapitalize="none"
        keyboardType="url"
        placeholder="brand.am"
      />
      <Err text={err} />
      <Button kind="grad" title="Сохранить" onPress={save} loading={busy} />
      {brand?.id ? (
        <Button kind="ghost" small title="Удалить бренд" onPress={remove} style={{ marginTop: 10 }} />
      ) : null}
    </Sheet>
  );
}

function MembershipSheet({ profile, membership, onClose, onSaved }: Base & { membership?: Membership }) {
  const [org, setOrg] = useState(membership?.org_name ?? "");
  const [status, setStatus] = useState(membership?.status_title ?? "");
  const [year, setYear] = useState(membership?.since_year ? String(membership.since_year) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (org.trim().length < 2) return setErr("Введите организацию.");
    const y = year.trim() ? Number(year) : null;
    if (y !== null && (!Number.isInteger(y) || y < 1950 || y > new Date().getFullYear()))
      return setErr("Проверьте год.");
    const row = { profile_id: profile.id, org_name: org.trim(), status_title: status.trim() || null, since_year: y };
    setBusy(true);
    const { error } = membership?.id
      ? await supabase.from("memberships").update(row).eq("id", membership.id)
      : await supabase.from("memberships").insert(row);
    setBusy(false);
    if (error) return setErr(saveErr);
    onSaved();
  }
  const remove = async () => {
    const { error } = await supabase.from("memberships").delete().eq("id", membership!.id!);
    if (error) setErr(saveErr);
    else onSaved();
  };

  return (
    <Sheet title="Членство в организации" onClose={onClose}>
      <Hint>Клуб, ассоциация или палата. Отметка «Подтверждено» появится после проверки организацией.</Hint>
      <Field label="Организация" value={org} onChangeText={setOrg} placeholder="Манташянц" autoFocus={!membership} />
      <Field label="Статус" value={status} onChangeText={setStatus} placeholder="Член правления" />
      <Field
        label="С какого года"
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholder="2022"
        maxLength={4}
      />
      <Err text={err} />
      <Button kind="grad" title="Сохранить" onPress={save} loading={busy} />
      {membership?.id ? <Button kind="ghost" small title="Удалить" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Sheet>
  );
}

/** Small helper so screens can reset sheet state when the target changes. */
export function useSheet<T>() {
  const [target, setTarget] = useState<T | null>(null);
  useEffect(() => () => setTarget(null), []);
  return [target, setTarget] as const;
}
