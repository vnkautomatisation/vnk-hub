import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  shouldAutoAdvance, tagToOrderStatus, tagToNote,
  TRACK_TAGS, type SeventeenTrackWebhookPayload,
} from "@/lib/seventeen-track";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await (prisma.appSettings.findFirst as any)({
    select: { trackingWebhookSecret: true },
  }) as { trackingWebhookSecret?: string | null } | null;

  if (!settings?.trackingWebhookSecret || settings.trackingWebhookSecret !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SeventeenTrackWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(payload) ? payload : [payload];

  for (const item of items) {
    if (!item?.data?.number) continue;

    const trackingNumber = item.data.number;
    const tag            = item.data.tag ?? -1;
    const latestEvent    = item.data.track_info?.latest_event;
    const carrierName    = item.data.track_info?.tracking?.providers?.[0]?.provider?.name ?? null;

    const order = await prisma.order.findFirst({
      where: { trackingNumber },
      select: { id: true, status: true },
    });
    if (!order) continue;
    if (order.status === "CANCELLED" || order.status === "REFUNDED") continue;

    const tagInfo   = TRACK_TAGS[tag];
    const eventTime = latestEvent?.time_utc ? new Date(latestEvent.time_utc) : new Date();
    const eventDesc = latestEvent?.description ?? tagInfo?.label ?? `Tag ${tag}`;

    const existing = await prisma.trackingEvent.findFirst({
      where: { orderId: order.id, status: eventDesc, occurredAt: eventTime },
    });

    if (!existing) {
      await (prisma.trackingEvent.create as any)({
        data: { orderId: order.id, status: eventDesc, location: latestEvent?.location ?? null, occurredAt: eventTime, tag, source: "17track" },
      });
    }

    if (carrierName) {
      await (prisma.order.update as any)({
        where: { id: order.id },
        data: { trackingCarrier: carrierName },
      }).catch(() => {});
    }

    if (shouldAutoAdvance(order.status, tag)) {
      const newStatus = tagToOrderStatus(tag)!;
      await prisma.order.update({ where: { id: order.id }, data: { status: newStatus as never } });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: order.status, toStatus: newStatus, note: `Auto-avancé par 17track (tag ${tag})` },
        });
      } catch {}
    }

    // System note for problematic tags — written to orderNotes (null userId = system)
    const note = tagToNote(tag, latestEvent);
    if (note) {
      const today = new Date().toLocaleDateString("fr-CA");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alreadyLogged = await (prisma.orderNote.findFirst as any)({
        where: { orderId: order.id, content: { startsWith: `[${today}]` }, userId: null },
      });
      if (!alreadyLogged) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.orderNote.create as any)({
          data: { orderId: order.id, userId: null, content: `[${today}] ${note}` },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
