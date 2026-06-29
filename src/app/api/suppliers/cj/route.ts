import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchProducts } from "@/lib/suppliers/cj";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  const products = await searchProducts(query);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { apiKey, apiSecret } = await req.json();

  await prisma.supplierConnection.upsert({
    where: { supplier: "CJ_DROPSHIPPING" },
    update: { apiKey, apiSecret, connected: true, lastSyncAt: new Date(), lastError: null },
    create: { supplier: "CJ_DROPSHIPPING", apiKey, apiSecret, connected: true, lastSyncAt: new Date() },
  });

  return NextResponse.json({ connected: true });
}
