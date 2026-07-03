import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { customerEmail: true, customerName: true, orderNumber: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let subject = `Mise à jour de votre commande ${order.orderNumber}`;
  let body = "";
  try {
    const data = await req.json();
    if (data.subject) subject = String(data.subject).slice(0, 500);
    if (data.body) body = String(data.body).slice(0, 10000);
  } catch {}

  // Log email attempt in activity
  try {
    await prisma.activityLog.create({
      data: {
        userId: (session.user as { id: string }).id,
        action: "order_email_sent",
        details: { orderId: params.id, to: order.customerEmail, subject },
      },
    });
  } catch {}

  if (process.env.RESEND_API_KEY) {
    try {
      const { sendOrderEmail } = await import("@/lib/resend");
      const htmlBody = body.replace(/\n/g, "<br>").replace(/ {2}/g, "&nbsp;&nbsp;");
      await sendOrderEmail(order.customerEmail, subject, `<p>${htmlBody}</p>`);
      return NextResponse.json({ sent: true });
    } catch {
      return NextResponse.json({ error: "Email service error" }, { status: 500 });
    }
  }

  const mailto = `mailto:${order.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return NextResponse.json({ sent: false, mailto });
}
