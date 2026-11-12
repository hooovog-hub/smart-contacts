// Pure logic for the Apple Wallet card (unit-tested with Vitest). Files starting with "_" are not routes on Vercel.
// Design: claude.ai canvas "Smart Contacts — Wallet-карта", board "Ближайший вариант для Apple Wallet".
import crypto from "node:crypto";

/** A download link lives 5 minutes: the app gets it with the user's session, Safari opens it without one. */
export const LINK_TTL_SEC = 300;

/** Env vars without which a valid (Apple-signed) pass cannot be produced. */
export const REQUIRED_ENV = [
  "WALLET_PASS_TYPE_ID",
  "WALLET_TEAM_ID",
  "WALLET_SIGNER_CERT_B64",
  "WALLET_SIGNER_KEY_B64",
  "WALLET_WWDR_CERT_B64",
  "WALLET_LINK_SECRET",
];

/** Names of required env vars that are missing or empty. */
export function missingEnv(env) {
  return REQUIRED_ENV.filter((k) => !String(env[k] ?? "").trim());
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sign = (payload, secret) => crypto.createHmac("sha256", secret).update(payload).digest("base64url");

/** Short-lived signed token "<userId>.<expiresAt>.<hmac>" for the download link. */
export function signLink(userId, secret, nowMs = Date.now()) {
  if (!UUID.test(userId)) throw new Error("bad user id");
  if (!secret) throw new Error("no secret");
  const payload = `${userId}.${Math.floor(nowMs / 1000) + LINK_TTL_SEC}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the user id if the token is authentic and not expired, else null. Never throws. */
export function verifyLink(token, secret, nowMs = Date.now()) {
  if (typeof token !== "string" || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!UUID.test(userId) || !/^\d{1,12}$/.test(exp)) return null;
  if (Number(exp) < Math.floor(nowMs / 1000)) return null;
  const expected = Buffer.from(sign(`${userId}.${exp}`, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  return userId;
}

/** Who may get a card: Pro and Business (docs/01-product/features/plans-billing.md). */
export const canHaveCard = (plan) => plan === "pro" || plan === "business";

/** Card content from a profile row, as on the design: name, "role · company", phone, email, QR to the profile. */
export function cardContent(profile, siteUrl) {
  const p = profile ?? {};
  const company = Array.isArray(p.brands) ? (p.brands.find((b) => b?.name)?.name ?? "") : "";
  const links = p.links && typeof p.links === "object" ? p.links : {};
  return {
    name: String(p.full_name ?? "").trim(),
    roleLine: [p.role, company]
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .join(" · "),
    phone: String(p.phone ?? "").trim(),
    email: typeof links.email === "string" ? links.email.trim() : "",
    profileUrl: `${String(siteUrl).replace(/\/+$/, "")}/${encodeURIComponent(p.handle ?? "")}`,
  };
}
