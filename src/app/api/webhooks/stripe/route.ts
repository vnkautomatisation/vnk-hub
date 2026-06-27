import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Phase 2 — payment_intent.succeeded triggers supplier dispatch
  return NextResponse.json({ received: true });
}
