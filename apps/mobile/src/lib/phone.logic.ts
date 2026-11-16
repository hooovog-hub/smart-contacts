// Phone numbers with a country picker (pure, unit-tested). Stored in E.164-like form: "+37495944844".

export type Country = { iso: string; name: string; dial: string; flag: string };

/** Armenia first (launch market), then the countries our users most often deal with. */
export const COUNTRIES: Country[] = [
  { iso: "AM", name: "Армения", dial: "374", flag: "🇦🇲" },
  { iso: "RU", name: "Россия", dial: "7", flag: "🇷🇺" },
  { iso: "GE", name: "Грузия", dial: "995", flag: "🇬🇪" },
  { iso: "US", name: "США", dial: "1", flag: "🇺🇸" },
  { iso: "AE", name: "ОАЭ", dial: "971", flag: "🇦🇪" },
  { iso: "FR", name: "Франция", dial: "33", flag: "🇫🇷" },
  { iso: "DE", name: "Германия", dial: "49", flag: "🇩🇪" },
  { iso: "GB", name: "Великобритания", dial: "44", flag: "🇬🇧" },
  { iso: "UA", name: "Украина", dial: "380", flag: "🇺🇦" },
  { iso: "KZ", name: "Казахстан", dial: "7", flag: "🇰🇿" },
  { iso: "BY", name: "Беларусь", dial: "375", flag: "🇧🇾" },
  { iso: "IR", name: "Иран", dial: "98", flag: "🇮🇷" },
  { iso: "TR", name: "Турция", dial: "90", flag: "🇹🇷" },
  { iso: "CY", name: "Кипр", dial: "357", flag: "🇨🇾" },
  { iso: "IL", name: "Израиль", dial: "972", flag: "🇮🇱" },
  { iso: "IT", name: "Италия", dial: "39", flag: "🇮🇹" },
  { iso: "ES", name: "Испания", dial: "34", flag: "🇪🇸" },
  { iso: "NL", name: "Нидерланды", dial: "31", flag: "🇳🇱" },
  { iso: "CA", name: "Канада", dial: "1", flag: "🇨🇦" },
  { iso: "CN", name: "Китай", dial: "86", flag: "🇨🇳" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * Builds the stored number from a picked country and what the user typed.
 * Strips spaces/dashes/brackets and a national leading 0 ("095 944 844" → "+37495944844").
 * If the user pasted a full number with "+", it is kept as is. Empty input → null.
 */
export function toE164(country: Country, input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith("+")) {
    const d = raw.replace(/\D/g, "");
    return d ? `+${d}` : null;
  }
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // "00374…" international prefix, or the dial code typed again without "+"
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith(country.dial) && digits.length > country.dial.length + 6) return `+${digits}`;
  digits = digits.replace(/^0+/, "");
  return `+${country.dial}${digits}`;
}

/** Splits a stored number back into a country and the national part (longest matching dial code wins). */
export function fromE164(stored: string | null | undefined): { country: Country; national: string } {
  const digits = (stored ?? "").replace(/\D/g, "");
  if (!digits) return { country: DEFAULT_COUNTRY, national: "" };
  if (!(stored ?? "").trim().startsWith("+")) return { country: DEFAULT_COUNTRY, national: digits };
  const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
  if (!match) return { country: DEFAULT_COUNTRY, national: `+${digits}` };
  return { country: match, national: digits.slice(match.dial.length) };
}

/** Too short / too long numbers are likely typos (E.164 allows up to 15 digits). */
export function isPlausible(e164: string | null): boolean {
  if (!e164) return true; // phone is optional
  const n = e164.replace(/\D/g, "").length;
  return n >= 8 && n <= 15;
}
