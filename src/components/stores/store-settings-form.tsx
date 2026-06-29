"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StoreSettingsForm({
  storeId,
  initialDomain,
  initialStripeKey,
}: {
  storeId: string;
  initialDomain: string;
  initialStripeKey: string;
}) {
  const router = useRouter();
  const [domain, setDomain] = useState(initialDomain);
  const [stripeKey, setStripeKey] = useState(initialStripeKey);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/stores/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, stripeKey }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="font-medium" style={{ color: "var(--text-1)" }}>
          Configuration
        </h2>

        <div className="space-y-1">
          <label className="text-[13px]" style={{ color: "var(--text-2)" }}>
            Domaine
          </label>
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="maboutique.com" className="w-full" />
        </div>

        <div className="space-y-1">
          <label className="text-[13px]" style={{ color: "var(--text-2)" }}>
            Clé Stripe dédiée
          </label>
          <Input value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} placeholder="sk_test_..." className="w-full" />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Card>
  );
}
