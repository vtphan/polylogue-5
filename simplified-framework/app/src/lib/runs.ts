import "server-only";

import { prisma } from "@/lib/db";
import { loadActiveConfig } from "@/lib/config";
import type { RunPhase, RunStatus } from "@/lib/domain";
import type { SessionRun } from "@prisma/client";

export type { SessionRun } from "@prisma/client";

export async function createOrResumeRun(params: {
  groupId: string;
  studentId: string;
}): Promise<SessionRun> {
  const config = await loadActiveConfig();
  const group = config.groups.find((entry) => entry.group_id === params.groupId);
  if (!group) {
    throw new Error(`Unknown group "${params.groupId}" in active config`);
  }
  const student = group.students.find((entry) => entry.student_id === params.studentId);
  if (!student) {
    throw new Error(`Unknown student "${params.studentId}" in group "${params.groupId}"`);
  }

  // Upsert so the unique open run is reopened (and updatedAt refreshed) or created.
  return prisma.sessionRun.upsert({
    where: {
      unique_open_run: {
        configId: config.config_id,
        episodeSource: config.episode.source,
        groupId: params.groupId,
        studentId: params.studentId,
        status: "in_progress" satisfies RunStatus,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      configId: config.config_id,
      episodeSource: config.episode.source,
      groupId: params.groupId,
      studentId: params.studentId,
      status: "in_progress" satisfies RunStatus,
      currentPhase: "read" satisfies RunPhase,
      readingComplete: false,
    },
  });
}

export async function getRun(runId: string): Promise<SessionRun | null> {
  return prisma.sessionRun.findUnique({ where: { runId } });
}

export async function markReadingComplete(runId: string): Promise<SessionRun> {
  return prisma.sessionRun.update({
    where: { runId },
    data: {
      readingComplete: true,
      currentPhase: "warmup" satisfies RunPhase,
    },
  });
}

export async function listGroupRuns(params: {
  configId: string;
  episodeSource: string;
  groupId: string;
}): Promise<SessionRun[]> {
  return prisma.sessionRun.findMany({
    where: {
      configId: params.configId,
      episodeSource: params.episodeSource,
      groupId: params.groupId,
    },
  });
}
