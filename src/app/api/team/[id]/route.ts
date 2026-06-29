import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.active !== undefined) data.active = body.active;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json(user);
}
