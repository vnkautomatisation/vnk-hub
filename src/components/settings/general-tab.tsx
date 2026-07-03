"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/contexts/lang-context";

const LANG_OPTIONS: SelectOption[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export function GeneralTab({ settings }: { settings: Record<string, unknown> | null }) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [companyName,     setCompanyName]     = useState((settings?.companyName as string)     ?? "VNK Automatisation");
  const [defaultLanguage, setDefaultLanguage] = useState((settings?.defaultLanguage as string) ?? "fr");
  const [slaHours,        setSlaHours]        = useState(String((settings?.slaHours as number) ?? 48));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, defaultLanguage, slaHours: parseInt(slaHours, 10) || 48 }),
    });
    setSaving(false);
    showToast(t.settings_saved, "success");
  }

  return (
    <Card className="max-w-lg space-y-3">
      <h2 className="card-title">{t.settings_company}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="input-label">{t.settings_company_name}</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="input-label">{t.settings_default_lang}</label>
          <Select options={LANG_OPTIONS} value={defaultLanguage} onChange={setDefaultLanguage} minWidth="100%" />
        </div>
        <div>
          <label className="input-label">Délai de livraison SLA (heures)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Input
              type="number"
              min="1"
              max="720"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              style={{ width: 100 }}
            />
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              heures après expédition — date de livraison promise calculée automatiquement
            </span>
          </div>
        </div>
        <Button type="submit" disabled={saving}>{saving ? t.action_saving : t.action_save}</Button>
      </form>
    </Card>
  );
}
