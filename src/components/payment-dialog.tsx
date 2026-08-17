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
import { monthKey, useLibrary, type Payment, type PaymentMethod } from "@/lib/library-store";

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
  const { students, addPayment, updatePayment } = useLibrary();
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

  const submit = () => {
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
    } else {
      addPayment(data);
      toast.success("Payment recorded.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit payment" : "Add payment"}</DialogTitle>
          <DialogDescription>Record a monthly fee payment and generate a receipt.</DialogDescription>
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
          <Button className="rounded-full" onClick={submit}>
            {payment ? "Save payment" : "Add payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
