// Общие типы и константы. Источник: docs/03-architecture/data-model.md

export type Plan = "free" | "pro" | "business";
export type TaskCategory = "biz" | "personal" | "friends" | "family" | "med" | "home";
export type AwardKind = "medal" | "cert" | "press" | "talk" | "case";

export const CONTACT_SECTIONS = [
  { key: "family", name: "Семья", color: "a4" },
  { key: "work", name: "Работа", color: "a1" },
  { key: "friends", name: "Друзья", color: "a5" },
  { key: "repair", name: "Ремонт", color: "a2" },
  { key: "med", name: "Медицина", color: "a3" },
  { key: "finance", name: "Финансы и право", color: "a6" },
  { key: "travel", name: "Путешествия", color: "a5" },
  { key: "home", name: "Дом и быт", color: "a4" },
  { key: "auto", name: "Авто", color: "a2" },
  { key: "food", name: "Рестораны", color: "a6" },
  { key: "edu", name: "Образование", color: "a1" },
  { key: "beauty", name: "Красота", color: "a3" },
] as const;

export const TASK_CATEGORIES: { key: TaskCategory; name: string }[] = [
  { key: "biz", name: "Бизнес" }, { key: "personal", name: "Личное" }, { key: "friends", name: "Друзья" },
  { key: "family", name: "Семья" }, { key: "med", name: "Медицина" }, { key: "home", name: "Дом и ремонт" },
];

export const PLANS = {
  free: { monthAMD: 0, aiTasksPerMonth: 5 },
  pro: { monthAMD: 5000, yearAMD: 50000, aiTasksPerMonth: Infinity },
  business: { monthAMD: 25000, yearAMD: 250000, seats: 5, extraSeatAMD: 4000, aiTasksPerMonth: Infinity },
} as const;

export interface Brand { id: string; name: string; sphere?: string; description?: string; foundedYear?: number; teamSize?: string; offer?: string; links: Partial<Record<"instagram" | "site" | "facebook" | "linkedin" | "youtube" | "tiktok", string>>; }
export interface Membership { id: string; orgName: string; statusTitle: string; sinceYear?: number; verified: boolean; }
export interface Award { id: string; title: string; kind: AwardKind; year?: number; source?: string; }
export interface Profile { id: string; handle: string; fullName: string; role?: string; bio?: string; city?: string; languages: string[]; phone?: string; links: Record<string, string>; helps: string[]; seeks: string[]; avatarUrl?: string; plan: Plan; brands: Brand[]; memberships: Membership[]; awards: Award[]; }
export interface Contact { id: string; displayName: string; phone?: string; role?: string; categoryKey: string; note?: string; linkedProfileId?: string; source: "phonebook" | "qr" | "room" | "manual"; isTemporary: boolean; }
export interface AiPerson { contactId: string; kind: "direct" | "indirect"; why: string; ask: string; }
export interface AiReply { taskId: string; category: TaskCategory; reply: string; people: AiPerson[]; }
