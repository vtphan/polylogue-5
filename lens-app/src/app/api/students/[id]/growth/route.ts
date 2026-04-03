import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Growth tracking across sessions for a student
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher", "researcher", "student");
  if (auth instanceof NextResponse) return auth;

  const { id: studentId } = await params;

  // Students can only view their own growth
  if (auth.role === "student" && auth.userId !== studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all sessions this student participated in
  const memberships = await prisma.sessionGroupMembership.findMany({
    where: { studentId },
    include: {
      sessionGroup: {
        include: {
          session: {
            include: {
              scenario: { select: { topic: true } },
            },
          },
        },
      },
    },
  });

  const sessionIds = memberships.map((m) => m.sessionGroup.session.id);

  // Get lens assignments
  const lensAssignments = await prisma.lensAssignment.findMany({
    where: { studentId, sessionId: { in: sessionIds } },
  });

  // Get all responses across sessions
  const evaluateResponses = await prisma.evaluateResponse.findMany({
    where: { studentId, sessionId: { in: sessionIds } },
    orderBy: { createdAt: "asc" },
  });

  const explainResponses = await prisma.explainResponse.findMany({
    where: { studentId, sessionId: { in: sessionIds } },
    orderBy: { createdAt: "asc" },
  });

  const consensus = await prisma.groupConsensus.findMany({
    where: {
      sessionId: { in: sessionIds },
      sessionGroupId: {
        in: memberships.map((m) => m.sessionGroupId),
      },
    },
  });

  // Get growth note
  const growthNote = await prisma.growthNote.findFirst({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
  });

  // Compute per-session growth data
  const sessions = memberships.map((m) => {
    const session = m.sessionGroup.session;
    const lens = lensAssignments.find((a) => a.sessionId === session.id);
    const sessionEval = evaluateResponses.filter(
      (r) => r.sessionId === session.id
    );
    const sessionExpl = explainResponses.filter(
      (r) => r.sessionId === session.id
    );
    const sessionConsensus = consensus.filter(
      (c) => c.sessionId === session.id
    );

    const evalIndividual = sessionEval.filter((r) => r.step === "individual");
    const evalPassages = new Set(evalIndividual.map((r) => r.passageId));
    const peerAdditions =
      sessionEval.filter((r) => r.step === "peer").length +
      sessionExpl.filter((r) => r.step === "peer").length;
    const avgWordCount =
      evalIndividual.length > 0
        ? Math.round(
            evalIndividual.reduce(
              (sum, r) =>
                sum + r.content.split(/\s+/).filter(Boolean).length,
              0
            ) / evalIndividual.length
          )
        : 0;
    const hintCount =
      sessionEval.filter((r) => r.hintUsed === true).length +
      sessionExpl.filter((r) => r.hintUsed === true).length;
    const redirectCount = sessionEval.filter(
      (r) => r.redirectTriggered === true
    ).length;

    return {
      sessionId: session.id,
      topic: session.scenario.topic,
      createdAt: session.createdAt,
      lensId: lens?.lensId || null,
      passagesEvaluated: evalPassages.size,
      passagesExplained: new Set(
        sessionExpl
          .filter((r) => r.step === "individual")
          .map((r) => r.passageId)
      ).size,
      avgWordCount,
      hintCount,
      redirectCount,
      peerAdditions,
      consensusCompleted: sessionConsensus.length > 0,
    };
  });

  // Perspectival range
  const lensesUsed = new Set(
    lensAssignments.map((a) => a.lensId)
  );

  return NextResponse.json({
    studentId,
    lensesUsed: Array.from(lensesUsed),
    sessions: sessions.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    growthNote: growthNote
      ? { content: growthNote.content, updatedAt: growthNote.updatedAt }
      : null,
  });
}
