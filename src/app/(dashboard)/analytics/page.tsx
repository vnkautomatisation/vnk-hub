import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { AnalyticsPeriodSelect } from "@/components/analytics/analytics-period-select";
import { RevenueBarChart } from "@/components/analytics/revenue-bar-chart";
import { StoreDonutChart } from "@/components/analytics/store-donut-chart";
import { IconCash, IconShoppingCart, IconReceipt2, IconPercentage } from "@tabler/icons-react";
import { getT, getLang } from "@/lib/i18n";

function startOfPeriod(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { period?: string } }) {
  const t = getT();
  const lang = getLang();
  const periodDays = parseInt(searchParams.period ?? "30", 10) || 30;
  const since = startOfPeriod(periodDays);

  const [revenueAgg, orderCount, deliveredCount, stores, topProducts] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: since }, status: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { createdAt: { gte: since }, status: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { createdAt: { gte: since }, status: "DELIVERED" } }),
    prisma.store.findMany({
      include: { orders: { where: { createdAt: { gte: since } }, select: { totalAmount: true, status: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueAgg._sum.totalAmount ?? 0;
  const avgBasket = orderCount > 0 ? totalRevenue / orderCount : 0;
  const conversionRate = orderCount > 0 ? (deliveredCount / orderCount) * 100 : 0;

  const storePerf = stores.map((s) => ({
    id: s.id,
    name: s.name,
    revenue: s.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0),
    orderCount: s.orders.length,
  }));

  const chartDays = Math.min(periodDays, 30);
  const locale = lang === "en" ? "en-CA" : "fr-CA";
  const revenueDays = await Promise.all(
    Array.from({ length: chartDays }, (_, i) => chartDays - 1 - i).map(async (daysAgo) => {
      const start = startOfDay(daysAgo);
      const end = startOfDay(daysAgo - 1);
      const sum = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      });
      return {
        day: start.toLocaleDateString(locale, chartDays > 14 ? { day: "2-digit", month: "2-digit" } : { weekday: "short" }),
        revenue: sum._sum.totalAmount ?? 0,
      };
    })
  );

  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
          {t.analytics_title}
        </h1>
        <AnalyticsPeriodSelect value={periodDays} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IconCash} iconColor="var(--success)" iconBg="var(--success-bg)" value={`${totalRevenue.toFixed(2)} $`} label={t.analytics_total_revenue} />
        <StatCard icon={IconShoppingCart} iconColor="var(--info)" iconBg="var(--info-bg)" value={String(orderCount)} label={t.analytics_total_orders} />
        <StatCard icon={IconReceipt2} iconColor="var(--purple)" iconBg="var(--purple-bg)" value={`${avgBasket.toFixed(2)} $`} label={t.analytics_avg_basket} />
        <StatCard icon={IconPercentage} iconColor="var(--warning)" iconBg="var(--warning-bg)" value={`${conversionRate.toFixed(1)}%`} label={t.analytics_conversion} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="card-title mb-3">{t.analytics_revenue_by_day}</h2>
          <RevenueBarChart data={revenueDays} />
        </Card>
        <Card>
          <h2 className="card-title mb-3">{t.analytics_by_store}</h2>
          <StoreDonutChart data={storePerf} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="card-title mb-3">{t.analytics_top_products}</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th>{t.label_product}</th>
                <th>{t.label_qty}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => {
                const product = productMap.get(p.productId);
                return (
                  <tr key={p.productId}>
                    <td>{product ? product.nameFr : t.analytics_deleted_product}</td>
                    <td className="td-muted">{p._sum.quantity}</td>
                  </tr>
                );
              })}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center" style={{ color: "var(--text-3)" }}>
                    {t.analytics_no_sales}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="card-title mb-3">{t.analytics_top_stores}</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th>{t.analytics_store_col}</th>
                <th>{t.analytics_orders_col}</th>
                <th>{t.analytics_revenue_col}</th>
                <th>{t.analytics_margin}</th>
              </tr>
            </thead>
            <tbody>
              {storePerf.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="td-muted">{s.orderCount}</td>
                  <td>{s.revenue.toFixed(2)} $</td>
                  <td style={{ color: "var(--success)" }}>—</td>
                </tr>
              ))}
              {storePerf.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ color: "var(--text-3)" }}>
                    {t.analytics_no_stores}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
