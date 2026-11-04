import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { ProfileView, useProfile } from "@/components/ProfileView";
import { Button } from "@/components/ui";
import { c } from "@/theme/tokens";

// Someone's Smart Contacts profile who is not in your book yet (e.g. met in a room).
export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const p = useProfile(id);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="back" size={18} /></Pressable>
        {id ? <ProfileView id={id} /> : null}
        {p?.phone ? <Button kind="grad" title={`Позвонить ${p.phone}`} onPress={() => Linking.openURL(`tel:${p.phone!.replace(/\s/g, "")}`)} style={{ marginTop: 18 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
