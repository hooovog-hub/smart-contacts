// Phone input with a country picker: the user picks a country (🇦🇲 +374 by default) and types only the
// national number. The parent keeps the full stored value ("+37495944844"). Logic: src/lib/phone.logic.ts
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { st } from "@/components/ui";
import { COUNTRIES, type Country, fromE164, toE164 } from "@/lib/phone.logic";
import { c } from "@/theme/tokens";

export function PhoneField({
  label = "Телефон",
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (e164: string | null) => void;
}) {
  const initial = fromE164(value);
  const [country, setCountry] = useState<Country>(initial.country);
  const [national, setNational] = useState(initial.national);
  const [open, setOpen] = useState(false);

  const update = (cty: Country, text: string) => {
    setCountry(cty);
    setNational(text);
    onChange(toE164(cty, text));
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={st.label}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Страна: ${country.name}, код +${country.dial}`}
          style={[st.input, { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 }]}
        >
          <Text style={{ fontSize: 18 }}>{country.flag}</Text>
          <Text style={{ color: c.ink, fontSize: 15.5 }}>+{country.dial}</Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>▾</Text>
        </Pressable>
        <TextInput
          value={national}
          onChangeText={(t) => update(country, t)}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          placeholder="95 123 456"
          placeholderTextColor={c.muted}
          style={[st.input, { flex: 1 }]}
        />
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top", "bottom"]}>
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
            <Text style={{ color: c.ink, fontSize: 18, fontWeight: "700", flex: 1 }}>Страна</Text>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={12}>
              <Text style={{ color: c.accentInk, fontSize: 16 }}>Закрыть</Text>
            </Pressable>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(x) => x.iso}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  update(item, national);
                  setOpen(false);
                }}
                style={[st.row, { gap: 12 }]}
              >
                <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                <Text style={[st.name, { flex: 1 }]}>{item.name}</Text>
                <Text style={{ color: item.iso === country.iso ? c.accent : c.muted, fontSize: 15 }}>+{item.dial}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
