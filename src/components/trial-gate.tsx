import { CheckCircle2, Copy, Lock, QrCode, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLibrary } from "@/lib/library-store";
import { useAuth } from "@/lib/auth";
import { TRIAL_DAYS, useTrial } from "@/lib/trial";

const UPI_ID = "sauravishwakarma11-4@okaxis";

function PaymentInstructions({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const { isAdmin } = useAuth();
  const [reference, setReference] = useState("");
  const [confirming, setConfirming] = useState(false);

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied.");
  };

  const confirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
    toast.success("Subscription marked active for this billing period.");
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Pay ₹499 for one month</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-center">
        <img src="/upi-qr.jpeg" alt="UPI payment QR code" className="mx-auto h-32 w-32 rounded-lg border object-cover" />
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Scan the QR code or pay to this UPI ID:</p>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-xs">{UPI_ID}</code>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => void copyUpi()} aria-label="Copy UPI ID">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Renewal is due on the 5th of every month.</p>
        </div>
      </div>
      {isAdmin && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">After checking the payment, confirm it here to update the account.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Payment reference (optional)" />
            <Button type="button" className="shrink-0" disabled={confirming} onClick={() => void confirm()}>
              {confirming ? "Confirming…" : "Confirm payment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** First-visit pilot popup shown once per device. */
export function TrialWelcomeDialog() {
  const { showWelcome, dismissWelcome, daysLeft, locked, subscribed, daysUntilRenewal, renewalDate } = useTrial();
  const { settings, confirmSubscription } = useLibrary();

  return (
    <Dialog open={showWelcome} onOpenChange={(v) => !v && dismissWelcome()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <span className="surface-gradient mb-2 grid h-11 w-11 place-items-center rounded-2xl text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <DialogTitle className="font-display text-xl">
            {locked ? "Subscription payment is required" : subscribed ? "Subscription active" : `Your ${TRIAL_DAYS}-day free pilot starts now`}
          </DialogTitle>
          <DialogDescription>
            {locked
              ? `${settings.libraryName} is locked until the monthly payment is confirmed.`
              : `${settings.libraryName} gets full access to seats, students, fees and receipts for ${TRIAL_DAYS} days — no card needed.`}
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
        {!locked && <div className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-primary-soft-foreground">{daysLeft} of {TRIAL_DAYS} pilot days remaining.</div>}
        {subscribed && renewalDate && <div className="rounded-2xl bg-success-soft px-4 py-3 text-sm text-success-foreground">Next renewal: {renewalDate} ({daysUntilRenewal} days).</div>}
        <PaymentInstructions onConfirm={() => confirmSubscription()} />
        {!locked && <Button variant="ghost" className="w-full" onClick={dismissWelcome}>Continue with free pilot</Button>}
        {locked && <p className="text-center text-xs font-medium text-destructive">This window stays open after the 5th until payment is confirmed.</p>}
      </DialogContent>
    </Dialog>
  );
}

/** Full-screen lock shown once the pilot has ended. */
export function TrialExpiredScreen() {
  const { daysLeft, locked } = useTrial();
  const { confirmSubscription } = useLibrary();
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
        <div className="mt-6"><PaymentInstructions onConfirm={() => confirmSubscription()} /></div>
        {locked && <p className="mt-3 text-xs text-destructive">Payment is required to unlock the account.</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          Need help? Write to billing@deskmanagers.app
        </p>
      </div>
    </div>
  );
}

/** Slim countdown banner during the pilot. */
export function TrialBanner() {
  const { subscribed, daysLeft, expired, ready, locked, daysUntilRenewal, renewalDate } = useTrial();
  if (!ready || subscribed || expired) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-warning-soft px-4 py-2.5 text-sm text-warning-foreground">
      <span>
        {locked ? "Subscription payment required" : <>Free pilot · <strong>{daysLeft}</strong> {daysLeft === 1 ? "day" : "days"} left of {TRIAL_DAYS}</>}
      </span>
      <span className="text-xs opacity-80">{renewalDate ? `Next renewal ${renewalDate} · ${daysUntilRenewal} days` : "Pay before the 5th to keep access."}</span>
    </div>
  );
}
