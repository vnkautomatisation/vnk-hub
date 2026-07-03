import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { KanbanBoard } from "@/components/orders/kanban-board";
import { IconArrowLeft } from "@tabler/icons-react";

export default async function OrdersLivePage() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [orders, employees] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { status: { notIn: ["CANCELLED", "REFUNDED", "DELIVERED"] } },
          { status: "DELIVERED", updatedAt: { gte: cutoff } },
        ],
      },
      select: {
        id: true, orderNumber: true, status: true,
        customerName: true, customerEmail: true, totalAmount: true, currency: true,
        createdAt: true, updatedAt: true, trackingNumber: true,
        store: { select: { name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: { take: 1, select: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const serialized = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    dispatchedAt: null as null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/orders" className="btn btn-ghost btn-icon btn-sm">
          <IconArrowLeft size={15} />
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.3px", color: "var(--text-1)" }}>
          Commandes en temps réel
        </h1>
      </div>
      <KanbanBoard initialOrders={serialized} employees={employees} />
    </div>
  );
}
