import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field, st } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { c } from "@/theme/tokens";

export default function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setMsg(null);
    const fn = mode === "up" ? supabase.auth.signUp({ email: email.trim(), password }) : supabase.auth.signInWithPassword({ email: email.trim(), password });
    const { data, error } = await fn;
    setBusy(false);
    if (error) return setMsg(error.message.includes("Invalid login") ? "Неверная почта или пароль." : error.message);
    if (mode === "up" && !data.session) setMsg("Мы отправили письмо для подтверждения. Откройте его и вернитесь сюда.");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Text style={{ color: c.ink, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>Smart <Text style={{ color: c.accent }}>Contacts</Text></Text>
        <Text style={[st.sub, { fontSize: 15, marginBottom: 28 }]}>Познакомились — не потеряете.</Text>
        <Field label="Почта" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@mail.com" />
        <Field label="Пароль" value={password} onChangeText={setPassword} secureTextEntry placeholder="Минимум 6 символов" />
        {msg ? <Text style={{ color: c.accentInk, marginBottom: 12 }}>{msg}</Text> : null}
        <Button kind="grad" title={mode === "up" ? "Создать аккаунт" : "Войти"} onPress={submit} loading={busy} disabled={!email || password.length < 6} />
        <Pressable onPress={() => setMode(mode === "up" ? "in" : "up")} style={{ marginTop: 18, alignItems: "center" }}>
          <Text style={{ color: c.muted }}>{mode === "up" ? "Уже есть аккаунт? " : "Нет аккаунта? "}<Text style={{ color: c.ink, fontWeight: "600" }}>{mode === "up" ? "Войти" : "Создать"}</Text></Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
