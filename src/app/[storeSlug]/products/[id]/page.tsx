export default function StoreProductPage({
  params,
}: {
  params: { storeSlug: string; id: string };
}) {
  return (
    <div>
      Produit {params.id} — {params.storeSlug}
    </div>
  );
}
