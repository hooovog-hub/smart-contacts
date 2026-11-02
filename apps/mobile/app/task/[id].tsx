import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/ai-assistant.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): переписка, карточки «Напрямую / Может знать», «Отметить решённой»
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Задача</Text>
      </View>
    </SafeAreaView>
  );
}
