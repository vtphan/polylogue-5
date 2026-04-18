import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Teacher manually advances a group past a gate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;
  const { sessionGroupId, gate } = await req.json();

  const session = await prisma.session.findFirst({
    where: { id: sessionId, createdById: auth.userId, status: "active" },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found or not active" },
      { status: 404 }
    );
  }

  // Persist gate override on the session group
  const group = await prisma.sessionGroup.findFirst({
    where: { id: sessionGroupId, sessionId },
  });

  if (!group) {
    return NextResponse.json(
      { error: "Group not found" },
      { status: 404 }
    );
  }

  const existing = group.gateOverrides
    ? JSON.parse(group.gateOverrides)
    : {};
  existing[gate] = true;

  await prisma.sessionGroup.update({
    where: { id: sessionGroupId },
    data: { gateOverrides: JSON.stringify(existing) },
  });

  return NextResponse.json({ ok: true, advanced: { sessionGroupId, gate } });
}

// Students poll this to check if their group has been advanced
export async function GET(
  req: NextRequest,
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
    include: { sessionGroup: true },
  });

  if (!membership) {
    return NextResponse.json({ overrides: {} });
  }

  const overrides = membership.sessionGroup.gateOverrides
    ? JSON.parse(membership.sessionGroup.gateOverrides)
    : {};

  return NextResponse.json({ overrides });
}
