import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { Icon } from "./Icon";
import { c, grad } from "@/theme/tokens";

/** AI input dock: voice is the primary button; it turns into Send while typing (docs/01-product/features/ai-assistant.md). */
export function Dock({
  placeholder,
  onSend,
  busy,
}: {
  placeholder: string;
  onSend: (t: string) => void;
  busy?: boolean;
}) {
  const [text, setText] = useState("");
  const has = text.trim().length > 0;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "position" : undefined}
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 96, backgroundColor: "rgba(0,0,0,0.92)" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1E1E21",
            borderRadius: 32,
            paddingLeft: 18,
            paddingRight: 6,
            height: 64,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={c.muted}
            style={{ flex: 1, color: c.ink, fontSize: 15.5 }}
            onSubmitEditing={() => {
              if (has) {
                onSend(text.trim());
                setText("");
              }
            }}
            returnKeyType="send"
          />
          {busy ? (
            <ActivityIndicator color={c.ink} style={{ width: 52 }} />
          ) : has ? (
            <Pressable
              onPress={() => {
                onSend(text.trim());
                setText("");
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: c.ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="send" color="#000" />
            </Pressable>
          ) : (
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Голосовой ввод",
                  "Нажмите на микрофон на клавиатуре iPhone, чтобы надиктовать задачу. Встроенная запись появится в версии из App Store.",
                )
              }
            >
              <LinearGradient
                colors={grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="mic" color={c.onGrad} size={24} />
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
