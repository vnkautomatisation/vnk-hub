import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { orderStatusLabels } from "@/lib/order-status";
import { supplierLabels } from "@/lib/suppliers";
import { relativeTime } from "@/lib/relative-time";
import { IconCash, IconShoppingCart, IconWorld, IconUserCheck } from "@tabler/icons-react";
import type { OrderStatus } from "@prisma/client";

const activeOrderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "DISPATCHED_TO_SUPPLIER", "SHIPPED", "IN_TRANSIT"];

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getStats(periodDays: number) {
  const today = startOfDay(0);
  const yesterday = startOfDay(1);

  const [
    revenueToday,
    revenueYesterday,
    activeOrders,
    newOrdersToday,
    activeStores,
    totalStores,
    activeAgents,
    recentOrders,
    connections,
    recentLogs,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { status: { in: activeOrderStatuses } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.store.count({ where: { active: true } }),
    prisma.store.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true } } },
    }),
    prisma.supplierConnection.findMany(),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const revenueDays = await Promise.all(
    Array.from({ length: periodDays }, (_, i) => periodDays - 1 - i).map(async (daysAgo) => {
      const start = startOfDay(daysAgo);
      const end = startOfDay(daysAgo - 1);
      const sum = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      });
      return {
        day: start.toLocaleDateString("fr-CA", periodDays > 14 ? { day: "2-digit", month: "2-digit" } : { weekday: "short" }),
        revenue: sum._sum.totalAmount ?? 0,
      };
    })
  );

  return {
    revenueToday: revenueToday._sum.totalAmount ?? 0,
    revenueYesterday: revenueYesterday._sum.totalAmount ?? 0,
    activeOrders,
    newOrdersToday,
    activeStores,
    totalStores,
    activeAgents,
    recentOrders,
    connections,
    recentLogs,
    revenueDays,
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string } }) {
  const periodDays = parseInt(searchParams.period ?? "7", 10) || 7;
  const stats = await getStats(periodDays);

  const revenueChange =
    stats.revenueYesterday > 0
      ? `${stats.revenueToday >= stats.revenueYesterday ? "↑" : "↓"} ${Math.abs(
          ((stats.revenueToday - stats.revenueYesterday) / stats.revenueYesterday) * 100
        ).toFixed(0)}%`
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={IconCash}
          iconColor="var(--success)"
          iconBg="var(--success-bg)"
          value={`${stats.revenueToday.toFixed(2)} $`}
          label="Revenus du jour"
          change={revenueChange}
        />
        <StatCard
          icon={IconShoppingCart}
          iconColor="var(--info)"
          iconBg="var(--info-bg)"
          value={String(stats.activeOrders)}
          label="Commandes actives"
          change={stats.newOrdersToday > 0 ? `+${stats.newOrdersToday} new` : undefined}
        />
        <StatCard
          icon={IconWorld}
          iconColor="var(--purple)"
          iconBg="var(--purple-bg)"
          value={String(stats.activeStores)}
          label="Boutiques actives"
          change={stats.activeStores === stats.totalStores ? "Toutes actives" : `${stats.totalStores} au total`}
          changeColor="var(--text-2)"
        />
        <StatCard
          icon={IconUserCheck}
          iconColor="var(--warning)"
          iconBg="var(--warning-bg)"
          value={String(stats.activeAgents)}
          label="Agents connectés"
        />
      </div>

      <Card>
        <div className="card-header">
          <span className="card-title">Revenus — {periodDays} derniers jours</span>
          <PeriodSelect value={periodDays} />
        </div>
        <RevenueChart data={stats.revenueDays} />
      </Card>

      <div className="dashboard-bottom-grid">
        <Card>
          <div className="card-header">
            <span className="card-title">Dernières commandes</span>
            <Badge>{stats.activeOrders} actives</Badge>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b-[0.5px] last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2">
                    <Link href={`/orders/${order.id}`} className="td-link">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td style={{ color: "var(--text-1)" }}>{order.customerName}</td>
                  <td style={{ color: "var(--text-2)" }}>{order.store.name}</td>
                  <td style={{ color: "var(--text-1)" }}>
                    {order.totalAmount.toFixed(2)} {order.currency}
                  </td>
                  <td className="text-right">
                    <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center" style={{ color: "var(--text-3)" }}>
                    Aucune commande
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Link href="/orders" className="mt-3 inline-block text-[12px]" style={{ color: "var(--accent-light)" }}>
            Voir toutes les commandes →
          </Link>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="card-header">
              <span className="card-title">Fournisseurs</span>
            </div>
            <ul className="space-y-0">
              {stats.connections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between"
                  style={{ padding: "10px 0", borderBottom: "0.5px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${c.connected ? "connected" : "error"}`} />
                    <span className="text-[13px]" style={{ color: "var(--text-1)" }}>
                      {supplierLabels[c.supplier as keyof typeof supplierLabels] ?? c.supplier}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px]" style={{ color: c.connected ? "var(--success)" : "var(--danger)" }}>
                      {c.connected ? "Connecté" : "Erreur"}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {c.lastSyncAt ? `Sync: ${relativeTime(c.lastSyncAt)}` : "jamais synchronisé"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="card-header">
              <span className="card-title">Activité équipe</span>
            </div>
            <ul className="space-y-0">
              {stats.recentLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-2.5" style={{ padding: "8px 0" }}>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
                    style={{ background: "var(--accent-gradient)" }}
                  >
                    {log.user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
                      {log.user.name} — {log.action}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {relativeTime(log.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
              {stats.recentLogs.length === 0 && (
                <li className="text-[13px]" style={{ color: "var(--text-3)" }}>
                  Aucune activité
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
