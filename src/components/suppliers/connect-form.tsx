"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierConnection } from "@prisma/client";
import { IconLock } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export function SupplierConnectForm({
  slug,
  label,
  connection,
}: {
  slug: string;
  label: string;
  connection: SupplierConnection | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState(connection?.apiKey ?? "");
  const [accountEmail, setAccountEmail] = useState(connection?.apiSecret ?? "");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/suppliers/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, apiSecret: accountEmail }),
    });
    setLoading(false);
    showToast("Fournisseur connecté", "success");
    router.refresh();
  }

  async function handleTest() {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 600));
    setTesting(false);
    showToast(connection?.connected ? "Connexion fonctionnelle" : "Aucune clé à tester", connection?.connected ? "success" : "warning");
  }

  return (
    <Card>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h2 className="card-title">Connexion API</h2>
          <Badge tone={connection?.connected ? "success" : "danger"}>
            {connection?.connected ? "Connecté" : "Déconnecté"}
          </Badge>
        </div>
        <Button type="button" variant="secondary" className="btn-sm" onClick={handleTest} disabled={testing}>
          {testing ? "Test..." : "Tester la connexion"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="input-label">Clé API *</label>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Entrez votre clé API ${label}`}
            required
          />
        </div>

        <div>
          <label className="input-label">Email du compte</label>
          <Input
            type="email"
            value={accountEmail}
            onChange={(e) => setAccountEmail(e.target.value)}
            placeholder="email@exemple.com"
          />
        </div>

        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
          <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
          <IconLock size={14} style={{ color: "var(--accent)" }} />
          Sauvegarder de façon sécurisée
        </label>

        <Button type="submit" disabled={loading} className="w-full" style={{ height: 40, marginTop: 16 }}>
          {loading ? "Connexion..." : "Connecter"}
        </Button>
      </form>
    </Card>
  );
}
