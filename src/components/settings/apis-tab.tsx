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
import {
  IconCopy, IconCheck, IconRefresh, IconExternalLink,
  IconAlertCircle, IconInfoCircle,
} from "@tabler/icons-react";

function IntegrationRow({
  label, connected, lastChecked, href,
}: {
  label: string; connected: boolean; lastChecked?: string; href?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "0.5px solid var(--border)" }}>
      <div>
        <p className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>{label}</p>
        {lastChecked && <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Dernière vérification: {lastChecked}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={connected ? "success" : "danger"}>{connected ? "Connecté" : "Déconnecté"}</Badge>
        {href && <Link href={href} className="btn btn-secondary btn-sm">Gérer</Link>}
      </div>
    </div>
  );
}

function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div>
      <label className="input-label">{label}</label>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{
          flex: 1, padding: "8px 12px", background: "var(--bg-base)",
          border: "0.5px solid var(--border)", borderRadius: 8,
          fontSize: mono ? 11 : 13, fontFamily: mono ? "monospace" : "inherit",
          color: "var(--text-2)", wordBreak: "break-all", lineHeight: 1.5,
        }}>
          {value}
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={copy} style={{ flexShrink: 0 }}>
          {copied ? <IconCheck size={13} style={{ color: "var(--success)" }} /> : <IconCopy size={13} />}
        </button>
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
  const [webhookSecret, setWebhookSecret] = useState((settings as unknown as Record<string, string> | null)?.trackingWebhookSecret ?? "");
  const [saving, setSaving] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingTrack, setTestingTrack] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const bySupplier = new Map(connections.map((c) => [c.supplier, c]));

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/tracking?token=${webhookSecret}`
    : `/api/webhooks/tracking?token=${webhookSecret}`;

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

  async function testStripe() {
    setTestingStripe(true);
    // Basic format check
    const valid = stripeSecretKey.startsWith("sk_");
    await new Promise((r) => setTimeout(r, 400));
    setTestingStripe(false);
    showToast(valid ? "Format Stripe valide" : "Clé Stripe invalide (doit commencer par sk_)", valid ? "success" : "error");
  }

  async function testTrack() {
    if (!seventeenTrackKey) { showToast("Entrez la clé 17track d'abord", "error"); return; }
    setTestingTrack(true);
    const res = await fetch("https://api.17track.net/track/v2.2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "17token": seventeenTrackKey },
      body: JSON.stringify([{ number: "TEST123" }]),
    }).catch(() => null);
    setTestingTrack(false);
    if (res && res.status !== 401) {
      showToast("Connexion 17track réussie", "success");
    } else {
      showToast("Clé 17track invalide ou inaccessible", "error");
    }
  }

  async function regenerateSecret() {
    setRegenerating(true);
    const res = await fetch("/api/settings", { method: "POST" });
    const data = await res.json();
    setRegenerating(false);
    if (data.secret) {
      setWebhookSecret(data.secret);
      showToast("Secret régénéré — mettez à jour l'URL dans 17track", "warning");
    }
  }

  return (
    <div className="space-y-4">
      {/* Fournisseurs */}
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

      {/* Stripe */}
      <Card className="max-w-lg space-y-3">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <h2 className="card-title">Stripe</h2>
          <Button variant="secondary" className="btn-sm" onClick={testStripe} disabled={testingStripe}>
            {testingStripe ? "Test..." : "Tester"}
          </Button>
        </div>
        <div>
          <label className="input-label">Clé secrète Stripe</label>
          <MaskedInput value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder="sk_live_..." className="w-full" />
        </div>
      </Card>

      {/* 17track */}
      <Card className="max-w-lg space-y-4">
        <div className="card-header" style={{ marginBottom: 0 }}>
          <div>
            <h2 className="card-title">17track — Suivi automatique</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              Mise à jour automatique du statut des commandes via webhook
            </p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button variant="secondary" className="btn-sm" onClick={testTrack} disabled={testingTrack}>
              {testingTrack ? "Test..." : "Tester"}
            </Button>
            <a
              href="https://www.17track.net/en/api"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-icon btn-sm"
              title="Documentation 17track"
            >
              <IconExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="input-label">Clé API 17track</label>
          <MaskedInput
            value={seventeenTrackKey}
            onChange={(e) => setSeventeenTrackKey(e.target.value)}
            placeholder="Votre clé 17track..."
            className="w-full"
          />
          {!seventeenTrackKey && (
            <div style={{ marginTop: 6, padding: "8px 12px", background: "var(--bg-base)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <IconInfoCircle size={13} style={{ color: "var(--text-3)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55 }}>
                Sans clé 17track, le suivi reste manuel. Les tracking numbers sont quand même enregistrés.
              </span>
            </div>
          )}
        </div>

        {/* Webhook config */}
        <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
              Configuration webhook
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11 }}
              onClick={regenerateSecret}
              disabled={regenerating}
            >
              <IconRefresh size={11} /> {regenerating ? "..." : "Regénérer"}
            </button>
          </div>

          {webhookSecret ? (
            <>
              <CopyField label="URL webhook à configurer dans 17track" value={webhookUrl} mono={false} />
              <div style={{ marginTop: 8 }}>
                <CopyField label="Token secret (inclus dans l'URL)" value={webhookSecret} />
              </div>
              <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(96,165,250,0.08)", border: "0.5px solid rgba(96,165,250,0.3)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--info)", fontWeight: 600, marginBottom: 4 }}>Comment configurer :</div>
                <ol style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.7, margin: 0, paddingLeft: 16 }}>
                  <li>Connectez-vous sur <strong>my.17track.net</strong></li>
                  <li>Allez dans <strong>API → Webhook</strong></li>
                  <li>Collez l'URL webhook ci-dessus</li>
                  <li>Sélectionnez l'événement <strong>TRACKING_UPDATED</strong></li>
                  <li>Sauvegardez et testez</li>
                </ol>
              </div>
            </>
          ) : (
            <div style={{ padding: "10px 12px", background: "var(--danger-bg)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <IconAlertCircle size={13} style={{ color: "var(--danger)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--danger)" }}>
                Aucun secret généré. Sauvegardez les paramètres une première fois pour en créer un.
              </span>
            </div>
          )}
        </div>

        {/* Events legend */}
        <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Comportement automatique
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { tag: "En transit",      action: "Statut → En transit",           color: "#60A5FA" },
              { tag: "En livraison",    action: "Statut → En transit (maintenu)", color: "#A78BFA" },
              { tag: "Livré",           action: "Statut → Livrée ✓",             color: "#4ADE80" },
              { tag: "Échec livraison", action: "Note interne ajoutée",           color: "#F87171" },
              { tag: "Exception",       action: "Note interne ajoutée",           color: "#F87171" },
              { tag: "Expiré",          action: "Note interne ajoutée",           color: "#FB923C" },
            ].map((row) => (
              <div key={row.tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 110 }}>{row.tag}</span>
                <span style={{ fontSize: 11, color: "var(--text-2)" }}>{row.action}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Enregistrement..." : "Sauvegarder"}
      </Button>
    </div>
  );
}
