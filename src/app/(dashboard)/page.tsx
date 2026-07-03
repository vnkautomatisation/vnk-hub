import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { supplierLabels } from "@/lib/suppliers";
import { relativeTime } from "@/lib/relative-time";
import { getT, getLang } from "@/lib/i18n";
import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconWorld,
  IconAlertTriangle,
  IconTrendingUp,
  IconTruck,
  IconPlus,
  IconPackage,
  IconChartBar,
  IconPercentage,
  IconReceipt,
  IconBuildingStore,
} from "@tabler/icons-react";
import type { OrderStatus } from "@prisma/client";

const activeOrderStatuses: OrderStatus[] = [
  "PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT",
];

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const ORDER_STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  DELIVERED:              { bg: "var(--success-bg)", color: "var(--success)" },
  IN_TRANSIT:             { bg: "var(--purple-bg)",  color: "var(--purple)"  },
  SHIPPED:                { bg: "var(--info-bg)",    color: "var(--info)"    },
  CONFIRMED:              { bg: "var(--info-bg)",    color: "var(--info)"    },
  DISPATCHED_TO_SUPPLIER: { bg: "var(--info-bg)",    color: "var(--info)"    },
  PENDING:                { bg: "var(--warning-bg)", color: "var(--warning)" },
  CANCELLED:              { bg: "var(--danger-bg)",  color: "var(--danger)"  },
  REFUNDED:               { bg: "var(--danger-bg)",  color: "var(--danger)"  },
};

const ACTION_LABELS: Record<string, Record<string, string>> = {
  fr: {
    team_member_invited: "a invité un membre",
    team_member_removed: "a retiré un membre",
    order_created:       "a créé une commande",
    order_updated:       "a modifié une commande",
    order_cancelled:     "a annulé une commande",
    store_created:       "a créé une boutique",
    store_updated:       "a modifié une boutique",
    product_added:       "a ajouté un produit",
    product_deleted:     "a supprimé un produit",
    settings_updated:    "a mis à jour les paramètres",
    supplier_connected:  "a connecté un fournisseur",
  },
  en: {
    team_member_invited: "invited a member",
    team_member_removed: "removed a member",
    order_created:       "created an order",
    order_updated:       "updated an order",
    order_cancelled:     "cancelled an order",
    store_created:       "created a store",
    store_updated:       "updated a store",
    product_added:       "added a product",
    product_deleted:     "deleted a product",
    settings_updated:    "updated settings",
    supplier_connected:  "connected a supplier",
  },
};

const STATUS_LABELS: Record<string, Record<OrderStatus, string>> = {
  fr: {
    PENDING: "En attente", CONFIRMED: "Confirmée", DISPATCHED_TO_SUPPLIER: "Envoyée fournisseur",
    SHIPPED: "Expédiée", IN_TRANSIT: "En transit", DELIVERED: "Livrée",
    CANCELLED: "Annulée", REFUNDED: "Remboursée",
  },
  en: {
    PENDING: "Pending", CONFIRMED: "Confirmed", DISPATCHED_TO_SUPPLIER: "Sent to supplier",
    SHIPPED: "Shipped", IN_TRANSIT: "In transit", DELIVERED: "Delivered",
    CANCELLED: "Cancelled", REFUNDED: "Refunded",
  },
};

async function getStats(periodDays: number, locale: string) {
  const today        = startOfDay(0);
  const yesterday    = startOfDay(1);
  const monthStart   = startOfMonth();
  const prevMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

  const [
    revenueToday, revenueYesterday,
    revenueMonth, revenuePrevMonth,
    ordersMonth, ordersPrevMonth,
    activeOrders, pendingOrders, dispatchedOrders,
    activeStores, niches, activeAgents,
    recentOrders, connections, recentLogs,
    deliveredCount, inTransitCount, shippedCount, cancelledCount, refundedCount,
    topProducts, ordersByStatus, revenueByStoreRaw, aovData, marginItems,
  ] = await Promise.all([
    // Revenue aggregates
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: prevMonthStart, lt: monthStart }, status: { not: "CANCELLED" } } }),
    // Order counts
    prisma.order.count({ where: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    prisma.order.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart }, status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    prisma.order.count({ where: { status: { in: activeOrderStatuses } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DISPATCHED_TO_SUPPLIER" } }),
    // Stores / team
    prisma.store.count({ where: { active: true } }),
    prisma.store.findMany({ where: { active: true }, select: { niche: true }, distinct: ["niche"] }),
    prisma.user.count({ where: { active: true } }),
    // Lists
    prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { items: { take: 1, include: { product: { select: { name: true } } } } } }),
    prisma.supplierConnection.findMany(),
    prisma.activityLog.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    // Status counts
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "IN_TRANSIT" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.count({ where: { status: "REFUNDED" } }),
    // Top products this month by quantity
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      _count: { orderId: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    // Orders by status (all time)
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    // Revenue by store this month
    prisma.order.groupBy({
      by: ["storeId"],
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
    // Average order value (all time, non-cancelled)
    prisma.order.aggregate({ _avg: { totalAmount: true }, _count: { id: true }, where: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
    // Margin: orderItems this month with product cost
    prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED", "REFUNDED"] } } },
      select: { quantity: true, price: true, product: { select: { cost: true } } },
    }),
  ]);

  // Gross margin calculation
  let grossRevenue = 0;
  let grossCost = 0;
  for (const item of marginItems) {
    grossRevenue += item.price * item.quantity;
    grossCost += item.product.cost * item.quantity;
  }
  const grossProfit  = grossRevenue - grossCost;
  const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : null;

  // Orders by status map
  const statusCountMap: Partial<Record<OrderStatus, number>> = {};
  for (const row of ordersByStatus) statusCountMap[row.status] = row._count.id;
  const totalOrdersAllTime = Object.values(statusCountMap).reduce((a, b) => a + (b ?? 0), 0);

  // Revenue by store — fetch names
  const storeIds = revenueByStoreRaw.map((s) => s.storeId);
  const storeNames = await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true } });
  const storeNameMap = Object.fromEntries(storeNames.map((s) => [s.id, s.name]));
  const revenueByStore = revenueByStoreRaw.map((s) => ({
    storeId: s.storeId,
    name: storeNameMap[s.storeId] ?? "—",
    revenue: s._sum.totalAmount ?? 0,
    orders: s._count.id,
  }));
  const maxStoreRevenue = Math.max(...revenueByStore.map((s) => s.revenue), 1);

  // Top products — fetch names
  const topProductIds = topProducts.map((p) => p.productId);
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, nameFr: true },
  });
  const nameMap = Object.fromEntries(productNames.map((p) => [p.id, { name: p.name, nameFr: p.nameFr }]));

  // Revenue chart (N sequential but unavoidable without raw SQL)
  const revenueDays = await Promise.all(
    Array.from({ length: periodDays }, (_, i) => periodDays - 1 - i).map(async (daysAgo) => {
      const start = startOfDay(daysAgo);
      const end   = startOfDay(daysAgo - 1);
      const sum   = await prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } } });
      return {
        day: start.toLocaleDateString(locale, periodDays > 14 ? { day: "2-digit", month: "2-digit" } : { weekday: "short" }),
        revenue: sum._sum.totalAmount ?? 0,
      };
    })
  );

  return {
    revenueToday:     revenueToday._sum.totalAmount  ?? 0,
    revenueYesterday: revenueYesterday._sum.totalAmount ?? 0,
    revenueMonth:     revenueMonth._sum.totalAmount   ?? 0,
    revenuePrevMonth: revenuePrevMonth._sum.totalAmount ?? 0,
    ordersMonth, ordersPrevMonth,
    activeOrders, pendingOrders, dispatchedOrders,
    activeStores, nicheCount: niches.length, activeAgents,
    recentOrders, connections, recentLogs, revenueDays,
    deliveredCount, inTransitCount, shippedCount, cancelledCount, refundedCount,
    grossProfit, grossMarginPct,
    aov: aovData._avg.totalAmount ?? 0,
    statusCountMap, totalOrdersAllTime,
    revenueByStore, maxStoreRevenue,
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name:    nameMap[p.productId]?.name    ?? "—",
      nameFr:  nameMap[p.productId]?.nameFr  ?? "—",
      qty:     p._sum.quantity ?? 0,
      orders:  p._count.orderId,
    })),
  };
}

/* ─── helpers ─── */
function fmt(n: number, locale: string) {
  return n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function diff(current: number, prev: number) {
  if (prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string } }) {
  const t          = getT();
  const lang       = getLang();
  const isEn       = lang === "en";
  const locale     = isEn ? "en-CA" : "fr-CA";
  const periodDays = parseInt(searchParams.period ?? "7", 10) || 7;
  const stats      = await getStats(periodDays, locale);

  const actionLabels = ACTION_LABELS[lang] ?? ACTION_LABELS.fr;
  const statusLabel  = STATUS_LABELS[lang]  ?? STATUS_LABELS.fr;

  const revDiff     = diff(stats.revenueToday,  stats.revenueYesterday);
  const monthDiff   = diff(stats.revenueMonth,  stats.revenuePrevMonth);
  const ordersDiff  = diff(stats.ordersMonth,   stats.ordersPrevMonth);

  const totalDelivery = stats.deliveredCount + stats.inTransitCount + stats.shippedCount;
  const needsAttention = stats.pendingOrders > 0 || stats.dispatchedOrders > 0;

  // All statuses in the breakdown order
  const statusBreakdown: { key: OrderStatus; labelFr: string; labelEn: string }[] = [
    { key: "PENDING",                 labelFr: "En attente",          labelEn: "Pending"           },
    { key: "CONFIRMED",               labelFr: "Confirmée",           labelEn: "Confirmed"         },
    { key: "DISPATCHED_TO_SUPPLIER",  labelFr: "Fournisseur",         labelEn: "At supplier"       },
    { key: "SHIPPED",                 labelFr: "Expédiée",            labelEn: "Shipped"           },
    { key: "IN_TRANSIT",              labelFr: "En transit",          labelEn: "In transit"        },
    { key: "DELIVERED",               labelFr: "Livrée",              labelEn: "Delivered"         },
    { key: "CANCELLED",               labelFr: "Annulée",             labelEn: "Cancelled"         },
    { key: "REFUNDED",                labelFr: "Remboursée",          labelEn: "Refunded"          },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Quick actions ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { href: "/orders?status=PENDING", icon: IconShoppingCart, label: isEn ? "Pending orders" : "Commandes en attente", color: "var(--warning)",  bg: "var(--warning-bg)",  count: stats.pendingOrders },
          { href: "/products",              icon: IconPlus,          label: isEn ? "Add product"     : "Ajouter un produit",  color: "var(--info)",     bg: "var(--info-bg)",     count: null },
          { href: "/stores",                icon: IconBuildingStore, label: isEn ? "Manage stores"   : "Gérer les boutiques", color: "var(--purple)",   bg: "var(--purple-bg)",   count: null },
          { href: "/analytics",             icon: IconChartBar,      label: isEn ? "Analytics"       : "Analytique",          color: "var(--success)",  bg: "var(--success-bg)",  count: null },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 8,
            background: a.bg, border: `0.5px solid ${a.color}22`,
            fontSize: 12, fontWeight: 500, color: a.color,
            textDecoration: "none", transition: "opacity 120ms",
            whiteSpace: "nowrap",
          }}>
            <a.icon size={14} />
            {a.label}
            {a.count != null && a.count > 0 && (
              <span style={{ background: a.color, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{a.count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Alert ── */}
      {needsAttention && (
        <div style={{
          background: "rgba(251,191,36,0.07)", border: "0.5px solid rgba(251,191,36,0.25)",
          borderRadius: 10, padding: "11px 16px",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <IconAlertTriangle size={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text-1)", flex: 1 }}>
            {isEn
              ? `${stats.pendingOrders} order${stats.pendingOrders !== 1 ? "s" : ""} awaiting confirmation${stats.dispatchedOrders > 0 ? ` · ${stats.dispatchedOrders} sent to supplier` : ""}`
              : `${stats.pendingOrders} commande${stats.pendingOrders !== 1 ? "s" : ""} en attente de confirmation${stats.dispatchedOrders > 0 ? ` · ${stats.dispatchedOrders} envoyée${stats.dispatchedOrders !== 1 ? "s" : ""} au fournisseur` : ""}`
            }
          </span>
          <Link href="/orders?status=PENDING" style={{ fontSize: 12, fontWeight: 500, color: "var(--warning)" }}>
            {isEn ? "View →" : "Voir →"}
          </Link>
        </div>
      )}

      {/* ── ROW 1 — 6 KPI cards (2×3) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {/* Revenue today */}
        <KpiCard
          icon={IconCurrencyDollar} iconBg="var(--success-bg)" iconColor="var(--success)"
          label={isEn ? "Revenue today" : "Revenus du jour"}
          value={`${fmt(stats.revenueToday, locale)} $`}
          sub={revDiff !== null ? { text: `${revDiff >= 0 ? "↑" : "↓"} ${Math.abs(revDiff).toFixed(0)}% ${isEn ? "vs yesterday" : "vs hier"}`, color: revDiff >= 0 ? "var(--success)" : "var(--danger)" } : undefined}
        />
        {/* Revenue this month */}
        <KpiCard
          icon={IconReceipt} iconBg="var(--info-bg)" iconColor="var(--info)"
          label={isEn ? "Revenue this month" : "Revenus du mois"}
          value={`${fmt(stats.revenueMonth, locale)} $`}
          sub={monthDiff !== null ? { text: `${monthDiff >= 0 ? "↑" : "↓"} ${Math.abs(monthDiff).toFixed(0)}% ${isEn ? "vs last month" : "vs mois dernier"}`, color: monthDiff >= 0 ? "var(--success)" : "var(--danger)" } : undefined}
        />
        {/* Gross margin */}
        <KpiCard
          icon={IconPercentage} iconBg="var(--purple-bg)" iconColor="var(--purple)"
          label={isEn ? "Gross margin (month)" : "Marge brute (mois)"}
          value={stats.grossMarginPct !== null ? `${stats.grossMarginPct.toFixed(1)} %` : "—"}
          sub={stats.grossProfit > 0 ? { text: `${fmt(stats.grossProfit, locale)} $ ${isEn ? "profit" : "de profit"}`, color: "var(--purple)" } : undefined}
        />
        {/* Active orders */}
        <KpiCard
          icon={IconShoppingCart} iconBg="var(--warning-bg)" iconColor="var(--warning)"
          label={isEn ? "Active orders" : "Commandes en cours"}
          value={String(stats.activeOrders)}
          sub={{ text: `${stats.pendingOrders} ${isEn ? "pending" : "en attente"}`, color: "var(--warning)" }}
        />
        {/* AOV */}
        <KpiCard
          icon={IconTrendingUp} iconBg="var(--success-bg)" iconColor="var(--success)"
          label={isEn ? "Avg. order value" : "Panier moyen"}
          value={`${fmt(stats.aov, locale)} $`}
          sub={ordersDiff !== null ? { text: `${stats.ordersMonth} ${isEn ? "orders this month" : "commandes ce mois"} (${ordersDiff >= 0 ? "↑" : "↓"}${Math.abs(ordersDiff).toFixed(0)}%)`, color: ordersDiff >= 0 ? "var(--success)" : "var(--danger)" } : { text: `${stats.ordersMonth} ${isEn ? "orders this month" : "commandes ce mois"}`, color: "var(--text-2)" }}
        />
        {/* Active stores */}
        <KpiCard
          icon={IconWorld} iconBg="var(--info-bg)" iconColor="var(--info)"
          label={isEn ? "Active stores" : "Boutiques actives"}
          value={String(stats.activeStores)}
          sub={{ text: `${stats.nicheCount} ${stats.nicheCount !== 1 ? (isEn ? "niches" : "niches") : (isEn ? "niche" : "niche")}`, color: "var(--info)" }}
        />
      </div>

      {/* ── ROW 2 — Revenue chart ── */}
      <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <div className="card-header">
          <span className="card-title">{isEn ? `Revenue — last ${periodDays} days` : `Revenus — ${periodDays} derniers jours`}</span>
          <PeriodSelect value={periodDays} />
        </div>
        <RevenueChart data={stats.revenueDays} lang={lang} />
      </div>

      {/* ── ROW 3 — Orders by status breakdown ── */}
      <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
        <p className="card-title" style={{ marginBottom: 14 }}>{isEn ? "Orders by status — all time" : "Commandes par statut — tous"}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {statusBreakdown.map(({ key, labelFr, labelEn }) => {
            const count = stats.statusCountMap[key] ?? 0;
            const pct   = stats.totalOrdersAllTime > 0 ? (count / stats.totalOrdersAllTime) * 100 : 0;
            const style = ORDER_STATUS_STYLE[key];
            return (
              <Link key={key} href={`/orders?status=${key}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: style.bg, borderRadius: 8, padding: "10px 14px",
                  border: "0.5px solid transparent", transition: "border-color 120ms",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: style.color, fontWeight: 500 }}>{isEn ? labelEn : labelFr}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: style.color }}>{count}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: style.color, borderRadius: 2 }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── ROW 4 — Orders table + right column ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Last orders — span 2 */}
        <div style={{ gridColumn: "span 2", background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "16px 20px" }}>
            <span className="card-title">{isEn ? "Recent orders" : "Dernières commandes"}</span>
            <Link href="/orders" style={{ fontSize: 12, color: "var(--accent-light)" }}>{t.action_view_all} →</Link>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                {[t.label_number, t.label_client, t.label_product, t.label_amount, t.label_status].map((h) => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order, i) => {
                const badge  = ORDER_STATUS_STYLE[order.status];
                const isLast = i === stats.recentOrders.length - 1;
                return (
                  <tr key={order.id} style={{ borderBottom: isLast ? "none" : "0.5px solid var(--border)", transition: "background 120ms" }}
                    className="dashboard-summary-row">
                    <td style={{ padding: "10px 16px" }}>
                      <Link href={`/orders/${order.id}`} style={{ color: "var(--accent-light)", fontWeight: 500, fontSize: 12 }}>{order.orderNumber}</Link>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-1)" }}>{order.customerName}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-2)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.items[0]?.product.name ?? "—"}</td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-1)", fontWeight: 500 }}>{order.totalAmount.toFixed(0)} $</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 500 }}>
                        {statusLabel[order.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {stats.recentOrders.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>{t.dash_no_orders}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Delivery status */}
          <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <IconTruck size={13} style={{ color: "var(--text-2)" }} />
              <span className="card-title" style={{ fontSize: 12 }}>{isEn ? "Deliveries" : "Livraisons"}</span>
            </div>
            {[
              { label: isEn ? "In transit" : "En transit", count: stats.inTransitCount, color: "var(--purple)" },
              { label: isEn ? "Shipped"    : "Expédiées",  count: stats.shippedCount,   color: "var(--info)"   },
              { label: isEn ? "Delivered"  : "Livrées",    count: stats.deliveredCount,  color: "var(--success)"},
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
                <span style={{ fontSize: 11, color: "var(--text-2)" }}>{row.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 52, height: 3, borderRadius: 2, background: "var(--bg-hover)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: totalDelivery > 0 ? `${(row.count / totalDelivery) * 100}%` : "0%", background: row.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", minWidth: 16, textAlign: "right" }}>{row.count}</span>
                </div>
              </div>
            ))}
            {stats.cancelledCount > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{isEn ? "Cancelled" : "Annulées"}</span>
                <span style={{ fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>{stats.cancelledCount}</span>
              </div>
            )}
          </div>

          {/* Top products */}
          <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconTrendingUp size={13} style={{ color: "var(--text-2)" }} />
                <span className="card-title" style={{ fontSize: 12 }}>{isEn ? "Top products" : "Top produits"}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>{isEn ? "this month" : "ce mois"}</span>
            </div>
            {stats.topProducts.length === 0
              ? <p style={{ fontSize: 11, color: "var(--text-3)" }}>{isEn ? "No sales yet" : "Aucune vente"}</p>
              : <ul>
                  {stats.topProducts.map((p, i) => (
                    <li key={p.productId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < stats.topProducts.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                      <span style={{ width: 16, height: 16, borderRadius: 4, background: "var(--bg-hover)", fontSize: 9, fontWeight: 700, color: "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 11, color: "var(--text-1)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isEn ? p.name : p.nameFr}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent-light)", flexShrink: 0 }}>{p.qty} {isEn ? "u." : "u."}</span>
                    </li>
                  ))}
                </ul>
            }
          </div>

          {/* Suppliers */}
          <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "14px 18px" }}>
            <span className="card-title" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>{t.dash_suppliers}</span>
            <ul>
              {stats.connections.map((c, i) => (
                <li key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: i < stats.connections.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.connected ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--text-1)" }}>{supplierLabels[c.supplier as keyof typeof supplierLabels] ?? c.supplier}</span>
                  </div>
                  <span style={{ fontSize: 10, color: c.connected ? "var(--success)" : "var(--text-3)", fontWeight: 500 }}>
                    {c.connected ? (isEn ? "Connected" : "Connecté") : (isEn ? "Not set" : "Non configuré")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── ROW 5 — Revenue by store ── */}
      {stats.revenueByStore.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
          <div className="card-header" style={{ marginBottom: 14 }}>
            <span className="card-title">{isEn ? "Revenue by store — this month" : "Revenus par boutique — ce mois"}</span>
            <Link href="/analytics" style={{ fontSize: 12, color: "var(--accent-light)" }}>{isEn ? "Full analytics →" : "Analytique complète →"}</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.revenueByStore.map((s) => (
              <div key={s.storeId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Link href={`/stores/${s.storeId}`} style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 500, minWidth: 140, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.name}
                </Link>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-hover)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.revenue / stats.maxStoreRevenue) * 100}%`, background: "var(--accent)", borderRadius: 3, transition: "width 400ms ease" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", minWidth: 70, textAlign: "right" }}>{fmt(s.revenue, locale)} $</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", minWidth: 60, textAlign: "right" }}>{s.orders} {isEn ? "orders" : "cmd."}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ROW 6 — Team activity ── */}
      <div style={{ background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "16px 20px" }}>
        <div className="card-header" style={{ marginBottom: 10 }}>
          <span className="card-title">{t.dash_team_activity}</span>
          <Link href="/team" style={{ fontSize: 12, color: "var(--accent-light)" }}>{t.action_view_all} →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 2 }}>
          {stats.recentLogs.map((log) => (
            <div key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {log.user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.4 }}>
                  <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{log.user.name}</span>{" "}
                  {actionLabels[log.action] ?? log.action}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{relativeTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
          {stats.recentLogs.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", padding: "6px 0" }}>{t.dash_no_activity}</p>
          )}
        </div>
      </div>

    </div>
  );
}

/* ─── KpiCard server component ─── */
function KpiCard({
  icon: Icon, iconBg, iconColor, label, value, sub,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: { text: string; color: string };
}) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "0.5px solid var(--border)", borderRadius: 12,
      padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 14,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 5, whiteSpace: "nowrap" }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: sub.color, marginTop: 5 }}>{sub.text}</p>}
      </div>
    </div>
  );
}
