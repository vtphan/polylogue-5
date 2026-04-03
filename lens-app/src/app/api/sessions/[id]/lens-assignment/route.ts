import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Student chooses or gets assigned a lens
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;
  const { lensId } = await req.json();

  if (!["logic", "evidence", "scope"].includes(lensId)) {
    return NextResponse.json(
      { error: "Invalid lens. Must be logic, evidence, or scope." },
      { status: 400 }
    );
  }

  const session = await prisma.session.findFirst({
    where: { id: sessionId, status: "active" },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not active" },
      { status: 400 }
    );
  }

  // Check if already assigned
  const existing = await prisma.lensAssignment.findUnique({
    where: {
      sessionId_studentId: { sessionId, studentId: auth.userId },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Lens already assigned" },
      { status: 409 }
    );
  }

  const assignment = await prisma.lensAssignment.create({
    data: {
      sessionId,
      studentId: auth.userId,
      lensId,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
