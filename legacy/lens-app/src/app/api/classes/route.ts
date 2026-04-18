import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const classes = await prisma.class.findMany({
    where: { teacherId: auth.userId },
    include: {
      _count: { select: { enrollments: true, sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { name, section } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Class name is required" },
      { status: 400 }
    );
  }

  const newClass = await prisma.class.create({
    data: {
      name,
      section: section || null,
      teacherId: auth.userId,
    },
  });

  return NextResponse.json(newClass, { status: 201 });
}
