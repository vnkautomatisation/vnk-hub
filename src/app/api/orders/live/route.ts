import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: { notIn: ["DELIVERED", "CANCELLED", "REFUNDED"] } },
        { status: "DELIVERED", updatedAt: { gte: since24h } },
      ],
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      dispatchedAt: true,
      store: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
