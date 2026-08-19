import type { Session as SbSession, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type Role = "Admin" | "Staff";
export type DbRole = "admin" | "staff";

export interface Session {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthValue {
  session: Session | null;
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function nameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[._]/g, " ") ?? "User";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sbSession, setSbSession] = useState<SbSession | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async (sb: SbSession | null) => {
    if (!sb?.user) {
      setSession(null);
      setReady(true);
      return;
    }
    const user = sb.user;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    setSession({
      id: user.id,
      email: profile?.email || user.email || "",
      name:
        profile?.full_name ||
        (user.user_metadata?.["full_name"] as string | undefined) ||
        nameFromEmail(user.email ?? ""),
      role: isAdmin ? "Admin" : "Staff",
    });
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSbSession(next);
      if (event === "TOKEN_REFRESHED") return;
      void hydrate(next);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSbSession(data.session);
      void hydrate(data.session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: sbSession?.user ?? null,
      ready,
      isAdmin: session?.role === "Admin",
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return { error: error?.message ?? null };
      },
      signUp: async (name, email, password) => {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: name.trim() },
          },
        });
        return { error: error?.message ?? null };
      },
      signInWithGoogle: async () => {
        try {
          const { lovable } = await import("@/integrations/lovable");
          await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
          return { error: null };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Google sign-in failed" };
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
      },
    }),
    [session, sbSession, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("deskmanagers.theme");
    const isDark = stored ? stored === "dark" : false;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("deskmanagers.theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}
