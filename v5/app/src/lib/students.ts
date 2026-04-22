import "server-only";

import { cookies } from "next/headers";
import { prisma } from "./db";
import { ACTIVE_STUDENT_COOKIE } from "./student-cookies";

export async function listStudents() {
  return prisma.student.findMany({
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function getStudentById(studentId: string) {
  if (!studentId) {
    return null;
  }

  return prisma.student.findUnique({
    where: { id: studentId },
  });
}

export async function createStudent(name: string) {
  const cleaned = name.trim();
  if (!cleaned) {
    throw new Error("Student name is required");
  }

  return prisma.student.create({
    data: { name: cleaned },
  });
}

export async function getActiveStudentFromCookies() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get(ACTIVE_STUDENT_COOKIE)?.value ?? "";
  return getStudentById(studentId);
}

export async function writeStudentCookies(studentId: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_STUDENT_COOKIE, studentId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
}

export async function clearStudentCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_STUDENT_COOKIE);
}
