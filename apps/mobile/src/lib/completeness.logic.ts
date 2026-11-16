// Profile completeness for "Мой профиль" (pure, unit-tested). Spec: docs/01-product/features/profile.md
// 10 items. The personal "Сайт" is gone (a site belongs to a brand); photo and "Сейчас ищу" count (2026-11-16).
import type { Profile } from "./types";

export type LinkKey = "instagram" | "linkedin" | "email" | "telegram" | "whatsapp";

/** What tapping "+" opens: a one-field sheet, a list sheet, the photo picker or a brand/membership form. */
export type AddKind =
  | { kind: "field"; column: "full_name" | "role" | "bio" | "city" | "phone" }
  | { kind: "link"; key: LinkKey }
  | { kind: "seek" }
  | { kind: "help" }
  | { kind: "photo" }
  | { kind: "brand" }
  | { kind: "membership" };

export type Item = { id: string; label: string; done: boolean; add: AddKind };

const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

export function completenessItems(p: Profile, openSeeks = 0): Item[] {
  const links = p.links ?? {};
  return [
    { id: "photo", label: "Фото", done: filled(p.avatar_url), add: { kind: "photo" } },
    { id: "role", label: "Чем занимаетесь", done: filled(p.role), add: { kind: "field", column: "role" } },
    { id: "phone", label: "Телефон", done: filled(p.phone), add: { kind: "field", column: "phone" } },
    { id: "bio", label: "О себе", done: filled(p.bio), add: { kind: "field", column: "bio" } },
    { id: "city", label: "Город", done: filled(p.city), add: { kind: "field", column: "city" } },
    { id: "seeks", label: "Сейчас ищу", done: openSeeks > 0, add: { kind: "seek" } },
    { id: "brand", label: "Бренд", done: (p.brands ?? []).length > 0, add: { kind: "brand" } },
    { id: "instagram", label: "Instagram", done: filled(links.instagram), add: { kind: "link", key: "instagram" } },
    { id: "linkedin", label: "LinkedIn", done: filled(links.linkedin), add: { kind: "link", key: "linkedin" } },
    { id: "membership", label: "Членство", done: (p.memberships ?? []).length > 0, add: { kind: "membership" } },
  ];
}

export function completeness(p: Profile, openSeeks = 0): { pct: number; done: number; total: number; todo: Item[] } {
  const items = completenessItems(p, openSeeks);
  const done = items.filter((i) => i.done).length;
  return {
    pct: Math.round((done / items.length) * 100),
    done,
    total: items.length,
    todo: items.filter((i) => !i.done),
  };
}

/** Normalises what the user typed into a link field (handles "@name", full URLs, bare domains). Null = invalid. */
export function normalizeLink(key: LinkKey | "site", input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (key === "instagram") {
    const m = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
    const name = (m ? m[1] : v).replace(/^@+/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(name) ? `@${name}` : null;
  }
  if (key === "telegram") {
    const m = v.match(/t\.me\/([A-Za-z0-9_]+)/i);
    const name = (m ? m[1] : v).replace(/^@+/, "");
    if (/^\+?\d[\d\s()-]{6,}$/.test(name)) return name.replace(/[^\d+]/g, "");
    return /^[A-Za-z0-9_]{4,32}$/.test(name) ? `@${name}` : null;
  }
  if (key === "whatsapp") {
    const d = v.replace(/[^\d+]/g, "");
    return d.replace(/\D/g, "").length >= 8 ? (d.startsWith("+") ? d : `+${d}`) : null;
  }
  if (key === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.toLowerCase() : null;
  if (key === "linkedin") {
    if (/linkedin\.com\//i.test(v)) return v.startsWith("http") ? v : `https://${v}`;
    const name = v.replace(/^@+/, "");
    return /^[A-Za-z0-9-]{3,100}$/.test(name) ? `https://www.linkedin.com/in/${name}` : null;
  }
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Hidden messenger marker: the user turned "same number" off and wants nothing shown. */
export const HIDDEN = "-";

/** WhatsApp/Telegram default to the profile phone unless set to another value or hidden. */
export function messenger(p: Pick<Profile, "phone" | "links">, key: "whatsapp" | "telegram") {
  const v = (p.links ?? {})[key];
  if (v === HIDDEN) return { mode: "hidden" as const, value: null };
  if (v && v.trim()) return { mode: "custom" as const, value: v };
  return p.phone ? { mode: "same" as const, value: p.phone } : { mode: "none" as const, value: null };
}
