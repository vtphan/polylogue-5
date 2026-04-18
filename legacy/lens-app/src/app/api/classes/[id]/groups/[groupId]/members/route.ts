import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Add student to group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId, groupId } = await params;
  const { studentId } = await req.json();

  // Verify group belongs to class and class belongs to teacher
  const group = await prisma.group.findFirst({
    where: { id: groupId, classId, class: { teacherId: auth.userId } },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Remove from any other group in this class first
  const classGroups = await prisma.group.findMany({
    where: { classId },
    select: { id: true },
  });
  await prisma.groupMembership.deleteMany({
    where: {
      studentId,
      groupId: { in: classGroups.map((g) => g.id) },
    },
  });

  // Add to new group
  await prisma.groupMembership.create({
    data: { studentId, groupId },
  });

  return NextResponse.json({ ok: true });
}

// Remove student from group (back to ungrouped)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId, groupId } = await params;
  const { studentId } = await req.json();

  const group = await prisma.group.findFirst({
    where: { id: groupId, classId, class: { teacherId: auth.userId } },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  await prisma.groupMembership.delete({
    where: {
      studentId_groupId: { studentId, groupId },
    },
  });

  return NextResponse.json({ ok: true });
}
