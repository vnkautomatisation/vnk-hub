import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: { store: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeId, name, nameFr, description, descriptionFr, price, cost, images, supplier, supplierSku } = body;

  if (!storeId || !name || !price || !cost || !supplier || !supplierSku) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      storeId,
      name,
      nameFr: nameFr || name,
      description: description || "",
      descriptionFr: descriptionFr || "",
      price,
      cost,
      images: images || [],
      supplier,
      supplierSku,
    },
  });

  return NextResponse.json(product);
}
