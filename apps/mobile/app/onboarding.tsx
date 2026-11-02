import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field, Title } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

const MAP: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ы:"y",э:"e",ю:"yu",я:"ya" };
const toHandle = (s: string) => s.toLowerCase().split("").map((ch) => MAP[ch] ?? ch).join("").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 30);

export default function Onboarding() {
  const { session, reloadProfile } = useAuth();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!session) return;
    const h = (handle || toHandle(name)).toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(h)) return setErr("Адрес профиля: 3–30 латинских букв, цифр, точек.");
    setBusy(true); setErr(null);
    const { error } = await supabase.from("profiles").insert({ id: session.user.id, handle: h, full_name: name.trim(), role: role.trim() || null, phone: phone.trim() || null });
    setBusy(false);
    if (error) return setErr(error.code === "23505" ? "Такой адрес профиля уже занят, выберите другой." : error.message);
    await reloadProfile();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Title sub="Это увидят люди, когда отсканируют ваш QR">Ваш профиль</Title>
        <Field label="Имя и фамилия" value={name} onChangeText={(v) => { setName(v); if (!handle) setErr(null); }} placeholder="Ованнес …" />
        <Field label="Адрес профиля" value={handle || toHandle(name)} onChangeText={(v) => setHandle(v.toLowerCase())} autoCapitalize="none" placeholder="hovhannes" />
        <Text style={{ color: c.muted, marginTop: -6, marginBottom: 14, fontSize: 12.5 }}>smart-contacts-how-iq.vercel.app/{handle || toHandle(name) || "…"}</Text>
        <Field label="Чем занимаетесь" value={role} onChangeText={setRole} placeholder="Основатель, Factory DF" />
        <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+374 …" />
        {err ? <Text style={{ color: c.danger, marginBottom: 12 }}>{err}</Text> : null}
        <Button kind="grad" title="Готово" onPress={save} loading={busy} disabled={name.trim().length < 2} />
      </ScrollView>
    </SafeAreaView>
  );
}
