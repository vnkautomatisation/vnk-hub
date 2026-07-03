"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { ActiveToggle } from "@/components/team/role-toggle";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/lang-context";

const roleBadge: Record<Role, { tone: "purple" | "info" | "default" | "success" }> = {
  SUPER_ADMIN: { tone: "purple" },
  ADMIN:       { tone: "info" },
  MANAGER:     { tone: "success" },
  AGENT:       { tone: "default" },
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function MemberCard({ member }: {
  member: { id: string; name: string; email: string; role: Role; active: boolean; ordersThisMonth: number; createdAt: Date };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<Role>(member.role);
  const [saving, setSaving] = useState(false);
  const badge = roleBadge[member.role];

  const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: t.role_super_admin,
    ADMIN:       t.role_admin,
    MANAGER:     t.role_manager,
    AGENT:       t.role_agent,
  };
  const roleOptions: SelectOption[] = (Object.keys(roleLabels) as Role[]).map((r) => ({ value: r, label: roleLabels[r] }));

  async function handleSaveRole() {
    setSaving(true);
    await fetch(`/api/team/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    setSaving(false);
    setEditing(false);
    showToast(t.team_role_updated, "success");
    router.refresh();
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-medium text-white" style={{ background: "var(--accent-gradient)" }}>
          {initials(member.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium" style={{ color: "var(--text-1)" }}>{member.name}</p>
          <span className={`badge badge-${badge.tone === "default" ? "neutral" : badge.tone}`}>{roleLabels[member.role]}</span>
        </div>
      </div>

      <p className="truncate text-[12px]" style={{ color: "var(--text-2)" }}>{member.email}</p>

      <div className="flex items-center gap-1.5 text-[12px]">
        <span className={`status-dot ${member.active ? "connected" : ""}`} style={!member.active ? { background: "var(--text-3)" } : undefined} />
        <span style={{ color: "var(--text-2)" }}>{member.active ? t.team_online : t.team_offline}</span>
        <span style={{ color: "var(--text-3)" }}>· {t.team_since} {member.createdAt.toLocaleDateString("fr-CA")}</span>
      </div>

      <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{member.ordersThisMonth} {t.team_orders_month}</p>

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" className="btn-sm" onClick={() => setEditing(true)}>{t.team_modify}</Button>
        <ActiveToggle userId={member.id} active={member.active} />
      </div>

      <Modal title={`${t.team_edit_member} ${member.name}`} open={editing} onClose={() => setEditing(false)}>
        <div className="space-y-3">
          <div>
            <label className="input-label">{t.label_role}</label>
            <Select options={roleOptions} value={role} onChange={(v) => setRole(v as Role)} minWidth="100%" />
          </div>
          <Button onClick={handleSaveRole} disabled={saving} className="w-full">
            {saving ? t.action_saving : t.action_save}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
