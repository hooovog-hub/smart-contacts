// Domain types. Source of truth: supabase/migrations, docs/03-architecture/data-model.md
export type Plan = "free" | "pro" | "business";
export type Links = Partial<Record<"whatsapp" | "telegram" | "instagram" | "linkedin" | "site" | "email" | "facebook", string>>;
export interface Brand { id?: string; name: string; sphere?: string | null; description?: string | null; founded_year?: number | null; offer?: string | null; links: Links; position: number }
export interface Membership { id?: string; org_name: string; status_title?: string | null; since_year?: number | null; verified?: boolean }
export interface Profile {
  id: string; handle: string; full_name: string; role?: string | null; bio?: string | null; city?: string | null;
  phone?: string | null; links: Links; plan: Plan; avatar_url?: string | null;
  brands?: Brand[]; memberships?: Membership[];
}
export interface Contact {
  id: string; display_name: string; phone?: string | null; role?: string | null; category_key: string;
  note?: string | null; source: "phonebook" | "qr" | "room" | "manual"; created_at: string;
}
export interface AiPerson { contactId: string; kind: "direct" | "indirect"; why: string; ask: string }
export interface AiTask { id: string; title: string; category: string; status: "open" | "done"; created_at: string }
export interface AiMessage { id: string; role: "user" | "assistant"; content: string; people: AiPerson[]; created_at: string }
