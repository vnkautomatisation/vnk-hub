import { Card } from "@/components/ui/card";

export function SupplierStatsCard({
  ordersThisMonth,
  productsImported,
  deliverySuccessRate,
  lastSyncAt,
}: {
  ordersThisMonth: number;
  productsImported: number;
  deliverySuccessRate: number;
  lastSyncAt: Date | null;
}) {
  return (
    <Card className="space-y-4">
      <h2 className="card-title">Statistiques</h2>

      <div className="flex items-center justify-between">
        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
          Commandes ce mois
        </span>
        <span className="text-[16px] font-semibold" style={{ color: "var(--text-1)" }}>
          {ordersThisMonth}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
          Produits importés
        </span>
        <span className="text-[16px] font-semibold" style={{ color: "var(--text-1)" }}>
          {productsImported}
        </span>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[13px]">
          <span style={{ color: "var(--text-2)" }}>Taux de réussite livraisons</span>
          <span style={{ color: "var(--success)" }}>{deliverySuccessRate}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "var(--bg-hover)" }}>
          <div className="h-2 rounded-full" style={{ width: `${deliverySuccessRate}%`, background: "var(--success)" }} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t-[0.5px] pt-3" style={{ borderColor: "var(--border)" }}>
        <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
          Dernière synchronisation
        </span>
        <span className="text-[12px]" style={{ color: "var(--text-2)" }}>
          {lastSyncAt ? lastSyncAt.toLocaleString("fr-CA") : "Jamais"}
        </span>
      </div>
    </Card>
  );
}
