import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const session = await prisma.session.findFirst({
    where: { id, createdById: auth.userId },
    include: {
      scenario: true,
      class: true,
      sessionGroups: {
        include: {
          memberships: {
            include: { student: true },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    scenario: {
      ...session.scenario,
      artifacts: JSON.parse(session.scenario.artifacts),
    },
    selectedPassages: session.selectedPassages
      ? JSON.parse(session.selectedPassages)
      : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();

  const session = await prisma.session.findFirst({
    where: { id, createdById: auth.userId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "draft") {
    return NextResponse.json(
      { error: "Can only edit draft sessions" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (body.lensAssignmentMode !== undefined)
    updateData.lensAssignmentMode = body.lensAssignmentMode;
  if (body.selectedPassages !== undefined)
    updateData.selectedPassages = JSON.stringify(body.selectedPassages);
  if (body.scaffoldingSentenceStarters !== undefined)
    updateData.scaffoldingSentenceStarters = body.scaffoldingSentenceStarters;
  if (body.scaffoldingReferenceLists !== undefined)
    updateData.scaffoldingReferenceLists = body.scaffoldingReferenceLists;
  if (body.thresholdEvaluate !== undefined)
    updateData.thresholdEvaluate = body.thresholdEvaluate;
  if (body.thresholdExplain !== undefined)
    updateData.thresholdExplain = body.thresholdExplain;

  const updated = await prisma.session.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
