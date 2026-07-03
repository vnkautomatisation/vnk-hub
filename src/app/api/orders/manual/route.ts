import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function generateOrderNumber() {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `MAN-${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { storeId, customerName, customerEmail, customerPhone, shippingAddress, totalAmount, currency, notes } = body;

  if (!storeId || !customerName?.trim() || !customerEmail?.trim() || totalAmount == null) {
    return NextResponse.json({ error: "Champs obligatoires manquants (boutique, client, montant)." }, { status: 400 });
  }

  if (typeof totalAmount !== "number" || totalAmount < 0) {
    return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });

  // Unique order number — retry on collision
  let orderNumber = generateOrderNumber();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!exists) break;
    orderNumber = generateOrderNumber();
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      storeId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone?.trim() || null,
      shippingAddress: (shippingAddress as object) ?? {},
      totalAmount: Number(totalAmount),
      currency: currency ?? "CAD",
      notes: notes?.trim() || null,
      status: "PENDING",
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: "order_created",
        details: { orderId: order.id, orderNumber, source: "manual" },
      },
    });
  } catch {}

  return NextResponse.json(order, { status: 201 });
}
