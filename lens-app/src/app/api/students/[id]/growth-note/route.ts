import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Create or update a growth note for a student
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: studentId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  // Verify student belongs to one of this teacher's classes
  const enrollment = await prisma.classEnrollment.findFirst({
    where: { studentId, class: { teacherId: auth.userId } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const note = await prisma.growthNote.upsert({
    where: {
      studentId_teacherId: {
        studentId,
        teacherId: auth.userId,
      },
    },
    update: { content: content.trim() },
    create: {
      studentId,
      teacherId: auth.userId,
      content: content.trim(),
    },
  });

  return NextResponse.json(note);
}
