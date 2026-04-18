import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const [teacherCount, classCount, studentCount, sessions] = await Promise.all([
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.session.findMany({
      select: { status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const sessionsByStatus = {
    draft: sessions.filter((s) => s.status === "draft").length,
    active: sessions.filter((s) => s.status === "active").length,
    closed: sessions.filter((s) => s.status === "closed").length,
  };

  // Monthly activity buckets
  const activityByMonth: Record<string, number> = {};
  for (const s of sessions) {
    const month = s.createdAt.toISOString().slice(0, 7); // YYYY-MM
    activityByMonth[month] = (activityByMonth[month] ?? 0) + 1;
  }

  return NextResponse.json({
    teacherCount,
    classCount,
    studentCount,
    sessionCount: sessions.length,
    sessionsByStatus,
    activityByMonth,
  });
}
