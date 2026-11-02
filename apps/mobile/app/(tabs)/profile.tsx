import { SafeAreaView, Text, View } from "react-native";
import { colors, type } from "@/theme/tokens";

// Спецификация: docs/01-product/features/profile.md
// Эталон: prototype/smart-contacts-prototype.html
// TODO(mobile-engineer): профиль, шкала заполненности, тарифы (docs/06-business/pricing-and-plans.md)
export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ ...type.title, color: colors.ink }}>Мой профиль</Text>
      </View>
    </SafeAreaView>
  );
}
