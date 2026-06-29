import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderEmail } from "@/lib/resend";
import { orderStatusLabels } from "@/lib/order-status";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sendOrderEmail(
    order.customerEmail,
    `Mise à jour de votre commande ${order.orderNumber}`,
    `<p>Bonjour ${order.customerName},</p><p>Statut de votre commande: ${orderStatusLabels[order.status]}.</p>`
  );

  return NextResponse.json({ sent: true });
}
