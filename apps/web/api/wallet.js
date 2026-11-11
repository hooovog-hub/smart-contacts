// Apple Wallet card. Decision: docs/03-architecture/adr/0004-wallet-passes.md · Spec: docs/01-product/features/wallet-card.md
//
// POST /api/wallet   (Authorization: Bearer <user session>)  → { url } — a signed download link valid 5 minutes.
// GET  /api/wallet?t=<token>                                  → the .pkpass; Safari shows "Add to Apple Wallet".
// The session token never goes into a URL; the link carries only the user id, expiry and an HMAC.
import { PKPass } from "passkit-generator";
import { SUPABASE_URL, SUPABASE_KEY, SITE_URL, rest } from "./_lib.js";
import { canHaveCard, cardContent, missingEnv, signLink, verifyLink } from "./_wallet.js";
import { PASS_IMAGES_B64 } from "./_pass-images.js";

const b64 = (k) => Buffer.from(process.env[k] ?? "", "base64");
const baseUrl = (req) => SITE_URL || `https://${req.headers.host}`;
const PROFILE_COLS = "id,handle,full_name,role,phone,links,plan,brands(name,position)";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const missing = missingEnv(process.env);
  if (missing.length) {
    // Not an error in the code: Apple certificates are not configured yet (docs/04-engineering/wallet-setup.md).
    return res.status(503).json({ error: "wallet_not_configured", message: "Карта Wallet ещё не настроена." });
  }
  try {
    if (req.method === "POST") return await issueLink(req, res);
    if (req.method === "GET") return await sendPass(req, res);
    return res.status(405).send("Method not allowed");
  } catch (e) {
    console.error(JSON.stringify({ level: "error", where: "wallet", message: String(e?.message ?? e) }));
    return res.status(500).json({ error: "internal" });
  }
}

async function issueLink(req, res) {
  const jwt = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!jwt) return res.status(401).json({ error: "unauthorized" });
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` };
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!u.ok) return res.status(401).json({ error: "unauthorized" });
  const user = await u.json();
  const [p] = await rest(`profiles?id=eq.${user.id}&select=plan`, { Authorization: `Bearer ${jwt}` });
  if (!p) return res.status(404).json({ error: "no_profile" });
  if (!canHaveCard(p.plan)) {
    return res.status(403).json({ error: "pro_only", message: "Карта в Apple Wallet доступна на тарифе Pro." });
  }
  const token = signLink(user.id, process.env.WALLET_LINK_SECRET);
  return res.status(200).json({ url: `${baseUrl(req)}/api/wallet?t=${encodeURIComponent(token)}` });
}

async function sendPass(req, res) {
  const userId = verifyLink(String(req.query.t ?? ""), process.env.WALLET_LINK_SECRET);
  if (!userId) return res.status(410).send("Ссылка устарела. Нажмите «Добавить в Apple Wallet» в приложении ещё раз.");
  // Profiles are public; brands of paid profiles are public too (RLS), so the publishable key is enough.
  const [p] = await rest(`profiles?id=eq.${userId}&select=${PROFILE_COLS}`);
  if (!p || !canHaveCard(p.plan)) return res.status(403).send("Карта в Apple Wallet доступна на тарифе Pro.");
  if (Array.isArray(p.brands)) p.brands.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const card = cardContent(p, baseUrl(req));

  const images = Object.fromEntries(Object.entries(PASS_IMAGES_B64).map(([k, v]) => [k, Buffer.from(v, "base64")]));
  const pass = new PKPass(
    images,
    {
      wwdr: b64("WALLET_WWDR_CERT_B64"),
      signerCert: b64("WALLET_SIGNER_CERT_B64"),
      signerKey: b64("WALLET_SIGNER_KEY_B64"),
      signerKeyPassphrase: process.env.WALLET_SIGNER_KEY_PASSPHRASE || undefined,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: process.env.WALLET_PASS_TYPE_ID,
      teamIdentifier: process.env.WALLET_TEAM_ID,
      organizationName: "Smart Contacts",
      serialNumber: userId,
      description: `Визитка: ${card.name}`,
      logoText: "Smart Contacts",
      // Graphite card from the design: #161618 ground, #F5F5F7 text, #A1A1A6 secondary.
      backgroundColor: "rgb(22,22,24)",
      foregroundColor: "rgb(245,245,247)",
      labelColor: "rgb(161,161,166)",
      sharingProhibited: false,
    },
  );
  pass.type = "generic";
  pass.primaryFields.push({ key: "name", label: "", value: card.name });
  if (card.roleLine) pass.secondaryFields.push({ key: "role", label: "", value: card.roleLine });
  if (card.phone) pass.auxiliaryFields.push({ key: "phone", label: "ТЕЛЕФОН", value: card.phone });
  if (card.email) pass.auxiliaryFields.push({ key: "email", label: "EMAIL", value: card.email });
  pass.backFields.push({ key: "profile", label: "Профиль", value: card.profileUrl });
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: card.profileUrl, messageEncoding: "iso-8859-1" });
  // TODO(SC-051): webServiceURL + authenticationToken so profile edits update the card (APNs push).

  res.setHeader("Content-Type", "application/vnd.apple.pkpass");
  res.setHeader("Content-Disposition", `attachment; filename="${p.handle || "card"}.pkpass"`);
  return res.status(200).send(pass.getAsBuffer());
}
