import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { orderStatusLabels } from "@/lib/order-status";

const squareBadgeStyle: Record<OrderStatus, { bg: string; color: string }> = {
  DELIVERED: { bg: "var(--success-bg)", color: "var(--success)" },
  SHIPPED: { bg: "var(--info-bg)", color: "var(--info)" },
  IN_TRANSIT: { bg: "var(--info-bg)", color: "var(--info)" },
  DISPATCHED_TO_SUPPLIER: { bg: "var(--info-bg)", color: "var(--info)" },
  CONFIRMED: { bg: "var(--info-bg)", color: "var(--info)" },
  PENDING: { bg: "var(--warning-bg)", color: "var(--warning)" },
  CANCELLED: { bg: "var(--danger-bg)", color: "var(--danger)" },
  REFUNDED: { bg: "var(--danger-bg)", color: "var(--danger)" },
};

function SquareStatusBadge({ status }: { status: OrderStatus }) {
  const style = squareBadgeStyle[status];
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: 6,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 500,
        display: "inline-block",
      }}
    >
      {orderStatusLabels[status]}
    </span>
  );
}

export type SummaryOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  totalAmount: number;
  status: OrderStatus;
};

export function DashboardSummaryCard({
  revenueToday,
  revenueChange,
  activeOrders,
  pendingOrders,
  activeStores,
  nicheCount,
  orders,
}: {
  revenueToday: number;
  revenueChange?: string;
  activeOrders: number;
  pendingOrders: number;
  activeStores: number;
  nicheCount: number;
  orders: SummaryOrderRow[];
}) {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: 16, overflow: "hidden" }}>
      {/* Revenue — full width */}
      <div style={{ padding: 24, borderBottom: "0.5px solid var(--border)" }}>
        <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>Revenus du jour</p>
        <p style={{ fontSize: 32, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-1px" }}>
          {revenueToday.toLocaleString("fr-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} $
        </p>
        {revenueChange && <p style={{ fontSize: 12, color: "var(--success)", marginTop: 4 }}>{revenueChange}</p>}
      </div>

      {/* 2 stats side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <div style={{ padding: 20, borderRight: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>Commandes en cours</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: "var(--text-1)" }}>{activeOrders}</p>
          <p style={{ fontSize: 12, color: "var(--info)", marginTop: 4 }}>{pendingOrders} en attente</p>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 6 }}>Boutiques actives</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: "var(--text-1)" }}>{activeStores}</p>
          <p style={{ fontSize: 12, color: "var(--purple)", marginTop: 4 }}>{nicheCount} niches</p>
        </div>
      </div>

      {/* Orders table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
            {["Client", "Produit", "Montant", "Statut"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 24px",
                  textAlign: "left",
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="dashboard-summary-row" style={{ borderBottom: "0.5px solid var(--border)" }}>
              <td style={{ padding: "14px 24px", color: "var(--text-1)", fontSize: 13 }}>
                <Link href={`/orders/${order.id}`} style={{ color: "inherit" }}>
                  {order.customerName}
                </Link>
              </td>
              <td style={{ padding: "14px 24px", color: "var(--text-2)", fontSize: 13 }}>{order.productName}</td>
              <td style={{ padding: "14px 24px", color: "var(--text-1)", fontSize: 13, fontWeight: 500 }}>
                {order.totalAmount.toFixed(0)} $
              </td>
              <td style={{ padding: "14px 24px" }}>
                <SquareStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                Aucune commande
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
