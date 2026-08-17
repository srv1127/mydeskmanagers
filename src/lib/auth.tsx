import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "Admin" | "Staff";
export interface Session {
  name: string;
  email: string;
  role: Role;
}

const KEY = "deskmanagers.session.v1";

interface AuthValue {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, role: Role) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      ready,
      signIn: (email, role) => {
        const next: Session = {
          email,
          role,
          name: email.split("@")[0]?.replace(/[._]/g, " ") ?? "User",
        };
        setSession(next);
        localStorage.setItem(KEY, JSON.stringify(next));
      },
      signOut: () => {
        setSession(null);
        localStorage.removeItem(KEY);
      },
    }),
    [session, ready],
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
