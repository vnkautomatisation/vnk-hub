"use client";

import Link from "next/link";
import { useState } from "react";
import type { OrderStatus, Supplier } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { orderStatusLabels } from "@/lib/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { IconShoppingCartOff } from "@tabler/icons-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  trackingNumber: string | null;
  store: { name: string };
  items: { product: { name: string; supplier: Supplier } }[];
};

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  function toggleAll() {
    setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  if (orders.length === 0) {
    return <EmptyState icon={IconShoppingCartOff} title="Aucune commande pour l'instant" description="Les commandes apparaîtront ici une fois reçues." />;
  }

  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr style={{ background: "var(--bg-card)" }}>
          <th className="w-10 px-4 py-3">
            <input
              type="checkbox"
              checked={orders.length > 0 && selected.size === orders.length}
              onChange={toggleAll}
              className="h-3.5 w-3.5"
            />
          </th>
          {["Numéro", "Client", "Produit", "Boutique", "Montant", "Statut", "Fournisseur", "Tracking", ""].map((h) => (
            <th
              key={h}
              className="border-b-[0.5px] px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide"
              style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.id}
            className="border-b-[0.5px] transition-colors duration-150 hover:bg-[var(--bg-hover)]"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
            onMouseEnter={() => setHovered(order.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={selected.has(order.id)}
                onChange={() => toggleOne(order.id)}
                className="h-3.5 w-3.5"
              />
            </td>
            <td className="px-4 py-3">
              <Link href={`/orders/${order.id}`} className="font-medium" style={{ color: "var(--accent)" }}>
                {order.orderNumber}
              </Link>
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-1)" }}>
              {order.customerName}
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
              {order.items[0]?.product.name ?? "—"}
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
              {order.store.name}
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-1)" }}>
              {order.totalAmount.toFixed(2)} {order.currency}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
              {order.items[0]?.product.supplier ?? "—"}
            </td>
            <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
              {order.trackingNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-right">
              {hovered === order.id && (
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-lg border-[0.5px] px-2.5 py-1 text-[12px]"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-1)" }}
                >
                  Voir détail
                </Link>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
