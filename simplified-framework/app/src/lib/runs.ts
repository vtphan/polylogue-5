import "server-only";

import { prisma } from "@/lib/db";
import type { Run } from "@prisma/client";

export type SessionRun = Run;
export type { Run } from "@prisma/client";

export async function createOrResumeRun(params: {
  studentId: string;
  storyId: string;
  episodeId: string;
}): Promise<Run> {
  const existing = await prisma.run.findUnique({
    where: {
      unique_student_episode_run: {
        studentId: params.studentId,
        storyId: params.storyId,
        episodeId: params.episodeId,
      },
    },
  });

  if (existing) {
    return prisma.run.update({
      where: { runId: existing.runId },
      data: { updatedAt: new Date() },
    });
  }

  return prisma.run.create({
    data: {
      studentId: params.studentId,
      storyId: params.storyId,
      episodeId: params.episodeId,
      currentSceneIndex: 0,
      sceneHighWaterMark: 0,
      starsEarned: 0,
    },
  });
}

export async function getRun(runId: string): Promise<Run | null> {
  return prisma.run.findUnique({ where: { runId } });
}

export async function getRunForStudent(runId: string, studentId: string): Promise<Run | null> {
  return prisma.run.findFirst({
    where: {
      runId,
      studentId,
    },
  });
}

export async function markReadingComplete(runId: string): Promise<Run> {
  const existing = await prisma.run.findUnique({ where: { runId } });
  if (!existing) {
    throw new Error(`Unknown run "${runId}"`);
  }
  if (existing.readingFinishedAt) {
    return existing;
  }

  return prisma.run.update({
    where: { runId },
    data: {
      readingFinishedAt: new Date(),
    },
  });
}

export async function listStudentRuns(studentId: string): Promise<Run[]> {
  return prisma.run.findMany({
    where: { studentId },
    orderBy: [{ storyId: "asc" }, { episodeId: "asc" }],
  });
}
