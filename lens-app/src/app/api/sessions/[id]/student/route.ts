import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Get session data for a student (entry point for session experience)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, status: { in: ["active", "closed"] } },
    include: {
      scenario: true,
      sessionGroups: {
        include: {
          memberships: {
            include: { student: { select: { id: true, fullName: true } } },
          },
        },
      },
      lensAssignments: {
        where: { studentId: auth.userId },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found or not active" },
      { status: 404 }
    );
  }

  // Find student's group
  const studentGroup = session.sessionGroups.find((g) =>
    g.memberships.some((m) => m.student.id === auth.userId)
  );

  if (!studentGroup) {
    return NextResponse.json(
      { error: "Student not in this session" },
      { status: 403 }
    );
  }

  const artifacts = JSON.parse(session.scenario.artifacts);
  const lensAssignment = session.lensAssignments[0] || null;

  // Get student's existing responses to determine progress
  const evaluateResponses = await prisma.evaluateResponse.findMany({
    where: { sessionId, studentId: auth.userId },
    orderBy: { createdAt: "asc" },
  });

  const explainResponses = await prisma.explainResponse.findMany({
    where: { sessionId, studentId: auth.userId },
    orderBy: { createdAt: "asc" },
  });

  // Get consensus for student's group
  const consensus = await prisma.groupConsensus.findMany({
    where: { sessionId, sessionGroupId: studentGroup.id },
  });

  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      lensAssignmentMode: session.lensAssignmentMode,
      selectedPassages: session.selectedPassages
        ? JSON.parse(session.selectedPassages)
        : null,
      scaffoldingSentenceStarters: session.scaffoldingSentenceStarters,
      scaffoldingReferenceLists: session.scaffoldingReferenceLists,
      thresholdEvaluate: session.thresholdEvaluate,
      thresholdExplain: session.thresholdExplain,
    },
    scenario: {
      topic: session.scenario.topic,
      artifacts,
    },
    group: {
      id: studentGroup.id,
      label: studentGroup.label,
      members: studentGroup.memberships.map((m) => m.student),
    },
    lensAssignment: lensAssignment
      ? { lensId: lensAssignment.lensId }
      : null,
    evaluateResponses,
    explainResponses,
    consensus,
  });
}
