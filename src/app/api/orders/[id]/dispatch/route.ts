import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const order = await prisma.order.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Order must be CONFIRMED to dispatch" }, { status: 409 });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: "DISPATCHED_TO_SUPPLIER", dispatchedAt: new Date() },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).orderStatusHistory.create({
      data: { orderId: params.id, fromStatus: "CONFIRMED", toStatus: "DISPATCHED_TO_SUPPLIER", userId },
    });
  } catch {}

  try {
    await prisma.activityLog.create({
      data: { userId, action: "order_updated", details: { orderId: params.id, change: "dispatched" } },
    });
  } catch {}

  return NextResponse.json(updated);
}
