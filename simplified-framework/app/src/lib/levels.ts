import "server-only";

import { prisma } from "@/lib/db";
import { loadLessonPackage } from "@/lib/content";
import type { LessonPackage, LessonLevel, RunPhase, RunStatus } from "@/lib/domain";
import type { LevelResponse, ScaffoldEvent, SessionRun } from "@prisma/client";

export type { LevelResponse, ScaffoldEvent } from "@prisma/client";

// Stable scaffold step_key for the single authored level hint per §10.31.
export const LEVEL_HINT_STEP_KEY = "hint";

// Derived level state for a run actively on a level. The saved-complete
// handoff is handled by the page's phase gate before calling this helper, so
// it is intentionally not a kind here.
//
// Milestone 5 adds the retry-open kind: a LevelResponse row exists (the
// student has submitted once) but completedAt is null (the level is not yet
// locked). In this state the student sees deterministic feedback for their
// wrong first answer and has one more submission available.
export type LevelStep =
  | { kind: "question"; hintOpen: boolean }
  | { kind: "retry"; firstAnswer: string; hintOpen: boolean }
  | { kind: "feedback" };

export function deriveLevelStep(params: {
  response: LevelResponse | null;
  hintEvent: ScaffoldEvent | null;
  hintQueryOpen: boolean;
}): LevelStep {
  const hintOpen = Boolean(params.hintEvent) || params.hintQueryOpen;
  if (params.response?.completedAt) {
    return { kind: "feedback" };
  }
  if (params.response) {
    return {
      kind: "retry",
      firstAnswer: params.response.initialAnswer,
      hintOpen,
    };
  }
  return { kind: "question", hintOpen };
}

// §10.57 retry eligibility: challenge level with at least 3 answer options
// and exactly one correct option_id. Ineligible levels fall back to the
// Milestone 3 single-submit flow.
export function isRetryEligible(level: LessonLevel): boolean {
  return (
    level.answer_options.length >= 3 &&
    level.feedback.correct.option_ids.length === 1
  );
}

export function resolveActiveLevel(
  pkg: LessonPackage,
  currentLevelId: string | null,
): LessonLevel {
  if (!currentLevelId) {
    throw new Error("Cannot resolve active level: current_level_id is unset");
  }
  const level = pkg.levels.find((entry) => entry.level_id === currentLevelId);
  if (!level) {
    throw new Error(`Unknown level_id "${currentLevelId}" for episode`);
  }
  return level;
}

export function nextLevel(
  pkg: LessonPackage,
  currentLevelId: string,
): LessonLevel | null {
  const current = pkg.levels.find((entry) => entry.level_id === currentLevelId);
  if (!current) {
    throw new Error(`Unknown level_id "${currentLevelId}" for episode`);
  }
  const sorted = [...pkg.levels].sort((a, b) => a.sequence_index - b.sequence_index);
  const idx = sorted.findIndex((entry) => entry.level_id === currentLevelId);
  if (idx === -1 || idx === sorted.length - 1) {
    return null;
  }
  return sorted[idx + 1];
}

// Deterministic feedback resolution per §10.32.
// runtime must NOT consult best_answer_id — only feedback.correct.option_ids
// and feedback.by_option for the submitted answer.
export function feedbackForOption(
  level: LessonLevel,
  optionId: string,
): { text: string; isCorrect: boolean } {
  const isCorrect = level.feedback.correct.option_ids.includes(optionId);
  if (isCorrect) {
    return { text: level.feedback.correct.text, isCorrect: true };
  }
  const byOption = level.feedback.by_option?.[optionId];
  if (byOption) {
    return { text: byOption, isCorrect: false };
  }
  throw new Error(
    `No authored feedback for option "${optionId}" on level "${level.level_id}"`,
  );
}

// Phase guard: level UI and level actions are valid only when the run is in
// the level phase OR has already transitioned to the saved-complete state.
// `complete` is allowed so §10.37's handoff state can render on the level
// route without bouncing the student through routeForRun.
export function isLevelPhaseOrComplete(run: SessionRun): boolean {
  return run.currentPhase === "level" || run.currentPhase === "complete";
}

export async function getLevelResponse(
  runId: string,
  levelId: string,
): Promise<LevelResponse | null> {
  return prisma.levelResponse.findUnique({
    where: { unique_level_response: { runId, levelId } },
  });
}

export async function getLevelHintEvent(
  runId: string,
  levelId: string,
): Promise<ScaffoldEvent | null> {
  return prisma.scaffoldEvent.findUnique({
    where: {
      unique_scaffold_event: {
        runId,
        levelId,
        stepKey: LEVEL_HINT_STEP_KEY,
      },
    },
  });
}

// §10.31: "opening the level hint should immediately create durable scaffold
// state before answer submission, so reload cannot lose the hint-open fact."
// Idempotent under concurrent calls: the unique (run_id, level_id, step_key)
// index makes repeated inserts a no-op from the caller's perspective.
export async function recordLevelHintOpened(params: {
  run: SessionRun;
  levelId: string;
}): Promise<ScaffoldEvent | null> {
  if (params.run.currentLevelId !== params.levelId) {
    throw new Error(
      `Cannot open hint for level "${params.levelId}" on run "${params.run.runId}": current_level_id is "${params.run.currentLevelId}"`,
    );
  }
  // Hint is only meaningful before first submission. After submission the
  // feedback state reads the prior event for read-only display, so stale
  // post-submit writes must not backfill a new event.
  const existingResponse = await getLevelResponse(params.run.runId, params.levelId);
  if (existingResponse?.completedAt) {
    return getLevelHintEvent(params.run.runId, params.levelId);
  }

  return prisma.scaffoldEvent.upsert({
    where: {
      unique_scaffold_event: {
        runId: params.run.runId,
        levelId: params.levelId,
        stepKey: LEVEL_HINT_STEP_KEY,
      },
    },
    update: {},
    create: {
      runId: params.run.runId,
      levelId: params.levelId,
      stepKey: LEVEL_HINT_STEP_KEY,
    },
  });
}

// §10.58–10.59 + §10.62: the level-submit branches are
//
//   1. locked row exists (completedAt set) → idempotent return
//   2. retry-open row exists (initialAnswer set, completedAt null) →
//      finalize via a guarded updateMany that only fires while still
//      retry-open; if a racing caller locked first, return their row
//   3. no row + wrong first answer + retry-eligible → create a retry-open
//      row (initialAnswer set, finalAnswer / completedAt null)
//   4. no row + (correct first answer OR ineligible level) → create a
//      locked row (Milestone 3 single-submit shape)
//
// Concurrency:
//   - first-submit races are resolved by the unique (run_id, level_id) index:
//     the winner's create lands, the loser catches P2002 and returns the
//     canonical row.
//   - second-submit races on a retry-open row use an updateMany guarded on
//     completedAt = null; only one caller's guard passes, and losers
//     re-fetch the canonical locked row.
export async function submitLevelAnswer(params: {
  run: SessionRun;
  selectedAnswerId: string;
}): Promise<LevelResponse> {
  const pkg = await loadLessonPackage(params.run.episodeSource);
  const level = resolveActiveLevel(pkg, params.run.currentLevelId);
  const isValidOption = level.answer_options.some(
    (option) => option.option_id === params.selectedAnswerId,
  );
  if (!isValidOption) {
    throw new Error(
      `Unknown answer option "${params.selectedAnswerId}" for level "${level.level_id}"`,
    );
  }

  const existing = await getLevelResponse(params.run.runId, level.level_id);

  // Branch 1: locked row → idempotent no-op.
  if (existing && existing.completedAt) {
    return existing;
  }

  // used_hint is derived at lock time so hints opened between the first and
  // second submissions on a retry-eligible level still count.
  const hintEvent = await getLevelHintEvent(params.run.runId, level.level_id);
  const usedHint = Boolean(hintEvent);

  // Branch 2: retry-open row → finalize with a guarded update.
  if (existing) {
    // §10.58: the retry view disables the first-picked option so the student
    // cannot re-submit it. As a server-side boundary guard, reject a second
    // submission that equals initial_answer by returning the retry-open row
    // unchanged. The level stays retry-open; the student picks again.
    if (params.selectedAnswerId === existing.initialAnswer) {
      return existing;
    }
    await prisma.levelResponse.updateMany({
      where: {
        runId: params.run.runId,
        levelId: level.level_id,
        completedAt: null,
      },
      data: {
        finalAnswer: params.selectedAnswerId,
        usedHint,
        // After the duplicate guard above, final_answer is necessarily
        // different from initial_answer, so answer_changed is always true
        // when the retry-finalize branch actually runs.
        answerChanged: true,
        completedAt: new Date(),
      },
    });
    // Re-fetch the canonical row — whether our guard fired or a racing caller
    // locked first, the persisted state is the source of truth.
    const canonical = await getLevelResponse(params.run.runId, level.level_id);
    if (!canonical) {
      throw new Error(
        `Retry-open row for run "${params.run.runId}" level "${level.level_id}" disappeared mid-submit`,
      );
    }
    return canonical;
  }

  // Branches 3 + 4: no row yet. Decide retry-open vs immediate lock.
  const isCorrect = level.feedback.correct.option_ids.includes(
    params.selectedAnswerId,
  );
  const shouldOpenRetry = !isCorrect && isRetryEligible(level);

  try {
    return await prisma.levelResponse.create({
      data: shouldOpenRetry
        ? {
            runId: params.run.runId,
            levelId: level.level_id,
            initialAnswer: params.selectedAnswerId,
            finalAnswer: null,
            usedHint,
            answerChanged: false,
            completedAt: null,
          }
        : {
            runId: params.run.runId,
            levelId: level.level_id,
            initialAnswer: params.selectedAnswerId,
            finalAnswer: params.selectedAnswerId,
            usedHint,
            answerChanged: false,
            completedAt: new Date(),
          },
    });
  } catch (error) {
    // P2002 = unique constraint violation. Another concurrent first-submit
    // won; return the canonical winner's row rather than surfacing a race.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const canonical = await getLevelResponse(params.run.runId, level.level_id);
      if (canonical) {
        return canonical;
      }
    }
    throw error;
  }
}

// §10.33 + §10.34: continue from the revealed feedback.
// - non-final level → advance current_level_id to the next sequence_index
// - final level → transition the run to current_phase = complete,
//   status = complete, clear current_level_id, set completed_at
export async function continueFromLevelFeedback(
  run: SessionRun,
): Promise<{ sessionRun: SessionRun; done: boolean }> {
  if (!run.currentLevelId) {
    throw new Error(
      `Cannot continue from level feedback for run "${run.runId}": current_level_id is unset`,
    );
  }
  const response = await getLevelResponse(run.runId, run.currentLevelId);
  if (!response || !response.completedAt) {
    throw new Error(
      `Cannot continue from level feedback for run "${run.runId}": level "${run.currentLevelId}" has no completed response`,
    );
  }

  const pkg = await loadLessonPackage(run.episodeSource);
  const next = nextLevel(pkg, run.currentLevelId);

  if (next) {
    const sessionRun = await prisma.sessionRun.update({
      where: { runId: run.runId },
      data: {
        currentPhase: "level" satisfies RunPhase,
        currentLevelId: next.level_id,
      },
    });
    return { sessionRun, done: false };
  }

  const sessionRun = await prisma.sessionRun.update({
    where: { runId: run.runId },
    data: {
      currentPhase: "complete" satisfies RunPhase,
      status: "complete" satisfies RunStatus,
      currentLevelId: null,
      completedAt: new Date(),
    },
  });
  return { sessionRun, done: true };
}
