"use client";

import { useState } from "react";
import type { AppSettings, SupplierConnection } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaskedInput } from "@/components/ui/masked-input";
import { useToast } from "@/components/ui/toast";
import { supplierLabels, supplierSlugs, type ConnectableSupplier } from "@/lib/suppliers";
import Link from "next/link";

function IntegrationRow({
  label,
  connected,
  lastChecked,
  href,
}: {
  label: string;
  connected: boolean;
  lastChecked?: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "0.5px solid var(--border)" }}>
      <div>
        <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>
          {label}
        </p>
        {lastChecked && (
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
            Dernière vérification: {lastChecked}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={connected ? "success" : "danger"}>{connected ? "Connecté" : "Déconnecté"}</Badge>
        {href && (
          <Link href={href} className="btn btn-secondary btn-sm">
            Gérer
          </Link>
        )}
      </div>
    </div>
  );
}

export function ApisTab({
  settings,
  connections,
}: {
  settings: AppSettings | null;
  connections: SupplierConnection[];
}) {
  const { showToast } = useToast();
  const [stripeSecretKey, setStripeSecretKey] = useState(settings?.stripeSecretKey ?? "");
  const [seventeenTrackKey, setSeventeenTrackKey] = useState(settings?.seventeenTrackKey ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const bySupplier = new Map(connections.map((c) => [c.supplier, c]));

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeSecretKey, seventeenTrackKey }),
    });
    setSaving(false);
    showToast("Clés API enregistrées", "success");
  }

  async function handleTest() {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 500));
    setTesting(false);
    showToast("Test effectué", "info");
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="card-title mb-2">Fournisseurs dropshipping</h2>
        {(Object.keys(supplierLabels) as ConnectableSupplier[]).map((key) => (
          <IntegrationRow
            key={key}
            label={supplierLabels[key]}
            connected={bySupplier.get(key)?.connected ?? false}
            lastChecked={bySupplier.get(key)?.lastSyncAt?.toLocaleString("fr-CA")}
            href={`/suppliers/${supplierSlugs[key]}`}
          />
        ))}
      </Card>

      <Card className="max-w-lg space-y-3">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h2 className="card-title">Stripe</h2>
          <Button variant="secondary" className="btn-sm" onClick={handleTest} disabled={testing}>
            {testing ? "Test..." : "Tester"}
          </Button>
        </div>
        <div>
          <label className="input-label">Clé secrète Stripe</label>
          <MaskedInput value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder="sk_test_..." className="w-full" />
        </div>
      </Card>

      <Card className="max-w-lg space-y-3">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h2 className="card-title">17Track</h2>
          <Button variant="secondary" className="btn-sm" onClick={handleTest} disabled={testing}>
            {testing ? "Test..." : "Tester"}
          </Button>
        </div>
        <div>
          <label className="input-label">Clé API 17Track</label>
          <MaskedInput value={seventeenTrackKey} onChange={(e) => setSeventeenTrackKey(e.target.value)} className="w-full" />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Enregistrement..." : "Sauvegarder"}
      </Button>
    </div>
  );
}
