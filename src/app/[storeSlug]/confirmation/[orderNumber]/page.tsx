import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ConfirmationPage({
  params,
}: {
  params: { storeSlug: string; orderNumber: string };
}) {
  const store = await prisma.store.findUnique({ where: { slug: params.storeSlug } });
  if (!store) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: { include: { product: true } } },
  });
  if (!order || order.storeId !== store.id) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Merci, {order.customerName}!</h1>
      <p className="text-gray-600">
        Votre commande <strong>{order.orderNumber}</strong> a été reçue chez {store.name}.
      </p>

      <div className="rounded border p-4 text-left text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.product.nameFr} × {item.quantity}
            </span>
            <span>{item.price.toFixed(2)} $</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-medium">
          <span>Total</span>
          <span>
            {order.totalAmount.toFixed(2)} {order.currency}
          </span>
        </div>
      </div>

      <Link
        href={`/${store.slug}/track/${order.orderNumber}`}
        className="inline-block rounded bg-brand-600 px-4 py-2 text-sm text-white"
      >
        Suivre ma commande
      </Link>
    </div>
  );
}
