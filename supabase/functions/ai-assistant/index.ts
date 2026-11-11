// Edge Function: AI-помощник «кому позвонить»
// Спецификация: docs/03-architecture/ai-assistant.md
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sanitizeAnswer } from "../_shared/assistant.ts";
import { parseModelJson } from "../_shared/classify.ts";
import { consume, reportError } from "../_shared/guard.ts";
import { validateMessage } from "../_shared/limits.ts";

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM = (userName: string) => `Ты AI-помощник в записной книжке бизнесмена ${userName}.
Он описывает задачу. Найди в ЕГО контактах, кому позвонить:
- "direct": человек сам делает то, что нужно;
- "indirect": сам не делает, но по работе знает нужных людей.
Используй только id из каталога. Учитывай myNote и где познакомились. Не выдумывай факты.
category — раздел задачи: biz, personal, friends, family, med, home.
Отвечай на языке пользователя. Верни ТОЛЬКО JSON:
{"category":"...","reply":"1-2 предложения","people":[{"id":"...","kind":"direct|indirect","why":"...","ask":"готовое короткое сообщение от имени пользователя"}]}
От 0 до 4 человек.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });

  // Клиент с JWT пользователя: RLS гарантирует, что читаем только его данные
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { taskId, message } = ((await req.json().catch(() => ({}))) ?? {}) as { taskId?: string; message?: unknown };
  const invalid = validateMessage(message);
  if (invalid) return new Response(invalid, { status: 400 });
  const text = message as string;

  try {
    return await answer(sb, user.id, text, taskId);
  } catch (e) {
    await reportError("ai-assistant", e, user.id);
    return Response.json({ error: "internal" }, { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
async function answer(sb: any, userId: string, message: string, taskId?: string) {
  const { data: me } = await sb.from("profiles").select("full_name, plan").eq("id", userId).single();

  // Лимиты (migration 0006): частота запросов для всех, 5 новых задач в месяц на Free.
  const blocked =
    (await consume(userId, "assistant", me?.plan)) ??
    (!taskId ? await consume(userId, "assistant_task", me?.plan) : null);
  if (blocked) return blocked;

  // Каталог без телефонов (docs/03-architecture/security-privacy.md §5)
  const { data: contacts } = await sb
    .from("contacts")
    .select(
      "id, display_name, role, category_key, note, met_at, linked:linked_profile_id(helps, seeks, brands(name, sphere, description))",
    )
    .eq("archived", false)
    .limit(1500);
  const catalog = (contacts ?? []).map((c: any) => ({
    id: c.id,
    name: c.display_name,
    role: c.role,
    section: c.category_key,
    businesses: c.linked?.brands?.map((b: any) => [b.name, b.sphere, b.description].filter(Boolean).join(" — ")),
    helps: c.linked?.helps,
    seeks: c.linked?.seeks,
    myNote: c.note ?? undefined,
  }));

  // Задача и история
  let task = taskId;
  if (!task) {
    const { data } = await sb
      .from("ai_tasks")
      .insert({ owner_id: userId, title: message.slice(0, 60) })
      .select("id")
      .single();
    task = data!.id;
  }
  const { data: history } = await sb
    .from("ai_messages")
    .select("role, content")
    .eq("task_id", task)
    .order("created_at")
    .limit(6);
  await sb.from("ai_messages").insert({ task_id: task, role: "user", content: message });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system: [
        { type: "text", text: SYSTEM(me?.full_name ?? "") },
        {
          type: "text",
          text: "Каталог контактов (JSON):\n" + JSON.stringify(catalog),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [...(history ?? []), { role: "user", content: message }],
    }),
  });
  if (!res.ok) {
    await reportError("ai-assistant:claude", `Claude ${res.status}: ${(await res.text()).slice(0, 200)}`, userId);
    return Response.json({ error: "upstream", status: res.status }, { status: 502 });
  }
  const out = await res.json();
  const raw: string = out.content?.find((b: any) => b.type === "text")?.text ?? "{}";
  // Защита: только реальные контакты пользователя, максимум 4, категория из списка
  const { category, reply, people } = sanitizeAnswer(parseModelJson(raw), raw, new Set(catalog.map((c: any) => c.id)));

  await sb.from("ai_messages").insert({ task_id: task, role: "assistant", content: reply, people });
  if (!taskId) await sb.from("ai_tasks").update({ category }).eq("id", task);

  return Response.json({ taskId: task, category, reply, people });
}
