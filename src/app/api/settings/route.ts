import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.appSettings.findFirst();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const existing = await prisma.appSettings.findFirst();

  const data = {
    companyName: body.companyName,
    defaultLanguage: body.defaultLanguage,
    resendApiKey: body.resendApiKey || null,
    fromEmail: body.fromEmail || null,
    stripeSecretKey: body.stripeSecretKey || null,
    seventeenTrackKey: body.seventeenTrackKey || null,
  };

  const settings = existing
    ? await prisma.appSettings.update({ where: { id: existing.id }, data })
    : await prisma.appSettings.create({ data });

  return NextResponse.json(settings);
}
