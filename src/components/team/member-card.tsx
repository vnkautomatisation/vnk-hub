"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActiveToggle } from "@/components/team/role-toggle";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const roleBadge: Record<Role, { label: string; tone: "purple" | "info" | "default" | "success" }> = {
  SUPER_ADMIN: { label: "Super Admin", tone: "purple" },
  ADMIN: { label: "Admin", tone: "info" },
  MANAGER: { label: "Manager", tone: "success" },
  AGENT: { label: "Agent", tone: "default" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MemberCard({
  member,
}: {
  member: { id: string; name: string; email: string; role: Role; active: boolean; ordersThisMonth: number; createdAt: Date };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);
  const badge = roleBadge[member.role];

  async function handleSaveRole() {
    setSaving(true);
    await fetch(`/api/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSaving(false);
    setEditing(false);
    showToast("Rôle mis à jour", "success");
    router.refresh();
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[16px] font-medium text-white"
          style={{ background: "var(--accent-gradient)" }}
        >
          {initials(member.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium" style={{ color: "var(--text-1)" }}>
            {member.name}
          </p>
          <span className={`badge badge-${badge.tone === "default" ? "neutral" : badge.tone}`}>{badge.label}</span>
        </div>
      </div>

      <p className="truncate text-[12px]" style={{ color: "var(--text-2)" }}>
        {member.email}
      </p>

      <div className="flex items-center gap-1.5 text-[12px]">
        <span className={`status-dot ${member.active ? "connected" : ""}`} style={!member.active ? { background: "var(--text-3)" } : undefined} />
        <span style={{ color: "var(--text-2)" }}>{member.active ? "En ligne" : "Hors ligne"}</span>
        <span style={{ color: "var(--text-3)" }}>· Membre depuis {member.createdAt.toLocaleDateString("fr-CA")}</span>
      </div>

      <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
        {member.ordersThisMonth} commandes traitées ce mois
      </p>

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" className="btn-sm" onClick={() => setEditing(true)}>
          Modifier
        </Button>
        <ActiveToggle userId={member.id} active={member.active} />
      </div>

      <Modal title={`Modifier ${member.name}`} open={editing} onClose={() => setEditing(false)}>
        <div className="space-y-3">
          <div>
            <label className="input-label">Rôle</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full">
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="AGENT">Agent</option>
            </Select>
          </div>
          <Button onClick={handleSaveRole} disabled={saving} className="w-full">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
