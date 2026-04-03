import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Submit group consensus (one member submits per passage per phase)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;
  const body = await req.json();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, status: "active" },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not active" },
      { status: 400 }
    );
  }

  // Find student's group
  const membership = await prisma.sessionGroupMembership.findFirst({
    where: {
      studentId: auth.userId,
      sessionGroup: { sessionId },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not in this session" },
      { status: 403 }
    );
  }

  // Check if consensus already exists for this passage+phase
  const existing = await prisma.groupConsensus.findFirst({
    where: {
      sessionId,
      sessionGroupId: membership.sessionGroupId,
      passageId: body.passageId,
      phase: body.phase,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Consensus already submitted for this passage and phase" },
      { status: 409 }
    );
  }

  const consensus = await prisma.groupConsensus.create({
    data: {
      sessionId,
      sessionGroupId: membership.sessionGroupId,
      passageId: body.passageId,
      phase: body.phase,
      position: body.position,
      rationale: body.rationale,
      submittedBy: auth.userId,
    },
  });

  return NextResponse.json(consensus, { status: 201 });
}

// Get consensus for student's group
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;

  const membership = await prisma.sessionGroupMembership.findFirst({
    where: {
      studentId: auth.userId,
      sessionGroup: { sessionId },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not in this session" },
      { status: 403 }
    );
  }

  const consensus = await prisma.groupConsensus.findMany({
    where: {
      sessionId,
      sessionGroupId: membership.sessionGroupId,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(consensus);
}
