// /privacy and /terms (?lang=ru|en). Texts: docs/06-business/legal/*.md → scripts/build-legal.mjs → _legal-content.js
import { LEGAL } from "./_legal-content.js";
import { html, page } from "./_lib.js";

const DOCS = { privacy: "privacy-policy", terms: "terms" };

export default function handler(req, res) {
  const doc = DOCS[String(req.query.doc || "")];
  if (!doc) return html(res, 404, page("Не найдено", "<h1>Страница не найдена</h1>"));
  const asked = String(req.query.lang || "");
  const lang =
    asked === "en" || asked === "ru"
      ? asked
      : /^\s*en/i.test(String(req.headers["accept-language"] || ""))
        ? "en"
        : "ru";
  const entry = LEGAL[`${doc}.${lang}`];
  if (!entry) return html(res, 404, page("Не найдено", "<h1>Страница не найдена</h1>"));
  const other = lang === "ru" ? "en" : "ru";
  const path = doc === "terms" ? "/terms" : "/privacy";
  const body = `
  <div class="legal-nav"><a href="${path}?lang=${other}">${other === "en" ? "English" : "Русский"}</a></div>
  <article class="legal">${entry.html}</article>
  <div class="foot">BeContact · <a href="/privacy?lang=${lang}" style="color:inherit">${lang === "ru" ? "Конфиденциальность" : "Privacy"}</a> · <a href="/terms?lang=${lang}" style="color:inherit">${lang === "ru" ? "Условия" : "Terms"}</a></div>`;
  return html(res, 200, page(entry.title, body));
}
