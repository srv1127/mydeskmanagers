import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Armchair,
  BarChart3,
  Bell,
  BookOpenCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth, useTheme } from "@/lib/auth";
import { duesFor, feeStatusFor, seatStatus, useLibrary } from "@/lib/library-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/seats", label: "Seats", icon: Armchair },
  { to: "/fees", label: "Fees", icon: CreditCard },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  const { settings } = useLibrary();
  return (
    <div className="flex min-w-0 items-center gap-3 px-5 py-5">
      <div className="surface-gradient grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-primary-foreground">
        <BookOpenCheck className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold">DeskManagers</p>
        <p className="truncate text-xs text-muted-foreground">{settings.libraryName}</p>
      </div>
    </div>
  );
}

function NotificationsBell() {
  const { students, payments, settings, reservedSeats } = useLibrary();
  const active = students.filter((s) => s.status === "active");
  const overdue = active.filter((s) => feeStatusFor(s, payments) === "overdue");
  const dueToday = active.filter((s) => feeStatusFor(s, payments) === "pending");
  const vacant =
    settings.totalSeats -
    Array.from({ length: settings.totalSeats }, (_, i) => i + 1).filter(
      (n) => seatStatus(n, students, reservedSeats).status !== "available",
    ).length;
  const count = overdue.length + dueToday.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Reminders for today</p>
        </div>
        <div className="max-h-72 space-y-1 overflow-auto p-2">
          <div className="rounded-xl bg-warning-soft/70 px-3 py-2.5">
            <p className="text-sm font-medium">Fees due this month</p>
            <p className="text-xs text-muted-foreground">{dueToday.length} students still to pay</p>
          </div>
          <div className="rounded-xl bg-destructive-soft/70 px-3 py-2.5">
            <p className="text-sm font-medium">Overdue fees</p>
            <p className="text-xs text-muted-foreground">
              {overdue.length} students crossed the due date
            </p>
          </div>
          <div className="rounded-xl bg-success-soft/70 px-3 py-2.5">
            <p className="text-sm font-medium">Vacant seats</p>
            <p className="text-xs text-muted-foreground">{vacant} seats available to assign</p>
          </div>
          {overdue.slice(0, 4).map((s) => (
            <Link
              key={s.id}
              to="/students/$studentId"
              params={{ studentId: s.id }}
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-accent"
            >
              <span className="truncate text-sm">{s.name}</span>
              <Badge variant="destructive" className="rounded-full">
                ₹{duesFor(s, payments)}
              </Badge>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GlobalSearch() {
  const { students } = useLibrary();
  const [q, setQ] = useState("");
  const results = q.trim()
    ? students
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q.toLowerCase()) ||
            s.mobile.includes(q) ||
            String(s.seatNumber ?? "") === q.trim(),
        )
        .slice(0, 6)
    : [];
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search students, mobile or seat…"
        className="h-10 rounded-full border-transparent bg-muted pl-9"
      />
      {results.length > 0 && (
        <div className="card-soft absolute z-30 mt-2 w-full overflow-hidden p-1">
          {results.map((s) => (
            <Link
              key={s.id}
              to="/students/$studentId"
              params={{ studentId: s.id }}
              onClick={() => setQ("")}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground">
                Seat {s.seatNumber ?? "—"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { session, ready, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !session) void navigate({ to: "/login", replace: true });
  }, [ready, session, navigate]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-primary-soft p-4">
            <p className="text-sm font-semibold text-primary-soft-foreground">Need a hand?</p>
            <p className="mt-1 text-xs text-primary-soft-foreground/80">
              Manage up to 100 seats, fees and receipts from one place.
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-rise absolute left-0 top-0 h-full w-72 bg-sidebar shadow-lifted">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden min-w-0 sm:block">
              <GlobalSearch />
            </div>
            <div className="col-start-3 flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={toggle} aria-label="Toggle theme">
                {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </Button>
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 gap-2 rounded-full px-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {(session?.name ?? "U").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                      {session?.name ?? "Guest"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <DropdownMenuLabel className="truncate">
                    {session?.email ?? "guest@local"}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      Role: {session?.role ?? "Staff"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      signOut();
                      void navigate({ to: "/login", replace: true });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
          <div className="animate-rise">{children}</div>
        </main>
      </div>
    </div>
  );
}
