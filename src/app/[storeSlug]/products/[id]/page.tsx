import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BuyForm } from "@/components/storefront/buy-form";

export default async function StoreProductPage({
  params,
}: {
  params: { storeSlug: string; id: string };
}) {
  const store = await prisma.store.findUnique({ where: { slug: params.storeSlug } });
  if (!store || !store.active) notFound();

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || product.storeId !== store.id || !product.active) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="grid grid-cols-2 gap-8">
        <div>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.nameFr} className="w-full rounded" />
          ) : (
            <div className="flex h-80 items-center justify-center rounded bg-gray-100 text-gray-400">
              Aucune image
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{product.nameFr}</h1>
          <p className="text-gray-600">{product.descriptionFr}</p>
          <p className="text-2xl font-semibold">
            {product.price.toFixed(2)} {store.currency}
          </p>

          <BuyForm
            storeSlug={store.slug}
            storeId={store.id}
            productId={product.id}
            primaryColor={store.primaryColor}
          />
        </div>
      </div>
    </div>
  );
}
