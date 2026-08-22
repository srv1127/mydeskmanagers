import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — DeskManagers Library Manager" },
      {
        name: "description",
        content:
          "Sign in to DeskManagers to manage library seats, student admissions and monthly fee collection.",
      },
      { property: "og:title", content: "Sign in — DeskManagers" },
      { property: "og:description", content: "Seat and fee management for private study libraries." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, ready, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && session) void navigate({ to: "/", replace: true });
  }, [ready, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Enter a valid email and a password of 6+ characters.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    setBusy(true);
    const res =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(name, email, password);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    if (mode === "signup") {
      toast.success("Account created. Check your email to confirm, then sign in.");
      setMode("signin");
      return;
    }
    toast.success("Welcome back.");
    void navigate({ to: "/", replace: true });
  };

  const google = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) toast.error(error);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-gradient relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/15">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <span className="font-display text-lg font-bold">DeskManagers</span>
        </div>
        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Seats, students and fees — all in one calm dashboard.
          </h1>
          <p className="mt-4 text-primary-foreground/80">
            Track every seat across morning, evening, night and full-day shifts, collect monthly fees
            and see exactly who is overdue.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            {[
              "Shift-wise seat map with live status",
              "Monthly collection & pending reports",
              "Admin and staff access levels",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2 text-primary-foreground/90">
                <ShieldCheck className="h-4 w-4" /> {line}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/70">© {new Date().getFullYear()} DeskManagers</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="card-soft animate-rise w-full max-w-md p-7 sm:p-9">
          <div className="mb-7 lg:hidden">
            <div className="surface-gradient mb-3 grid h-11 w-11 place-items-center rounded-2xl text-primary-foreground">
              <BookOpenCheck className="h-6 w-6" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Use your library account to continue."
              : "The first account created becomes the Admin."}
          </p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="rounded-full">
                Sign in
              </TabsTrigger>
              {/* <TabsTrigger value="signup" className="rounded-full">
                Sign up
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@library.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>
          </div>

          <Button type="submit" disabled={busy} className="mt-6 h-11 w-full rounded-full text-sm font-semibold">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? (busy ? "Signing in…" : "Sign in") : busy ? "Creating…" : "Create account"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div> */}

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void google()}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            Continue with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
