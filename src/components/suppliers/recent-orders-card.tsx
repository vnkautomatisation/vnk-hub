import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { orderStatusLabels } from "@/lib/order-status";
import { IconPackageOff } from "@tabler/icons-react";
import type { Order } from "@prisma/client";

export function RecentOrdersCard({ orders }: { orders: Order[] }) {
  return (
    <Card className="space-y-3">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title">Commandes en cours</h2>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={IconPackageOff} title="Aucune commande" description="Aucune commande via ce fournisseur." />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between text-[13px]">
              <Link href={`/orders/${order.id}`} className="td-link">
                {order.orderNumber}
              </Link>
              <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/orders" className="text-[12px]" style={{ color: "var(--accent-light)" }}>
        Voir tout →
      </Link>
    </Card>
  );
}
