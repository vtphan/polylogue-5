import "server-only";

import { prisma } from "@/lib/db";
import { LEVEL_HINT_STEP_KEY } from "@/lib/levels";
import type { LessonPackage } from "@/lib/domain";
import type {
  LevelResponse,
  ScaffoldEvent,
  SessionRun,
  WarmupProgress,
} from "@prisma/client";

export type CompletionInputs = {
  run: SessionRun;
  warmupProgress: WarmupProgress | null;
  levelResponses: LevelResponse[];
  scaffoldEvents: ScaffoldEvent[];
};

// Single fetcher for every persisted row the completion surface derives from.
// Kept read-only: the Milestone 3 terminal-state invariant forbids any write
// on render of a completed run.
export async function loadCompletionInputs(runId: string): Promise<CompletionInputs | null> {
  const [run, warmupProgress, levelResponses, scaffoldEvents] = await Promise.all([
    prisma.sessionRun.findUnique({ where: { runId } }),
    prisma.warmupProgress.findUnique({ where: { runId } }),
    prisma.levelResponse.findMany({ where: { runId } }),
    prisma.scaffoldEvent.findMany({ where: { runId } }),
  ]);
  if (!run) {
    return null;
  }
  return { run, warmupProgress, levelResponses, scaffoldEvents };
}

// Only one badge category now. Medals represent correct answers; the
// first-try variant was replaced by the lifeline-based bonus mechanic.
export type BadgeCategory = "correct_answer";

export type Badge = {
  category: BadgeCategory;
  label: string;
  description?: string;
};

// Lifelines: a fixed budget of help-tokens per run, spent when the student
// opens a level hint. Warm-up hints do not count — they are part of
// scaffolded practice, not the challenge measure. The formula intentionally
// gives the student some slack (levels.length - 1) so one hint never forfeits
// the bonus, with a minimum of 1 to keep the mechanic visible on short
// episodes.
export type LifelineState = {
  initial: number;
  used: number;
  remaining: number;
};

export function deriveLifelineState(
  inputs: CompletionInputs,
  pkg: LessonPackage,
): LifelineState {
  const initial = Math.max(1, pkg.levels.length - 1);
  const levelsWithHintOpened = new Set<string>();
  for (const event of inputs.scaffoldEvents) {
    if (event.stepKey === LEVEL_HINT_STEP_KEY) {
      levelsWithHintOpened.add(event.levelId);
    }
  }
  const used = levelsWithHintOpened.size;
  const remaining = Math.max(0, initial - used);
  return { initial, used, remaining };
}

// Pure predicate evaluation. Deterministic from persisted state — no runtime
// model call, no string generation beyond stitching authored fields
// (`lesson_package.levels[].title`) into short labels.
//
// `options.bonusMedals` doubles each correct-answer medal. Called with true
// only at episode completion when lifelines remain — see CompletionSurface.
export function deriveEarnedBadges(
  inputs: CompletionInputs,
  pkg: LessonPackage,
  options: { bonusMedals?: boolean } = {},
): Badge[] {
  const { levelResponses } = inputs;
  const bonusMedals = options.bonusMedals ?? false;
  const badges: Badge[] = [];

  const sortedLevels = [...pkg.levels].sort(
    (a, b) => a.sequence_index - b.sequence_index,
  );
  const responseByLevelId = new Map<string, LevelResponse>();
  for (const response of levelResponses) {
    if (response.completedAt) {
      responseByLevelId.set(response.levelId, response);
    }
  }

  // Correct Answer — one per authored level where the locked final answer
  // is in feedback.correct.option_ids. Retry-correct still counts; a level
  // locked on a wrong final answer earns nothing. When bonusMedals is set,
  // each correct level yields a second medal labelled as a bonus.
  for (const level of sortedLevels) {
    const response = responseByLevelId.get(level.level_id);
    if (!response || !response.finalAnswer) {
      continue;
    }
    if (!level.feedback.correct.option_ids.includes(response.finalAnswer)) {
      continue;
    }
    badges.push({
      category: "correct_answer",
      label: `Got Level ${level.sequence_index} right: ${level.title}`,
    });
    if (bonusMedals) {
      badges.push({
        category: "correct_answer",
        label: `Bonus medal · Level ${level.sequence_index}: ${level.title}`,
      });
    }
  }

  return badges;
}

// Convenience predicate for unit-style reasoning about derived badge sets.
export function countBadgesByCategory(badges: Badge[]): Record<BadgeCategory, number> {
  const counts: Record<BadgeCategory, number> = {
    correct_answer: 0,
  };
  for (const badge of badges) {
    counts[badge.category] += 1;
  }
  return counts;
}

// Used by the completion page to group badges for rendering. Kept for UI
// flexibility even though the current category set is a single entry.
export function groupBadgesByCategory(badges: Badge[]): Array<{
  category: BadgeCategory;
  badges: Badge[];
}> {
  const order: BadgeCategory[] = ["correct_answer"];
  const byCategory = new Map<BadgeCategory, Badge[]>();
  for (const badge of badges) {
    const bucket = byCategory.get(badge.category) ?? [];
    bucket.push(badge);
    byCategory.set(badge.category, bucket);
  }
  return order
    .filter((category) => byCategory.has(category))
    .map((category) => ({
      category,
      badges: byCategory.get(category) ?? [],
    }));
}
