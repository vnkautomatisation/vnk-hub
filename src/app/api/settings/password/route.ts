import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  return NextResponse.json({ updated: true });
}
