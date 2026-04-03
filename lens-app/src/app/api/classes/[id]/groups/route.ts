import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Create a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId } = await params;
  const { label } = await req.json();

  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.userId },
  });
  if (!classRecord) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const group = await prisma.group.create({
    data: { classId, label: label || "New Group" },
    include: { memberships: { include: { student: true } } },
  });

  return NextResponse.json(group, { status: 201 });
}
