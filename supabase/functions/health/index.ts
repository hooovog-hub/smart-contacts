// Health check: verifies the Anthropic key works (free models list call). Never returns the key.
// Deployed with verify_jwt=false. Open: https://<project>.supabase.co/functions/v1/health
Deno.serve(async () => {
  const key = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
  if (!key) return Response.json({ ok: false, reason: "no key" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/models?limit=1", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
    });
    return Response.json({ ok: r.ok, status: r.status, prefix: key.slice(0, 10), works: r.ok });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e) });
  }
});
