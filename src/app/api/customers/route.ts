import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

function genId() { return randomBytes(12).toString("hex"); }

type CustomerRow = {
  id: string; name: string; email: string; phone: string | null;
  address: unknown; notes: string | null; createdAt: Date; updatedAt: Date;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const customers: CustomerRow[] = q
    ? await prisma.$queryRaw`
        SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
        FROM "Customer"
        WHERE name ILIKE ${"%" + q + "%"}
           OR email ILIKE ${"%" + q + "%"}
           OR phone ILIKE ${"%" + q + "%"}
        ORDER BY "createdAt" DESC LIMIT 100`
    : await prisma.$queryRaw`
        SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
        FROM "Customer"
        ORDER BY "createdAt" DESC LIMIT 100`;

  const enriched = await Promise.all(
    customers.map(async (c) => {
      const [counts, totals] = await Promise.all([
        prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM "Order" WHERE "customerId" = ${c.id}`,
        prisma.$queryRaw<[{ sum: number | null }]>`SELECT SUM("totalAmount") as sum FROM "Order" WHERE "customerId" = ${c.id}`,
      ]);
      return { ...c, orderCount: Number(counts[0].count), totalSpent: totals[0].sum ?? 0 };
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

  const cleanEmail = email.trim().toLowerCase();
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Customer" WHERE email = ${cleanEmail} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Un client avec cet email existe déjà." }, { status: 409 });
  }

  const id = genId();
  const now = new Date();
  const addressJson = address ? JSON.stringify(address) : null;

  await prisma.$executeRaw`
    INSERT INTO "Customer" (id, name, email, phone, address, notes, "createdAt", "updatedAt")
    VALUES (${id}, ${name.trim()}, ${cleanEmail}, ${phone?.trim() || null},
            ${addressJson}::jsonb, ${notes?.trim() || null}, ${now}, ${now})`;

  const [customer] = await prisma.$queryRaw<CustomerRow[]>`
    SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
    FROM "Customer" WHERE id = ${id}`;

  return NextResponse.json(customer, { status: 201 });
}
