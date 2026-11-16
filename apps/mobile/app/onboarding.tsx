import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PhoneField } from "@/components/PhoneField";
import { Button, Field, Title } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { applyInvite, pendingInvite } from "@/lib/invite";
import { isPlausible } from "@/lib/phone.logic";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

const MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
};
const toHandle = (s: string) =>
  s
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 30);

export default function Onboarding() {
  const { session, reloadProfile } = useAuth();
  // Sign in with Apple stores the user's name in metadata on first sign-in (src/lib/appleAuth.ts).
  const metaName = String(session?.user.user_metadata?.full_name ?? "");
  const [name, setName] = useState(metaName);
  // The name may arrive a moment after this screen opens (updateUser races the auth gate): fill it if still empty.
  useEffect(() => {
    if (metaName) setName((cur) => cur || metaName);
  }, [metaName]);
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [handleErr, setHandleErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Invite code from a link (smartcontacts://i/<code>) — prefilled, can also be typed by hand.
  const [invite, setInvite] = useState("");
  useEffect(() => {
    pendingInvite().then((code) => code && setInvite((cur) => cur || code));
  }, []);

  async function save() {
    if (!session) return;
    const h = (handle || toHandle(name)).toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(h)) return setHandleErr("3–30 латинских букв, цифр или точек.");
    if (!isPlausible(phone)) return setErr("Проверьте номер телефона: похоже, не хватает или лишние цифры.");
    setBusy(true);
    setErr(null);
    setHandleErr(null);
    const { error } = await supabase.from("profiles").insert({
      id: session.user.id,
      handle: h,
      full_name: name.trim(),
      role: role.trim() || null,
      phone,
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") return setHandleErr("Этот адрес уже занят — придумайте другой.");
      return setErr(error.message);
    }
    await applyInvite(session.user.id, invite);
    await reloadProfile();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Title sub="Это увидят люди, когда отсканируют ваш QR">Ваш профиль</Title>
        <Field
          label="Имя и фамилия"
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (!handle) setHandleErr(null); // the address is derived from the name
          }}
          placeholder="Ованнес …"
        />
        <Field
          label="Адрес профиля"
          value={handle || toHandle(name)}
          onChangeText={(v) => {
            setHandle(v.toLowerCase());
            setHandleErr(null);
          }}
          autoCapitalize="none"
          placeholder="hovhannes"
          style={handleErr ? { borderWidth: 1, borderColor: c.danger } : undefined}
        />
        <Text style={{ color: c.muted, marginTop: -6, marginBottom: handleErr ? 4 : 14, fontSize: 12.5 }}>
          {SITE_URL.replace(/^https?:\/\//, "")}/{handle || toHandle(name) || "…"}
        </Text>
        {handleErr ? <Text style={{ color: c.danger, marginBottom: 14, fontSize: 13 }}>{handleErr}</Text> : null}
        <Field label="Чем занимаетесь" value={role} onChangeText={setRole} placeholder="Основатель, Factory DF" />
        <PhoneField
          value={phone}
          onChange={(v) => {
            setPhone(v);
            setErr(null);
          }}
        />
        <Field
          label="Код пригласившего (если есть)"
          value={invite}
          onChangeText={(v) => setInvite(v.trim())}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="например, a1b2c3d4"
          maxLength={32}
        />
        {err ? <Text style={{ color: c.danger, marginBottom: 12 }}>{err}</Text> : null}
        <Button kind="grad" title="Готово" onPress={save} loading={busy} disabled={name.trim().length < 2} />
      </ScrollView>
    </SafeAreaView>
  );
}
