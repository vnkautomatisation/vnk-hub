import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getTrackingInfo, shouldAutoAdvance, tagToOrderStatus,
  tagToNote, TRACK_TAGS,
} from "@/lib/seventeen-track";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, trackingNumber: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!order.trackingNumber) return NextResponse.json({ error: "Pas de numéro de tracking sur cette commande." }, { status: 400 });

  if (["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status)) {
    return NextResponse.json({ error: "La commande est déjà dans un statut terminal." }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await (prisma.appSettings.findFirst as any)({ select: { seventeenTrackKey: true } }) as { seventeenTrackKey?: string | null } | null;
  if (!settings?.seventeenTrackKey) {
    return NextResponse.json({ error: "Clé 17track non configurée dans les paramètres." }, { status: 503 });
  }

  const info = await getTrackingInfo(settings.seventeenTrackKey, order.trackingNumber);
  if (!info) return NextResponse.json({ error: "17track n'a pas retourné de données pour ce numéro." }, { status: 502 });

  const tag         = info.tag ?? -1;
  const tagInfo     = TRACK_TAGS[tag];
  const latestEvent = info.track_info?.latest_event;
  const carrierName = info.track_info?.tracking?.providers?.[0]?.provider?.name ?? null;
  const allEvents   = info.track_info?.tracking?.providers?.[0]?.events ?? [];

  let newEventsCount = 0;

  for (const ev of allEvents) {
    const occurredAt = ev.time_utc ? new Date(ev.time_utc) : new Date();
    const status     = ev.description ?? tagInfo?.label ?? `Tag ${tag}`;

    const exists = await prisma.trackingEvent.findFirst({ where: { orderId: order.id, status, occurredAt } });
    if (!exists) {
      await (prisma.trackingEvent.create as any)({
        data: { orderId: order.id, status, location: ev.location ?? null, occurredAt, tag, source: "17track" },
      });
      newEventsCount++;
    }
  }

  const orderUpdate: Record<string, unknown> = {};
  if (carrierName) orderUpdate.trackingCarrier = carrierName;

  let statusAdvanced = false;
  if (shouldAutoAdvance(order.status, tag)) {
    orderUpdate.status    = tagToOrderStatus(tag);
    orderUpdate.updatedAt = new Date();
    statusAdvanced        = true;
  }

  if (Object.keys(orderUpdate).length > 0) {
    await (prisma.order.update as any)({ where: { id: order.id }, data: orderUpdate });
  }

  if (statusAdvanced && orderUpdate.status) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: orderUpdate.status,
          note: `Auto-avancé via actualisation manuelle (tag ${tag})`,
        },
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

  const events = await prisma.trackingEvent.findMany({
    where: { orderId: order.id },
    orderBy: { occurredAt: "desc" },
  });

  return NextResponse.json({
    tag,
    tagLabel: tagInfo?.label ?? `Tag ${tag}`,
    carrier: carrierName,
    newEvents: newEventsCount,
    statusAdvanced,
    newStatus: statusAdvanced ? orderUpdate.status : null,
    events,
  });
}
