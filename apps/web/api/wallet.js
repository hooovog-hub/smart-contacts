// Apple Wallet pass generation. Decision: docs/03-architecture/adr/0004-wallet-passes.md
import { PKPass } from "passkit-generator";
import { SUPABASE_URL, SUPABASE_KEY, SITE_URL } from "./_lib.js";

const b64 = (k) => Buffer.from(process.env[k] ?? "", "base64");

export default async function handler(req, res) {
  const jwt = (req.headers.authorization || "").replace("Bearer ", "");
  if (!jwt) return res.status(401).send("Unauthorized");
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${jwt}` };
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!u.ok) return res.status(401).send("Unauthorized");
  const user = await u.json();
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=handle,full_name,role,plan,brands(name)`,
    { headers },
  );
  const p = (await r.json())[0];
  if (!p || p.plan === "free") return res.status(403).send("Wallet card is a Pro feature");

  const pass = new PKPass(
    {},
    {
      wwdr: b64("WALLET_WWDR_CERT_B64"),
      signerCert: b64("WALLET_SIGNER_CERT_B64"),
      signerKey: b64("WALLET_SIGNER_KEY_B64"),
      signerKeyPassphrase: process.env.WALLET_SIGNER_KEY_PASSPHRASE,
    },
    {
      formatVersion: 1,
      passTypeIdentifier: process.env.WALLET_PASS_TYPE_ID,
      teamIdentifier: process.env.WALLET_TEAM_ID,
      organizationName: "Smart Contacts",
      serialNumber: user.id,
      description: "Бизнес-карта",
      backgroundColor: "rgb(22,22,24)",
      foregroundColor: "rgb(245,245,247)",
      labelColor: "rgb(255,138,61)",
    },
  );
  pass.type = "generic";
  pass.primaryFields.push({ key: "name", label: "ИМЯ", value: p.full_name });
  pass.secondaryFields.push({ key: "role", label: "РОЛЬ", value: p.role ?? "" });
  pass.auxiliaryFields.push({ key: "company", label: "КОМПАНИЯ", value: p.brands?.[0]?.name ?? "" });
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: `${SITE_URL || "https://" + req.headers.host}/${p.handle}`,
    messageEncoding: "iso-8859-1",
  });
  // TODO(integrations-engineer): icon.png / logo.png via pass.addBuffer, webServiceURL + authenticationToken for updates

  res.setHeader("Content-Type", "application/vnd.apple.pkpass");
  res.setHeader("Content-Disposition", `attachment; filename="${p.handle}.pkpass"`);
  res.status(200).send(pass.getAsBuffer());
}
