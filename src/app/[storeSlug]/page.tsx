export default function StoreHomePage({ params }: { params: { storeSlug: string } }) {
  return <div>Boutique {params.storeSlug}</div>;
}
