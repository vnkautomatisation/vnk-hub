export default function TrackOrderPage({
  params,
}: {
  params: { storeSlug: string; orderNumber: string };
}) {
  return (
    <div>
      Suivi commande {params.orderNumber} — {params.storeSlug}
    </div>
  );
}
