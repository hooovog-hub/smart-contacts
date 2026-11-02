import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/meetings-rooms.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): карточка последней встречи, «Спросите AI», «Вспомнить всех», «Стоит написать сегодня», комнаты
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Знакомства</Text>
      </View>
    </SafeAreaView>
  );
}
