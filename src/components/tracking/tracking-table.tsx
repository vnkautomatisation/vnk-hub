"use client";

import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { orderStatusLabels } from "@/lib/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTruckOff } from "@tabler/icons-react";

type TrackingOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
  trackingNumber: string | null;
  updatedAt: Date;
  store: { name: string };
  items: { product: { supplier: string } }[];
};

const statusProgress: Record<OrderStatus, number> = {
  PENDING: 5,
  CONFIRMED: 15,
  DISPATCHED_TO_SUPPLIER: 30,
  SHIPPED: 55,
  IN_TRANSIT: 75,
  DELIVERED: 100,
  CANCELLED: 0,
  REFUNDED: 0,
};

const filters = [
  { key: "all", label: "Tous" },
  { key: "transit", label: "En transit" },
  { key: "blocked", label: "Bloqué" },
  { key: "delivered", label: "Livré" },
] as const;

export function TrackingTable({ orders }: { orders: TrackingOrderRow[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");

  const filtered = orders.filter((o) => {
    if (filter === "transit") return o.status === "IN_TRANSIT" || o.status === "SHIPPED";
    if (filter === "delivered") return o.status === "DELIVERED";
    if (filter === "blocked") return Date.now() - o.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 10;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-[20px] px-3 py-1 text-[12px]"
            style={
              filter === f.key
                ? { background: "var(--accent)", color: "white" }
                : { border: "0.5px solid var(--border)", color: "var(--text-2)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={IconTruckOff} title="Aucun colis" description="Aucune commande ne correspond à ce filtre." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="w-full">
            <thead>
              <tr>
                {["Commande", "Client", "Fournisseur", "Transporteur", "Statut", "Dernière MAJ", "ETA"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const progress = statusProgress[order.status];
                return (
                  <tr key={order.id}>
                    <td colSpan={7} style={{ padding: 0 }}>
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td style={{ width: "14%" }}>{order.orderNumber}</td>
                            <td className="td-muted">{order.customerName}</td>
                            <td className="td-muted">{order.items[0]?.product.supplier ?? "—"}</td>
                            <td className="td-muted">17Track</td>
                            <td>
                              <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
                            </td>
                            <td className="td-muted">{order.updatedAt.toLocaleDateString("fr-CA")}</td>
                            <td className="td-muted">{order.trackingNumber ?? "—"}</td>
                          </tr>
                          <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                            <td colSpan={7} style={{ paddingTop: 0 }}>
                              <div className="h-1.5 rounded-full" style={{ background: "var(--bg-hover)" }}>
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{
                                    width: `${progress}%`,
                                    background: progress === 100 ? "var(--success)" : "var(--accent)",
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
