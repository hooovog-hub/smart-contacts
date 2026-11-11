// Contact sections (spec: docs/01-product/features/contacts-book.md)
// Sections live in the `categories` table per user: system ones + groups the AI created for this person.
// Sorting is done by Claude on the server (Edge Function `classify-contacts`), not by keywords.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UNSORTED, chunk, sectionColor, type Section } from "@/lib/sections.logic";

export { TEMP_RE, UNSORTED, orderedSections, type Section } from "@/lib/sections.logic";

/** The user's sections, loaded from the database. */
export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase.from("categories").select("key, name, color, position").order("position");
    setSections([...(data ?? []).map((d) => ({ key: d.key, name: d.name, color: sectionColor(d.color) })), UNSORTED]);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  const sectionOf = useCallback(
    (k: string) => sections.find((s) => s.key === k) ?? { ...UNSORTED, key: k },
    [sections],
  );
  return { sections, sectionOf, reload };
}

/** Ask Claude (on the server) to sort contacts. Phones are never sent to the model. */
export async function aiSort(ids: string[], onProgress: (done: number, total: number) => void) {
  const plan = await supabase.functions.invoke<{ added: string[]; error?: string }>("classify-contacts", {
    body: { action: "plan" },
  });
  if (plan.error) throw plan.error;
  const chunks = chunk(ids, 120);
  let done = 0,
    sorted = 0,
    failed = 0;
  onProgress(0, ids.length);
  const worker = async () => {
    for (let ch = chunks.shift(); ch; ch = chunks.shift()) {
      const { data, error } = await supabase.functions.invoke<{ done: number; sorted: number }>("classify-contacts", {
        body: { action: "classify", ids: ch },
      });
      if (error || !data) failed += ch.length;
      else sorted += data.sorted;
      done += ch.length;
      onProgress(done, ids.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { added: plan.data?.added ?? [], sorted, failed };
}
