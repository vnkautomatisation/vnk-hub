import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(orders);
}

// Public checkout endpoint used by storefront pages — mock payment, no real Stripe charge yet.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, productId, quantity, customerName, customerEmail, customerPhone, shippingAddress } = body;

  if (!storeId || !productId || !quantity || !customerName || !customerEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.storeId !== storeId) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) return NextResponse.json({ error: "Invalid store" }, { status: 400 });

  const orderNumber = `${store.slug.slice(0, 4).toUpperCase()}-${Date.now()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      storeId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      shippingAddress: shippingAddress || {},
      totalAmount: product.price * quantity,
      currency: store.currency,
      items: {
        create: [{ productId, quantity, price: product.price }],
      },
    },
  });

  return NextResponse.json(order);
}
