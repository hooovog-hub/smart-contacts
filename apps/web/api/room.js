// Room join page without the app: /r/<code>. Spec: docs/01-product/features/meetings-rooms.md
// TODO(web-engineer): list members via a server-side query with service role; join form → POST /api/room-join
import { esc, page, html } from "./_lib.js";

export default async function handler(req, res) {
  const code = String(req.query.code || "").toUpperCase().slice(0, 12);
  return html(res, 200, page(`Встреча ${code}`, `<h1>Встреча ${esc(code)}</h1><p class="muted">Войдите, чтобы увидеть участников и сохранить их контакты.</p>`));
}
