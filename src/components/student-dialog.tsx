import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { SHIFTS, seatStatus, useLibrary, type Student } from "@/lib/library-store";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  mobile: z.string().trim().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  email: z.string().trim().email("Enter a valid email").max(255),
  address: z.string().trim().max(240),
  aadhaar: z.string().trim().max(20).optional(),
  joiningDate: z.string().min(4, "Pick a joining date"),
  monthlyFee: z.number().min(0).max(100000),
  securityDeposit: z.number().min(0).max(100000),
});

export function StudentDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student?: Student | undefined;
}) {
  const { students, reservations, settings, addStudent, updateStudent } = useLibrary();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    aadhaar: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    seatNumber: "none",
    shift: "morning" as Student["shift"],
    monthlyFee: String(settings.defaultMonthlyFee),
    securityDeposit: "500",
    status: "active" as Student["status"],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: student?.name ?? "",
      mobile: student?.mobile ?? "",
      email: student?.email ?? "",
      address: student?.address ?? "",
      aadhaar: student?.aadhaar ?? "",
      joiningDate: (student?.joiningDate ?? new Date().toISOString()).slice(0, 10),
      seatNumber: student?.seatNumber ? String(student.seatNumber) : "none",
      shift: student?.shift ?? "morning",
      monthlyFee: String(student?.monthlyFee ?? settings.defaultMonthlyFee),
      securityDeposit: String(student?.securityDeposit ?? 500),
      status: student?.status ?? "active",
    });
  }, [open, student, settings.defaultMonthlyFee]);

  const freeSeats = Array.from({ length: settings.totalSeats }, (_, i) => i + 1).filter((n) => {
    const st = seatStatus(n, students, reservations, form.shift);
    return st.status !== "occupied" || st.student?.id === student?.id;
  });

  const submit = () => {
    const parsed = schema.safeParse({
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      aadhaar: form.aadhaar || undefined,
      joiningDate: form.joiningDate,
      monthlyFee: Number(form.monthlyFee),
      securityDeposit: Number(form.securityDeposit),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    const payload = {
      ...parsed.data,
      aadhaar: form.aadhaar.trim() || undefined,
      joiningDate: new Date(form.joiningDate).toISOString(),
      seatNumber: form.seatNumber === "none" ? null : Number(form.seatNumber),
      shift: form.shift,
      status: form.status,
    };
    if (student) {
      updateStudent(student.id, payload);
      toast.success(`${payload.name}'s details updated.`);
    } else {
      addStudent(payload);
      toast.success(`${payload.name} admitted successfully.`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {student ? "Update the student's details and seat." : "Admit a new student to the library."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-name">Full name</Label>
            <Input
              id="s-name"
              value={form.name}
              maxLength={80}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Aarav Sharma"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-mobile">Mobile number</Label>
            <Input
              id="s-mobile"
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
              placeholder="10-digit number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-email">Email</Label>
            <Input
              id="s-email"
              type="email"
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="student@mail.com"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-address">Address</Label>
            <Textarea
              id="s-address"
              value={form.address}
              maxLength={240}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House, street, city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-aadhaar">Aadhaar number (optional)</Label>
            <Input
              id="s-aadhaar"
              maxLength={20}
              value={form.aadhaar}
              onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
              placeholder="1234 5678 9012"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-join">Joining date</Label>
            <Input
              id="s-join"
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Seat number</Label>
            <Select
              value={form.seatNumber}
              onValueChange={(v) => setForm({ ...form, seatNumber: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a seat" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="none">No seat yet</SelectItem>
                {freeSeats.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Seat {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Shift</Label>
            <Select
              value={form.shift}
              onValueChange={(v) => setForm({ ...form, shift: v as Student["shift"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIFTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label} · {s.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as Student["status"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-fee">Monthly fee (₹)</Label>
            <Input
              id="s-fee"
              inputMode="numeric"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: e.target.value.replace(/\D/g, "") })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-dep">Security deposit (₹)</Label>
            <Input
              id="s-dep"
              inputMode="numeric"
              value={form.securityDeposit}
              onChange={(e) => setForm({ ...form, securityDeposit: e.target.value.replace(/\D/g, "") })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" onClick={submit}>
            {student ? "Save changes" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
