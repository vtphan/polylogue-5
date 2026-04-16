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

  // §11.13: at most one in_progress run per (config, episode, group, student).
  // Completed runs are unbounded so the same student can replay the episode,
  // producing a new in_progress row alongside any historical complete rows.
  // Uniqueness for the in_progress case is enforced by a partial unique index
  // (see 20260416_allow_multiple_completes migration).
  const existing = await prisma.sessionRun.findFirst({
    where: {
      configId: config.config_id,
      episodeSource: config.episode.source,
      groupId: params.groupId,
      studentId: params.studentId,
      status: "in_progress" satisfies RunStatus,
    },
  });
  if (existing) {
    return prisma.sessionRun.update({
      where: { runId: existing.runId },
      data: { updatedAt: new Date() },
    });
  }
  try {
    return await prisma.sessionRun.create({
      data: {
        configId: config.config_id,
        episodeSource: config.episode.source,
        groupId: params.groupId,
        studentId: params.studentId,
        status: "in_progress" satisfies RunStatus,
        currentPhase: "read" satisfies RunPhase,
        readingComplete: false,
      },
    });
  } catch (error) {
    // Another request may have created the in-progress row after our pre-check.
    // Treat the partial unique index as canonical and resume that winner.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const canonical = await prisma.sessionRun.findFirst({
        where: {
          configId: config.config_id,
          episodeSource: config.episode.source,
          groupId: params.groupId,
          studentId: params.studentId,
          status: "in_progress" satisfies RunStatus,
        },
      });
      if (canonical) {
        return prisma.sessionRun.update({
          where: { runId: canonical.runId },
          data: { updatedAt: new Date() },
        });
      }
    }
    throw error;
  }
}

export async function getRun(runId: string): Promise<SessionRun | null> {
  return prisma.sessionRun.findUnique({ where: { runId } });
}

// Terminal-state invariant: once a run is `status = "complete"` it is frozen.
// Re-reading the transcript from the complete handoff must not rewind the
// phase back to warmup. If a completed run somehow hits this path (direct
// POST, stale form), no-op and return the existing row so upstream redirects
// fall through to routeForRun.
export async function markReadingComplete(runId: string): Promise<SessionRun> {
  const existing = await prisma.sessionRun.findUnique({ where: { runId } });
  if (!existing) {
    throw new Error(`Unknown run "${runId}"`);
  }
  if (existing.status === "complete") {
    return existing;
  }
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
