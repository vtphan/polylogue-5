import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const session = await prisma.session.findFirst({
    where: { id, createdById: auth.userId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "closed") {
    return NextResponse.json(
      { error: "Can only reopen closed sessions" },
      { status: 400 }
    );
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      status: "active",
      closedAt: null,
    },
  });

  return NextResponse.json(updated);
}
