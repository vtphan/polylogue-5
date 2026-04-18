import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const {
    classId,
    scenarioId,
    lensAssignmentMode,
    selectedPassages,
    scaffoldingSentenceStarters,
    scaffoldingReferenceLists,
    thresholdEvaluate,
    thresholdExplain,
  } = body;

  if (!classId || !scenarioId) {
    return NextResponse.json(
      { error: "classId and scenarioId are required" },
      { status: 400 }
    );
  }

  // Verify class belongs to teacher
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.userId },
  });
  if (!classRecord) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Generate a unique join code
  let joinCode = generateJoinCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.session.findFirst({
      where: { joinCode },
    });
    if (!existing) break;
    joinCode = generateJoinCode();
    attempts++;
  }

  // Create session as draft
  const session = await prisma.session.create({
    data: {
      classId,
      scenarioId,
      createdById: auth.userId,
      joinCode,
      lensAssignmentMode: lensAssignmentMode || "assign",
      selectedPassages: selectedPassages
        ? JSON.stringify(selectedPassages)
        : null,
      scaffoldingSentenceStarters: scaffoldingSentenceStarters ?? true,
      scaffoldingReferenceLists: scaffoldingReferenceLists ?? true,
      thresholdEvaluate: thresholdEvaluate ?? null,
      thresholdExplain: thresholdExplain ?? null,
    },
  });

  // Copy class groups into session groups
  const classGroups = await prisma.group.findMany({
    where: { classId },
    include: { memberships: true },
  });

  for (const group of classGroups) {
    const sessionGroup = await prisma.sessionGroup.create({
      data: {
        sessionId: session.id,
        label: group.label,
      },
    });

    for (const membership of group.memberships) {
      await prisma.sessionGroupMembership.create({
        data: {
          sessionGroupId: sessionGroup.id,
          studentId: membership.studentId,
        },
      });
    }
  }

  return NextResponse.json(session, { status: 201 });
}
