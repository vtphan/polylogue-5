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
export type LevelStep =
  | { kind: "question"; hintOpen: boolean }
  | { kind: "feedback" };

export function deriveLevelStep(params: {
  response: LevelResponse | null;
  hintEvent: ScaffoldEvent | null;
  hintQueryOpen: boolean;
}): LevelStep {
  if (params.response && params.response.completedAt) {
    return { kind: "feedback" };
  }
  return {
    kind: "question",
    hintOpen: Boolean(params.hintEvent) || params.hintQueryOpen,
  };
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

// §10.32 + §10.35: on the first accepted submit, write one durable level
// response and lock it. Duplicate submits for a completed (run_id, level_id)
// return the existing row without changing initial_answer / final_answer.
//
// Concurrency: an atomic create via the unique (run_id, level_id) index. If
// two callers race, whichever the database inserts first wins; the other hits
// a Prisma P2002 unique-constraint error which we catch and resolve by
// returning the canonical winner's row.
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

  // Idempotent no-op for duplicate submits after the first accepted response.
  const existing = await getLevelResponse(params.run.runId, level.level_id);
  if (existing && existing.completedAt) {
    return existing;
  }

  // Derive used_hint from scaffold_events at submission time per §10.31.
  const hintEvent = await getLevelHintEvent(params.run.runId, level.level_id);
  const usedHint = Boolean(hintEvent);

  try {
    return await prisma.levelResponse.create({
      data: {
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
    // P2002 = unique constraint violation. Another concurrent submit won;
    // return the canonical winner's row rather than surfacing a race.
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
