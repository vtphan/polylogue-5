import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      createdAt: true,
      classes: {
        select: {
          id: true,
          name: true,
          sessions: {
            select: { id: true, status: true, createdAt: true },
          },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });

  const result = teachers.map((t) => {
    const allSessions = t.classes.flatMap((c) => c.sessions);
    const totalStudents = t.classes.reduce((sum, c) => sum + c._count.enrollments, 0);
    const lastSession = allSessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      id: t.id,
      fullName: t.fullName,
      username: t.username,
      createdAt: t.createdAt,
      classCount: t.classes.length,
      sessionCount: allSessions.length,
      studentCount: totalStudents,
      lastActivity: lastSession?.createdAt ?? t.createdAt,
    };
  });

  return NextResponse.json(result);
}
