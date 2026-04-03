import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

// Batch add students to a class
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId } = await params;
  const { names } = await req.json();

  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json(
      { error: "names array is required" },
      { status: 400 }
    );
  }

  // Verify class belongs to teacher
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.userId },
  });
  if (!classRecord) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Get existing students in teacher's classes for dedup
  const teacherStudents = await prisma.student.findMany({
    where: {
      classEnrollments: {
        some: { class: { teacherId: auth.userId } },
      },
    },
  });
  const teacherStudentMap = new Map(
    teacherStudents.map((s) => [s.fullName.toLowerCase(), s])
  );

  // Get all students for global dedup
  const allStudents = await prisma.student.findMany();
  const globalStudentMap = new Map(
    allStudents.map((s) => [s.fullName.toLowerCase(), s])
  );

  const results: {
    name: string;
    status: string;
    studentId: string;
  }[] = [];

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;

    const key = name.toLowerCase();

    // Check teacher's classes first
    let student = teacherStudentMap.get(key);
    let status = "existing_teacher";

    if (!student) {
      // Check globally
      student = globalStudentMap.get(key);
      status = student ? "existing_global" : "created";
    }

    if (!student) {
      // Create new student
      student = await prisma.student.create({
        data: {
          fullName: name,
          createdByRole: "teacher",
          createdById: auth.userId,
        },
      });
    }

    // Enroll in class (upsert to handle existing enrollment)
    await prisma.classEnrollment.upsert({
      where: {
        studentId_classId: {
          studentId: student.id,
          classId,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        classId,
      },
    });

    results.push({ name: student.fullName, status, studentId: student.id });
  }

  return NextResponse.json({ results });
}

// Remove student from class
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("teacher");
  if (auth instanceof NextResponse) return auth;

  const { id: classId } = await params;
  const { studentId } = await req.json();

  // Verify class belongs to teacher
  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: auth.userId },
  });
  if (!classRecord) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  // Remove enrollment
  await prisma.classEnrollment.delete({
    where: {
      studentId_classId: { studentId, classId },
    },
  });

  // Also remove from any groups in this class
  const classGroups = await prisma.group.findMany({
    where: { classId },
    select: { id: true },
  });
  const groupIds = classGroups.map((g) => g.id);

  if (groupIds.length > 0) {
    await prisma.groupMembership.deleteMany({
      where: {
        studentId,
        groupId: { in: groupIds },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
