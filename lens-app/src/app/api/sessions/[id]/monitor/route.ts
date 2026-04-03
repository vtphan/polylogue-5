import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Teacher monitoring endpoint — returns full session state for dashboard
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId, createdById: auth.userId },
    include: {
      scenario: true,
      class: true,
      sessionGroups: {
        include: {
          memberships: {
            include: {
              student: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { label: "asc" },
      },
      lensAssignments: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get all responses for this session
  const evaluateResponses = await prisma.evaluateResponse.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const explainResponses = await prisma.explainResponse.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const consensus = await prisma.groupConsensus.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  // Compute per-student status
  const studentStatuses: Record<
    string,
    {
      phase: string;
      step: string;
      lastActivity: string | null;
      passagesCompleted: number;
    }
  > = {};

  const allStudentIds = session.sessionGroups.flatMap((g) =>
    g.memberships.map((m) => m.student.id)
  );

  for (const studentId of allStudentIds) {
    const evalIndiv = evaluateResponses.filter(
      (r) => r.studentId === studentId && r.step === "individual"
    );
    const evalPeer = evaluateResponses.filter(
      (r) => r.studentId === studentId && r.step === "peer"
    );
    const evalAI = evaluateResponses.filter(
      (r) => r.studentId === studentId && r.step === "ai"
    );
    const explIndiv = explainResponses.filter(
      (r) => r.studentId === studentId && r.step === "individual"
    );
    const explPeer = explainResponses.filter(
      (r) => r.studentId === studentId && r.step === "peer"
    );
    const explAI = explainResponses.filter(
      (r) => r.studentId === studentId && r.step === "ai"
    );

    const hasLens = session.lensAssignments.some(
      (a) => a.studentId === studentId
    );

    // Determine phase and step
    let phase = "not_started";
    let step = "not_started";
    let passagesCompleted = 0;

    if (explAI.length > 0) {
      phase = "explain";
      step = "ai";
      passagesCompleted = new Set(explIndiv.map((r) => r.passageId)).size;
    } else if (explPeer.length > 0) {
      phase = "explain";
      step = "peer";
      passagesCompleted = new Set(explIndiv.map((r) => r.passageId)).size;
    } else if (explIndiv.length > 0) {
      phase = "explain";
      step = "individual";
      passagesCompleted = new Set(explIndiv.map((r) => r.passageId)).size;
    } else if (evalAI.length > 0) {
      phase = "evaluate";
      step = "ai";
      passagesCompleted = new Set(evalIndiv.map((r) => r.passageId)).size;
    } else if (evalPeer.length > 0) {
      phase = "evaluate";
      step = "peer";
      passagesCompleted = new Set(evalIndiv.map((r) => r.passageId)).size;
    } else if (evalIndiv.length > 0) {
      phase = "evaluate";
      step = "individual";
      passagesCompleted = new Set(evalIndiv.map((r) => r.passageId)).size;
    } else if (hasLens) {
      phase = "evaluate";
      step = "starting";
    }

    // Check for consensus participation
    const studentGroup = session.sessionGroups.find((g) =>
      g.memberships.some((m) => m.student.id === studentId)
    );
    const groupConsensusEval = consensus.filter(
      (c) =>
        c.sessionGroupId === studentGroup?.id && c.phase === "evaluate"
    );
    const groupConsensusExpl = consensus.filter(
      (c) =>
        c.sessionGroupId === studentGroup?.id && c.phase === "explain"
    );

    if (groupConsensusExpl.length > 0) {
      phase = "explain";
      step = "consensus";
    } else if (groupConsensusEval.length > 0 && explIndiv.length === 0) {
      phase = "evaluate";
      step = "consensus";
    }

    // Last activity
    const allTimestamps = [
      ...evaluateResponses
        .filter((r) => r.studentId === studentId)
        .map((r) => r.createdAt),
      ...explainResponses
        .filter((r) => r.studentId === studentId)
        .map((r) => r.createdAt),
    ];
    const lastActivity =
      allTimestamps.length > 0
        ? allTimestamps.sort().reverse()[0]
        : null;

    studentStatuses[studentId] = {
      phase,
      step,
      lastActivity: lastActivity ? String(lastActivity) : null,
      passagesCompleted,
    };
  }

  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      joinCode: session.joinCode,
      classId: session.classId,
      className: session.class.name,
      scenarioTopic: session.scenario.topic,
      selectedPassages: session.selectedPassages
        ? JSON.parse(session.selectedPassages)
        : null,
    },
    artifacts: JSON.parse(session.scenario.artifacts),
    groups: session.sessionGroups.map((g) => ({
      id: g.id,
      label: g.label,
      gateOverrides: g.gateOverrides
        ? JSON.parse(g.gateOverrides)
        : {},
      members: g.memberships.map((m) => ({
        ...m.student,
        lens:
          session.lensAssignments.find((a) => a.studentId === m.student.id)
            ?.lensId || null,
        status: studentStatuses[m.student.id],
      })),
    })),
    evaluateResponses,
    explainResponses,
    consensus,
  });
}
