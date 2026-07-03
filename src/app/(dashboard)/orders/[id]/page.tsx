import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "@/components/orders/order-detail-client";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, employees, settings] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.order.findUnique as any)({
      where: { id: params.id },
      include: {
        store: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: { name: true, supplier: true, supplierSku: true, price: true, cost: true },
            },
          },
        },
        trackingEvents: { orderBy: { occurredAt: "desc" } },
      },
    }) as ReturnType<typeof prisma.order.findUnique>,
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.appSettings.findFirst as any)({ select: { seventeenTrackKey: true } }) as Promise<{ seventeenTrackKey?: string | null } | null>,
  ]);

  if (!order) notFound();

  const [relatedOrders, statusHistory] = await Promise.all([
    prisma.order.findMany({
      where: { customerEmail: order.customerEmail, id: { not: params.id } },
      select: { id: true, orderNumber: true, status: true, totalAmount: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).orderStatusHistory.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }) as Promise<{ id: string; fromStatus: string | null; toStatus: string; userId: string | null; note: string | null; createdAt: Date; user?: { name: string } | null }[]>,
  ]);

  return (
    <OrderDetailClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order={order as any}
      employees={employees}
      notes={[]}
      trackingEnabled={!!settings?.seventeenTrackKey}
      statusHistory={statusHistory.map((h) => ({ ...h, createdAt: h.createdAt }))}
      relatedOrders={relatedOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
    />
  );
}
