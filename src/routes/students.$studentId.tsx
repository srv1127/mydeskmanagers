import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PaymentDialog } from "@/components/payment-dialog";
import { StudentDialog } from "@/components/student-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  shiftLabel,
  useLibrary,
} from "@/lib/library-store";
import { printReceipt, whatsappReminderUrl } from "@/lib/receipt";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — DeskManagers" },
      {
        name: "description",
        content: "Student details, assigned seat, payment history and remaining dues.",
      },
      { property: "og:title", content: "Student profile — DeskManagers" },
      { property: "og:description", content: "Personal details, seat, payments and dues in one view." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const navigate = useNavigate();
  const { students, payments, settings, removeStudent, removePayment } = useLibrary();
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);

  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <AppShell title="Student not found" description="This student may have been removed.">
        <div className="card-soft flex flex-col items-center p-12 text-center">
          <p className="text-sm text-muted-foreground">We couldn't find that student record.</p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/students">Back to students</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const history = payments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const totalPaid = history.reduce((s, p) => s + p.amount, 0);
  const due = duesFor(student, payments);
  const editingPayment = history.find((p) => p.id === editPaymentId);

  const openReceipt = (paymentId: string) => {
    const p = history.find((x) => x.id === paymentId);
    if (!p) return;
    if (!printReceipt(p, student, settings)) toast.error("Allow pop-ups to print the receipt.");
  };

  const sendReminder = () => {
    window.open(
      whatsappReminderUrl(student, due, settings, formatMonth(monthKey(new Date()))),
      "_blank",
      "noopener",
    );
  };

  return (
    <AppShell
      title={student.name}
      description={`Seat ${student.seatNumber ?? "unassigned"} · joined ${formatDate(student.joiningDate)}`}
      actions={
        <>
          {due > 0 && (
            <Button
              variant="outline"
              className="rounded-full border-success/40 text-success hover:bg-success-soft"
              onClick={sendReminder}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Send reminder
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button className="rounded-full" onClick={() => setPayOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Collect fee
          </Button>
        </>
      }
    >
      <Button asChild variant="ghost" size="sm" className="mb-4 rounded-full">
        <Link to="/students">
          <ArrowLeft className="mr-2 h-4 w-4" /> All students
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft font-display text-lg font-bold text-primary-soft-foreground">
              {student.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{student.name}</p>
              <Badge
                variant={student.status === "active" ? "secondary" : "outline"}
                className="mt-1 rounded-full capitalize"
              >
                {student.status}
              </Badge>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            {[
              { icon: Phone, label: student.mobile },
              { icon: Mail, label: student.email },
              { icon: MapPin, label: student.address || "—" },
              { icon: Clock, label: `Shift: ${shiftLabel(student.shift)}` },
              { icon: CalendarDays, label: `Joined ${formatDate(student.joiningDate)}` },
              { icon: ShieldCheck, label: `Aadhaar ${student.aadhaar ?? "not provided"}` },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 break-words text-muted-foreground">{row.label}</span>
              </div>
            ))}
          </dl>
          <Button
            variant="ghost"
            className="mt-5 w-full rounded-full text-destructive hover:bg-destructive-soft"
            onClick={() => {
              removeStudent(student.id);
              toast.success(`${student.name} removed.`);
              void navigate({ to: "/students" });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete student
          </Button>
        </div>

        <div className="grid gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Monthly fee", value: formatINR(student.monthlyFee) },
              { label: "Total paid", value: formatINR(totalPaid) },
              { label: "Remaining due", value: formatINR(due) },
            ].map((c) => (
              <div key={c.label} className="card-soft p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1.5 font-display text-xl font-bold">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="card-soft p-5">
            <Tabs defaultValue="payments">
              <TabsList className="rounded-full">
                <TabsTrigger value="payments" className="rounded-full">
                  Payment history
                </TabsTrigger>
                <TabsTrigger value="seat" className="rounded-full">
                  Seat & fees
                </TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="mt-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-semibold">No payments yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Record the first monthly fee payment.
                    </p>
                    <Button className="mt-4 rounded-full" onClick={() => setPayOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add payment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Receipt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm">{formatMonth(p.forMonth)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(p.date)}
                            </TableCell>
                            <TableCell className="text-sm uppercase">{p.method}</TableCell>
                            <TableCell className="text-right text-sm font-semibold">
                              {formatINR(p.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => openReceipt(p.id)}
                                >
                                  <Printer className="mr-1.5 h-4 w-4" /> Receipt
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-full"
                                  aria-label="Edit payment"
                                  onClick={() => {
                                    setEditPaymentId(p.id);
                                    setPayOpen(true);
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
                  </div>
                )}
              </TabsContent>

              <TabsContent value="seat" className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                  <span className="text-sm text-muted-foreground">Assigned seat</span>
                  <span className="font-semibold">{student.seatNumber ?? "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                  <span className="text-sm text-muted-foreground">Security deposit</span>
                  <span className="font-semibold">{formatINR(student.securityDeposit)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                  <span className="text-sm text-muted-foreground">This month's status</span>
                  <FeeBadge status={feeStatusFor(student, payments)} />
                </div>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to="/seats">Manage seat allocation</Link>
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <StudentDialog open={editOpen} onOpenChange={setEditOpen} student={student} />
      <PaymentDialog
        open={payOpen}
        onOpenChange={(v) => {
          setPayOpen(v);
          if (!v) setEditPaymentId(null);
        }}
        studentId={student.id}
        payment={editingPayment}
      />
    </AppShell>
  );
}
