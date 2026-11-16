// Profile completeness for "Мой профиль" (pure, unit-tested). Spec: docs/01-product/features/profile.md
// Photo is intentionally not counted: photo upload does not exist yet and the founder asked not to nudge it.
import type { Profile } from "./types";

/** How a missing item is added: a one-field sheet on the profile screen, or the full edit screen. */
export type AddKind =
  | { kind: "field"; column: "role" | "bio" | "city" | "phone" }
  | { kind: "link"; key: "instagram" | "linkedin" | "site" }
  | { kind: "edit"; section: "main" | "brands" | "memberships" };

export type Item = { id: string; label: string; done: boolean; add: AddKind };

const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

export function completenessItems(p: Profile): Item[] {
  const links = p.links ?? {};
  return [
    { id: "name", label: "Имя", done: filled(p.full_name), add: { kind: "edit", section: "main" } },
    { id: "role", label: "Чем занимаетесь", done: filled(p.role), add: { kind: "field", column: "role" } },
    { id: "phone", label: "Телефон", done: filled(p.phone), add: { kind: "field", column: "phone" } },
    { id: "bio", label: "О себе", done: filled(p.bio), add: { kind: "field", column: "bio" } },
    { id: "city", label: "Город", done: filled(p.city), add: { kind: "field", column: "city" } },
    { id: "brand", label: "Бренд", done: (p.brands ?? []).length > 0, add: { kind: "edit", section: "brands" } },
    { id: "instagram", label: "Instagram", done: filled(links.instagram), add: { kind: "link", key: "instagram" } },
    { id: "linkedin", label: "LinkedIn", done: filled(links.linkedin), add: { kind: "link", key: "linkedin" } },
    { id: "site", label: "Сайт", done: filled(links.site), add: { kind: "link", key: "site" } },
    {
      id: "membership",
      label: "Членство",
      done: (p.memberships ?? []).length > 0,
      add: { kind: "edit", section: "memberships" },
    },
  ];
}

export function completeness(p: Profile): { pct: number; done: number; total: number; todo: Item[] } {
  const items = completenessItems(p);
  const done = items.filter((i) => i.done).length;
  return {
    pct: Math.round((done / items.length) * 100),
    done,
    total: items.length,
    todo: items.filter((i) => !i.done),
  };
}

/** Normalises what the user typed into a link field (handles "@name", full URLs, bare domains). */
export function normalizeLink(key: "instagram" | "linkedin" | "site", input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (key === "instagram") {
    const m = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
    const name = (m ? m[1] : v).replace(/^@+/, "");
    return /^[A-Za-z0-9._]{1,30}$/.test(name) ? `@${name}` : null;
  }
  if (key === "linkedin") {
    if (/linkedin\.com\//i.test(v)) return v.startsWith("http") ? v : `https://${v}`;
    return `https://www.linkedin.com/in/${v.replace(/^@+/, "")}`;
  }
  return v.startsWith("http") ? v : `https://${v}`;
}
