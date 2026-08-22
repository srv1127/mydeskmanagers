import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Member = { id: string; name: string; email: string; role: "admin" | "staff" };

export function RoleManager() {
  const { session } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setMembers(
      (profiles ?? []).map((p) => ({
        id: p.id,
        name: p.full_name || p.email || "Team member",
        email: p.email ?? "",
        role: (roles ?? []).some((r) => r.user_id === p.id && r.role === "admin") ? "admin" : "staff",
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setRole = async (member: Member, role: "admin" | "staff") => {
    if (role === member.role) return;
    const del = await supabase.from("user_roles").delete().eq("user_id", member.id);
    if (del.error) {
      toast.error(del.error.message);
      return;
    }
    const ins = await supabase.from("user_roles").insert({ user_id: member.id, role });
    if (ins.error) {
      toast.error(ins.error.message);
      return;
    }
    toast.success(`${member.name} is now ${role === "admin" ? "an Admin" : "Staff"}.`);
    void load();
  };

  return (
    <div className="card-soft p-5 sm:p-6 lg:col-span-2">
      <h2 className="text-base font-semibold">Team &amp; roles</h2>
      <p className="text-xs text-muted-foreground">
        Staff can add students, assign seats and collect fees. Only admins see revenue, reports and
        settings.
      </p>
      <div className="mt-5 space-y-2">
        {loading && <p className="text-sm text-muted-foreground">Loading team…</p>}
        {!loading && members.length === 0 && (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        )}
        {members.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>
            <Select
              value={m.role}
              disabled={m.id === session?.id}
              onValueChange={(v) => void setRole(m, v as "admin" | "staff")}
            >
              <SelectTrigger className="w-32 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
