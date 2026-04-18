import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Rename or delete a group
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId, groupId } = await params;
  const { label } = await req.json();

  const group = await prisma.group.findFirst({
    where: { id: groupId, classId, class: { teacherId: auth.userId } },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { label },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId, groupId } = await params;

  const group = await prisma.group.findFirst({
    where: { id: groupId, classId, class: { teacherId: auth.userId } },
  });
  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Delete memberships first, then group
  await prisma.groupMembership.deleteMany({ where: { groupId } });
  await prisma.group.delete({ where: { id: groupId } });

  return NextResponse.json({ ok: true });
}
