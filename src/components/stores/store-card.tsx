import Link from "next/link";
import { IconWorld, IconPlus } from "@tabler/icons-react";
import { StoreActiveToggle, DuplicateStoreButton } from "@/components/stores/store-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type StoreCardData = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  primaryColor: string;
  domain: string | null;
  active: boolean;
  stripeConnected: boolean;
  productCount: number;
  orderCount: number;
  revenue: number;
};

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          height: 80,
          background: store.primaryColor || "var(--accent-gradient)",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <span className="truncate text-[16px] font-medium text-white">{store.name}</span>
        <span>
          <Badge tone="default">{store.niche}</Badge>
        </span>
      </div>

      <div className="space-y-2.5 p-4">
        {store.domain ? (
          <span className="badge badge-neutral">
            <IconWorld size={12} />
            {store.domain}
          </span>
        ) : (
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
            Aucun domaine personnalisé
          </span>
        )}

        <div className="flex items-center gap-1.5 text-[12px]">
          <span className={`status-dot ${store.stripeConnected ? "connected" : "error"}`} />
          <span style={{ color: "var(--text-2)" }}>Stripe {store.stripeConnected ? "connecté" : "non connecté"}</span>
        </div>

        <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
          {store.productCount} produits · {store.orderCount} commandes · {store.revenue.toFixed(2)} $ revenus
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <Link href={`/stores/builder/${store.id}`}>
              <Button className="btn-sm">Gérer</Button>
            </Link>
            <Link href={`/${store.slug}`} target="_blank">
              <Button variant="secondary" className="btn-sm">
                Voir le site
              </Button>
            </Link>
          </div>
          <StoreActiveToggle storeId={store.id} active={store.active} />
        </div>
        <DuplicateStoreButton storeId={store.id} />
      </div>
    </div>
  );
}

export function CreateStoreCard() {
  return (
    <Link
      href="/stores/builder"
      className="group create-store-card flex flex-col items-center justify-center gap-2 text-center transition-colors duration-150"
      style={{ minHeight: 220, borderRadius: "var(--radius-lg)" }}
    >
      <IconPlus size={32} className="text-[var(--text-2)] transition-colors duration-150 group-hover:text-[var(--accent-light)]" />
      <span className="text-[var(--text-2)] transition-colors duration-150 group-hover:text-[var(--accent-light)]">
        Créer une nouvelle boutique
      </span>
    </Link>
  );
}
