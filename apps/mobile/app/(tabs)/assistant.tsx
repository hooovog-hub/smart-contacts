import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/ai-assistant.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): чипы разделов, 2 последних + «Архив», док ввода с голосом (src/features/assistant/api.ts)
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>AI-помощник</Text>
      </View>
    </SafeAreaView>
  );
}
