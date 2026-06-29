import { prisma } from "@/lib/prisma";
import { SupplierSearchClient } from "@/components/products/supplier-search-client";

export default async function ProductsSearchPage() {
  const stores = await prisma.store.findMany({ select: { id: true, name: true } });

  return (
    <div className="space-y-4">
      <h1 className="text-[22px] font-medium tracking-[-0.3px]" style={{ color: "var(--text-1)" }}>
        Recherche produits fournisseurs
      </h1>
      <SupplierSearchClient stores={stores} />
    </div>
  );
}
