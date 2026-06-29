import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/resend";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, role } = await req.json();
  if (!email || !name || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tempPassword = Math.random().toString(36).slice(-10);
  const hashed = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: { email, name, role, password: hashed },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as { id: string }).id,
      action: "team_member_invited",
      details: { invitedEmail: email, role },
    },
  });

  await sendOrderEmail(
    email,
    "Invitation VNK Hub",
    `<p>Bonjour ${name},</p><p>Vous avez été invité sur VNK Hub. Mot de passe temporaire: ${tempPassword}</p>`
  );

  return NextResponse.json(user);
}
