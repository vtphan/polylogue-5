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
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  // Allow submission if session is active, or if closed (student finishing current work)
  // Only reject draft sessions
  if (session.status === "draft") {
    return NextResponse.json(
      { error: "Session not active" },
      { status: 400 }
    );
  }

  // Idempotent write: if clientId provided and already exists, return existing
  if (body.clientId) {
    const existing = await prisma.evaluateResponse.findUnique({
      where: { clientId: body.clientId },
    });
    if (existing) {
      return NextResponse.json(existing, { status: 409 });
    }
  }

  const response = await prisma.evaluateResponse.create({
    data: {
      clientId: body.clientId || null,
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
