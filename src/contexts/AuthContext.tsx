import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "cliente";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { full_name: string | null; avatar_url: string | null } | null;
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchUserData = useCallback(async (userId: string, fetchId: number) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);
      // Only update state if this is still the latest fetch
      if (fetchIdRef.current !== fetchId) return;
      if (profileRes.data) setProfile(profileRes.data);
      if (roleRes.data) setRole(roleRes.data.role as AppRole);
      else setRole("cliente");
    } catch {
      if (fetchIdRef.current !== fetchId) return;
      setRole("cliente");
    } finally {
      if (fetchIdRef.current === fetchId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Set up listener FIRST (synchronous callback — no await inside)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setIsLoading(true);
          const id = ++fetchIdRef.current;
          fetchUserData(newSession.user.id, id);
        } else {
          fetchIdRef.current++;
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // 2. Then get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const id = ++fetchIdRef.current;
        fetchUserData(initialSession.user.id, id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    fetchIdRef.current++;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isAdmin: role === "admin", isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
