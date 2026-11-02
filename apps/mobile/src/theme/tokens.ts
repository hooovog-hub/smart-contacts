// Токены дизайн-системы. Источник: docs/02-design/design-system.md
export const colors = {
  bg: "#000000",
  surface: "#161618",
  surface2: "#222225",
  ink: "#F5F5F7",
  muted: "#8E8E93",
  line: "#2A2A2E",
  accent: "#FF8A3D",
  ok: "#5BD08A",
  gold: "#F5C451",
  gradient: ["#FFB547", "#FF7A59", "#E85BC4"] as const,
  avatar: { a1: "#6E7BFF", a2: "#FF8A3D", a3: "#E85BC4", a4: "#3CC9A0", a5: "#4AB4F0", a6: "#A57CFF" },
};
export const radius = { card: 18, cardLg: 24, pill: 999, sheet: 28 };
export const space = { gutter: 16, gap: 8, section: 22 };
export const type = {
  title: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.5 },
  body: { fontSize: 15 },
  meta: { fontSize: 13, color: colors.muted },
  section: { fontSize: 13, fontWeight: "500" as const, color: colors.muted },
};
