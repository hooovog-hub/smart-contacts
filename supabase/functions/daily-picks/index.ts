// Edge Function: «Стоит написать сегодня» — up to 3 people a day with a reason and a ready message.
// Spec: docs/01-product/features/today.md · Logic: ../_shared/picks.ts
// POST { day: "YYYY-MM-DD" } (the user's local date). Cached per day in public.daily_picks.
// Phone numbers are never sent to the model.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseModelJson } from "../_shared/classify.ts";
import { consume, reportError } from "../_shared/guard.ts";
import { type PickContact, sanitizePicks, selectCandidates } from "../_shared/picks.ts";

const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5";
const API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const SCHEMA = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, reason: { type: "string" }, message: { type: "string" } },
        required: ["id", "reason", "message"],
        additionalProperties: false,
      },
    },
  },
  required: ["picks"],
  additionalProperties: false,
};

type Row = { contact_id: string; reason: string; message: string; position: number };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });
  const sb = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { day?: unknown };
  // The user's local date, accepted only within ±1 day of the server's UTC date.
  const utc = new Date().toISOString().slice(0, 10);
  const asked = typeof body.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : utc;
  const day = Math.abs(Date.parse(asked) - Date.parse(utc)) <= 86_400_000 ? asked : utc;

  try {
    const cached = await load(sb, day);
    if (cached.length) return Response.json({ day, picks: cached });

    const { data: me } = await sb.from("profiles").select("full_name, role, plan").eq("id", user.id).single();
    // People shown in the last 14 days are skipped so the list changes.
    const since = new Date(Date.parse(day) - 14 * 86_400_000).toISOString().slice(0, 10);
    const { data: recentRows } = await sb.from("daily_picks").select("contact_id").gte("day", since);
    const recent = new Set((recentRows ?? []).map((r: { contact_id: string }) => r.contact_id));

    const { data: rows } = await sb
      .from("contacts")
      .select(
        "id, display_name, role, category_key, note, source, created_at, linked:linked_profile_id(profile_seeks(text, resolved_at))",
      )
      .eq("archived", false)
      .eq("is_demo", false)
      .limit(3000);
    // deno-lint-ignore no-explicit-any
    const contacts: PickContact[] = (rows ?? []).map((c: any) => ({
      id: c.id,
      display_name: c.display_name,
      role: c.role,
      category_key: c.category_key,
      note: c.note,
      source: c.source,
      created_at: c.created_at,
      linked_seeks: (c.linked?.profile_seeks ?? [])
        .filter((s: { resolved_at: string | null }) => !s.resolved_at)
        .map((s: { text: string }) => s.text),
    }));
    const candidates = selectCandidates(contacts, day, recent);
    if (!candidates.length) return Response.json({ day, picks: [] });

    const blocked = await consume(user.id, "daily_picks", me?.plan);
    if (blocked) return blocked;

    const byId = new Map(contacts.map((c) => [c.id, c]));
    const lines = candidates
      .map((c) => {
        const p = byId.get(c.id)!;
        return `${c.id}\t${p.display_name}${p.role ? ` — ${p.role}` : ""}\tповод: ${c.hint}`;
      })
      .join("\n");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        system: `Ты помогаешь бизнесмену ${me?.full_name ?? ""}${me?.role ? ` (${me.role})` : ""} поддерживать связи.
Для каждого человека из списка напиши:
- reason: одна короткая фраза, почему стоит написать сегодня (опирайся на повод, не выдумывай фактов);
- message: готовое тёплое сообщение от его имени, 1–2 предложения, на «ты» или «вы» по ситуации, по-русски.
Используй только id из списка.`,
        messages: [{ role: "user", content: lines }],
      }),
    });
    if (!res.ok) {
      await reportError("daily-picks:claude", `Claude ${res.status}: ${(await res.text()).slice(0, 200)}`, user.id);
      return Response.json({ error: "upstream" }, { status: 502 });
    }
    const out = await res.json();
    if (out.stop_reason === "refusal") return Response.json({ day, picks: [] });
    // deno-lint-ignore no-explicit-any
    const text: string = out.content?.find((b: any) => b.type === "text")?.text ?? "";
    const picks = sanitizePicks(parseModelJson(text), candidates);
    if (picks.length) {
      const { error } = await admin.from("daily_picks").upsert(
        picks.map((p, i) => ({
          owner_id: user.id,
          day,
          contact_id: p.id,
          position: i,
          reason: p.reason,
          message: p.message,
        })),
        { onConflict: "owner_id,day,contact_id", ignoreDuplicates: true },
      );
      if (error) throw error;
    }
    return Response.json({ day, picks: await load(sb, day) });
  } catch (e) {
    await reportError("daily-picks", e, user.id);
    return Response.json({ error: "internal" }, { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
async function load(sb: any, day: string) {
  const { data } = await sb
    .from("daily_picks")
    .select("contact_id, reason, message, position, contacts(display_name, role, phone)")
    .eq("day", day)
    .order("position");
  return (data ?? []) as (Row & { contacts: unknown })[];
}
