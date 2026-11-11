import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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
    const { data } = await supabase
      .from("profiles")
      .select("*, brands(*), memberships(*)")
      .eq("id", s.user.id)
      .maybeSingle();
    if (data)
      data.brands = (data.brands ?? []).sort(
        (a: { position: number }, b: { position: number }) => a.position - b.position,
      );
    setProfile((data as Profile) ?? null);
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

  return (
    <AuthCtx.Provider value={{ session, profile, loading, reloadProfile: () => loadProfile(session) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
