import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Armchair,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  feeStatusFor,
  duesFor,
  formatINR,
  monthKey,
  monthlyCollection,
  seatStatus,
  useLibrary,
} from "@/lib/library-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DeskManagers Library Seat & Fee Manager" },
      {
        name: "description",
        content:
          "Live overview of library seat occupancy, student count, monthly fee collection and pending dues.",
      },
      { property: "og:title", content: "DeskManagers — Library Seat & Fee Management" },
      {
        property: "og:description",
        content: "Manage 100 study seats, admissions, receipts and monthly fees in one clean dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { students, payments, settings, reservedSeats, activities, loading } = useLibrary();

  const seats = Array.from({ length: settings.totalSeats }, (_, i) => i + 1).map((n) =>
    seatStatus(n, students, reservedSeats),
  );
  const occupied = seats.filter((s) => s.status === "occupied").length;
  const reserved = seats.filter((s) => s.status === "reserved").length;
  const available = settings.totalSeats - occupied - reserved;
  const activeStudents = students.filter((s) => s.status === "active");
  const current = monthKey(new Date());
  const collected = payments.filter((p) => p.forMonth === current).reduce((s, p) => s + p.amount, 0);
  const pending = activeStudents.reduce((sum, s) => sum + duesFor(s, payments), 0);
  const chart = monthlyCollection(payments, 6);
  const donut = [
    { name: "Occupied", value: occupied, fill: "var(--color-chart-1)" },
    { name: "Available", value: available, fill: "var(--color-chart-3)" },
    { name: "Reserved", value: reserved, fill: "var(--color-chart-4)" },
  ];
  const overdue = activeStudents.filter((s) => feeStatusFor(s, payments) === "overdue").slice(0, 5);

  return (
    <AppShell
      title="Dashboard"
      description={`Today's snapshot for ${settings.libraryName}`}
      actions={
        <Button asChild className="rounded-full">
          <Link to="/students">
            <UserPlus className="mr-2 h-4 w-4" /> Add student
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              { label: "Total Seats", value: String(settings.totalSeats), icon: Armchair, tone: "primary" as const, hint: `${reserved} reserved` },
              { label: "Occupied Seats", value: String(occupied), icon: Armchair, tone: "destructive" as const, hint: `${Math.round((occupied / settings.totalSeats) * 100)}% utilisation` },
              { label: "Available Seats", value: String(available), icon: Armchair, tone: "success" as const, hint: "Ready to assign" },
              { label: "Total Students", value: String(students.length), icon: Users, tone: "primary" as const, hint: `${activeStudents.length} active` },
              { label: "Fees Collected (This Month)", value: formatINR(collected), icon: CircleDollarSign, tone: "success" as const, hint: "Received payments" },
              { label: "Pending Fees", value: formatINR(pending), icon: Clock3, tone: "warning" as const, hint: "Across active students" },
            ].map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-5 lg:col-span-2">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">Monthly fee collection</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              <TrendingUp className="mr-1 h-3.5 w-3.5" /> {formatINR(collected)} this month
            </Badge>
          </div>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ left: -18, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="collect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                    }}
                    formatter={(v: number) => [formatINR(v), "Collected"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2.5}
                    fill="url(#collect)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card-soft p-5">
          <h2 className="text-base font-semibold">Seat occupancy</h2>
          <p className="text-xs text-muted-foreground">{settings.totalSeats} seats total</p>
          {loading ? (
            <Skeleton className="mt-4 h-52 w-full rounded-2xl" />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={3}>
                      {donut.map((d) => (
                        <Cell key={d.name} fill={d.fill} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-popover)",
                        color: "var(--color-popover-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {donut.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link to="/fees" className="text-sm font-medium text-primary hover:underline">
              View fees
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y">
              {activities.slice(0, 7).map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3">
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      a.type === "admission"
                        ? "bg-primary-soft text-primary-soft-foreground"
                        : a.type === "payment"
                          ? "bg-success-soft text-success"
                          : "bg-warning-soft text-warning-foreground"
                    }`}
                  >
                    {a.type === "admission" ? (
                      <UserPlus className="h-4 w-4" />
                    ) : a.type === "payment" ? (
                      <CircleDollarSign className="h-4 w-4" />
                    ) : (
                      <Armchair className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft p-5">
          <h2 className="text-base font-semibold">Needs follow-up</h2>
          <p className="text-xs text-muted-foreground">Overdue fees this month</p>
          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : overdue.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Everyone is up to date. 🎉
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {overdue.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: s.id }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        Seat {s.seatNumber ?? "—"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-destructive">
                      {formatINR(duesFor(s, payments))}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
