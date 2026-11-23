// Parsing of profile QR codes (becontact.app/<handle>).
// Old QRs and Wallet cards point to smart-contacts.vercel.app — that address keeps working, so we accept it too.
import { SITE_URL } from "./config";

export const LEGACY_SITE_HOSTS = ["smart-contacts.vercel.app"];

const hostOf = (url: string) =>
  url
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .replace(/^www\./, "");

/** Profile handle from a BeContact QR (current or legacy address), or null for any other code. */
export function handleFromQr(data: string): string | null {
  const m = data.trim().match(/^https?:\/\/([^/?#]+)\/([a-z0-9_.]{3,30})\/?$/i);
  if (!m) return null;
  const host = hostOf(m[1]);
  const known = [hostOf(SITE_URL), ...LEGACY_SITE_HOSTS];
  return known.includes(host) ? m[2].toLowerCase() : null;
}
