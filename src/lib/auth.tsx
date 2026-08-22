import type { Session as SbSession, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/* =========================================================
   TYPES
========================================================= */

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

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signInWithGoogle: () => Promise<{ error: string | null }>;

  signOut: () => Promise<void>;
}

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = createContext<AuthValue | null>(null);

/* =========================================================
   HELPERS
========================================================= */

function nameFromEmail(email: string) {
  return (
    email
      .split("@")[0]
      ?.replace(/[._-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) || "User"
  );
}

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sbSession, setSbSession] = useState<SbSession | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [ready, setReady] = useState(false);

  /* =======================================================
     HYDRATE USER SESSION
  ======================================================= */

  const hydrate = useCallback(async (sb: SbSession | null) => {
    /* -----------------------------------------------
       No Supabase session
    ------------------------------------------------ */

    if (!sb?.user) {
      setSbSession(null);
      setSession(null);
      setReady(true);
      return;
    }

    const user = sb.user;

    try {
      /* -----------------------------------------------
         Load profile + role simultaneously
      ------------------------------------------------ */

      const [
        { data: profile, error: profileError },
        { data: roles, error: rolesError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id),
      ]);

      /* -----------------------------------------------
         Debug database errors
      ------------------------------------------------ */

      if (profileError) {
        console.error(
          "Failed to load user profile:",
          profileError
        );
      }

      if (rolesError) {
        console.error(
          "Failed to load user role:",
          rolesError
        );
      }

      /* -----------------------------------------------
         Determine role
      ------------------------------------------------ */

      const hasAdminRole = (roles ?? []).some(
        (item) => item.role === "admin"
      );

      const role: Role = hasAdminRole ? "Admin" : "Staff";

      /* -----------------------------------------------
         Determine user name
      ------------------------------------------------ */

      const metadataName =
        typeof user.user_metadata?.["full_name"] === "string"
          ? (user.user_metadata["full_name"] as string)
          : "";

      const name =
        profile?.full_name ||
        metadataName ||
        nameFromEmail(user.email ?? "");

      /* -----------------------------------------------
         Create application session
      ------------------------------------------------ */

      const appSession: Session = {
        id: user.id,
        name,
        email: profile?.email || user.email || "",
        role,
      };

      setSbSession(sb);
      setSession(appSession);
    } catch (error) {
      console.error(
        "Unexpected authentication error:",
        error
      );

      setSession(null);
    } finally {
      setReady(true);
    }
  }, []);

  /* =======================================================
     INITIAL AUTH CHECK
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    /* -----------------------------------------------
       Listen for Supabase authentication changes
    ------------------------------------------------ */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;

        console.log(
          "Supabase auth event:",
          event
        );

        setSbSession(nextSession);

        /*
         * Don't perform database queries synchronously
         * inside Supabase's auth callback.
         */
        if (event === "TOKEN_REFRESHED") {
          return;
        }

        void hydrate(nextSession);
      }
    );

    /* -----------------------------------------------
       Get current session
    ------------------------------------------------ */

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(
            "Failed to get Supabase session:",
            error
          );

          setSbSession(null);
          setSession(null);
          setReady(true);

          return;
        }

        void hydrate(data.session);
      });

    /* -----------------------------------------------
       Cleanup
    ------------------------------------------------ */

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  /* =======================================================
     SIGN IN
  ======================================================= */

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      try {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          console.error(
            "Sign in failed:",
            error
          );

          return {
            error: error.message,
          };
        }

        return {
          error: null,
        };
      } catch (error) {
        console.error(
          "Unexpected sign in error:",
          error
        );

        return {
          error: "Unable to sign in. Please try again.",
        };
      }
    },
    []
  );

  /* =======================================================
     SIGN UP
  ======================================================= */

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ error: string | null }> => {
      try {
        const { error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,

            options: {
              emailRedirectTo:
                `${window.location.origin}/login`,

              data: {
                full_name: name.trim(),
              },
            },
          });

        if (error) {
          console.error(
            "Sign up failed:",
            error
          );

          return {
            error: error.message,
          };
        }

        return {
          error: null,
        };
      } catch (error) {
        console.error(
          "Unexpected sign up error:",
          error
        );

        return {
          error: "Unable to create account.",
        };
      }
    },
    []
  );

  /* =======================================================
     GOOGLE SIGN IN
  ======================================================= */

  const signInWithGoogle = useCallback(
    async (): Promise<{ error: string | null }> => {
      try {
        const { error } = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });

        if (error) {
          console.error(
            "Google sign in failed:",
            error
          );

          return {
            error: typeof error === "string" ? error : "Unable to sign in with Google.",
          };
        }

        return {
          error: null,
        };
      } catch (error) {
        console.error(
          "Unexpected Google sign in error:",
          error
        );

        return {
          error: "Unable to sign in with Google.",
        };
      }
    },
    []
  );

  /* =======================================================
     SIGN OUT
  ======================================================= */

  const signOut = useCallback(async () => {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Sign out failed:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Unexpected sign out error:",
        error
      );
    } finally {
      setSbSession(null);
      setSession(null);
      setReady(true);
    }
  }, []);

  /* =======================================================
     AUTH VALUE
  ======================================================= */

  const value = useMemo<AuthValue>(
    () => ({
      session,

      user: sbSession?.user ?? null,

      ready,

      isAdmin:
        session?.role === "Admin",

      signIn,

      signUp,

      signInWithGoogle,

      signOut,
    }),
    [
      session,
      sbSession,
      ready,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    ]
  );

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   USE AUTH
========================================================= */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

/* =========================================================
   THEME
========================================================= */

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem(
        "deskmanagers.theme"
      );

    const isDark =
      stored === "dark";

    setDark(isDark);

    document.documentElement.classList.toggle(
      "dark",
      isDark
    );
  }, []);

  const toggle = () => {
    setDark((previous) => {
      const next = !previous;

      document.documentElement.classList.toggle(
        "dark",
        next
      );

      localStorage.setItem(
        "deskmanagers.theme",
        next ? "dark" : "light"
      );

      return next;
    });
  };

  return {
    dark,
    toggle,
  };
}
