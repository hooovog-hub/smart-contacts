import { useRouter } from "expo-router";
import { Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { c } from "@/theme/tokens";

export default function MyQR() {
  const { profile } = useAuth();
  const router = useRouter();
  if (!profile) return null;
  const url = `${SITE_URL}/${profile.handle}`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: 20 }}>
      <Pressable
        onPress={() => router.back()}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="x" size={18} />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Text style={{ color: c.ink, fontSize: 24, fontWeight: "700" }}>{profile.full_name}</Text>
        <View style={{ backgroundColor: "#fff", padding: 18, borderRadius: 24 }}>
          <QRCode value={url} size={240} />
        </View>
        <Text style={{ color: c.muted, textAlign: "center" }}>
          Наведите камеру — откроется ваш профиль{"\n"}с кнопкой «Сохранить контакт»
        </Text>
        <Button
          kind="grad"
          title="Отправить ссылку"
          onPress={() => Share.share({ message: url })}
          style={{ alignSelf: "stretch" }}
        />
      </View>
    </SafeAreaView>
  );
}
