import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  duesFor,
  feeStatusFor,
  formatINR,
  monthKey,
  monthlyCollection,
  seatStatus,
  useLibrary,
} from "@/lib/library-store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — DeskManagers" },
      {
        name: "description",
        content:
          "Monthly collection, pending fees, student list and seat occupancy reports with Excel and PDF export.",
      },
      { property: "og:title", content: "Reports — DeskManagers" },
      { property: "og:description", content: "Export library collection and occupancy reports in one click." },
    ],
  }),
  component: ReportsPage,
});

function toCsv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const { students, payments, settings, reservations } = useLibrary();
  const chart = monthlyCollection(payments, 6);
  const current = monthKey(new Date());
  const active = students.filter((s) => s.status === "active");
  const seats = Array.from({ length: settings.totalSeats }, (_, i) => i + 1).map(
    (n) => seatStatus(n, students, reservations).status,
  );
  const occupied = seats.filter((s) => s === "occupied").length;
  const reserved = seats.filter((s) => s === "reserved").length;

  const exportStudents = () => {
    download(
      "students.csv",
      toCsv([
        ["Name", "Mobile", "Email", "Seat", "Monthly Fee", "Pending", "Status"],
        ...students.map((s) => [
          s.name,
          s.mobile,
          s.email,
          s.seatNumber ?? "",
          s.monthlyFee,
          duesFor(s, payments),
          s.status,
        ]),
      ]),
    );
    toast.success("Student list exported as Excel-ready CSV.");
  };

  const exportPending = () => {
    download(
      "pending-fees.csv",
      toCsv([
        ["Name", "Seat", "Pending", "Status"],
        ...active
          .filter((s) => duesFor(s, payments) > 0)
          .map((s) => [s.name, s.seatNumber ?? "", duesFor(s, payments), feeStatusFor(s, payments)]),
      ]),
    );
    toast.success("Pending fees report exported.");
  };

  const exportCollection = () => {
    download(
      "monthly-collection.csv",
      toCsv([["Month", "Collected"], ...chart.map((c) => [c.month, c.total])]),
    );
    toast.success("Monthly collection exported.");
  };

  return (
    <AppShell
      title="Reports"
      description="Collection, dues and occupancy summaries you can export"
      actions={
        <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print / PDF
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-soft p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Monthly collection</h2>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -18, right: 8, top: 8 }}>
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
                <Bar dataKey="total" radius={[10, 10, 4, 4]} fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft space-y-3 p-5">
          <h2 className="text-base font-semibold">Exports</h2>
          <Button variant="outline" className="w-full justify-start rounded-full" onClick={exportCollection}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Monthly collection
          </Button>
          <Button variant="outline" className="w-full justify-start rounded-full" onClick={exportPending}>
            <Download className="mr-2 h-4 w-4" /> Pending fees
          </Button>
          <Button variant="outline" className="w-full justify-start rounded-full" onClick={exportStudents}>
            <Download className="mr-2 h-4 w-4" /> Student list
          </Button>
          <div className="rounded-2xl bg-muted p-4 text-sm">
            <p className="font-semibold">Seat occupancy</p>
            <p className="mt-1 text-muted-foreground">
              {occupied} occupied · {reserved} reserved ·{" "}
              {settings.totalSeats - occupied - reserved} available
            </p>
          </div>
        </div>
      </div>

      <div className="card-soft mt-6 overflow-x-auto p-5">
        <h2 className="mb-4 text-base font-semibold">Pending fees ({formatMonth(current)})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Seat</TableHead>
              <TableHead className="text-right">Monthly fee</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active
              .filter((s) => duesFor(s, payments) > 0)
              .slice(0, 12)
              .map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.seatNumber ?? "—"}</TableCell>
                  <TableCell className="text-right text-sm">{formatINR(s.monthlyFee)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {formatINR(duesFor(s, payments))}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{feeStatusFor(s, payments)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
