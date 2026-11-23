import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROFILE_COLUMNS, profilePhone } from "./profileData";
import { supabase } from "./supabase";
import type { Profile } from "./types";

type Ctx = { session: Session | null; profile: Profile | null; loading: boolean; reloadProfile: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, profile: null, loading: true, reloadProfile: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const [{ data }, phone] = await Promise.all([
      supabase
        .from("profiles")
        .select(`${PROFILE_COLUMNS}, brands(*), memberships(*)`)
        .eq("id", s.user.id)
        .maybeSingle(),
      profilePhone(s.user.id),
    ]);
    if (!data) return setProfile(null);
    const brands = ((data.brands ?? []) as { position: number }[]).sort((a, b) => a.position - b.position);
    setProfile({ ...(data as unknown as Profile), brands: brands as Profile["brands"], phone });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  // Stable function and value: screens put reloadProfile in effect deps (a new one each render looped forever).
  const reloadProfile = useCallback(() => loadProfile(session), [loadProfile, session]);
  const value = useMemo(
    () => ({ session, profile, loading, reloadProfile }),
    [session, profile, loading, reloadProfile],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
