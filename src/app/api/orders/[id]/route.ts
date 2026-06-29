import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
  if (body.notes !== undefined) data.notes = body.notes;

  const order = await prisma.order.update({ where: { id: params.id }, data });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as { id: string }).id,
      action: "order_updated",
      details: { orderId: params.id, changes: JSON.parse(JSON.stringify(data)) },
    },
  });

  return NextResponse.json(order);
}
