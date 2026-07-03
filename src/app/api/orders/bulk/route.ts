import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { ids, action, value }: { ids: string[]; action: string; value?: string } = body;

  if (!ids?.length || !action) {
    return NextResponse.json({ error: "Missing ids or action" }, { status: 400 });
  }

  if (action === "status") {
    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status: value as import("@prisma/client").OrderStatus } });
    await prisma.activityLog.createMany({
      data: ids.map((orderId) => ({
        userId,
        action: "order_updated",
        details: { orderId, change: "status", value },
      })),
    });
    return NextResponse.json({ updated: ids.length });
  }

  if (action === "assign") {
    const assignedToId = value === "" ? null : (value ?? null);
    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { assignedToId } });
    return NextResponse.json({ updated: ids.length });
  }

  if (action === "cancel") {
    const eligible = await prisma.order.findMany({
      where: { id: { in: ids }, status: { notIn: ["CANCELLED", "DELIVERED", "REFUNDED"] } },
      select: { id: true },
    });
    const eligibleIds = eligible.map((o) => o.id);
    if (eligibleIds.length) {
      await prisma.order.updateMany({ where: { id: { in: eligibleIds } }, data: { status: "CANCELLED" } });
      await prisma.activityLog.createMany({
        data: eligibleIds.map((orderId) => ({
          userId,
          action: "order_cancelled",
          details: { orderId },
        })),
      });
    }
    return NextResponse.json({ updated: eligibleIds.length });
  }

  if (action === "export") {
    const orders = await prisma.order.findMany({
      where: { id: { in: ids } },
      include: {
        store: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });
    return NextResponse.json(orders);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
