// Invite page: /i/<code>. Shows who invited and how to join; the app reads the code from the deep link
// (smartcontacts://i/<code>) or the user types it at sign-up. Spec: docs/01-product/features/invites.md
import { esc, html, page, rest } from "./_lib.js";

const INSTALL_URL = process.env.INVITE_INSTALL_URL || ""; // TestFlight public link now, App Store later

export default async function handler(req, res) {
  const code = String(req.query.code || "").toLowerCase();
  if (!/^[a-z0-9]{4,32}$/.test(code)) return html(res, 404, page("Не найдено", `<h1>Приглашение не найдено</h1>`));
  let p;
  try {
    // Only the public name and role; who invited whom stays private (profile_invites).
    const rows = await rest(`profiles?invite_code=eq.${encodeURIComponent(code)}&select=full_name,role,avatar_url`);
    p = rows[0];
  } catch {
    return html(
      res,
      500,
      page("Ошибка", `<h1>Не удалось открыть приглашение</h1><p class="muted">Попробуйте позже.</p>`),
    );
  }
  if (!p)
    return html(res, 404, page("Не найдено", `<h1>Приглашение не найдено</h1><p class="muted">Проверьте ссылку.</p>`));
  const first = esc(String(p.full_name).split(/\s+/)[0]);
  const body = `
  <h1 style="margin-top:28px">${first} приглашает вас в BeContact</h1>
  <p class="muted">${esc(p.role || "")}</p>
  <p class="bio">Умная записная книжка для бизнеса: AI подсказывает, кто из знакомых поможет с задачей, визитка в Apple Wallet и напоминания, кому стоит написать.</p>
  ${INSTALL_URL ? `<a class="btn save" href="${esc(INSTALL_URL)}">Установить приложение</a>` : `<div class="lock">Приложение сейчас в закрытом тестировании. Попросите ${first} добавить вас — и сохраните код ниже.</div>`}
  <a class="btn ghost" href="smartcontacts://i/${esc(code)}">У меня уже есть приложение</a>
  <div class="sect">Код приглашения — введите его при создании профиля</div>
  <div class="code">${esc(code)}</div>
  <div class="foot">BeContact</div>`;
  return html(res, 200, page(`${p.full_name} приглашает вас в BeContact`, body));
}
