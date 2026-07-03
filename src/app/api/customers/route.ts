import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const where = q
    ? {
        OR: [
          { name:  { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const customers = await (prisma as any).customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
    take: 100,
  });

  // Compute total spent per customer
  const enriched = await Promise.all(
    customers.map(async (c: any) => {
      const agg = await (prisma.order.aggregate as any)({
        where: { customerId: c.id },
        _sum: { totalAmount: true },
      });
      return { ...c, totalSpent: agg._sum?.totalAmount ?? 0, orderCount: c._count.orders };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, notes } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nom et email requis." }, { status: 400 });
  }

  const existing = await (prisma as any).customer.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Un client avec cet email existe déjà." }, { status: 409 });

  const customer = await (prisma as any).customer.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      address: address ?? null,
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
