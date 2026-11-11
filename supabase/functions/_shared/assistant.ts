// Pure logic for the ai-assistant Edge Function (no Deno / network APIs — unit-tested with Vitest).

export const TASK_CATEGORIES = ["biz", "personal", "friends", "family", "med", "home"] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export const MAX_PEOPLE = 4;

export type SuggestedPerson = { contactId: string; kind: "direct" | "indirect"; why: string; ask: string };
export type SafeAnswer = { category: TaskCategory; reply: string; people: SuggestedPerson[] };

/**
 * Guard the model's answer: only the owner's real contacts, at most 4 people,
 * kind is direct|indirect, category from the fixed list (default "biz").
 */
export function sanitizeAnswer(parsed: unknown, fallbackText: string, contactIds: Set<string>): SafeAnswer {
  const p = (parsed && typeof parsed === "object" ? parsed : {}) as {
    category?: unknown;
    reply?: unknown;
    people?: unknown;
  };
  const category = (TASK_CATEGORIES as readonly unknown[]).includes(p.category) ? (p.category as TaskCategory) : "biz";
  const reply = typeof p.reply === "string" ? p.reply : parsed ? "" : fallbackText;
  const seen = new Set<string>();
  const people: SuggestedPerson[] = [];
  for (const raw of Array.isArray(p.people) ? p.people : []) {
    const r = raw as { id?: unknown; kind?: unknown; why?: unknown; ask?: unknown };
    const id = typeof r?.id === "string" ? r.id : "";
    if (!contactIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    people.push({
      contactId: id,
      kind: r.kind === "indirect" ? "indirect" : "direct",
      why: String(r.why ?? ""),
      ask: String(r.ask ?? ""),
    });
    if (people.length >= MAX_PEOPLE) break;
  }
  return { category, reply, people };
}
