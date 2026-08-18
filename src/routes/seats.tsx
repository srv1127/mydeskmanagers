import { createFileRoute, Link } from "@tanstack/react-router";
import { Armchair, Bookmark, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { seatStatus, useLibrary } from "@/lib/library-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/seats")({
  head: () => ({
    meta: [
      { title: "Seat Management — DeskManagers" },
      {
        name: "description",
        content:
          "Visual seat map for 100 library desks: assign, change or release seats and see live occupancy.",
      },
      { property: "og:title", content: "Seat Management — DeskManagers" },
      { property: "og:description", content: "Green available, red occupied, yellow reserved — at a glance." },
    ],
  }),
  component: SeatsPage,
});

const STYLES = {
  available: "bg-success-soft text-success border-success/40 hover:border-success hover:bg-success/15",
  occupied:
    "bg-destructive-soft text-destructive border-destructive/40 hover:border-destructive hover:bg-destructive/15",
  reserved:
    "bg-warning-soft text-warning-foreground border-warning/50 hover:border-warning hover:bg-warning/20",
} as const;

const DOTS = {
  available: "bg-success",
  occupied: "bg-destructive",
  reserved: "bg-warning",
} as const;

const LABELS = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
} as const;

function SeatsPage() {
  const { students, reservedSeats, settings, loading, assignSeat, releaseSeat, toggleReserved } =
    useLibrary();
  const [selected, setSelected] = useState<number | null>(null);
  const [assignTo, setAssignTo] = useState("");

  const seats = Array.from({ length: settings.totalSeats }, (_, i) => i + 1);
  const detail = selected ? seatStatus(selected, students, reservedSeats) : null;
  const counts = seats.reduce(
    (acc, n) => {
      acc[seatStatus(n, students, reservedSeats).status] += 1;
      return acc;
    },
    { available: 0, occupied: 0, reserved: 0 },
  );
  const unseated = students.filter((s) => s.status === "active" && s.seatNumber === null);

  return (
    <AppShell
      title="Seat management"
      description={`${settings.totalSeats} seats · ${counts.occupied} occupied · ${counts.available} available`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        {(
          [
            ["available", counts.available],
            ["occupied", counts.occupied],
            ["reserved", counts.reserved],
          ] as const
        ).map(([key, count]) => (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
              STYLES[key],
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", DOTS[key])} /> {LABELS[key]} · {count}
          </span>
        ))}
        <span className="text-xs text-muted-foreground">
          Tap any seat to assign, release or reserve it.
        </span>
      </div>

      <div className="card-soft p-4 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
            {Array.from({ length: 40 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 sm:gap-3">
            {seats.map((n) => {
              const st = seatStatus(n, students, reservedSeats);
              return (
                <button
                  key={n}
                  type="button"
                  title={`Seat ${n} · ${LABELS[st.status]}${st.student ? ` · ${st.student.name}` : ""}`}
                  aria-label={`Seat ${n}, ${LABELS[st.status]}${st.student ? `, ${st.student.name}` : ""}`}
                  onClick={() => {
                    setSelected(n);
                    setAssignTo("");
                  }}
                  className={cn(
                    "group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 p-1.5 text-center transition-all",
                    "hover:-translate-y-0.5 hover:shadow-lifted active:translate-y-0 active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    STYLES[st.status],
                    selected === n && "ring-2 ring-ring ring-offset-2",
                  )}
                >
                  <span
                    className={cn("absolute right-1.5 top-1.5 h-2 w-2 rounded-full", DOTS[st.status])}
                  />
                  <Armchair className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-bold leading-none">{n}</span>
                  <span className="w-full truncate text-[10px] font-medium leading-tight opacity-90">
                    {st.student?.name.split(" ")[0] ?? (st.status === "reserved" ? "Reserved" : "Free")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seat {selected}</DialogTitle>
            <DialogDescription className="capitalize">
              Status: {detail?.status ?? "—"}
              {detail?.student ? ` · ${detail.student.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {detail?.student ? (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted p-4 text-sm">
                <p className="font-semibold">{detail.student.name}</p>
                <p className="text-muted-foreground">{detail.student.mobile}</p>
              </div>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/students/$studentId" params={{ studentId: detail.student.id }}>
                  Open profile
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-full text-destructive hover:bg-destructive-soft"
                onClick={() => {
                  if (selected) releaseSeat(selected);
                  toast.success(`Seat ${selected} released.`);
                  setSelected(null);
                }}
              >
                <UserMinus className="mr-2 h-4 w-4" /> Release seat
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to student" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {unseated.length === 0 ? (
                    <SelectItem value="none" disabled>
                      All active students have seats
                    </SelectItem>
                  ) : (
                    unseated.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                className="w-full rounded-full"
                disabled={!assignTo || assignTo === "none"}
                onClick={() => {
                  if (selected) assignSeat(assignTo, selected);
                  toast.success(`Seat ${selected} assigned.`);
                  setSelected(null);
                }}
              >
                Assign seat
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => {
                  if (selected) toggleReserved(selected);
                  toast.success(
                    reservedSeats.includes(selected ?? -1)
                      ? `Seat ${selected} is available again.`
                      : `Seat ${selected} reserved.`,
                  );
                  setSelected(null);
                }}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {reservedSeats.includes(selected ?? -1) ? "Remove reservation" : "Mark as reserved"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
