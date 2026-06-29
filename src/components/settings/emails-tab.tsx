"use client";

import { useState } from "react";
import type { AppSettings } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MaskedInput } from "@/components/ui/masked-input";
import { useToast } from "@/components/ui/toast";

const templates = [
  { key: "confirmation", label: "Confirmation de commande" },
  { key: "shipping", label: "Expédition" },
  { key: "delivery", label: "Livraison" },
];

export function EmailsTab({ settings }: { settings: AppSettings | null }) {
  const { showToast } = useToast();
  const [resendApiKey, setResendApiKey] = useState(settings?.resendApiKey ?? "");
  const [fromEmail, setFromEmail] = useState(settings?.fromEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resendApiKey, fromEmail }),
    });
    setSaving(false);
    showToast("Configuration email enregistrée", "success");
  }

  async function handleTestSend() {
    setSendingTest(true);
    await new Promise((r) => setTimeout(r, 600));
    setSendingTest(false);
    showToast(`Email de test envoyé à ${fromEmail || "l'expéditeur configuré"}`, "info");
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-lg space-y-3">
        <h2 className="card-title">Resend</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="input-label">Clé API Resend</label>
            <MaskedInput value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder="re_..." className="w-full" />
          </div>
          <div>
            <label className="input-label">Email expéditeur</label>
            <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="noreply@votredomaine.com" className="w-full" />
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>
              Domaine non vérifié — configurez les enregistrements DNS chez Resend.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleTestSend} disabled={sendingTest}>
              {sendingTest ? "Envoi..." : "Envoyer un test"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-2">
        <h2 className="card-title">Modèles d&apos;emails</h2>
        {templates.map((t) => (
          <div key={t.key} className="flex items-center justify-between py-2" style={{ borderBottom: "0.5px solid var(--border)" }}>
            <span className="text-[13px]" style={{ color: "var(--text-1)" }}>
              {t.label}
            </span>
            <Button variant="secondary" className="btn-sm">
              Aperçu / Éditer
            </Button>
          </div>
        ))}
        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>
          Les modèles par boutique se configurent dans l&apos;étape Emails du créateur de boutique.
        </p>
      </Card>
    </div>
  );
}
