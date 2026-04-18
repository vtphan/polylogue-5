import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

// Step 1: POST with { joinCode } → returns roster of students for that session
// Step 2: POST with { joinCode, studentId } → logs in as that student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { joinCode, studentId } = body;

  if (!joinCode) {
    return NextResponse.json(
      { error: "Join code is required" },
      { status: 400 }
    );
  }

  // Find the active session with this join code
  const activeSession = await prisma.session.findFirst({
    where: {
      joinCode,
      status: "active",
    },
    include: {
      scenario: { select: { topic: true } },
      sessionGroups: {
        include: {
          memberships: {
            include: {
              student: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });

  if (!activeSession) {
    return NextResponse.json(
      { error: "Invalid or inactive join code" },
      { status: 404 }
    );
  }

  // If no studentId, return the roster for name selection
  if (!studentId) {
    const students = activeSession.sessionGroups.flatMap((g) =>
      g.memberships.map((m) => ({
        id: m.student.id,
        fullName: m.student.fullName,
      }))
    );

    // Sort alphabetically
    students.sort((a, b) => a.fullName.localeCompare(b.fullName));

    return NextResponse.json({
      sessionId: activeSession.id,
      topic: activeSession.scenario.topic,
      students,
    });
  }

  // Verify the student is in this session
  const membership = activeSession.sessionGroups.find((g) =>
    g.memberships.some((m) => m.student.id === studentId)
  );

  if (!membership) {
    return NextResponse.json(
      { error: "Student not found in this session" },
      { status: 404 }
    );
  }

  const student = membership.memberships.find(
    (m) => m.student.id === studentId
  )!.student;

  const session = await getSession();
  session.userId = student.id;
  session.role = "student";
  session.fullName = student.fullName;
  await session.save();

  return NextResponse.json({
    id: student.id,
    role: "student",
    fullName: student.fullName,
    sessionId: activeSession.id,
  });
}
