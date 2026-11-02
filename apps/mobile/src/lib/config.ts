import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
export const SUPABASE_URL = extra.supabaseUrl;
export const SUPABASE_KEY = extra.supabaseKey; // publishable key — safe in the client (RLS protects data)
export const SITE_URL = extra.siteUrl;
