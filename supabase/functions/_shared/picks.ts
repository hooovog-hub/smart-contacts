// Pure candidate selection for "Стоит написать сегодня" (daily-picks Edge Function). Unit-tested with Vitest.
// Birthdays are NOT here — they have their own block on the Today screen.

export type PickContact = {
  id: string;
  display_name: string;
  role?: string | null;
  category_key: string;
  note?: string | null;
  source: string; // phonebook | qr | room | manual
  created_at: string;
  linked_seeks?: string[]; // open "Сейчас ищу" of the linked Smart Contacts profile
};

export type Candidate = { id: string; kind: "seeks" | "new" | "business"; hint: string };

export const PICKS_PER_DAY = 3;
const DAY = 86_400_000;
const BUSINESS_SECTIONS = new Set(["work", "finance"]);

/** Small deterministic hash so the same day gives the same order (no Math.random in tests). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Picks up to `limit` people to reach out to today, in priority order:
 * 1) a linked profile with an open need ("Ищет …"), 2) a recent acquaintance (QR/room/manual, 3–21 days old),
 * 3) someone from a business section. Contacts shown in the last 14 days (`recent`) are skipped.
 * Bulk phonebook imports never count as "new acquaintances".
 */
export function selectCandidates(
  contacts: PickContact[],
  today: string, // YYYY-MM-DD
  recent: Set<string>,
  limit = PICKS_PER_DAY,
): Candidate[] {
  const now = Date.parse(`${today}T12:00:00Z`);
  const pool = contacts.filter((c) => !recent.has(c.id));
  const order = (a: PickContact, b: PickContact) => hash(today + a.id) - hash(today + b.id);
  const out: Candidate[] = [];
  const take = (c: PickContact, kind: Candidate["kind"], hint: string) => {
    if (out.length < limit && !out.some((x) => x.id === c.id)) out.push({ id: c.id, kind, hint });
  };

  for (const c of pool.filter((x) => (x.linked_seeks ?? []).length).sort(order))
    take(c, "seeks", `Ищет: ${(c.linked_seeks ?? [])[0]}`);

  for (const c of pool
    .filter((x) => x.source !== "phonebook")
    .filter((x) => {
      const age = (now - Date.parse(x.created_at)) / DAY;
      return age >= 3 && age <= 21;
    })
    .sort(order)) {
    const days = Math.round((now - Date.parse(c.created_at)) / DAY);
    take(c, "new", `Познакомились ${days} дн. назад`);
  }

  for (const c of pool.filter((x) => BUSINESS_SECTIONS.has(x.category_key)).sort(order))
    take(c, "business", c.note ? `Ваша заметка: ${c.note.slice(0, 80)}` : "Раздел Работа — давно не на связи?");

  return out;
}

export type PickOut = { id: string; reason: string; message: string };

/** Keeps only candidates we offered, trims texts, falls back to our hint when the model gives no reason. */
export function sanitizePicks(raw: unknown, candidates: Candidate[]): PickOut[] {
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const list = Array.isArray((raw as { picks?: unknown })?.picks) ? (raw as { picks: unknown[] }).picks : [];
  const out: PickOut[] = [];
  for (const item of list) {
    const r = item as { id?: unknown; reason?: unknown; message?: unknown };
    const c = typeof r.id === "string" ? byId.get(r.id) : undefined;
    if (!c || out.some((x) => x.id === c.id)) continue;
    const message = String(r.message ?? "")
      .trim()
      .slice(0, 600);
    if (!message) continue;
    out.push({
      id: c.id,
      reason:
        String(r.reason ?? "")
          .trim()
          .slice(0, 200) || c.hint,
      message,
    });
  }
  return out;
}
