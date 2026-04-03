import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const classData = await prisma.class.findFirst({
    where: { id, teacherId: auth.userId },
    include: {
      enrollments: {
        include: {
          student: true,
        },
      },
      groups: {
        include: {
          memberships: {
            include: { student: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      sessions: {
        select: {
          id: true,
          status: true,
          joinCode: true,
          createdAt: true,
          scenario: { select: { topic: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classData) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  return NextResponse.json(classData);
}
