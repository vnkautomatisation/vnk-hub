"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUserPlus } from "@tabler/icons-react";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: "Tout — paramètres, équipe, finances, tous les sites",
  ADMIN: "Commandes, produits, sites, équipe",
  MANAGER: "Commandes + catalogue produits",
  AGENT: "Commandes uniquement",
};

export function InviteForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("AGENT");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    setLoading(false);
    setOpen(false);
    setEmail("");
    setName("");
    showToast("Invitation envoyée", "success");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconUserPlus size={16} />
        Inviter un membre
      </Button>

      <Modal title="Inviter un membre" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="input-label">Nom</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">Courriel</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label className="input-label">Rôle</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-full">
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="AGENT">Agent</option>
            </Select>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>
              {roleDescriptions[role]}
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full" style={{ marginTop: 8 }}>
            {loading ? "Envoi..." : "Envoyer l'invitation"}
          </Button>
        </form>
      </Modal>
    </>
  );
}
