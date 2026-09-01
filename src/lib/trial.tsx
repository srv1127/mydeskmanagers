import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "deskmanagers.trial.v1";
export const TRIAL_DAYS = 7;

interface TrialState {
  startedAt: string;
  subscribed: boolean;
}

interface TrialValue {
  ready: boolean;
  startedAt: string | null;
  daysLeft: number;
  expired: boolean;
  subscribed: boolean;
  showWelcome: boolean;
  startTrial: () => void;
  dismissWelcome: () => void;
  subscribe: () => void;
}

const TrialContext = createContext<TrialValue | null>(null);

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function TrialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrialState | null>(null);
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    let parsed: TrialState | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) parsed = JSON.parse(raw) as TrialState;
    } catch {
      /* ignore */
    }
    if (!parsed) {
      parsed = { startedAt: new Date().toISOString(), subscribed: false };
      localStorage.setItem(KEY, JSON.stringify(parsed));
    }
    // Show the subscription pivot popup on every page load/refresh until the
    // user has an active subscription. The trial record (startedAt +
    // subscribed) stays persisted, so the popup simply reappears each visit.
    setShowWelcome(!parsed.subscribed);
    setState(parsed);
    setReady(true);
  }, []);

  const value = useMemo<TrialValue>(() => {
    const used = state ? daysBetween(new Date(state.startedAt), new Date()) : 0;
    const daysLeft = Math.max(0, TRIAL_DAYS - used);
    const subscribed = state?.subscribed ?? false;
    return {
      ready,
      startedAt: state?.startedAt ?? null,
      daysLeft,
      subscribed,
      expired: ready && !subscribed && daysLeft <= 0,
      showWelcome,
      startTrial: () => setShowWelcome(false),
      dismissWelcome: () => setShowWelcome(false),
      subscribe: () => {
        setState((prev) => {
          const next: TrialState = {
            startedAt: prev?.startedAt ?? new Date().toISOString(),
            subscribed: true,
          };
          localStorage.setItem(KEY, JSON.stringify(next));
          return next;
        });
        setShowWelcome(false);
      },
    };
  }, [state, ready, showWelcome]);

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>;
}

export function useTrial() {
  const ctx = useContext(TrialContext);
  if (!ctx) throw new Error("useTrial must be used inside TrialProvider");
  return ctx;
}
