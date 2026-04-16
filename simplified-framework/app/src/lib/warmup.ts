import "server-only";

import { prisma } from "@/lib/db";
import { loadLessonPackage } from "@/lib/content";
import { firstLevelId, type RunPhase } from "@/lib/domain";
import type { SessionRun, WarmupProgress } from "@prisma/client";

export type { WarmupProgress } from "@prisma/client";

// Derived warm-up state so pages render a single canonical phase from persisted
// fields rather than reinventing the logic.
export type WarmupStep = "modeled" | "guided_question" | "guided_reveal" | "done";

export function deriveWarmupStep(progress: WarmupProgress): WarmupStep {
  if (progress.guidedComplete) {
    return "done";
  }
  if (progress.guidedSubmitted) {
    return "guided_reveal";
  }
  if (progress.modeledComplete) {
    return "guided_question";
  }
  return "modeled";
}

// Per the Milestone 2 brief, warmup_progress may be created on first warm-up
// load or first warm-up write. We create it lazily on load so pages can read a
// stable row even before the student presses Continue on the modeled warm-up.
// Callers must have already verified that the run is in the warmup phase.
export async function getOrCreateWarmupProgress(runId: string): Promise<WarmupProgress> {
  return prisma.warmupProgress.upsert({
    where: { runId },
    update: {},
    create: { runId },
  });
}

export async function completeModeledWarmup(runId: string): Promise<WarmupProgress> {
  // Idempotent: repeated submissions of the modeled Continue just re-write
  // modeledComplete=true. No forward state transitions leak into this write.
  return prisma.warmupProgress.upsert({
    where: { runId },
    update: { modeledComplete: true },
    create: { runId, modeledComplete: true },
  });
}

// Validates the submitted option against the lesson package and enforces the
// state-machine precondition (modeled must be complete; guided is locked after
// the first accepted submission).
//
// Concurrency: the lock is enforced by an atomic conditional updateMany rather
// than a check-then-act pair. Two callers racing on the same run will both
// send the same conditional UPDATE; whichever the database executes first
// flips `guidedSubmitted` to true, and the other's WHERE clause no longer
// matches (count=0). The follow-up findUnique returns the canonical winner's
// row to every caller, so no submission is silently overwritten.
export async function submitGuidedWarmup(params: {
  run: SessionRun;
  selectedAnswerId: string;
  usedHint: boolean;
}): Promise<WarmupProgress> {
  const pkg = await loadLessonPackage(params.run.episodeSource);
  const isValidOption = pkg.warmups.guided.answer_options.some(
    (option) => option.option_id === params.selectedAnswerId,
  );
  if (!isValidOption) {
    throw new Error(
      `Unknown guided answer option "${params.selectedAnswerId}" for run "${params.run.runId}"`,
    );
  }

  // Atomic conditional write. Only matches rows where modeledComplete is true
  // AND guidedSubmitted is still false. Note: guidedUsedHint is NOT written
  // here — it is a monotonic flag owned by recordGuidedHintOpened and merged
  // below via an idempotent follow-up write.
  await prisma.warmupProgress.updateMany({
    where: {
      runId: params.run.runId,
      modeledComplete: true,
      guidedSubmitted: false,
    },
    data: {
      guidedSubmitted: true,
      guidedSelectedAnswerId: params.selectedAnswerId,
    },
  });

  const canonical = await prisma.warmupProgress.findUnique({
    where: { runId: params.run.runId },
  });
  if (!canonical) {
    throw new Error(
      `Cannot submit guided warm-up for run "${params.run.runId}": no warmup_progress row`,
    );
  }
  if (!canonical.modeledComplete) {
    throw new Error(
      `Cannot submit guided warm-up for run "${params.run.runId}": modeled warm-up is not complete`,
    );
  }

  // Monotonic hint-flag merge. Safe under concurrent writes because it only
  // flips false → true and the post-condition is idempotent.
  if (params.usedHint && !canonical.guidedUsedHint) {
    return prisma.warmupProgress.update({
      where: { runId: params.run.runId },
      data: { guidedUsedHint: true },
    });
  }

  return canonical;
}

export async function recordGuidedHintOpened(runId: string): Promise<WarmupProgress> {
  const existing = await prisma.warmupProgress.findUnique({ where: { runId } });
  if (!existing || !existing.modeledComplete) {
    throw new Error(
      `Cannot open guided hint for run "${runId}": modeled warm-up is not complete`,
    );
  }
  if (existing.guidedSubmitted) {
    // Hint is only meaningful before submission; don't mutate after locking.
    return existing;
  }
  return prisma.warmupProgress.update({
    where: { runId },
    data: { guidedUsedHint: true },
  });
}

// Transition from the guided reveal state into the level phase. Requires that
// the full warm-up sequence has run: modeled complete, guided submitted, and
// the saved selection still matches one of the current answer_options.
// Initializes session_runs.current_level_id to the level with the lowest
// sequence_index per technical-spec §9.
export async function continueFromGuidedWarmup(
  run: SessionRun,
): Promise<{ sessionRun: SessionRun; firstLevel: string }> {
  const progress = await prisma.warmupProgress.findUnique({
    where: { runId: run.runId },
  });
  if (
    !progress ||
    !progress.modeledComplete ||
    !progress.guidedSubmitted ||
    !progress.guidedSelectedAnswerId
  ) {
    throw new Error(
      `Cannot continue from guided warm-up for run "${run.runId}": required warm-up state is missing`,
    );
  }

  const pkg = await loadLessonPackage(run.episodeSource);
  const stillValid = pkg.warmups.guided.answer_options.some(
    (option) => option.option_id === progress.guidedSelectedAnswerId,
  );
  if (!stillValid) {
    throw new Error(
      `Saved guided selection "${progress.guidedSelectedAnswerId}" is not in the current answer_options for run "${run.runId}"`,
    );
  }

  const levelId = firstLevelId(pkg.levels);

  const [, sessionRun] = await prisma.$transaction([
    prisma.warmupProgress.update({
      where: { runId: run.runId },
      data: { guidedComplete: true },
    }),
    prisma.sessionRun.update({
      where: { runId: run.runId },
      data: {
        currentPhase: "level" satisfies RunPhase,
        currentLevelId: levelId,
      },
    }),
  ]);

  return { sessionRun, firstLevel: levelId };
}
