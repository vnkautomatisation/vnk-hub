import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stores = await prisma.store.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(stores);
}

export async function POST(req: NextRequest) {
  const { name, slug, niche, domain, language } = await req.json();

  if (!name || !slug || !niche) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const store = await prisma.store.create({
    data: {
      name,
      slug,
      niche,
      domain: domain || null,
      language: language || "FR",
    },
  });

  return NextResponse.json(store);
}
