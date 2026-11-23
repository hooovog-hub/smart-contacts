// vCard download: /<handle>/vcard
import { profilePhone, rest, SITE_URL, withinHourlyLimit } from "./_lib.js";

// SC-103: the phone is public here, so one visitor gets at most this many vCards with a phone per hour.
const VCARD_PHONES_PER_HOUR = 20;

export default async function handler(req, res) {
  const handle = String(req.query.handle || "").toLowerCase();
  const rows = await rest(`profiles?handle=eq.${encodeURIComponent(handle)}&select=full_name,role`).catch(() => []);
  const p = rows[0];
  if (!p) return res.status(404).send("Not found");
  // Over the limit the card still downloads, just without the phone.
  const phone = (await withinHourlyLimit(req, "vcard", VCARD_PHONES_PER_HOUR)) ? await profilePhone({ handle }) : null;
  const base = SITE_URL || `https://${req.headers.host}`;
  const url = `${base}/${handle}`;
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${p.full_name}`,
    p.role ? `TITLE:${p.role}` : "",
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    `URL:${url}`,
    `NOTE:Профиль: ${url}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${handle}.vcf"`);
  res.status(200).send(vcf);
}
