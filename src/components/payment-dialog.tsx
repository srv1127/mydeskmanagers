import { CheckCircle2, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR, monthKey, useLibrary, type Payment, type PaymentMethod } from "@/lib/library-store";
import { printReceipt, receiptNumber } from "@/lib/receipt";

export function PaymentDialog({
  open,
  onOpenChange,
  payment,
  studentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment?: Payment | undefined;
  studentId?: string | undefined;
}) {
  const { students, settings, addPayment, updatePayment } = useLibrary();
  const [saved, setSaved] = useState<Payment | null>(null);
  const [form, setForm] = useState({
    studentId: studentId ?? "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "upi" as PaymentMethod,
    forMonth: monthKey(new Date()),
    note: "",
  });

  useEffect(() => {
    if (!open) return;
    const sid = payment?.studentId ?? studentId ?? "";
    const fee = students.find((s) => s.id === sid)?.monthlyFee;
    setForm({
      studentId: sid,
      amount: String(payment?.amount ?? fee ?? ""),
      date: (payment?.date ?? new Date().toISOString()).slice(0, 10),
      method: payment?.method ?? "upi",
      forMonth: payment?.forMonth ?? monthKey(new Date()),
      note: payment?.note ?? "",
    });
  }, [open, payment, studentId, students]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return monthKey(d);
  });

  const doPrint = (p: Payment) => {
    const student = students.find((s) => s.id === p.studentId);
    if (!student) return;
    if (!printReceipt(p, student, settings)) toast.error("Allow pop-ups to print the receipt.");
  };

  const submit = (thenPrint = false) => {
    const amount = Number(form.amount);
    if (!form.studentId) {
      toast.error("Select a student.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    const data = {
      studentId: form.studentId,
      amount,
      date: new Date(form.date).toISOString(),
      method: form.method,
      forMonth: form.forMonth,
      note: form.note.trim() || undefined,
    };
    if (payment) {
      updatePayment(payment.id, data);
      toast.success("Payment updated.");
      if (thenPrint) doPrint({ ...payment, ...data });
      onOpenChange(false);
      return;
    }
    const created = addPayment(data);
    toast.success("Payment recorded.");
    if (thenPrint) doPrint(created);
    setSaved(created);
  };

  const savedStudent = saved ? students.find((s) => s.id === saved.studentId) : undefined;

  if (saved) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) setSaved(null);
          onOpenChange(v);
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center">Payment recorded</DialogTitle>
            <DialogDescription className="text-center">
              {formatINR(saved.amount)} from {savedStudent?.name ?? "student"} · {saved.forMonth}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-muted p-4 text-center text-sm">
            <p className="text-muted-foreground">Receipt number</p>
            <p className="font-display text-lg font-bold">{receiptNumber(settings, saved)}</p>
          </div>

          <DialogFooter className="sm:flex-col sm:gap-2">
            <Button className="w-full rounded-full" onClick={() => doPrint(saved)}>
              <Printer className="mr-2 h-4 w-4" /> Generate / print receipt
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                setSaved(null);
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit payment" : "Collect fee payment"}</DialogTitle>
          <DialogDescription>
            Record a monthly fee payment, then print or share the receipt in one tap.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select
              value={form.studentId}
              onValueChange={(v) => {
                const fee = students.find((s) => s.id === v)?.monthlyFee;
                setForm({ ...form, studentId: v, amount: String(fee ?? form.amount) });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · Seat {s.seatNumber ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-amount">Amount (₹)</Label>
              <Input
                id="p-amount"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-date">Payment date</Label>
              <Input
                id="p-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select
                value={form.method}
                onValueChange={(v) => setForm({ ...form, method: v as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>For month</Label>
              <Select value={form.forMonth} onValueChange={(v) => setForm({ ...form, forMonth: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-note">Note (optional)</Label>
            <Input
              id="p-note"
              maxLength={120}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. paid at counter"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={() => submit(false)}>
            {payment ? "Save payment" : "Save payment"}
          </Button>
          <Button className="rounded-full" onClick={() => submit(true)}>
            <Printer className="mr-2 h-4 w-4" /> Save &amp; print receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
