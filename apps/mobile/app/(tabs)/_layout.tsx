import { Tabs } from "expo-router";
import { colors } from "@/theme/tokens";

// Плавающая панель из иконок, активная вкладка — белый круг (docs/02-design/design-system.md)
// TODO(mobile-engineer): кастомный tabBar с blur (expo-blur) и иконками из src/components/icons
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { position: "absolute", marginHorizontal: 80, bottom: 24, borderRadius: 999, backgroundColor: "rgba(28,28,30,0.85)", borderTopWidth: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Знакомства" }} />
      <Tabs.Screen name="contacts" options={{ title: "Контакты" }} />
      <Tabs.Screen name="assistant" options={{ title: "AI-помощник" }} />
      <Tabs.Screen name="profile" options={{ title: "Мой профиль" }} />
    </Tabs>
  );
}
