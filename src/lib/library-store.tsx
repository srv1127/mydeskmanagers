import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Status = "active" | "inactive";
export type SeatStatus = "available" | "occupied" | "reserved";
export type PaymentMethod = "cash" | "upi" | "card" | "bank";

export interface Student {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  aadhaar?: string | undefined;
  joiningDate: string;
  seatNumber: number | null;
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

export interface Settings {
  libraryName: string;
  totalSeats: number;
  defaultMonthlyFee: number;
  receiptPrefix: string;
  adminName: string;
  adminEmail: string;
  role: "Admin" | "Staff";
}

interface State {
  students: Student[];
  payments: Payment[];
  reservedSeats: number[];
  activities: Activity[];
  settings: Settings;
}

const STORAGE_KEY = "deskmanagers.state.v1";

/** Day of the month after which an unpaid current month counts as overdue. */
export const FEE_DUE_DAY = 10;

const FIRST = [
  "Aarav", "Diya", "Kabir", "Ishita", "Rohan", "Ananya", "Vivaan", "Meera", "Arjun", "Sneha",
  "Aditya", "Nisha", "Yash", "Priya", "Karan", "Riya", "Manav", "Tanvi", "Dev", "Pooja",
  "Harsh", "Kavya", "Nikhil", "Sanya", "Rahul", "Aditi", "Siddharth", "Neha", "Varun", "Simran",
  "Om", "Ira", "Raj", "Anjali", "Vikas", "Bhavna", "Naveen", "Payal", "Sahil", "Trisha",
];
const LAST = ["Sharma", "Verma", "Patel", "Singh", "Gupta", "Nair", "Iyer", "Joshi", "Mehta", "Reddy"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}

export function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function seed(): State {
  const totalSeats = 100;
  const students: Student[] = [];
  const payments: Payment[] = [];
  const activities: Activity[] = [];
  const now = new Date();

  const seatPool = Array.from({ length: totalSeats }, (_, i) => i + 1);
  // deterministic shuffle
  let s = 42;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = seatPool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = seatPool[i]!;
    seatPool[i] = seatPool[j]!;
    seatPool[j] = tmp;
  }

  const count = 64;
  for (let i = 0; i < count; i++) {
    const name = `${FIRST[i % FIRST.length]!} ${LAST[(i * 3) % LAST.length]!}`;
    const monthsAgo = Math.floor(rnd() * 9);
    const joining = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1 + Math.floor(rnd() * 26));
    const active = i % 11 !== 0;
    const fee = [800, 1000, 1200, 1500][Math.floor(rnd() * 4)]!;
    const student: Student = {
      id: `stu_${i + 1}`,
      name,
      mobile: `9${(800000000 + Math.floor(rnd() * 99999999)).toString().slice(0, 9)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@mail.com`,
      address: `${10 + i} Gandhi Road, Sector ${1 + (i % 22)}`,
      aadhaar: i % 3 === 0 ? `${2000 + i} ${3000 + i} ${4000 + i}` : undefined,
      joiningDate: joining.toISOString(),
      seatNumber: active ? (seatPool[i] ?? null) : null,
      monthlyFee: fee,
      securityDeposit: 500,
      status: active ? "active" : "inactive",
    };
    students.push(student);

    // payments for past months
    for (let m = monthsAgo; m >= 0; m--) {
      const paidChance = m === 0 ? rnd() > 0.35 : rnd() > 0.08;
      if (!paidChance) continue;
      const d = new Date(now.getFullYear(), now.getMonth() - m, 3 + Math.floor(rnd() * 12));
      if (d > now) continue;
      payments.push({
        id: `pay_${i}_${m}`,
        studentId: student.id,
        amount: fee,
        date: d.toISOString(),
        method: (["cash", "upi", "card", "bank"] as PaymentMethod[])[Math.floor(rnd() * 4)]!,
        forMonth: monthKey(d),
      });
    }
  }

  students.slice(0, 6).forEach((st, idx) => {
    activities.push({
      id: `act_a_${idx}`,
      type: idx % 3 === 0 ? "admission" : idx % 3 === 1 ? "payment" : "seat",
      title:
        idx % 3 === 0
          ? "New admission"
          : idx % 3 === 1
            ? "Fee payment received"
            : "Seat assigned",
      detail:
        idx % 3 === 0
          ? `${st.name} joined with seat ${st.seatNumber ?? "—"}`
          : idx % 3 === 1
            ? `${st.name} paid ${formatINR(st.monthlyFee)}`
            : `${st.name} moved to seat ${st.seatNumber ?? "—"}`,
      at: new Date(now.getTime() - (idx + 1) * 3600_000 * 5).toISOString(),
    });
  });

  return {
    students,
    payments,
    reservedSeats: [7, 24, 55, 78],
    activities,
    settings: {
      libraryName: "DeskManagers Study Library",
      totalSeats,
      defaultMonthlyFee: 1000,
      receiptPrefix: "DM",
      adminName: "Ravi Kulkarni",
      adminEmail: "admin@deskmanagers.app",
      role: "Admin",
    },
  };
}

interface StoreValue extends State {
  loading: boolean;
  addStudent: (s: Omit<Student, "id">) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  assignSeat: (studentId: string, seat: number | null) => void;
  releaseSeat: (seat: number) => void;
  toggleReserved: (seat: number) => void;
  addPayment: (p: Omit<Payment, "id">) => Payment;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => seed());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      /* ignore corrupt storage */
    }
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full */
    }
  }, [state, loading]);

  const log = useCallback((a: Omit<Activity, "id" | "at">) => {
    setState((prev) => ({
      ...prev,
      activities: [
        { ...a, id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() },
        ...prev.activities,
      ].slice(0, 40),
    }));
  }, []);

  const value = useMemo<StoreValue>(() => {
    return {
      ...state,
      loading,
      addStudent: (s) => {
        const student: Student = { ...s, id: `stu_${Date.now()}` };
        setState((prev) => ({ ...prev, students: [student, ...prev.students] }));
        log({
          type: "admission",
          title: "New admission",
          detail: `${student.name} joined${student.seatNumber ? ` on seat ${student.seatNumber}` : ""}`,
        });
        return student;
      },
      updateStudent: (id, patch) =>
        setState((prev) => ({
          ...prev,
          students: prev.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      removeStudent: (id) =>
        setState((prev) => ({
          ...prev,
          students: prev.students.filter((s) => s.id !== id),
          payments: prev.payments.filter((p) => p.studentId !== id),
        })),
      assignSeat: (studentId, seat) => {
        setState((prev) => ({
          ...prev,
          reservedSeats: seat ? prev.reservedSeats.filter((r) => r !== seat) : prev.reservedSeats,
          students: prev.students.map((s) => {
            if (s.id === studentId) return { ...s, seatNumber: seat };
            if (seat !== null && s.seatNumber === seat) return { ...s, seatNumber: null };
            return s;
          }),
        }));
        const name = state.students.find((s) => s.id === studentId)?.name ?? "Student";
        log({
          type: "seat",
          title: seat ? "Seat assigned" : "Seat released",
          detail: seat ? `${name} → seat ${seat}` : `${name} released their seat`,
        });
      },
      releaseSeat: (seat) => {
        setState((prev) => ({
          ...prev,
          students: prev.students.map((s) => (s.seatNumber === seat ? { ...s, seatNumber: null } : s)),
        }));
        log({ type: "seat", title: "Seat released", detail: `Seat ${seat} is now available` });
      },
      toggleReserved: (seat) =>
        setState((prev) => ({
          ...prev,
          reservedSeats: prev.reservedSeats.includes(seat)
            ? prev.reservedSeats.filter((r) => r !== seat)
            : [...prev.reservedSeats, seat],
        })),
      addPayment: (p) => {
        const payment: Payment = { ...p, id: `pay_${Date.now()}` };
        setState((prev) => ({ ...prev, payments: [payment, ...prev.payments] }));
        const name = state.students.find((s) => s.id === p.studentId)?.name ?? "Student";
        log({ type: "payment", title: "Fee payment received", detail: `${name} paid ${formatINR(p.amount)}` });
        return payment;
      },
      updatePayment: (id, patch) =>
        setState((prev) => ({
          ...prev,
          payments: prev.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePayment: (id) =>
        setState((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) })),
      updateSettings: (patch) =>
        setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    };
  }, [state, loading, log]);

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
  reservedSeats: number[],
): { status: SeatStatus; student?: Student } {
  const student = students.find((s) => s.seatNumber === seat && s.status === "active");
  if (student) return { status: "occupied", student };
  if (reservedSeats.includes(seat)) return { status: "reserved" };
  return { status: "available" };
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
 * Single source of truth for fee status. It is derived from the SAME number
 * shown in the "Pending" column (duesFor), so a student can never display a
 * pending amount while being labelled "paid".
 * - paid: nothing outstanding at all
 * - overdue: arrears from an earlier month, or this month past the due day
 * - pending: only this month is outstanding and the due day hasn't passed
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
