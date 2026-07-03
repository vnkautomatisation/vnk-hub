import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.orderNote.findMany({
    where: { orderId: params.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await prisma.orderNote.create({
    data: {
      orderId: params.id,
      userId: (session.user as { id: string }).id,
      content,
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
