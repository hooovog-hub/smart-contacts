// Pure logic for the classify-contacts Edge Function (no Deno / network APIs — unit-tested with Vitest).

export const UNSORTED_KEY = "unsorted";
export const MAX_NEW_SECTIONS = 6;
export const MAX_IDS_PER_CALL = 150;

export type ExistingSection = { key: string; name: string };
export type NewSection = { key: string; name: string };
export type ContactRow = { id: string; display_name: string; role?: string | null; note?: string | null };
export type ModelAssignment = { i: unknown; k: unknown };

/** Parse a JSON object from model text: whole string first, then the first {...} block. Never throws. */
export function parseModelJson<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

/** Normalise a section key proposed by the model to latin snake_case, max 30 chars. */
export function normalizeKey(raw: unknown): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

/** Clean the model's proposed new sections: valid keys, no duplicates of existing ones, at most 6. */
export function sanitizeNewSections(proposed: unknown, existing: ExistingSection[]): NewSection[] {
  const list = Array.isArray(proposed) ? proposed : [];
  const out: NewSection[] = [];
  for (const a of list) {
    const key = normalizeKey((a as { key?: unknown })?.key);
    const name = String((a as { name?: unknown })?.name ?? "")
      .trim()
      .slice(0, 40);
    if (!key || !name || key === UNSORTED_KEY) continue;
    const clash = [...existing, ...out].some((c) => c.key === key || c.name.toLowerCase() === name.toLowerCase());
    if (clash) continue;
    out.push({ key, name });
    if (out.length >= MAX_NEW_SECTIONS) break;
  }
  return out;
}

/** Lines sent to the model: index, name, role, note. Phone numbers are never included. */
export function buildContactLines(rows: ContactRow[]): string {
  return rows
    .map((r, i) => `${i}\t${r.display_name}${r.role ? ` — ${r.role}` : ""}${r.note ? ` (заметка: ${r.note})` : ""}`)
    .join("\n");
}

/**
 * Turn the model's {i, k} answers into section → contact ids.
 * Unknown keys become "unsorted"; rows the model skipped are also "unsorted";
 * each row is assigned at most once (first answer wins).
 */
export function groupAssignments(answers: unknown, rows: ContactRow[], validKeys: Set<string>): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  const seen = new Set<string>();
  const add = (k: string, id: string) => byKey.set(k, [...(byKey.get(k) ?? []), id]);
  for (const item of Array.isArray(answers) ? (answers as ModelAssignment[]) : []) {
    const idx = Number(item?.i);
    const row = Number.isInteger(idx) ? rows[idx] : undefined;
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    const k = typeof item.k === "string" && validKeys.has(item.k) ? item.k : UNSORTED_KEY;
    add(k, row.id);
  }
  for (const r of rows) if (!seen.has(r.id)) add(UNSORTED_KEY, r.id);
  return byKey;
}

/** How many contacts landed in a real section (not "unsorted"). */
export function countSorted(byKey: Map<string, string[]>): number {
  let n = 0;
  for (const [k, ids] of byKey) if (k !== UNSORTED_KEY) n += ids.length;
  return n;
}
