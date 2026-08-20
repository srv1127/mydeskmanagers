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
import { useAuth } from "@/lib/auth";

export type Status = "active" | "inactive";
export type SeatStatus = "available" | "occupied" | "reserved";
export type PaymentMethod = "cash" | "upi" | "card" | "bank";
export type Shift = "morning" | "evening" | "night" | "full_day";

export const SHIFTS: { value: Shift; label: string; time: string }[] = [
  { value: "morning", label: "Morning", time: "6 AM – 2 PM" },
  { value: "evening", label: "Evening", time: "2 PM – 10 PM" },
  { value: "night", label: "Night", time: "10 PM – 6 AM" },
  { value: "full_day", label: "Full day", time: "24 hours" },
];

export function shiftLabel(shift: Shift) {
  return SHIFTS.find((s) => s.value === shift)?.label ?? shift;
}

/** Full-day bookings overlap every single shift. */
export function shiftsOverlap(a: Shift, b: Shift) {
  return a === b || a === "full_day" || b === "full_day";
}

export interface Student {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  aadhaar?: string | undefined;
  joiningDate: string;
  seatNumber: number | null;
  shift: Shift;
  monthlyFee: number;
  securityDeposit: number;
  status: Status;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  forMonth: string; // yyyy-MM
  note?: string | undefined;
}

export interface Activity {
  id: string;
  type: "admission" | "payment" | "seat";
  title: string;
  detail: string;
  at: string;
}

export interface Reservation {
  id: string;
  seatNumber: number;
  shift: Shift;
  note?: string | undefined;
}

export interface Settings {
  libraryName: string;
  totalSeats: number;
  defaultMonthlyFee: number;
  receiptPrefix: string;
  adminName: string;
  adminEmail: string;
  role: "Admin" | "Staff";
}

/** Day of the month after which an unpaid current month counts as overdue. */
export const FEE_DUE_DAY = 10;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ---------- row mappers ---------- */

type Row = Record<string, unknown>;

function mapStudent(r: Row): Student {
  return {
    id: String(r["id"]),
    name: String(r["name"] ?? ""),
    mobile: String(r["mobile"] ?? ""),
    email: String(r["email"] ?? ""),
    address: String(r["address"] ?? ""),
    aadhaar: (r["aadhaar"] as string | null) ?? undefined,
    joiningDate: String(r["joining_date"]),
    seatNumber: (r["seat_number"] as number | null) ?? null,
    shift: (r["shift"] as Shift) ?? "morning",
    monthlyFee: Number(r["monthly_fee"] ?? 0),
    securityDeposit: Number(r["security_deposit"] ?? 0),
    status: (r["status"] as Status) ?? "active",
  };
}

function mapPayment(r: Row): Payment {
  return {
    id: String(r["id"]),
    studentId: String(r["student_id"]),
    amount: Number(r["amount"] ?? 0),
    date: String(r["paid_at"]),
    method: (r["method"] as PaymentMethod) ?? "cash",
    forMonth: String(r["for_month"]),
    note: (r["note"] as string | null) ?? undefined,
  };
}

const DEFAULT_SETTINGS: Omit<Settings, "adminName" | "adminEmail" | "role"> = {
  libraryName: "My Study Library",
  totalSeats: 100,
  defaultMonthlyFee: 1000,
  receiptPrefix: "DM",
};

interface StoreValue {
  students: Student[];
  payments: Payment[];
  reservations: Reservation[];
  activities: Activity[];
  settings: Settings;
  loading: boolean;
  refresh: () => Promise<void>;
  addStudent: (s: Omit<Student, "id">) => Promise<Student | null>;
  updateStudent: (id: string, patch: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  assignSeat: (studentId: string, seat: number | null, shift?: Shift) => Promise<void>;
  releaseSeat: (seat: number, shift: Shift) => Promise<void>;
  toggleReserved: (seat: number, shift: Shift) => Promise<void>;
  addPayment: (p: Omit<Payment, "id">) => Promise<Payment | null>;
  updatePayment: (id: string, patch: Partial<Payment>) => Promise<void>;
  removePayment: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settingsRow, setSettingsRow] = useState<{
    id: string | null;
    libraryName: string;
    totalSeats: number;
    defaultMonthlyFee: number;
    receiptPrefix: string;
  }>({ id: null, ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);

  const userId = session?.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setStudents([]);
      setPayments([]);
      setReservations([]);
      setActivities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [st, pa, re, ac, se] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("paid_at", { ascending: false }),
      supabase.from("seat_reservations").select("*"),
      supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(40),
      supabase.from("library_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (st.error) console.error("Failed to load students:", st.error);
    if (pa.error) console.error("Failed to load payments:", pa.error);
    if (re.error) console.error("Failed to load reservations:", re.error);
    if (ac.error) console.error("Failed to load activity:", ac.error);
    if (se.error) console.error("Failed to load settings:", se.error);

    setStudents((st.data ?? []).map((r) => mapStudent(r as Row)));
    setPayments((pa.data ?? []).map((r) => mapPayment(r as Row)));
    setReservations(
      (re.data ?? []).map((r) => {
        const row = r as Row;
        return {
          id: String(row["id"]),
          seatNumber: Number(row["seat_number"]),
          shift: (row["shift"] as Shift) ?? "full_day",
          note: (row["note"] as string | null) ?? undefined,
        };
      }),
    );
    setActivities(
      (ac.data ?? []).map((r) => {
        const row = r as Row;
        return {
          id: String(row["id"]),
          type: (row["type"] as Activity["type"]) ?? "seat",
          title: String(row["title"] ?? ""),
          detail: String(row["detail"] ?? ""),
          at: String(row["created_at"]),
        };
      }),
    );
    if (se.data) {
      const row = se.data as Row;
      setSettingsRow({
        id: String(row["id"]),
        libraryName: String(row["library_name"] ?? DEFAULT_SETTINGS.libraryName),
        totalSeats: Number(row["total_seats"] ?? DEFAULT_SETTINGS.totalSeats),
        defaultMonthlyFee: Number(row["default_monthly_fee"] ?? DEFAULT_SETTINGS.defaultMonthlyFee),
        receiptPrefix: String(row["receipt_prefix"] ?? DEFAULT_SETTINGS.receiptPrefix),
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, refresh]);

  const log = useCallback(
    async (type: Activity["type"], title: string, detail: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("activities")
        .insert({ type, title, detail, created_by: userId });
      if (error) console.error("Failed to log activity:", error);
    },
    [userId],
  );

  const settings = useMemo<Settings>(
    () => ({
      libraryName: settingsRow.libraryName,
      totalSeats: settingsRow.totalSeats,
      defaultMonthlyFee: settingsRow.defaultMonthlyFee,
      receiptPrefix: settingsRow.receiptPrefix,
      adminName: session?.name ?? "",
      adminEmail: session?.email ?? "",
      role: session?.role ?? "Staff",
    }),
    [settingsRow, session],
  );

  const value = useMemo<StoreValue>(() => {
    const studentPatch = (patch: Partial<Student>) => {
      const out: Row = {};
      if (patch.name !== undefined) out["name"] = patch.name;
      if (patch.mobile !== undefined) out["mobile"] = patch.mobile;
      if (patch.email !== undefined) out["email"] = patch.email;
      if (patch.address !== undefined) out["address"] = patch.address;
      if (patch.aadhaar !== undefined) out["aadhaar"] = patch.aadhaar ?? null;
      if (patch.joiningDate !== undefined) out["joining_date"] = patch.joiningDate;
      if (patch.seatNumber !== undefined) out["seat_number"] = patch.seatNumber;
      if (patch.shift !== undefined) out["shift"] = patch.shift;
      if (patch.monthlyFee !== undefined) out["monthly_fee"] = patch.monthlyFee;
      if (patch.securityDeposit !== undefined) out["security_deposit"] = patch.securityDeposit;
      if (patch.status !== undefined) out["status"] = patch.status;
      return out;
    };

    const paymentPatch = (patch: Partial<Payment>) => {
      const out: Row = {};
      if (patch.studentId !== undefined) out["student_id"] = patch.studentId;
      if (patch.amount !== undefined) out["amount"] = patch.amount;
      if (patch.date !== undefined) out["paid_at"] = patch.date;
      if (patch.method !== undefined) out["method"] = patch.method;
      if (patch.forMonth !== undefined) out["for_month"] = patch.forMonth;
      if (patch.note !== undefined) out["note"] = patch.note ?? null;
      return out;
    };

    return {
      students,
      payments,
      reservations,
      activities,
      settings,
      loading,
      refresh,

      addStudent: async (s) => {
        const { data, error } = await supabase
          .from("students")
          .insert({ ...studentPatch(s), created_by: userId })
          .select("*")
          .single();
        if (error || !data) {
          console.error("Failed to add student:", error);
          return null;
        }
        const student = mapStudent(data as Row);
        await log(
          "admission",
          "New admission",
          `${student.name} joined${student.seatNumber ? ` on seat ${student.seatNumber} (${shiftLabel(student.shift)})` : ""}`,
        );
        await refresh();
        return student;
      },

      updateStudent: async (id, patch) => {
        const { error } = await supabase.from("students").update(studentPatch(patch)).eq("id", id);
        if (error) console.error("Failed to update student:", error);
        await refresh();
      },

      removeStudent: async (id) => {
        await supabase.from("payments").delete().eq("student_id", id);
        const { error } = await supabase.from("students").delete().eq("id", id);
        if (error) console.error("Failed to remove student:", error);
        await refresh();
      },

      assignSeat: async (studentId, seat, shift) => {
        const target = students.find((s) => s.id === studentId);
        const nextShift = shift ?? target?.shift ?? "morning";
        if (seat !== null) {
          // free the same seat/shift for anyone else holding it
          const clashes = students.filter(
            (s) => s.id !== studentId && s.seatNumber === seat && shiftsOverlap(s.shift, nextShift),
          );
          for (const c of clashes) {
            await supabase.from("students").update({ seat_number: null }).eq("id", c.id);
          }
          const held = reservations.filter(
            (r) => r.seatNumber === seat && shiftsOverlap(r.shift, nextShift),
          );
          for (const r of held) {
            await supabase.from("seat_reservations").delete().eq("id", r.id);
          }
        }
        const { error } = await supabase
          .from("students")
          .update({ seat_number: seat, shift: nextShift })
          .eq("id", studentId);
        if (error) console.error("Failed to assign seat:", error);
        const name = target?.name ?? "Student";
        await log(
          "seat",
          seat ? "Seat assigned" : "Seat released",
          seat
            ? `${name} → seat ${seat} · ${shiftLabel(nextShift)}`
            : `${name} released their seat`,
        );
        await refresh();
      },

      releaseSeat: async (seat, shift) => {
        const holders = students.filter(
          (s) => s.seatNumber === seat && shiftsOverlap(s.shift, shift),
        );
        for (const h of holders) {
          await supabase.from("students").update({ seat_number: null }).eq("id", h.id);
        }
        await log("seat", "Seat released", `Seat ${seat} · ${shiftLabel(shift)} is now available`);
        await refresh();
      },

      toggleReserved: async (seat, shift) => {
        const existing = reservations.filter(
          (r) => r.seatNumber === seat && shiftsOverlap(r.shift, shift),
        );
        if (existing.length > 0) {
          for (const r of existing) {
            await supabase.from("seat_reservations").delete().eq("id", r.id);
          }
        } else {
          const { error } = await supabase
            .from("seat_reservations")
            .insert({ seat_number: seat, shift, created_by: userId });
          if (error) console.error("Failed to reserve seat:", error);
        }
        await refresh();
      },

      addPayment: async (p) => {
        const { data, error } = await supabase
          .from("payments")
          .insert({ ...paymentPatch(p), created_by: userId })
          .select("*")
          .single();
        if (error || !data) {
          console.error("Failed to record payment:", error);
          return null;
        }
        const payment = mapPayment(data as Row);
        const name = students.find((s) => s.id === p.studentId)?.name ?? "Student";
        await log("payment", "Fee payment received", `${name} paid ${formatINR(p.amount)}`);
        await refresh();
        return payment;
      },

      updatePayment: async (id, patch) => {
        const { error } = await supabase.from("payments").update(paymentPatch(patch)).eq("id", id);
        if (error) console.error("Failed to update payment:", error);
        await refresh();
      },

      removePayment: async (id) => {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) console.error("Failed to delete payment:", error);
        await refresh();
      },

      updateSettings: async (patch) => {
        const row: Row = {};
        if (patch.libraryName !== undefined) row["library_name"] = patch.libraryName;
        if (patch.totalSeats !== undefined) row["total_seats"] = patch.totalSeats;
        if (patch.defaultMonthlyFee !== undefined)
          row["default_monthly_fee"] = patch.defaultMonthlyFee;
        if (patch.receiptPrefix !== undefined) row["receipt_prefix"] = patch.receiptPrefix;

        if (Object.keys(row).length > 0) {
          const { error } = settingsRow.id
            ? await supabase.from("library_settings").update(row).eq("id", settingsRow.id)
            : await supabase.from("library_settings").insert(row);
          if (error) console.error("Failed to save settings:", error);
        }
        if (patch.adminName !== undefined && userId) {
          const { error } = await supabase
            .from("profiles")
            .update({ full_name: patch.adminName })
            .eq("id", userId);
          if (error) console.error("Failed to save profile name:", error);
        }
        await refresh();
      },
    };
  }, [students, payments, reservations, activities, settings, settingsRow, loading, refresh, log, userId]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

/* ---------- derived helpers ---------- */

export function seatStatus(
  seat: number,
  students: Student[],
  reservations: Reservation[],
  shift: Shift = "full_day",
): { status: SeatStatus; student?: Student } {
  const student = students.find(
    (s) => s.seatNumber === seat && s.status === "active" && shiftsOverlap(s.shift, shift),
  );
  if (student) return { status: "occupied", student };
  if (reservations.some((r) => r.seatNumber === seat && shiftsOverlap(r.shift, shift)))
    return { status: "reserved" };
  return { status: "available" };
}

/** Every occupant of a seat, one entry per booked shift. */
export function seatOccupants(seat: number, students: Student[]) {
  return students.filter((s) => s.seatNumber === seat && s.status === "active");
}

export function paidForMonth(payments: Payment[], studentId: string, month: string) {
  return payments
    .filter((p) => p.studentId === studentId && p.forMonth === month)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function duesFor(student: Student, payments: Payment[], upto = new Date()) {
  const join = new Date(student.joiningDate);
  let expected = 0;
  const cursor = new Date(join.getFullYear(), join.getMonth(), 1);
  while (cursor <= upto && student.status === "active") {
    expected += student.monthlyFee;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const paid = payments.filter((p) => p.studentId === student.id).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, expected - paid);
}

/**
 * Single source of truth for fee status, derived from the SAME number shown in
 * the "Pending" column (duesFor), so a student can never display a pending
 * amount while being labelled "paid".
 */
export function feeStatusFor(student: Student, payments: Payment[]) {
  const due = duesFor(student, payments);
  if (due <= 0) return "paid" as const;

  const current = monthKey(new Date());
  const paidThisMonth = paidForMonth(payments, student.id, current);
  const thisMonthShortfall = Math.max(0, student.monthlyFee - paidThisMonth);
  const arrears = due - thisMonthShortfall;
  if (arrears > 0) return "overdue" as const;

  return new Date().getDate() > FEE_DUE_DAY ? ("overdue" as const) : ("pending" as const);
}

export function monthlyCollection(payments: Payment[], months = 6) {
  const now = new Date();
  const out: { month: string; label: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    out.push({
      month: key,
      label: d.toLocaleString("en-IN", { month: "short" }),
      total: payments.filter((p) => p.forMonth === key).reduce((s, p) => s + p.amount, 0),
    });
  }
  return out;
}
