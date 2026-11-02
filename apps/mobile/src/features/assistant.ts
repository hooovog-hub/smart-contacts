import { supabase } from "@/lib/supabase";
import type { AiPerson } from "@/lib/types";

export const TASK_CATS: { key: string; name: string }[] = [
  { key: "biz", name: "Бизнес" }, { key: "personal", name: "Личное" }, { key: "friends", name: "Друзья" },
  { key: "family", name: "Семья" }, { key: "med", name: "Медицина" }, { key: "home", name: "Дом и ремонт" },
];
export const catName = (k: string) => TASK_CATS.find((t) => t.key === k)?.name ?? "";

/** Ask the AI assistant. The Claude key lives only on the server (Edge Function `ai-assistant`). */
export async function askAssistant(message: string, taskId?: string) {
  const { data, error } = await supabase.functions.invoke<{ taskId: string; category: string; reply: string; people: AiPerson[] }>("ai-assistant", { body: { message, taskId } });
  if (error || !data) throw error ?? new Error("Пустой ответ");
  return data;
}
