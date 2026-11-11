// Shared helpers for Vercel Functions. Data is read via Supabase REST with the publishable key (RLS applies).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export async function rest(path, headers = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Accept: "application/json", ...headers },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
}

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Design tokens: docs/02-design/design-system.md
export function page(title, body) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta property="og:title" content="${esc(title)}"><meta name="theme-color" content="#000000">
<style>
:root{--bg:#000;--surface:#161618;--surface2:#222225;--ink:#F5F5F7;--muted:#8E8E93;--grad:linear-gradient(100deg,#FFB547,#FF7A59,#E85BC4);color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:440px;margin:0 auto;padding:16px max(16px,env(safe-area-inset-left)) 40px}
.top{border-radius:20px;overflow:hidden;background:var(--surface)}
.band{height:110px;background:radial-gradient(80% 120% at 15% 10%,#6E7BFF,transparent 60%),radial-gradient(70% 110% at 85% 0%,#FF8A3D,transparent 60%),radial-gradient(80% 120% at 60% 120%,#E85BC4,transparent 65%),#1d1d22}
.pin{padding:0 16px 16px;margin-top:-40px}
.av{width:80px;height:80px;border-radius:50%;border:4px solid var(--surface);display:grid;place-items:center;font-size:28px;font-weight:700;background:radial-gradient(circle at 30% 25%,#9aa3ff,#6E7BFF 45%,#3a428a);background-size:cover;background-position:center}
h1{font-size:24px;letter-spacing:-.02em;margin:10px 0 2px}.muted{color:var(--muted)}
.pill{display:inline-block;font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;background:#1C2A22;color:#5BD08A;margin-top:8px}
.pro{background:var(--grad);color:#1a0d00}
.bio{font-size:16px;line-height:1.5;color:#D1D1D6;margin:16px 2px}
.sect{font-size:13px;color:var(--muted);margin:22px 2px 8px}
.card{background:var(--surface);border-radius:18px;padding:14px;margin-bottom:8px}
.card b{display:block}.org{display:flex;justify-content:space-between;gap:8px;align-items:center}
.ok{font-size:11px;font-weight:600;color:#5BD08A;background:#1C2A22;padding:3px 8px;border-radius:999px;white-space:nowrap}
.btn{display:block;text-align:center;padding:15px;border-radius:999px;font-weight:600;text-decoration:none;margin-top:12px}
.save{background:var(--grad);color:#1a0d00}.ghost{background:var(--surface2);color:var(--ink)}
.lock{border:1px dashed #333;border-radius:16px;padding:12px;color:var(--muted);font-size:14px;margin-top:12px}
.foot{text-align:center;color:var(--muted);font-size:12px;margin-top:28px}
</style></head><body><main>${body}</main></body></html>`;
}

export function html(res, status, body) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.status(status).send(body);
}
