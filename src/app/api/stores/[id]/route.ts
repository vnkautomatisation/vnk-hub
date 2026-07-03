import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const editableFields = [
  "name",
  "niche",
  "language",
  "domain",
  "active",
  "primaryColor",
  "logoText",
  "logoUrl",
  "heroImageUrl",
  "heroTitle",
  "heroSubtitle",
  "slogan",
  "currency",
  "useMainStripeKey",
  "stripeKey",
  "paymentMethods",
  "emailTemplates",
] as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const store = await prisma.store.findUnique({
    where: { id: params.id },
    include: { products: true },
  });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(store);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  for (const field of editableFields) {
    if (body[field] !== undefined) {
      data[field] = body[field] === "" ? null : body[field];
    }
  }

  if (body.domain !== undefined) {
    data.domainStatus = "PENDING";
  }

  const store = await prisma.store.update({ where: { id: params.id }, data });
  return NextResponse.json(store);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderCount = await prisma.order.count({ where: { storeId: params.id } });
  if (orderCount > 0) {
    return NextResponse.json(
      { error: "Cette boutique contient des commandes et ne peut pas être supprimée. Désactivez-la à la place." },
      { status: 409 }
    );
  }

  const products = await prisma.product.findMany({ where: { storeId: params.id }, select: { id: true } });
  const productIds = products.map((p) => p.id);
  if (productIds.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  }
  await prisma.store.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
