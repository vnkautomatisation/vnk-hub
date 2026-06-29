import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetail } from "@/components/orders/order-detail";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      store: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
      items: { include: { product: { select: { name: true, supplier: true, supplierSku: true } } } },
      trackingEvents: { orderBy: { occurredAt: "desc" } },
    },
  });

  if (!order) notFound();

  const employees = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  return <OrderDetail order={order} employees={employees} />;
}
