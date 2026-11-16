// Edge Function: delete the signed-in user's account (SC-072, Apple App Review 5.1.1(v)).
// Spec: docs/01-product/features/account-deletion.md · Privacy: docs/03-architecture/security-privacy.md §6
// Order: revoke Apple tokens → Storage files → auth user → error reports. Deleting the auth user cascades to
// profiles and every table that references it (brands, contacts, rooms, ai_tasks, ai_usage, …; see migrations).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { chunk, collectObjectPaths, validateDeleteRequest } from "../_shared/account.ts";
import { revokeAppleTokens } from "../_shared/appleRevoke.ts";
import { reportError } from "../_shared/guard.ts";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response("Unauthorized", { status: 401 });

  // Identify the caller from their own JWT; the user id never comes from the request body.
  const sb = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();
  if (!user) {
    // A missing user is normal after a repeated call (the client then just signs out locally).
    if (authErr && (authErr.status ?? 0) >= 500) await reportError("delete-account:auth", authErr);
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const invalid = validateDeleteRequest(body);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  try {
    // 1. Revoke Sign in with Apple tokens (Apple requirement). Never blocks deletion.
    const appleId = user.identities?.find((i) => i.provider === "apple");
    const code = (body as { appleAuthorizationCode?: unknown }).appleAuthorizationCode;
    let apple: string = appleId ? "no_code" : "not_apple";
    if (appleId && typeof code === "string" && code.length < 2000) {
      const sub = (appleId.identity_data?.sub as string | undefined) ?? appleId.id ?? null;
      apple = await revokeAppleTokens(code, sub);
    }
    if (apple !== "revoked" && apple !== "not_apple") await reportError("delete-account:apple", apple);

    // 2. Files, 3. auth user (hard delete → cascades to all user tables).
    await removeStorage(user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    // 4. client_errors has no FK (reports must save before a profile exists): remove after the user is gone,
    // so a report sent during deletion cannot survive. Best effort.
    await admin.from("client_errors").delete().eq("owner_id", user.id);

    console.log(JSON.stringify({ level: "info", where: "delete-account", event: "deleted", apple }));
    return Response.json({ ok: true });
  } catch (e) {
    // No user id, and uuids scrubbed from the message: the record must not outlive the account.
    await reportError("delete-account", scrub(e, user.id));
    return Response.json({ error: "internal" }, { status: 500 });
  }
});

/** Error text without the user's id (Storage errors may contain "<userId>/…" paths). */
function scrub(e: unknown, userId: string): string {
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
  return (msg || "error").split(userId).join("<user>");
}

/** Remove every object under "<userId>/" (recursively) in every bucket (none exist yet; future photos go there). */
async function removeStorage(userId: string) {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  for (const b of buckets ?? []) {
    const bucket = admin.storage.from(b.name);
    const paths = await collectObjectPaths((prefix, opts) => bucket.list(prefix, opts), userId);
    for (const part of chunk(paths)) {
      const { error: rmErr } = await bucket.remove(part);
      if (rmErr) throw rmErr;
    }
  }
}
