import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Create researcher
  const researcher = await prisma.researcher.upsert({
    where: { username: "researcher" },
    update: {},
    create: {
      username: "researcher",
      passwordHash: hash("researcher123"),
    },
  });
  console.log("Researcher:", researcher.username);

  // Create teacher
  const teacher = await prisma.teacher.upsert({
    where: { username: "teacher" },
    update: {},
    create: {
      fullName: "Ms. Rivera",
      username: "teacher",
      passwordHash: hash("teacher123"),
      createdById: researcher.id,
    },
  });
  console.log("Teacher:", teacher.username);

  // Create students
  const studentNames = [
    "Alex Chen",
    "Jordan Kim",
    "Sam Patel",
    "Riley Garcia",
    "Morgan Lee",
    "Casey Thompson",
  ];

  const students = [];
  for (const name of studentNames) {
    const student = await prisma.student.upsert({
      where: { id: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        fullName: name,
        createdByRole: "teacher",
        createdById: teacher.id,
      },
    });
    students.push(student);
  }
  console.log("Students:", students.map((s) => s.fullName).join(", "));

  // Create a class and enroll students
  const existingClass = await prisma.class.findFirst({
    where: { name: "Period 3", teacherId: teacher.id },
  });

  const classRecord = existingClass || await prisma.class.create({
    data: {
      name: "Period 3",
      section: "6A",
      teacherId: teacher.id,
    },
  });

  for (const student of students) {
    await prisma.classEnrollment.upsert({
      where: {
        studentId_classId: {
          studentId: student.id,
          classId: classRecord.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        classId: classRecord.id,
      },
    });
  }
  console.log("Class:", classRecord.name, "with", students.length, "students");

  // Create two groups
  const existingGroups = await prisma.group.findMany({
    where: { classId: classRecord.id },
  });

  if (existingGroups.length === 0) {
    const groupA = await prisma.group.create({
      data: { classId: classRecord.id, label: "Group A" },
    });
    const groupB = await prisma.group.create({
      data: { classId: classRecord.id, label: "Group B" },
    });

    // First 3 students in Group A, last 3 in Group B
    for (let i = 0; i < 3; i++) {
      await prisma.groupMembership.create({
        data: { studentId: students[i].id, groupId: groupA.id },
      });
    }
    for (let i = 3; i < 6; i++) {
      await prisma.groupMembership.create({
        data: { studentId: students[i].id, groupId: groupB.id },
      });
    }
    console.log("Groups: A (3 students), B (3 students)");
  }

  console.log("\nSeed complete. Login credentials:");
  console.log("  Researcher: researcher / researcher123");
  console.log("  Teacher: teacher / teacher123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
