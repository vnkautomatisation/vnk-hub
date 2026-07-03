import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let settings = await (prisma.appSettings.findFirst as any)() as Record<string, unknown> | null;
  if (settings && !settings.trackingWebhookSecret) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings = await (prisma.appSettings.update as any)({
      where: { id: settings.id },
      data: { trackingWebhookSecret: randomBytes(24).toString("hex") },
    });
  }
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma.appSettings.findFirst as any)() as { id: string } | null;

  const data: Record<string, unknown> = {};
  if (body.companyName       !== undefined) data.companyName       = body.companyName;
  if (body.defaultLanguage   !== undefined) data.defaultLanguage   = body.defaultLanguage;
  if (body.resendApiKey      !== undefined) data.resendApiKey      = body.resendApiKey || null;
  if (body.fromEmail         !== undefined) data.fromEmail         = body.fromEmail || null;
  if (body.stripeSecretKey   !== undefined) data.stripeSecretKey   = body.stripeSecretKey || null;
  if (body.seventeenTrackKey !== undefined) data.seventeenTrackKey = body.seventeenTrackKey || null;
  if (body.slaHours          !== undefined) data.slaHours          = Number(body.slaHours) || 48;
  // trackingWebhookSecret is read-only via PATCH

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = await (prisma.appSettings.update as any)({ where: { id: existing.id }, data });
    return NextResponse.json(settings);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings = await (prisma.appSettings.create as any)({
    data: { ...data, trackingWebhookSecret: randomBytes(24).toString("hex") },
  });
  return NextResponse.json(settings);
}

export async function POST() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma.appSettings.findFirst as any)() as { id: string } | null;
  if (!existing) return NextResponse.json({ error: "No settings" }, { status: 404 });
  const newSecret = randomBytes(24).toString("hex");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma.appSettings.update as any)({ where: { id: existing.id }, data: { trackingWebhookSecret: newSecret } });
  return NextResponse.json({ secret: newSecret });
}
