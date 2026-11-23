// Reading profiles (SC-103). The phone column is not readable directly: a phone comes from profile_phone(),
// which returns your own number always and others' within a daily limit (migrations 0011/0012).
import { supabase } from "./supabase";

/** Every profile column except phone. Keep in sync with the grant in supabase/migrations/0012. */
export const PROFILE_COLUMNS =
  "id, handle, full_name, role, bio, city, languages, links, helps, seeks, avatar_url, plan, created_at, updated_at, is_demo, pro_until, invite_code";

/** Phone of one profile, or null (no phone, not signed in, or daily limit reached). Never throws. */
export async function profilePhone(id: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("profile_phone", { p_id: id });
  if (error) return null;
  return typeof data === "string" && data ? data : null;
}
