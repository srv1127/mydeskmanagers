import { CheckCircle2, Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLibrary } from "@/lib/library-store";
import { TRIAL_DAYS, useTrial } from "@/lib/trial";

const PLANS = [
  { name: "Monthly", price: "₹499", note: "per month · up to 100 seats" },
  { name: "Yearly", price: "₹4,999", note: "2 months free · best value" },
];

/** First-visit pilot popup shown once per device. */
export function TrialWelcomeDialog() {
  const { showWelcome, dismissWelcome, subscribe, daysLeft } = useTrial();
  const { settings } = useLibrary();

  return (
    <Dialog open={showWelcome} onOpenChange={(v) => !v && dismissWelcome()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <span className="surface-gradient mb-2 grid h-11 w-11 place-items-center rounded-2xl text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            Your {TRIAL_DAYS}-day free pilot starts now
          </DialogTitle>
          <DialogDescription>
            {settings.libraryName} gets full access to seats, students, fees and receipts for{" "}
            {TRIAL_DAYS} days — no card needed. After that a subscription is required to keep using
            DeskManagers.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {[
            "Who is sitting where — live 100-seat map",
            "Who paid, who hasn't — dues and overdue tracking",
            "Printable fee receipts and WhatsApp reminders",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-primary-soft-foreground">
          {daysLeft} of {TRIAL_DAYS} pilot days remaining.
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="rounded-full" onClick={subscribe}>
            I have a subscription
          </Button>
          <Button className="rounded-full" onClick={dismissWelcome}>
            Start free pilot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Full-screen lock shown once the pilot has ended. */
export function TrialExpiredScreen() {
  const { subscribe } = useTrial();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="card-soft w-full max-w-lg p-7 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive-soft text-destructive">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">Your {TRIAL_DAYS}-day pilot has ended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your data is safe. Choose a subscription plan to unlock seats, students, fees and receipts
          again.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-2xl border p-4 text-left">
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-1 font-display text-2xl font-bold">{p.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
        <Button className="mt-6 w-full rounded-full" onClick={subscribe}>
          Activate subscription
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Need help? Write to billing@deskmanagers.app
        </p>
      </div>
    </div>
  );
}

/** Slim countdown banner during the pilot. */
export function TrialBanner() {
  const { subscribed, daysLeft, expired, ready } = useTrial();
  if (!ready || subscribed || expired) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-warning-soft px-4 py-2.5 text-sm text-warning-foreground">
      <span>
        Free pilot · <strong>{daysLeft}</strong> {daysLeft === 1 ? "day" : "days"} left of{" "}
        {TRIAL_DAYS}
      </span>
      <span className="text-xs opacity-80">Subscribe before the pilot ends to avoid a lockout.</span>
    </div>
  );
}
