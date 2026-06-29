import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SubscriptionTab() {
  return (
    <Card className="max-w-lg space-y-3">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title">Plan actuel</h2>
        <Badge tone="purple">Interne — VNK Automatisation</Badge>
      </div>
      <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
        VNK Hub est un outil interne, sans facturation par abonnement. Cette section sera utilisée si une offre
        commerciale est lancée.
      </p>
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-[13px]">
          <span style={{ color: "var(--text-2)" }}>Boutiques</span>
          <span style={{ color: "var(--text-1)" }}>Illimité</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span style={{ color: "var(--text-2)" }}>Membres d&apos;équipe</span>
          <span style={{ color: "var(--text-1)" }}>Illimité</span>
        </div>
      </div>
    </Card>
  );
}
