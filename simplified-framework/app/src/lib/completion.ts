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

// §10.45 visible badge categories. `changed_my_mind` is activated by
// Milestone 5 once bounded retry can produce genuine revision; its predicate
// is defined in §10.60 and supersedes the M3/M4 omission.
export type BadgeCategory =
  | "read_the_episode"
  | "finished_warmup"
  | "level_complete"
  | "used_help_and_kept_going"
  | "changed_my_mind"
  | "episode_complete";

export type Badge = {
  category: BadgeCategory;
  label: string;
  description?: string;
};

// Pure predicate evaluation per §10.45. Deterministic from persisted state —
// no runtime model call, no string generation beyond stitching authored
// fields (`lesson_package.levels[].title`) into short labels.
export function deriveEarnedBadges(inputs: CompletionInputs, pkg: LessonPackage): Badge[] {
  const { run, warmupProgress, levelResponses, scaffoldEvents } = inputs;
  const badges: Badge[] = [];

  // Read The Episode — one per run, once reading is complete. Always true for
  // a completed run, but we honour the predicate rather than assuming.
  if (run.readingComplete) {
    badges.push({
      category: "read_the_episode",
      label: "Read the episode",
      description: "You took time to read every turn.",
    });
  }

  // Finished Warm-Up — one per run, tied to guided warm-up completion.
  if (warmupProgress?.guidedComplete) {
    badges.push({
      category: "finished_warmup",
      label: "Finished the warm-up",
      description: "You worked through both warm-up moments.",
    });
  }

  // Level Complete — one per authored level with a completed response row.
  // Iterate in authored sequence so badges read top-to-bottom in level order.
  const sortedLevels = [...pkg.levels].sort(
    (a, b) => a.sequence_index - b.sequence_index,
  );
  const responseByLevelId = new Map<string, LevelResponse>();
  for (const response of levelResponses) {
    if (response.completedAt) {
      responseByLevelId.set(response.levelId, response);
    }
  }
  for (const level of sortedLevels) {
    if (responseByLevelId.has(level.level_id)) {
      badges.push({
        category: "level_complete",
        label: `Finished Level ${level.sequence_index}: ${level.title}`,
      });
    }
  }

  // Used Help And Kept Going — per support-used-and-still-completed moment.
  // Warm-up first, then one per eligible level (hint event OR used_hint flag
  // AND the response was completed). Ordered alongside Level Complete by
  // authored sequence so the two categories read consistently.
  if (warmupProgress?.guidedUsedHint && warmupProgress.guidedComplete) {
    badges.push({
      category: "used_help_and_kept_going",
      label: "Used a hint on the warm-up and kept going",
    });
  }
  const hintEventByLevelId = new Map<string, ScaffoldEvent>();
  for (const event of scaffoldEvents) {
    if (event.stepKey === LEVEL_HINT_STEP_KEY) {
      hintEventByLevelId.set(event.levelId, event);
    }
  }
  for (const level of sortedLevels) {
    const response = responseByLevelId.get(level.level_id);
    if (!response || !response.completedAt) {
      continue;
    }
    const usedHelp =
      hintEventByLevelId.has(level.level_id) || response.usedHint;
    if (usedHelp) {
      badges.push({
        category: "used_help_and_kept_going",
        label: `Used a hint on Level ${level.sequence_index} and kept going`,
      });
    }
  }

  // Changed My Mind — one per level where the student reconsidered after a
  // wrong first answer and locked the correct answer on retry (§10.60).
  // Predicate: completedAt set AND answerChanged true AND final_answer is in
  // feedback.correct.option_ids. Wrong-then-different-wrong sequences are
  // intentionally excluded — the badge recognises productive revision, not
  // answer-switching.
  for (const level of sortedLevels) {
    const response = responseByLevelId.get(level.level_id);
    if (!response || !response.completedAt || !response.answerChanged) {
      continue;
    }
    const finalAnswer = response.finalAnswer;
    if (!finalAnswer) {
      continue;
    }
    if (!level.feedback.correct.option_ids.includes(finalAnswer)) {
      continue;
    }
    badges.push({
      category: "changed_my_mind",
      label: `Changed my mind on Level ${level.sequence_index}: ${level.title}`,
    });
  }

  // Episode Complete — one per run, terminal badge. Presented last so it
  // reads as the final acknowledgement.
  if (run.status === "complete" && run.completedAt) {
    badges.push({
      category: "episode_complete",
      label: "Completed the episode",
      description: "Every level answered, every hint saved. Nice run.",
    });
  }

  return badges;
}

// Convenience predicate for unit-style reasoning about derived badge sets.
// Not used on the page itself but useful for anything that wants to count
// badges by category without re-deriving them.
export function countBadgesByCategory(badges: Badge[]): Record<BadgeCategory, number> {
  const counts: Record<BadgeCategory, number> = {
    read_the_episode: 0,
    finished_warmup: 0,
    level_complete: 0,
    used_help_and_kept_going: 0,
    changed_my_mind: 0,
    episode_complete: 0,
  };
  for (const badge of badges) {
    counts[badge.category] += 1;
  }
  return counts;
}

// Used by the completion page to group badges for rendering. Keeps the
// top-level list deterministic while letting the UI show category headings.
export function groupBadgesByCategory(badges: Badge[]): Array<{
  category: BadgeCategory;
  badges: Badge[];
}> {
  const order: BadgeCategory[] = [
    "read_the_episode",
    "finished_warmup",
    "level_complete",
    "used_help_and_kept_going",
    "changed_my_mind",
    "episode_complete",
  ];
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
