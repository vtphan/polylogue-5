import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Move a student between session groups (draft only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;
  const { studentId, targetGroupId } = await req.json();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, createdById: auth.userId },
  });

  if (!session || session.status !== "draft") {
    return NextResponse.json(
      { error: "Session not found or not in draft" },
      { status: 400 }
    );
  }

  // Remove from all session groups
  const sessionGroups = await prisma.sessionGroup.findMany({
    where: { sessionId },
    select: { id: true },
  });

  await prisma.sessionGroupMembership.deleteMany({
    where: {
      studentId,
      sessionGroupId: { in: sessionGroups.map((g) => g.id) },
    },
  });

  // Add to target group
  if (targetGroupId) {
    await prisma.sessionGroupMembership.create({
      data: { sessionGroupId: targetGroupId, studentId },
    });
  }

  return NextResponse.json({ ok: true });
}
