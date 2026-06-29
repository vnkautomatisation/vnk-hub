import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { prisma } from "@/lib/prisma";
import { StoreCard, CreateStoreCard } from "@/components/stores/store-card";
import { Button } from "@/components/ui/button";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    include: {
      _count: { select: { products: true } },
      orders: { select: { totalAmount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
            Boutiques
          </h1>
          <p className="text-[13px]" style={{ color: "var(--text-2)" }}>
            Gérez vos sites boutiques et leurs configurations
          </p>
        </div>
        <Link href="/stores/builder">
          <Button>
            <IconPlus size={16} />
            Nouvelle boutique
          </Button>
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => {
          const revenue = store.orders.filter((o) => o.status !== "CANCELLED").reduce((sum, o) => sum + o.totalAmount, 0);
          return (
            <li key={store.id}>
              <StoreCard
                store={{
                  id: store.id,
                  name: store.name,
                  slug: store.slug,
                  niche: store.niche,
                  primaryColor: store.primaryColor,
                  domain: store.domain,
                  active: store.active,
                  stripeConnected: store.useMainStripeKey || Boolean(store.stripeKey),
                  productCount: store._count.products,
                  orderCount: store.orders.length,
                  revenue,
                }}
              />
            </li>
          );
        })}
        <li>
          <CreateStoreCard />
        </li>
      </ul>
    </div>
  );
}
