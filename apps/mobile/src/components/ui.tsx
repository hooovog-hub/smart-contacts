import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { avatarColors, c, grad, r } from "@/theme/tokens";

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={st.title}>{children}</Text>
      {sub ? <Text style={st.sub}>{sub}</Text> : null}
    </View>
  );
}

export const Section = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <View style={st.sectRow}><Text style={st.sect}>{children}</Text>{right}</View>
);

export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => <View style={[st.card, style]}>{children}</View>;

type BtnKind = "grad" | "white" | "ghost";
export function Button({ title, onPress, kind = "white", loading, disabled, small, style }: { title: string; onPress?: () => void; kind?: BtnKind; loading?: boolean; disabled?: boolean; small?: boolean; style?: ViewStyle }) {
  const h = small ? 36 : 48;
  const color = kind === "grad" ? c.onGrad : kind === "white" ? "#000" : c.ink;
  const inner = loading ? <ActivityIndicator color={color} /> : <Text style={[st.btnText, { color, fontSize: small ? 14 : 16 }]}>{title}</Text>;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderRadius: r.pill, overflow: "hidden" }, style]}>
      {kind === "grad" ? (
        <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[st.btn, { height: h }]}>{inner}</LinearGradient>
      ) : (
        <View style={[st.btn, { height: h, backgroundColor: kind === "white" ? c.ink : c.surface2 }]}>{inner}</View>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={st.label}>{label}</Text>
      <TextInput placeholderTextColor={c.muted} {...props} style={[st.input, props.multiline && { height: 90, paddingTop: 12, textAlignVertical: "top" }, props.style]} />
    </View>
  );
}

export function Avatar({ name, size = 44, seed }: { name: string; size?: number; seed?: string }) {
  const ini = name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
  const k = (seed ?? name).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % avatarColors.length;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColors[k], alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.36 }}>{ini}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const body = <Text style={{ color: active ? c.onGrad : c.ink, fontWeight: "500", fontSize: 13.5 }}>{color && !active ? <Text style={{ color }}>● </Text> : null}{label}</Text>;
  return (
    <Pressable onPress={onPress} style={{ borderRadius: r.pill, overflow: "hidden" }}>
      {active ? <LinearGradient colors={grad} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={st.chip}>{body}</LinearGradient> : <View style={[st.chip, { backgroundColor: c.surface }]}>{body}</View>}
    </Pressable>
  );
}

export const Pill = ({ text, tone = "ok" }: { text: string; tone?: "ok" | "warn" | "mute" }) => (
  <View style={{ alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: r.pill, backgroundColor: tone === "ok" ? c.okBg : tone === "warn" ? "#2A1B10" : c.surface2 }}>
    <Text style={{ fontSize: 11.5, fontWeight: "600", color: tone === "ok" ? c.ok : tone === "warn" ? c.accentInk : c.muted }}>{text}</Text>
  </View>
);

export const st = StyleSheet.create({
  title: { color: c.ink, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  sub: { color: c.muted, fontSize: 13.5, marginTop: 2 },
  sectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 8, paddingHorizontal: 2 },
  sect: { color: c.muted, fontSize: 13, fontWeight: "500" },
  card: { backgroundColor: c.surface, borderRadius: r.card, padding: 14 },
  btn: { alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnText: { fontWeight: "600" },
  label: { color: c.muted, fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: { backgroundColor: c.surface2, color: c.ink, borderRadius: 14, height: 46, paddingHorizontal: 14, fontSize: 15.5 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: r.pill },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  name: { color: c.ink, fontSize: 15.5, fontWeight: "500" },
  meta: { color: c.muted, fontSize: 12.5, marginTop: 1 },
  text: { color: c.ink, fontSize: 15, lineHeight: 21 },
});
