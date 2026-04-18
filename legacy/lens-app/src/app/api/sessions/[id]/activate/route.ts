import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const session = await prisma.session.findFirst({
    where: { id, createdById: auth.userId },
    include: {
      sessionGroups: {
        include: { memberships: true },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "draft") {
    return NextResponse.json(
      { error: "Can only activate draft sessions" },
      { status: 400 }
    );
  }

  // Validate: every group has at least 2 members
  for (const group of session.sessionGroups) {
    if (group.memberships.length < 2) {
      return NextResponse.json(
        {
          error: `Group "${group.label}" has fewer than 2 members`,
        },
        { status: 400 }
      );
    }
  }

  // Check for ungrouped students
  const allGroupedStudentIds = new Set(
    session.sessionGroups.flatMap((g) => g.memberships.map((m) => m.studentId))
  );

  // Get all enrolled students in the class
  const enrollments = await prisma.classEnrollment.findMany({
    where: { classId: session.classId },
    select: { studentId: true },
  });

  const ungroupedStudents = enrollments.filter(
    (e) => !allGroupedStudentIds.has(e.studentId)
  );

  if (ungroupedStudents.length > 0) {
    return NextResponse.json(
      { error: `${ungroupedStudents.length} student(s) are not in any group` },
      { status: 400 }
    );
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: "active",
      activatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
