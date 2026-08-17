import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Search, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StudentDialog } from "@/components/student-dialog";
import { Badge } from "@/components/ui/badge";
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
import { duesFor, feeStatusFor, formatDate, formatINR, useLibrary } from "@/lib/library-store";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students — DeskManagers" },
      {
        name: "description",
        content: "Search, filter and manage library student admissions, seats and monthly fees.",
      },
      { property: "og:title", content: "Student Management — DeskManagers" },
      { property: "og:description", content: "Admissions, seat allocation and fee status for every student." },
    ],
  }),
  component: StudentsPage,
});

const PAGE_SIZE = 8;

export function FeeBadge({ status }: { status: "paid" | "pending" | "overdue" }) {
  const map = {
    paid: "bg-success-soft text-success",
    pending: "bg-warning-soft text-warning-foreground",
    overdue: "bg-destructive-soft text-destructive",
  } as const;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function StudentsPage() {
  const { students, payments, loading } = useLibrary();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [fee, setFee] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matches =
        !q.trim() ||
        s.name.toLowerCase().includes(q.toLowerCase()) ||
        s.mobile.includes(q) ||
        s.email.toLowerCase().includes(q.toLowerCase()) ||
        String(s.seatNumber ?? "") === q.trim();
      const st = status === "all" || s.status === status;
      const fs = fee === "all" || feeStatusFor(s, payments) === fee;
      return matches && st && fs;
    });
  }, [students, payments, q, status, fee]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <AppShell
      title="Students"
      description={`${students.length} students on record`}
      actions={
        <Button className="rounded-full" onClick={() => setOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add student
        </Button>
      }
    >
      <div className="card-soft p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, mobile, email or seat"
              className="h-11 rounded-full pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 min-w-40 rounded-full">
              <Filter className="mr-1 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={fee}
            onValueChange={(v) => {
              setFee(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 min-w-40 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fee status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <Users className="h-6 w-6" />
              </span>
              <p className="mt-4 font-semibold">No students found</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try a different search, or add your first student to get started.
              </p>
              <Button className="mt-5 rounded-full" onClick={() => setOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Add student
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Monthly fee</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Fee status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id} className="hover:bg-accent/50">
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-soft-foreground">
                          {s.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.mobile}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.seatNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(s.joiningDate)}
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatINR(s.monthlyFee)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatINR(duesFor(s, payments))}
                    </TableCell>
                    <TableCell>
                      <FeeBadge status={feeStatusFor(s, payments)} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.status === "active" ? "secondary" : "outline"}
                        className="rounded-full capitalize"
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="rounded-full">
                        <Link to="/students/$studentId" params={{ studentId: s.id }}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="truncate text-xs text-muted-foreground">
              Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {current} / {pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <StudentDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
