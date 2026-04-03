import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Submit an evaluate response (append-only)
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

  const response = await prisma.evaluateResponse.create({
    data: {
      sessionId,
      studentId: auth.userId,
      passageId: body.passageId,
      step: body.step,
      lensId: body.lensId,
      rating: body.rating || null,
      content: body.content,
      hintUsed: body.hintUsed ?? null,
      redirectTriggered: body.redirectTriggered ?? null,
    },
  });

  return NextResponse.json(response, { status: 201 });
}

// Get student's own evaluate responses
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("student");
  if (auth instanceof NextResponse) return auth;

  const { id: sessionId } = await params;

  const responses = await prisma.evaluateResponse.findMany({
    where: { sessionId, studentId: auth.userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(responses);
}
