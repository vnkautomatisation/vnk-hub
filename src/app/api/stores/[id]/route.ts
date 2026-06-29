import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    data.domainStatus = body.domain ? "PENDING" : "PENDING";
  }

  const store = await prisma.store.update({ where: { id: params.id }, data });
  return NextResponse.json(store);
}
