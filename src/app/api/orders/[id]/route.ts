import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { registerTracking } from "@/lib/seventeen-track";

const TERMINAL = new Set(["CANCELLED", "REFUNDED"]);
// Forward-only: transitions must progress along this axis
const FORWARD_FLOW = ["PENDING","CONFIRMED","DISPATCHED_TO_SUPPLIER","SHIPPED","IN_TRANSIT","DELIVERED"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      store: { select: { name: true } },
      assignedTo: { select: { id: true, name: true } },
      items: { include: { product: { select: { name: true, supplier: true, supplierSku: true } } } },
      trackingEvents: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as { id: string }).id;

  let currentStatus: string | null = null;

  if (body.status) {
    const current = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    currentStatus = current.status;

    // Block transitions out of terminal statuses
    if (TERMINAL.has(current.status)) {
      return NextResponse.json(
        { error: `Impossible de modifier une commande ${current.status === "CANCELLED" ? "annulée" : "remboursée"}.` },
        { status: 409 }
      );
    }

    // Block backward transitions in the main flow
    const fromIdx = FORWARD_FLOW.indexOf(current.status);
    const toIdx   = FORWARD_FLOW.indexOf(body.status);
    if (fromIdx !== -1 && toIdx !== -1 && toIdx <= fromIdx) {
      return NextResponse.json(
        { error: `Transition invalide : impossible de repasser de "${current.status}" à "${body.status}".` },
        { status: 409 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (body.status              !== undefined) data.status              = body.status;
  if (body.assignedToId        !== undefined) data.assignedToId        = body.assignedToId || null;
  if (body.notes               !== undefined) data.notes               = body.notes;
  if (body.trackingNumber      !== undefined) data.trackingNumber      = body.trackingNumber || null;
  if (body.trackingUrl         !== undefined) data.trackingUrl         = body.trackingUrl || null;
  if (body.trackingCarrier     !== undefined) data.trackingCarrier     = body.trackingCarrier || null;
  if (body.supplierOrderId     !== undefined) data.supplierOrderId     = body.supplierOrderId || null;
  if (body.cancellationReason  !== undefined) (data as Record<string,unknown>).cancellationReason = body.cancellationReason || null;

  // Auto-set timestamps for key status transitions
  if (body.status === "DISPATCHED_TO_SUPPLIER") data.dispatchedAt = new Date();
  if (body.status === "CANCELLED") {
    (data as Record<string, unknown>).cancelledAt = new Date();
    if (body.cancellationReason) (data as Record<string, unknown>).cancellationReason = body.cancellationReason;
  }

  // Set expected delivery date when shipped (based on slaHours setting)
  if (body.status === "SHIPPED") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = await (prisma.appSettings.findFirst as any)({ select: { slaHours: true } }) as { slaHours?: number } | null;
    const hours = s?.slaHours ?? 48;
    (data as Record<string, unknown>).expectedDeliveryAt = new Date(Date.now() + hours * 3600 * 1000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (prisma.order.update as any)({ where: { id: params.id }, data });

  // Auto-register with 17track when a tracking number is newly set
  if (body.trackingNumber) {
    prisma.appSettings.findFirst({ select: { seventeenTrackKey: true } }).then(async (s) => {
      if (s?.seventeenTrackKey) {
        await registerTracking(s.seventeenTrackKey, body.trackingNumber).catch(() => {});
      }
    }).catch(() => {});
  }

  // Record status history
  if (body.status && currentStatus !== null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).orderStatusHistory.create({
        data: {
          orderId: params.id,
          fromStatus: currentStatus,
          toStatus: body.status,
          userId,
          note: body.notes ?? body.cancellationReason ?? null,
        },
      });
    } catch {}
  }

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: "order_updated",
        details: { orderId: params.id, changes: JSON.parse(JSON.stringify(data)) },
      },
    });
  } catch {}

  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["CANCELLED", "REFUNDED"].includes(order.status)) {
    return NextResponse.json({ error: "Seules les commandes annulées ou remboursées peuvent être supprimées." }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).orderStatusHistory.deleteMany({ where: { orderId: params.id } });
  await prisma.trackingEvent.deleteMany({ where: { orderId: params.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: params.id } });
  await prisma.orderNote.deleteMany({ where: { orderId: params.id } });
  await prisma.order.delete({ where: { id: params.id } });

  try {
    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: "order_deleted",
        details: { orderId: params.id },
      },
    });
  } catch {}

  return NextResponse.json({ deleted: true });
}
