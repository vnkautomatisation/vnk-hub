import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.price !== undefined) data.price = body.price;
  if (body.featured !== undefined) data.featured = body.featured;

  const product = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const orderItemCount = await prisma.orderItem.count({ where: { productId: params.id } });
  if (orderItemCount > 0) {
    return NextResponse.json(
      { error: "Ce produit est lié à des commandes existantes et ne peut pas être supprimé." },
      { status: 409 }
    );
  }
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
