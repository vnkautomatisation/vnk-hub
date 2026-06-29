"use client";

import { useState } from "react";
import type { AppSettings } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function GeneralTab({ settings }: { settings: AppSettings | null }) {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState(settings?.companyName ?? "VNK Automatisation");
  const [defaultLanguage, setDefaultLanguage] = useState(settings?.defaultLanguage ?? "fr");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, defaultLanguage }),
    });
    setSaving(false);
    showToast("Paramètres enregistrés", "success");
  }

  return (
    <Card className="max-w-lg space-y-3">
      <h2 className="card-title">Profil entreprise</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="input-label">Nom de l&apos;entreprise</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="input-label">Langue par défaut</label>
          <Select value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} className="w-full">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </Select>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
