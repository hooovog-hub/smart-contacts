import { CONTACT_SECTIONS } from "@sc/shared";
import type { Contact } from "@sc/shared";

/** Порядок разделов: Семья, Работа, Друзья, Ремонт, сообщества, затем по убыванию количества. */
const PRIORITY = ["family", "work", "friends", "repair"];

export function orderSections(contacts: Contact[], communityKeys: string[] = []) {
  const count = (k: string) => contacts.filter((c) => c.categoryKey === k).length;
  const keys = [...CONTACT_SECTIONS.map((s) => s.key as string), ...communityKeys].filter((k) => count(k) > 0);
  const rank = (k: string) => { const i = [...PRIORITY, ...communityKeys].indexOf(k); return i < 0 ? 99 : i; };
  return keys.sort((a, b) => rank(a) - rank(b) || count(b) - count(a));
}

/** Группировка для режима А–Я. */
export function groupAZ(contacts: Contact[]) {
  const sorted = [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));
  const groups = new Map<string, Contact[]>();
  for (const c of sorted) {
    const L = c.displayName[0]?.toUpperCase() ?? "#";
    groups.set(L, [...(groups.get(L) ?? []), c]);
  }
  return groups;
}
