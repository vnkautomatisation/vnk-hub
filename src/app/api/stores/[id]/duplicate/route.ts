import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const source = await prisma.store.findUnique({
    where: { id: params.id },
    include: { products: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug = `${source.slug}-copy`;
  let suffix = 1;
  while (await prisma.store.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${source.slug}-copy-${suffix}`;
  }

  const duplicate = await prisma.store.create({
    data: {
      name: `${source.name} (copie)`,
      slug,
      niche: source.niche,
      language: source.language,
      primaryColor: source.primaryColor,
      logoText: source.logoText,
      heroTitle: source.heroTitle,
      heroSubtitle: source.heroSubtitle,
      slogan: source.slogan,
      currency: source.currency,
      paymentMethods: source.paymentMethods,
      active: false,
      products: {
        create: source.products.map((p) => ({
          name: p.name,
          nameFr: p.nameFr,
          description: p.description,
          descriptionFr: p.descriptionFr,
          price: p.price,
          cost: p.cost,
          images: p.images,
          supplier: p.supplier,
          supplierSku: p.supplierSku,
          active: p.active,
          featured: p.featured,
        })),
      },
    },
  });

  return NextResponse.json(duplicate);
}
