import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/contacts-book.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): переключатель Разделы/А–Я, чипы + «Ещё», секции по 3, указатель букв (src/features/contacts/sections.ts)
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Контакты</Text>
      </View>
    </SafeAreaView>
  );
}
