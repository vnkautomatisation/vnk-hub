"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaskedInput } from "@/components/ui/masked-input";
import { useToast } from "@/components/ui/toast";

export function SecurityTab() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      showToast(body.error ?? "Erreur lors du changement", "error");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Mot de passe mis à jour", "success");
  }

  return (
    <Card className="max-w-lg space-y-3">
      <h2 className="card-title">Changer le mot de passe</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="input-label">Mot de passe actuel</label>
          <MaskedInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full" />
        </div>
        <div>
          <label className="input-label">Nouveau mot de passe</label>
          <MaskedInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="w-full" />
        </div>
        <div>
          <label className="input-label">Confirmer le nouveau mot de passe</label>
          <MaskedInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full" />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </form>
    </Card>
  );
}
