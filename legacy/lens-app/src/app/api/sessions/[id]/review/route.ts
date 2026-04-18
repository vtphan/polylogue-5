import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";
import { computeSignals } from "@/lib/signals/behavioral";

// Session review data for teacher post-session analysis
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher", "researcher");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;

  const session = await prisma.session.findFirst({
    where: { id: sessionId },
    include: {
      scenario: true,
      class: true,
      sessionGroups: {
        include: {
          memberships: {
            include: { student: { select: { id: true, fullName: true } } },
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

  // Teachers can only review their own sessions
  if (auth.role === "teacher" && session.createdById !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const evaluateResponses = await prisma.evaluateResponse.findMany({
    where: { sessionId },
    include: { student: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const explainResponses = await prisma.explainResponse.findMany({
    where: { sessionId },
    include: { student: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  });

  const consensus = await prisma.groupConsensus.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  // Extract passage texts from scenario artifacts for transcript reference computation
  let passageTexts: Record<string, string> | undefined;
  try {
    const artifacts = JSON.parse(session.scenario.artifacts);
    const transcript = artifacts.transcript;
    const analysis = artifacts.analysis;
    if (transcript?.turns && analysis?.passage_analyses) {
      const turnTextMap: Record<string, string> = {};
      for (const turn of transcript.turns) {
        turnTextMap[turn.turn_id] = (turn.sentences || [])
          .map((s: { text: string }) => s.text)
          .join(" ");
      }
      passageTexts = {};
      for (const passage of analysis.passage_analyses) {
        passageTexts[passage.passage_id] = (passage.turns || [])
          .map((tid: string) => turnTextMap[tid] || "")
          .join(" ");
      }
    }
  } catch {
    // If artifacts can't be parsed, skip transcript reference — signals still compute
  }

  // Compute behavioral signals per student
  const studentSignals: Record<string, ReturnType<typeof computeSignals>> = {};

  for (const group of session.sessionGroups) {
    for (const membership of group.memberships) {
      studentSignals[membership.student.id] = computeSignals(
        membership.student.id,
        evaluateResponses,
        explainResponses,
        consensus,
        session.thresholdEvaluate,
        session.thresholdExplain,
        group.id,
        passageTexts
      );
    }
  }

  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      className: session.class.name,
      scenarioTopic: session.scenario.topic,
      selectedPassages: session.selectedPassages
        ? JSON.parse(session.selectedPassages)
        : null,
      thresholdEvaluate: session.thresholdEvaluate,
      thresholdExplain: session.thresholdExplain,
    },
    groups: session.sessionGroups.map((g) => ({
      id: g.id,
      label: g.label,
      members: g.memberships.map((m) => ({
        ...m.student,
        lens:
          session.lensAssignments.find((a) => a.studentId === m.student.id)
            ?.lensId || null,
      })),
    })),
    evaluateResponses,
    explainResponses,
    consensus,
    studentSignals,
  });
}
