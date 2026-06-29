import { NextRequest, NextResponse } from "next/server";
import { getTracking } from "@/lib/tracking/seventeen-track";

export async function GET() {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const { trackingNumber } = await req.json();
  if (!trackingNumber) {
    return NextResponse.json({ error: "Missing trackingNumber" }, { status: 400 });
  }

  const result = await getTracking(trackingNumber);
  return NextResponse.json(result);
}
