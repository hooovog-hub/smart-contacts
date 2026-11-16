// Pure logic for the "Сегодня" tab (unit-tested). Spec: docs/01-product/features/today.md

export type BirthdayContact = { id: string; display_name: string; phone?: string | null; birthday?: string | null };
export type UpcomingBirthday = { contact: BirthdayContact; inDays: number; age: number | null };

const UNKNOWN_YEAR = 1604; // iOS convention for "no year"

/** Local calendar date as YYYY-MM-DD (the user's day, not UTC). */
export function localDay(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Birthdays from today to `days` ahead (default: today + 7 days), soonest first. Feb 29 → Feb 28 in other years. */
export function upcomingBirthdays(list: BirthdayContact[], today: string, days = 7): UpcomingBirthday[] {
  const [ty, tm, td] = today.split("-").map(Number);
  const t0 = Date.UTC(ty, tm - 1, td);
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const out: UpcomingBirthday[] = [];
  for (const c of list) {
    if (!c.birthday) continue;
    const [by, bm, bd] = c.birthday.slice(0, 10).split("-").map(Number);
    if (!bm || !bd) continue;
    let best: { inDays: number; year: number } | null = null;
    for (const y of [ty, ty + 1]) {
      const day = bm === 2 && bd === 29 && !isLeap(y) ? 28 : bd;
      const inDays = Math.round((Date.UTC(y, bm - 1, day) - t0) / 86_400_000);
      if (inDays >= 0 && (!best || inDays < best.inDays)) best = { inDays, year: y };
    }
    if (best && best.inDays <= days)
      out.push({ contact: c, inDays: best.inDays, age: by && by !== UNKNOWN_YEAR ? best.year - by : null });
  }
  return out.sort((a, b) => a.inDays - b.inDays || a.contact.display_name.localeCompare(b.contact.display_name));
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? full;

export function birthdayMessage(name: string) {
  return `${firstName(name)}, с днём рождения! 🎉 Желаю здоровья, сил и чтобы все задуманные проекты получались. Хорошего дня!`;
}

/** WhatsApp deep link with a prefilled message, or null when the number is unusable. */
export function whatsappUrl(phone: string | null | undefined, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function whenLabel(inDays: number): string {
  if (inDays === 0) return "Сегодня";
  if (inDays === 1) return "Завтра";
  const n =
    inDays % 10 === 1 && inDays % 100 !== 11
      ? "день"
      : [2, 3, 4].includes(inDays % 10) && ![12, 13, 14].includes(inDays % 100)
        ? "дня"
        : "дней";
  return `Через ${inDays} ${n}`;
}
