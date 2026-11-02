// Public profile page: /<handle>. Spec: docs/01-product/features/profile.md
import { rest, esc, page, html } from "./_lib.js";

const ini = (n) => n.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

export default async function handler(req, res) {
  const handle = String(req.query.handle || "").toLowerCase();
  if (!/^[a-z0-9_.]{3,30}$/.test(handle)) return html(res, 404, page("Не найдено", `<h1>Профиль не найден</h1>`));
  let p;
  try {
    const rows = await rest(`profiles?handle=eq.${encodeURIComponent(handle)}&select=id,full_name,role,bio,city,languages,plan,avatar_url,phone,links,brands(name,sphere,description,links,position),memberships(org_name,status_title,since_year,verified)`);
    p = rows[0];
  } catch (e) {
    return html(res, 500, page("Ошибка", `<h1>Не удалось загрузить профиль</h1><p class="muted">Попробуйте ещё раз через минуту.</p>`));
  }
  if (!p) return html(res, 404, page("Не найдено", `<h1>Профиль не найден</h1><p class="muted">Проверьте ссылку.</p>`));
  const paid = p.plan !== "free";
  const brands = paid ? (p.brands || []).sort((a, b) => a.position - b.position) : [];
  const orgs = paid ? p.memberships || [] : [];
  const avatar = p.avatar_url ? `<div class="av" style="background-image:url('${esc(p.avatar_url)}')"></div>` : `<div class="av">${esc(ini(p.full_name))}</div>`;
  const body = `
  <div class="top"><div class="band"></div><div class="pin">${avatar}
    <h1>${esc(p.full_name)} ${paid ? '<span class="pill pro">PRO</span>' : ""}</h1>
    <div class="muted">${esc([p.role, ...brands.map((b) => b.name)].filter(Boolean).join(" · "))}</div>
    <span class="pill">✓ Профиль проверен</span> <span class="muted" style="font-size:13px">${esc(p.city || "")}</span>
  </div></div>
  <a class="btn save" href="/${esc(handle)}/vcard">Сохранить контакт</a>
  ${paid && p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ""}
  ${brands.length ? `<div class="sect">Бренды и компании · ${brands.length}</div>` + brands.map((b) => `<div class="card"><b>${esc(b.name)}</b><span class="muted">${esc(b.sphere || "")}</span>${b.description ? `<div style="margin-top:4px">${esc(b.description)}</div>` : ""}</div>`).join("") : ""}
  ${orgs.length ? `<div class="sect">Членство в организациях</div>` + orgs.map((o) => `<div class="card org"><div><b>${esc(o.org_name)}</b><span class="muted">${esc(o.status_title || "")}${o.since_year ? " · с " + o.since_year : ""}</span></div>${o.verified ? '<span class="ok">✓ Подтверждено</span>' : ""}</div>`).join("") : ""}
  ${!paid ? `<div class="lock">Бизнесы, бренды и членство показываются в Pro-профиле.</div>` : ""}
  <a class="btn ghost" href="smartcontacts://person/${esc(p.id)}">Открыть в приложении</a>
  <div class="foot">Smart Contacts · <a href="/" style="color:inherit">Создать свой профиль</a></div>`;
  return html(res, 200, page(`${p.full_name} — Smart Contacts`, body));
}
