// Pure section logic (no React / Supabase imports — unit-tested with Vitest).
// Spec: docs/01-product/features/contacts-book.md

export type Section = { key: string; name: string; color: string };

const COLORS: Record<string, string> = {
  a1: "#6E7BFF",
  a2: "#FF8A3D",
  a3: "#E85BC4",
  a4: "#3CC9A0",
  a5: "#4AB4F0",
  a6: "#A57CFF",
};
export const GREY = "#8E8E93";
export const UNSORTED: Section = { key: "unsorted", name: "Без раздела", color: GREY };

/** Token (a1…a6) → hex; raw hex passes through; empty → grey. */
export const sectionColor = (c?: string | null) => (c ? (COLORS[c] ?? c) : GREY);

/** Contacts that are temporary by nature (taxi, couriers, transfers). */
export const TEMP_RE = /(taxi|такси|курьер|трансфер)/i;

/** Sections priority: Семья, Работа, Друзья. */
export const PRIORITY = ["family", "work", "friends"];

/** Only non-empty sections. Order: Семья, Работа, Друзья first, then by size; "Без раздела" last. */
export function orderedSections(all: Section[], counts: Record<string, number>): Section[] {
  const rank = (k: string) => {
    const r = PRIORITY.indexOf(k);
    return r < 0 ? 99 : r;
  };
  return all
    .filter((s) => (counts[s.key] ?? 0) > 0)
    .sort((a, b) => {
      if (a.key === UNSORTED.key) return 1;
      if (b.key === UNSORTED.key) return -1;
      return rank(a.key) - rank(b.key) || (counts[b.key] ?? 0) - (counts[a.key] ?? 0);
    });
}

/** Split ids into batches for the classify-contacts function. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be positive");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
