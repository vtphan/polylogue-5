import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Get peer responses for the student's group (progressive reveal — only peers who are ready)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;
  const phase = req.nextUrl.searchParams.get("phase") || "evaluate";

  // Find student's session group
  const membership = await prisma.sessionGroupMembership.findFirst({
    where: {
      studentId: auth.userId,
      sessionGroup: { sessionId },
    },
    include: {
      sessionGroup: {
        include: {
          memberships: {
            include: { student: { select: { id: true, fullName: true } } },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not in this session" },
      { status: 403 }
    );
  }

  const groupMembers = membership.sessionGroup.memberships.map(
    (m) => m.student
  );
  const peerIds = groupMembers
    .filter((m) => m.id !== auth.userId)
    .map((m) => m.id);

  if (phase === "evaluate") {
    // Get all evaluate responses from peers (only those who have submitted at least one peer-step response = they clicked "ready")
    const peerResponses = await prisma.evaluateResponse.findMany({
      where: {
        sessionId,
        studentId: { in: peerIds },
      },
      include: {
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      members: groupMembers,
      responses: peerResponses,
    });
  } else {
    const peerResponses = await prisma.explainResponse.findMany({
      where: {
        sessionId,
        studentId: { in: peerIds },
      },
      include: {
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      members: groupMembers,
      responses: peerResponses,
    });
  }
}
