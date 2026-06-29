import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StoreHomePage({ params }: { params: { storeSlug: string } }) {
  const store = await prisma.store.findUnique({
    where: { slug: params.storeSlug },
    include: { products: { where: { active: true }, orderBy: { featured: "desc" } } },
  });

  if (!store || !store.active) notFound();

  const featured = store.products.filter((p) => p.featured);
  const others = store.products.filter((p) => !p.featured);

  return (
    <div>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">{store.logoText || store.name}</span>
        <span className="text-sm text-gray-500">{store.slogan}</span>
      </header>

      <section
        className="flex h-64 flex-col items-center justify-center text-white"
        style={{
          backgroundColor: store.primaryColor,
          backgroundImage: store.heroImageUrl ? `url(${store.heroImageUrl})` : undefined,
          backgroundSize: "cover",
        }}
      >
        <h1 className="text-2xl font-semibold">{store.heroTitle || store.name}</h1>
        <p className="mt-2">{store.heroSubtitle || store.niche}</p>
      </section>

      <main className="space-y-8 px-6 py-8">
        {featured.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-medium">Produits vedettes</h2>
            <div className="grid grid-cols-3 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} storeSlug={store.slug} product={p} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-lg font-medium">Tous les produits</h2>
          {others.length === 0 && featured.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun produit disponible</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {others.map((p) => (
                <ProductCard key={p.id} storeSlug={store.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ProductCard({
  storeSlug,
  product,
}: {
  storeSlug: string;
  product: { id: string; nameFr: string; price: number; images: string[] };
}) {
  return (
    <Link href={`/${storeSlug}/products/${product.id}`} className="block rounded border p-4 hover:shadow">
      {product.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.nameFr} className="mb-2 h-40 w-full rounded object-cover" />
      )}
      <p className="font-medium">{product.nameFr}</p>
      <p className="text-sm text-gray-500">{product.price.toFixed(2)} $</p>
    </Link>
  );
}
