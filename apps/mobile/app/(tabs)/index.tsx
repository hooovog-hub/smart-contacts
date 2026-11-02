import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button, Card, Section, Title, st } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { c } from "@/theme/tokens";

// Spec: docs/01-product/features/meetings-rooms.md (rooms come in roadmap stage 3)
export default function Meetings() {
  const router = useRouter();
  const { profile } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Title sub={`Привет, ${profile?.full_name.split(" ")[0] ?? ""}`}>Знакомства</Title>
        <LinearGradient colors={["#3A4BD8", "#E85BC4", "#FF8A3D"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18, gap: 8 }}>
          <Text style={{ color: "#fff", opacity: 0.85, fontSize: 12, fontWeight: "600", letterSpacing: 0.6 }}>ВАША ВИЗИТКА</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", letterSpacing: -0.5 }}>Покажите QR — и вас сохранят</Text>
          <Text style={{ color: "#fff", opacity: 0.85 }}>Собеседник откроет ваш профиль без приложения.</Text>
          <Button title="Мой QR" onPress={() => router.push("/profile/qr")} style={{ marginTop: 6, alignSelf: "flex-start" }} small />
        </LinearGradient>
        <Pressable onPress={() => router.push("/assistant")} style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 25, backgroundColor: c.surface }}>
          <Icon name="spark" size={18} color={c.accent} />
          <Text style={{ color: c.muted }}>Спросите AI: «Нужно решить вопрос с дверями»</Text>
        </Pressable>
        <Section>Скоро</Section>
        <Card><Text style={st.name}>Комнаты встреч</Text><Text style={[st.meta, { marginTop: 4 }]}>Покажите QR на встрече — все участники сохранятся с профилями, а после встречи «Вспомнить всех».</Text></Card>
      </ScrollView>
    </SafeAreaView>
  );
}
