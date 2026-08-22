import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RoleManager } from "@/components/role-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/library-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DeskManagers" },
      {
        name: "description",
        content: "Configure library name, default monthly fee, receipt format and admin profile.",
      },
      { property: "og:title", content: "Settings — DeskManagers" },
      { property: "og:description", content: "Library preferences, receipts and admin account settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, updateSettings } = useLibrary();
  const { session, isAdmin } = useAuth();
  const [form, setForm] = useState({
    libraryName: settings.libraryName,
    totalSeats: String(settings.totalSeats),
    defaultMonthlyFee: String(settings.defaultMonthlyFee),
    receiptPrefix: settings.receiptPrefix,
    adminName: settings.adminName,
    adminEmail: settings.adminEmail,
  });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const save = () => {
    const seats = Number(form.totalSeats);
    const fee = Number(form.defaultMonthlyFee);
    if (form.libraryName.trim().length < 2) {
      toast.error("Library name is too short.");
      return;
    }
    if (!Number.isFinite(seats) || seats < 1 || seats > 1000) {
      toast.error("Total seats must be between 1 and 1000.");
      return;
    }
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Enter a valid default monthly fee.");
      return;
    }
    updateSettings({
      libraryName: form.libraryName.trim(),
      totalSeats: seats,
      defaultMonthlyFee: fee,
      receiptPrefix: form.receiptPrefix.trim().toUpperCase() || "DM",
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
    });
    toast.success("Settings saved.");
  };

  const changePassword = () => {
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    toast.success("Password updated.");
  };

  if (!isAdmin) {
    return (
      <AppShell title="Settings" description="Admin access required">
        <div className="card-soft p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Only admins can change library settings and manage roles.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      description={`Signed in as ${session?.email ?? "guest"} · ${session?.role ?? "Staff"}`}
      actions={
        <Button className="rounded-full" onClick={save}>
          <Save className="mr-2 h-4 w-4" /> Save changes
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-soft p-5 sm:p-6">
          <h2 className="text-base font-semibold">Library</h2>
          <p className="text-xs text-muted-foreground">Basic details used across the app and receipts.</p>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="lib">Library name</Label>
              <Input
                id="lib"
                maxLength={80}
                value={form.libraryName}
                onChange={(e) => setForm({ ...form, libraryName: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="seats">Total seats</Label>
                <Input
                  id="seats"
                  inputMode="numeric"
                  value={form.totalSeats}
                  onChange={(e) => setForm({ ...form, totalSeats: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Default monthly fee (₹)</Label>
                <Input
                  id="fee"
                  inputMode="numeric"
                  value={form.defaultMonthlyFee}
                  onChange={(e) =>
                    setForm({ ...form, defaultMonthlyFee: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefix">Receipt format</Label>
              <Input
                id="prefix"
                maxLength={8}
                value={form.receiptPrefix}
                onChange={(e) => setForm({ ...form, receiptPrefix: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Receipts will look like {form.receiptPrefix || "DM"}-A1B2C3
              </p>
            </div>
          </div>
        </div>

        <div className="card-soft p-5 sm:p-6">
          <h2 className="text-base font-semibold">Admin profile</h2>
          <p className="text-xs text-muted-foreground">Shown on receipts and reports.</p>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="an">Full name</Label>
              <Input
                id="an"
                maxLength={80}
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ae">Email</Label>
              <Input
                id="ae"
                type="email"
                maxLength={255}
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              />
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="text-sm font-semibold">Change password</h3>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="cp">Current password</Label>
              <Input
                id="cp"
                type="password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="np">New password</Label>
                <Input
                  id="np"
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf">Confirm password</Label>
                <Input
                  id="cf"
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                />
              </div>
            </div>
            <Button variant="outline" className="rounded-full" onClick={changePassword}>
              <KeyRound className="mr-2 h-4 w-4" /> Update password
            </Button>
          </div>
        </div>
        <RoleManager />
      </div>
    </AppShell>
  );
}
