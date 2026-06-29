import { prisma } from "@/lib/prisma";
import { StoreBuilderWizard } from "@/components/stores/builder/wizard";

export default async function StoreBuilderPage({ params }: { params: { id?: string[] } }) {
  const storeId = params.id?.[0];

  const store = storeId
    ? await prisma.store.findUnique({
        where: { id: storeId },
        include: { products: { orderBy: { createdAt: "desc" } } },
      })
    : null;

  return <StoreBuilderWizard store={store} />;
}
