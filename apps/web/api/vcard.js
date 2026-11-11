// vCard download: /<handle>/vcard
import { rest, SITE_URL } from "./_lib.js";

export default async function handler(req, res) {
  const handle = String(req.query.handle || "").toLowerCase();
  const rows = await rest(`profiles?handle=eq.${encodeURIComponent(handle)}&select=full_name,role,phone`).catch(
    () => [],
  );
  const p = rows[0];
  if (!p) return res.status(404).send("Not found");
  const base = SITE_URL || `https://${req.headers.host}`;
  const url = `${base}/${handle}`;
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${p.full_name}`,
    p.role ? `TITLE:${p.role}` : "",
    p.phone ? `TEL;TYPE=CELL:${p.phone}` : "",
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
