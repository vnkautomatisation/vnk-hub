import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { orderStatusLabels } from "@/lib/order-status";
import { TrackLookupForm } from "@/components/storefront/track-lookup-form";

export default async function TrackOrderPage({
  params,
}: {
  params: { storeSlug: string; orderNumber: string };
}) {
  const store = await prisma.store.findUnique({ where: { slug: params.storeSlug } });
  if (!store) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { trackingEvents: { orderBy: { occurredAt: "desc" } } },
  });

  if (!order || order.storeId !== store.id) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold">Commande introuvable</h1>
        <p className="text-sm text-gray-500">
          Aucune commande {params.orderNumber} trouvée pour {store.name}.
        </p>
        <TrackLookupForm storeSlug={store.slug} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-6 py-12">
      <h1 className="text-xl font-semibold">Suivi de commande</h1>
      <TrackLookupForm storeSlug={store.slug} />

      <div className="rounded border p-4">
        <p className="font-medium">{order.orderNumber}</p>
        <p className="text-sm text-gray-500">Statut: {orderStatusLabels[order.status]}</p>
        {order.trackingNumber && <p className="text-sm text-gray-500">Numéro de suivi: {order.trackingNumber}</p>}

        {order.trackingEvents.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {order.trackingEvents.map((event) => (
              <li key={event.id} className="text-gray-600">
                {new Date(event.occurredAt).toLocaleString("fr-CA")} — {event.status}
                {event.location ? ` (${event.location})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
