// Deno-side helpers shared by AI Edge Functions: limit checks and error reports.
// Uses the service role key (available to Edge Functions by default); never exposed to clients.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { type AiFn, type ConsumeResult, limitResponse, limitsFor } from "./limits.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

/**
 * Record one AI use if limits allow it. Returns a ready 429/503 Response when blocked, or null when allowed.
 * Fails closed: if the limit check itself fails, the AI is not called (protects the Claude bill).
 */
export async function consume(userId: string, fn: AiFn, plan: string | null | undefined): Promise<Response | null> {
  const l = limitsFor(fn, plan);
  const { data, error } = await admin.rpc("ai_consume", {
    p_user: userId,
    p_fn: fn,
    p_per_minute: l.perMinute,
    p_per_day: l.perDay,
    p_per_month: l.perMonth,
  });
  if (error) {
    await reportError(`limits:${fn}`, error, userId);
    return Response.json({ error: "limits_unavailable" }, { status: 503 });
  }
  const result = data as ConsumeResult;
  if (result?.ok) return null;
  const r = limitResponse(result);
  return Response.json(r.body, { status: r.status, headers: r.headers });
}

/** Log an Edge Function error to function logs and to public.client_errors (source = 'edge'). Never throws. */
export async function reportError(where: string, err: unknown, userId?: string, context?: Record<string, unknown>) {
  const message = (err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err)) || "error";
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(JSON.stringify({ level: "error", where, message, userId }));
  try {
    await admin.from("client_errors").insert({
      source: "edge",
      owner_id: userId ?? null,
      message: `${where}: ${message}`.slice(0, 1000),
      stack: stack?.slice(0, 8000) ?? null,
      fatal: false,
      platform: "deno",
      context: context ?? null,
    });
  } catch {
    /* reporting must never break the request */
  }
}
