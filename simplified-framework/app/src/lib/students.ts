import "server-only";

import { cookies } from "next/headers";
import { prisma } from "./db";
import { ACTIVE_STUDENT_COOKIE, PRACTICE_COMPLETE_COOKIE } from "./student-cookies";

export const REQUIRED_PRACTICE_COUNT = 5;

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

export async function getCompletedPracticeCount(studentId: string): Promise<number> {
  return prisma.practiceAttempt.count({
    where: {
      studentId,
      completedAt: { not: null },
    },
  });
}

export async function hasCompletedAllPractice(studentId: string): Promise<boolean> {
  return (await getCompletedPracticeCount(studentId)) >= REQUIRED_PRACTICE_COUNT;
}

export async function getActiveStudentFromCookies() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get(ACTIVE_STUDENT_COOKIE)?.value ?? "";
  return getStudentById(studentId);
}

export async function writeStudentCookies(studentId: string) {
  const cookieStore = await cookies();
  const practiceComplete = await hasCompletedAllPractice(studentId);

  const commonOptions = {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: false,
  };

  cookieStore.set(ACTIVE_STUDENT_COOKIE, studentId, commonOptions);
  cookieStore.set(
    PRACTICE_COMPLETE_COOKIE,
    practiceComplete ? "true" : "false",
    commonOptions,
  );
}

export async function clearStudentCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_STUDENT_COOKIE);
  cookieStore.delete(PRACTICE_COMPLETE_COOKIE);
}
