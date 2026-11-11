import { Tabs } from "expo-router";
import { View } from "react-native";
import { Icon, type IconName } from "@/components/Icon";
import { c } from "@/theme/tokens";

const tab =
  (name: IconName) =>
  ({ focused }: { focused: boolean }) => (
    <View
      style={{
        width: 54,
        height: 42,
        borderRadius: 21,
        backgroundColor: focused ? c.ink : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} color={focused ? "#000" : c.muted} />
    </View>
  );

// Floating icon-only tab bar (docs/02-design/design-system.md)
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: c.bg },
        tabBarStyle: {
          position: "absolute",
          left: 50,
          right: 50,
          marginHorizontal: 50,
          bottom: 24,
          height: 58,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 29,
          backgroundColor: "rgba(28,28,30,0.96)",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Знакомства", tabBarIcon: tab("cal") }} />
      <Tabs.Screen name="contacts" options={{ title: "Контакты", tabBarIcon: tab("people") }} />
      <Tabs.Screen name="assistant" options={{ title: "AI-помощник", tabBarIcon: tab("spark") }} />
      <Tabs.Screen name="profile" options={{ title: "Мой профиль", tabBarIcon: tab("card") }} />
    </Tabs>
  );
}
