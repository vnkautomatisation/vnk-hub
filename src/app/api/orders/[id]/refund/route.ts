import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { amount }: { amount?: number } = await req.json().catch(() => ({}));

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, stripePaymentId: true, totalAmount: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["SHIPPED", "DELIVERED", "IN_TRANSIT"].includes(order.status)) {
    return NextResponse.json(
      { error: `Impossible de rembourser une commande en statut "${order.status}". Elle doit être Expédiée, En transit ou Livrée.` },
      { status: 409 }
    );
  }

  if (amount !== undefined) {
    if (typeof amount !== "number" || amount <= 0 || amount > order.totalAmount) {
      return NextResponse.json(
        { error: `Montant invalide. Doit être entre 0.01 et ${order.totalAmount.toFixed(2)}.` },
        { status: 400 }
      );
    }
  }

  let stripeRefunded = false;

  const settings = await prisma.appSettings.findFirst({ select: { stripeSecretKey: true } });
  if (settings?.stripeSecretKey && order.stripePaymentId) {
    const body = new URLSearchParams({ payment_intent: order.stripePaymentId });
    if (amount) body.set("amount", String(Math.round(amount * 100)));

    const res = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const result = await res.json();
    stripeRefunded = res.ok;

    if (!res.ok) {
      return NextResponse.json(
        { error: result?.error?.message ?? "Échec du remboursement Stripe." },
        { status: 502 }
      );
    }

    try {
      await prisma.activityLog.create({
        data: { userId, action: "order_updated", details: { orderId: params.id, change: "stripe_refund", refundId: result?.id ?? null } },
      });
    } catch {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.order.update as any)({
    where: { id: params.id },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).orderStatusHistory.create({
      data: {
        orderId: params.id,
        fromStatus: order.status,
        toStatus: "REFUNDED",
        userId,
        note: `Remboursement de ${(amount ?? order.totalAmount).toFixed(2)} ${order.status}`,
      },
    });
  } catch {}

  try {
    await prisma.activityLog.create({
      data: { userId, action: "order_refunded", details: { orderId: params.id, amount: amount ?? order.totalAmount } },
    });
  } catch {}

  return NextResponse.json({ refunded: true, stripe: stripeRefunded });
}
