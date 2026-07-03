"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUserPlus } from "@tabler/icons-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/lang-context";

export function InviteForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("AGENT");
  const [loading, setLoading] = useState(false);

  const roleOptions: SelectOption[] = [
    { value: "SUPER_ADMIN", label: t.role_super_admin },
    { value: "ADMIN",       label: t.role_admin },
    { value: "MANAGER",     label: t.role_manager },
    { value: "AGENT",       label: t.role_agent },
  ];

  const roleDescriptions: Record<string, string> = {
    SUPER_ADMIN: t.role_super_admin_desc,
    ADMIN:       t.role_admin_desc,
    MANAGER:     t.role_manager_desc,
    AGENT:       t.role_agent_desc,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, name, role }) });
    setLoading(false);
    setOpen(false);
    setEmail(""); setName("");
    showToast(t.team_invited_toast, "success");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconUserPlus size={16} />
        {t.team_invite_btn}
      </Button>

      <Modal title={t.team_invite_modal} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="input-label">{t.label_name}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">{t.label_email}</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">{t.label_role}</label>
            <Select options={roleOptions} value={role} onChange={setRole} minWidth="100%" />
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>{roleDescriptions[role]}</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full" style={{ marginTop: 8 }}>
            {loading ? t.team_sending : t.team_send_invite}
          </Button>
        </form>
      </Modal>
    </>
  );
}
