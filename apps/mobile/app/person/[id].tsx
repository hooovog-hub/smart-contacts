import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/profile.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): шапка, 4 кнопки (Сохранить — градиент), бренды со ссылками, членство, награды, свёрнутые секции
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Профиль</Text>
      </View>
    </SafeAreaView>
  );
}
