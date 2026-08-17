import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Filter, Plus, Receipt, Search, Trash2, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PaymentDialog } from "@/components/payment-dialog";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeeBadge } from "@/routes/students.index";
import {
  duesFor,
  feeStatusFor,
  formatDate,
  formatINR,
  formatMonth,
  monthKey,
  paidForMonth,
  useLibrary,
} from "@/lib/library-store";

export const Route = createFileRoute("/fees")({
  head: () => ({
    meta: [
      { title: "Fee Management — DeskManagers" },
      {
        name: "description",
        content:
          "Record monthly fee payments, track pending and overdue dues, and print student receipts.",
      },
      { property: "og:title", content: "Fee Management — DeskManagers" },
      { property: "og:description", content: "Payments, dues and receipts for every library student." },
    ],
  }),
  component: FeesPage,
});

const PAGE_SIZE = 8;

function FeesPage() {
  const { students, payments, settings, loading, removePayment } = useLibrary();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const current = monthKey(new Date());
  const collected = payments.filter((p) => p.forMonth === current).reduce((s, p) => s + p.amount, 0);
  const active = students.filter((s) => s.status === "active");
  const pending = active.reduce((s, st) => s + duesFor(st, payments), 0);
  const overdueCount = active.filter((s) => feeStatusFor(s, payments) === "overdue").length;

  const studentRows = useMemo(
    () =>
      active
        .filter((s) => {
          const m = !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()) || s.mobile.includes(q);
          const f = statusFilter === "all" || feeStatusFor(s, payments) === statusFilter;
          return m && f;
        })
        .map((s) => ({
          student: s,
          paid: paidForMonth(payments, s.id, current),
          due: duesFor(s, payments),
          status: feeStatusFor(s, payments),
        })),
    [active, payments, q, statusFilter, current],
  );

  const pages = Math.max(1, Math.ceil(studentRows.length / PAGE_SIZE));
  const pageNo = Math.min(page, pages);
  const rows = studentRows.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);

  const recent = [...payments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 12);
  const editingPayment = payments.find((p) => p.id === editId);

  const printReceipt = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    const s = students.find((x) => x.id === p?.studentId);
    if (!p || !s) return;
    const win = window.open("", "_blank", "width=600,height=760");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Receipt</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#12203a}
      h1{font-size:20px;margin:0}small{color:#5b6b86}
      table{width:100%;margin-top:24px;border-collapse:collapse}
      td{padding:10px 0;border-bottom:1px solid #e6ebf3;font-size:14px}
      .total{font-weight:700;font-size:18px}</style></head><body>
      <h1>${settings.libraryName}</h1>
      <small>Fee receipt · ${settings.receiptPrefix}-${p.id.slice(-6).toUpperCase()}</small>
      <table>
        <tr><td>Student</td><td align="right">${s.name}</td></tr>
        <tr><td>Seat</td><td align="right">${s.seatNumber ?? "—"}</td></tr>
        <tr><td>For month</td><td align="right">${formatMonth(p.forMonth)}</td></tr>
        <tr><td>Payment date</td><td align="right">${formatDate(p.date)}</td></tr>
        <tr><td>Method</td><td align="right">${p.method.toUpperCase()}</td></tr>
        <tr><td class="total">Amount paid</td><td align="right" class="total">₹${p.amount}</td></tr>
      </table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <AppShell
      title="Fee management"
      description={`${formatMonth(current)} collection and outstanding dues`}
      actions={
        <Button
          className="rounded-full"
          onClick={() => {
            setEditId(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add payment
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected this month" value={formatINR(collected)} icon={CreditCard} tone="success" />
        <StatCard label="Pending amount" value={formatINR(pending)} icon={Receipt} tone="warning" />
        <StatCard label="Overdue students" value={String(overdueCount)} icon={Receipt} tone="destructive" />
      </div>

      <div className="card-soft mt-6 p-4 sm:p-5">
        <Tabs defaultValue="students">
          <TabsList className="rounded-full">
            <TabsTrigger value="students" className="rounded-full">
              By student
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-full">
              Recent payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search student"
                  className="h-11 rounded-full pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 min-w-40 rounded-full">
                  <Filter className="mr-1 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <p className="py-14 text-center text-sm text-muted-foreground">
                  No students match this filter.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead className="text-right">Monthly fee</TableHead>
                      <TableHead className="text-right">Paid ({formatMonth(current)})</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(({ student, paid, due, status }) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Link
                            to="/students/$studentId"
                            params={{ studentId: student.id }}
                            className="text-sm font-medium hover:underline"
                          >
                            {student.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{student.seatNumber ?? "—"}</TableCell>
                        <TableCell className="text-right text-sm">{formatINR(student.monthlyFee)}</TableCell>
                        <TableCell className="text-right text-sm">{formatINR(paid)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{formatINR(due)}</TableCell>
                        <TableCell>
                          <FeeBadge status={status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                              setEditId(null);
                              setOpen(true);
                            }}
                          >
                            Collect
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {!loading && studentRows.length > 0 && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="truncate text-xs text-muted-foreground">
                  {studentRows.length} students · page {pageNo} of {pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={pageNo === 1}
                    onClick={() => setPage(pageNo - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={pageNo === pages}
                    onClick={() => setPage(pageNo + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-4 overflow-x-auto">
            {recent.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">
                        {students.find((s) => s.id === p.studentId)?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{formatMonth(p.forMonth)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-sm uppercase">{p.method}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatINR(p.amount)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => printReceipt(p.id)}
                          >
                            Receipt
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full"
                            aria-label="Edit payment"
                            onClick={() => {
                              setEditId(p.id);
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full text-destructive"
                            aria-label="Delete payment"
                            onClick={() => {
                              removePayment(p.id);
                              toast.success("Payment deleted.");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PaymentDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditId(null);
        }}
        payment={editingPayment}
      />
    </AppShell>
  );
}
