import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n";
import { ProductsFilterBar } from "@/components/products/products-filter-bar";
import { ProductsPageActions } from "@/components/products/products-page-actions";
import { ProductsView } from "@/components/products/products-view";
import type { Supplier } from "@prisma/client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { storeId?: string; supplier?: string; search?: string };
}) {
  const where: Record<string, unknown> = {};
  if (searchParams.storeId) where.storeId = searchParams.storeId;
  if (searchParams.supplier) where.supplier = searchParams.supplier as Supplier;
  if (searchParams.search) where.nameFr = { contains: searchParams.search, mode: "insensitive" };

  const t = getT();
  const [products, stores, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { store: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.store.findMany({ select: { id: true, name: true } }),
    prisma.product.count(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
            {t.products_title}
          </h1>
          <Badge>{totalCount} {t.products_count}</Badge>
        </div>
        <ProductsPageActions stores={stores} />
      </div>

      <ProductsFilterBar stores={stores} storeId={searchParams.storeId} supplier={searchParams.supplier} search={searchParams.search} />

      <ProductsView products={products} />
    </div>
  );
}
