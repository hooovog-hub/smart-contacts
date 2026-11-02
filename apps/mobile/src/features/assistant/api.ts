import type { AiReply } from "@sc/shared";
import { supabase } from "@/lib/supabase";

/** Отправить задачу или уточнение AI-помощнику. Ключ Claude живёт только на сервере. */
export async function askAssistant(message: string, taskId?: string): Promise<AiReply> {
  const { data, error } = await supabase.functions.invoke<AiReply>("ai-assistant", { body: { message, taskId } });
  if (error || !data) throw error ?? new Error("Пустой ответ AI");
  return data;
}
