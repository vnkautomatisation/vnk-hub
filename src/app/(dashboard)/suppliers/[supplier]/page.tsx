import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SupplierConnectForm } from "@/components/suppliers/connect-form";
import { SupplierProductSearch } from "@/components/suppliers/product-search";
import { SupplierStatsCard } from "@/components/suppliers/stats-card";
import { RecentOrdersCard } from "@/components/suppliers/recent-orders-card";
import { SupplierInfoCard } from "@/components/suppliers/info-card";
import { supplierSlugs, supplierInfo, supplierLabels, type ConnectableSupplier } from "@/lib/suppliers";
const slugToSupplier: Record<string, ConnectableSupplier> = {
  cj: "CJ_DROPSHIPPING",
  aliexpress: "ALIEXPRESS",
  zendrop: "ZENDROP",
  printful: "PRINTFUL",
};

export default async function SupplierDetailPage({
  params,
}: {
  params: { supplier: string };
}) {
  const supplier = slugToSupplier[params.supplier];
  if (!supplier) notFound();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [connection, stores] = await Promise.all([
    prisma.supplierConnection.findUnique({ where: { supplier } }),
    prisma.store.findMany({ select: { id: true, name: true } }),
  ]);

  const orderWhere = { items: { some: { product: { supplier } } } };

  const [ordersThisMonth, productsImported, deliveredCount, totalOrders, recentOrders] = await Promise.all([
    prisma.order.count({ where: { ...orderWhere, createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { supplier } }),
    prisma.order.count({ where: { ...orderWhere, status: "DELIVERED" } }),
    prisma.order.count({ where: orderWhere }),
    prisma.order.findMany({ where: orderWhere, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const deliverySuccessRate = totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
          Fournisseurs
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
          Gérez vos connexions API et recherchez des produits
        </p>
      </div>

      <div className="flex gap-1" style={{ borderBottom: "0.5px solid var(--border)" }}>
        {(Object.keys(supplierLabels) as ConnectableSupplier[]).map((key) => {
          const isActive = key === supplier;
          return (
            <Link
              key={key}
              href={`/suppliers/${supplierSlugs[key]}`}
              className="px-4 py-2.5 text-[13px] font-medium transition-colors duration-150"
              style={{
                color: isActive ? "var(--accent-light)" : "var(--text-2)",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {supplierLabels[key]}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <SupplierConnectForm slug={params.supplier} label={supplierInfo[supplier].label} connection={connection} />
          <SupplierProductSearch slug={params.supplier} stores={stores} />
        </div>

        <div className="space-y-4 xl:col-span-2">
          <SupplierStatsCard
            ordersThisMonth={ordersThisMonth}
            productsImported={productsImported}
            deliverySuccessRate={deliverySuccessRate}
            lastSyncAt={connection?.lastSyncAt ?? null}
          />
          <RecentOrdersCard orders={recentOrders} />
          <SupplierInfoCard info={supplierInfo[supplier]} />
        </div>
      </div>
    </div>
  );
}
