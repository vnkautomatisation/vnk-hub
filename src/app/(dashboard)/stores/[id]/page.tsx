import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StoreSettingsForm } from "@/components/stores/store-settings-form";
import { Card } from "@/components/ui/card";

export default async function StoreConfigPage({ params }: { params: { id: string } }) {
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: { _count: { select: { products: true, orders: true } } },
  });

  if (!store) notFound();

  const [revenue, deliveredCount] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { storeId: store.id, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { storeId: store.id, status: "DELIVERED" } }),
  ]);

  const conversionRate =
    store._count.orders > 0 ? ((deliveredCount / store._count.orders) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
          {store.name}
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
          /{store.slug}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Revenus
          </p>
          <p className="text-[20px] font-medium" style={{ color: "var(--text-1)" }}>
            {(revenue._sum.totalAmount ?? 0).toFixed(2)} $
          </p>
        </Card>
        <Card>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Commandes
          </p>
          <p className="text-[20px] font-medium" style={{ color: "var(--text-1)" }}>
            {store._count.orders}
          </p>
        </Card>
        <Card>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Produits
          </p>
          <p className="text-[20px] font-medium" style={{ color: "var(--text-1)" }}>
            {store._count.products}
          </p>
        </Card>
        <Card>
          <p className="text-[12px]" style={{ color: "var(--text-2)" }}>
            Taux de conversion
          </p>
          <p className="text-[20px] font-medium" style={{ color: "var(--text-1)" }}>
            {conversionRate}%
          </p>
        </Card>
      </div>

      <StoreSettingsForm
        storeId={store.id}
        initialDomain={store.domain ?? ""}
        initialStripeKey={store.stripeKey ?? ""}
      />
    </div>
  );
}
