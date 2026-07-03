import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await (prisma as any).customer.findUnique({
    where: { id: params.id },
  });
  if (!customer) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

  const orders = await (prisma.order.findMany as any)({
    where: { customerId: params.id },
    select: {
      id: true, orderNumber: true, status: true, totalAmount: true, currency: true, createdAt: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = (orders as any[]).reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  return NextResponse.json({ ...customer, orders, totalSpent });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, notes } = body;

  const data: Record<string, unknown> = {};
  if (name  !== undefined) data.name  = name?.trim() || undefined;
  if (email !== undefined) data.email = email?.trim().toLowerCase() || undefined;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (address !== undefined) data.address = address;
  if (notes !== undefined) data.notes = notes?.trim() || null;

  const customer = await (prisma as any).customer.update({ where: { id: params.id }, data });

  return NextResponse.json(customer);
}
