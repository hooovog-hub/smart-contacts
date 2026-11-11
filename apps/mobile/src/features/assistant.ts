import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import type { AiPerson } from "@/lib/types";

export const TASK_CATS: { key: string; name: string }[] = [
  { key: "biz", name: "Бизнес" },
  { key: "personal", name: "Личное" },
  { key: "friends", name: "Друзья" },
  { key: "family", name: "Семья" },
  { key: "med", name: "Медицина" },
  { key: "home", name: "Дом и ремонт" },
];
export const catName = (k: string) => TASK_CATS.find((t) => t.key === k)?.name ?? "";

/** AI refused because of a limit; `message` is ready to show. */
export class AiLimitError extends Error {}

/** Ask the AI assistant. The Claude key lives only on the server (Edge Function `ai-assistant`). */
export async function askAssistant(message: string, taskId?: string) {
  const { data, error } = await supabase.functions.invoke<{
    taskId: string;
    category: string;
    reply: string;
    people: AiPerson[];
  }>("ai-assistant", { body: { message, taskId } });
  if (error) {
    // 429 = AI limit (rate limit or Free monthly quota): show the server's message to the user.
    const res = (error as { context?: Response }).context;
    if (res?.status === 429) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new AiLimitError(body?.message ?? "Лимит AI исчерпан. Попробуйте позже.");
    }
    reportError(error, { context: { fn: "ai-assistant", status: res?.status } });
    throw error;
  }
  if (!data) throw new Error("Пустой ответ");
  return data;
}
