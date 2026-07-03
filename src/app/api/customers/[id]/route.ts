import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type CustomerRow = {
  id: string; name: string; email: string; phone: string | null;
  address: unknown; notes: string | null; createdAt: Date; updatedAt: Date;
};

type OrderRow = {
  id: string; orderNumber: string; status: string;
  totalAmount: number; currency: string; createdAt: Date; storeName: string;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRaw<CustomerRow[]>`
    SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
    FROM "Customer" WHERE id = ${params.id} LIMIT 1`;
  if (!rows.length) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  const customer = rows[0];

  const orders = await prisma.$queryRaw<OrderRow[]>`
    SELECT o.id, o."orderNumber", o.status, o."totalAmount", o.currency, o."createdAt",
           s.name AS "storeName"
    FROM "Order" o
    JOIN "Store" s ON s.id = o."storeId"
    WHERE o."customerId" = ${params.id}
    ORDER BY o."createdAt" DESC`;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return NextResponse.json({
    ...customer,
    orders: orders.map((o) => ({ ...o, store: { name: o.storeName } })),
    totalSpent,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const current = await prisma.$queryRaw<CustomerRow[]>`
    SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
    FROM "Customer" WHERE id = ${params.id} LIMIT 1`;
  if (!current.length) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

  const body = await req.json();
  const c = current[0];
  const newName  = body.name  !== undefined ? (body.name as string).trim()                   : c.name;
  const newEmail = body.email !== undefined ? (body.email as string).trim().toLowerCase()     : c.email;
  const newPhone = body.phone !== undefined ? (body.phone as string | null)?.trim() || null  : c.phone;
  const newAddr  = body.address !== undefined ? body.address                                 : c.address;
  const newNotes = body.notes !== undefined ? (body.notes as string | null)?.trim() || null  : c.notes;
  const addrJson = newAddr ? JSON.stringify(newAddr) : null;
  const now = new Date();

  await prisma.$executeRaw`
    UPDATE "Customer"
    SET name=${newName}, email=${newEmail}, phone=${newPhone},
        address=${addrJson}::jsonb, notes=${newNotes}, "updatedAt"=${now}
    WHERE id=${params.id}`;

  const [customer] = await prisma.$queryRaw<CustomerRow[]>`
    SELECT id, name, email, phone, address, notes, "createdAt", "updatedAt"
    FROM "Customer" WHERE id = ${params.id}`;

  return NextResponse.json(customer);
}
