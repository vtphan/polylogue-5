import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      createdAt: true,
      _count: { select: { classes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const { fullName, username, password } = await req.json();

  if (!fullName || !username || !password) {
    return NextResponse.json(
      { error: "fullName, username, and password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.teacher.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const teacher = await prisma.teacher.create({
    data: {
      fullName,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      createdById: auth.userId,
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      createdAt: true,
    },
  });

  return NextResponse.json(teacher, { status: 201 });
}
