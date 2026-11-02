// Contact sections (spec: docs/01-product/features/contacts-book.md)
// Sections live in the `categories` table per user: system ones + groups the AI created for this person.
// Sorting is done by Claude on the server (Edge Function `classify-contacts`), not by keywords.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Section = { key: string; name: string; color: string };

const COLORS: Record<string, string> = { a1: "#6E7BFF", a2: "#FF8A3D", a3: "#E85BC4", a4: "#3CC9A0", a5: "#4AB4F0", a6: "#A57CFF" };
export const UNSORTED: Section = { key: "unsorted", name: "Без раздела", color: "#8E8E93" };
const color = (c?: string | null) => (c ? COLORS[c] ?? c : "#8E8E93");

export const TEMP_RE = /(taxi|такси|курьер|трансфер)/i;

/** The user's sections, loaded from the database. */
export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("categories").select("key, name, color, position").order("position");
    setSections([...(data ?? []).map((d) => ({ key: d.key, name: d.name, color: color(d.color) })), UNSORTED]);
  }, []);
  useEffect(() => { reload(); }, [reload]);
  const sectionOf = useCallback((k: string) => sections.find((s) => s.key === k) ?? { ...UNSORTED, key: k }, [sections]);
  return { sections, sectionOf, reload };
}

/** Order: Семья, Работа, Друзья first, then by size; "Без раздела" last. */
export function orderedSections(all: Section[], counts: Record<string, number>) {
  const prio = ["family", "work", "friends"];
  return all.filter((s) => (counts[s.key] ?? 0) > 0).sort((a, b) => {
    if (a.key === "unsorted") return 1;
    if (b.key === "unsorted") return -1;
    const ra = prio.indexOf(a.key), rb = prio.indexOf(b.key);
    return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || (counts[b.key] ?? 0) - (counts[a.key] ?? 0);
  });
}

/** Ask Claude (on the server) to sort contacts. Phones are never sent to the model. */
export async function aiSort(ids: string[], onProgress: (done: number, total: number) => void) {
  const plan = await supabase.functions.invoke<{ added: string[]; error?: string }>("classify-contacts", { body: { action: "plan" } });
  if (plan.error) throw plan.error;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 120) chunks.push(ids.slice(i, i + 120));
  let done = 0, sorted = 0, failed = 0;
  onProgress(0, ids.length);
  const worker = async () => {
    for (let ch = chunks.shift(); ch; ch = chunks.shift()) {
      const { data, error } = await supabase.functions.invoke<{ done: number; sorted: number }>("classify-contacts", { body: { action: "classify", ids: ch } });
      if (error || !data) failed += ch.length; else sorted += data.sorted;
      done += ch.length;
      onProgress(done, ids.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { added: plan.data?.added ?? [], sorted, failed };
}
