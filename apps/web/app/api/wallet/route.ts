// Генерация Apple Wallet пропуска. Решение: docs/03-architecture/adr/0004-wallet-passes.md
import { PKPass } from "passkit-generator";
import { createClient } from "@supabase/supabase-js";

const b64 = (k: string) => Buffer.from(process.env[k] ?? "", "base64");

export async function GET(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return new Response("Unauthorized", { status: 401 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: p } = await sb.from("profiles").select("handle, full_name, role, plan, brands(name)").eq("id", user.id).single();
  if (!p || p.plan === "free") return new Response("Wallet card is a Pro feature", { status: 403 });

  const pass = new PKPass({}, {
    wwdr: b64("WALLET_WWDR_CERT_B64"),
    signerCert: b64("WALLET_SIGNER_CERT_B64"),
    signerKey: b64("WALLET_SIGNER_KEY_B64"),
    signerKeyPassphrase: process.env.WALLET_SIGNER_KEY_PASSPHRASE,
  }, {
    formatVersion: 1,
    passTypeIdentifier: process.env.WALLET_PASS_TYPE_ID!,
    teamIdentifier: process.env.WALLET_TEAM_ID!,
    organizationName: "Smart Contacts",
    serialNumber: user.id,
    description: "Бизнес-карта",
    backgroundColor: "rgb(22,22,24)",
    foregroundColor: "rgb(245,245,247)",
    labelColor: "rgb(255,138,61)",
  });
  pass.type = "generic";
  pass.primaryFields.push({ key: "name", label: "ИМЯ", value: p.full_name });
  pass.secondaryFields.push({ key: "role", label: "РОЛЬ", value: p.role ?? "" });
  pass.auxiliaryFields.push({ key: "company", label: "КОМПАНИЯ", value: (p.brands as any[])?.[0]?.name ?? "" });
  pass.setBarcodes({ format: "PKBarcodeFormatQR", message: `${process.env.NEXT_PUBLIC_SITE_URL}/${p.handle}`, messageEncoding: "iso-8859-1" });
  // TODO(integrations-engineer): иконки icon.png/logo.png (pass.addBuffer), webServiceURL + authenticationToken для обновлений

  return new Response(new Uint8Array(pass.getAsBuffer()), { headers: { "Content-Type": "application/vnd.apple.pkpass", "Content-Disposition": `attachment; filename="${p.handle}.pkpass"` } });
}
