import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type Role } from "@/lib/auth";

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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@deskmanagers.app");
  const [password, setPassword] = useState("library123");
  const [role, setRole] = useState<Role>("Admin");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Enter a valid email and a password of 6+ characters.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      signIn(email.trim(), role);
      toast.success(`Welcome back, signed in as ${role}.`);
      void navigate({ to: "/", replace: true });
    }, 550);
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
            Track 100 seats in a visual grid, collect monthly fees, print receipts and see exactly who
            is overdue.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            {["Visual seat map with live status", "Monthly collection & pending reports", "Admin and staff access"].map(
              (line) => (
                <div key={line} className="flex items-center gap-2 text-primary-foreground/90">
                  <ShieldCheck className="h-4 w-4" /> {line}
                </div>
              ),
            )}
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
          <h2 className="font-display text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your library credentials to continue.
          </p>

          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="Admin" className="rounded-full">
                Admin
              </TabsTrigger>
              <TabsTrigger value="Staff" className="rounded-full">
                Staff
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 space-y-4">
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
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo mode — any valid email works. Data is stored on this device.
          </p>
        </form>
      </div>
    </div>
  );
}
