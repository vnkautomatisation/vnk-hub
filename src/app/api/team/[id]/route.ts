import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.active !== undefined) data.active = body.active;
  if (body.name !== undefined) data.name = body.name;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = (session.user as { id: string }).id;
  if (me === params.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }

  // Unassign orders before deleting
  await prisma.order.updateMany({ where: { assignedToId: params.id }, data: { assignedToId: null } });
  await prisma.activityLog.deleteMany({ where: { userId: params.id } });
  await prisma.user.delete({ where: { id: params.id } });

  await prisma.activityLog.create({
    data: {
      userId: me,
      action: "team_member_removed",
      details: { removedUserId: params.id },
    },
  });

  return NextResponse.json({ deleted: true });
}
