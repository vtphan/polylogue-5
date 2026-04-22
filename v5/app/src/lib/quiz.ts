import "server-only";

import { prisma } from "@/lib/db";
import type { ReaderLevel } from "@/lib/content";
import type { QuizAttempt, Run } from "@prisma/client";

// Per-level stars. Earned only after Step 3 locks.
// Step 2 is a reflection step; it has no correctness and no weight.
//
// 3 · first-try on Step 1 AND first-try on Step 3, no hint
// 2 · first-try on both, hint used
//     OR first-try on one, retry-correct on the other, no hint
// 1 · retry-correct on one (hint used)
//     OR retry-correct on both (no hint)
// 0 · final wrong on Step 1 or Step 3
export function starsForLockedLevel(params: {
  usedHint: boolean;
  step1FirstWasCorrect: boolean;
  step1FinalWasCorrect: boolean;
  step3FirstWasCorrect: boolean;
  step3FinalWasCorrect: boolean;
}): number {
  if (!params.step1FinalWasCorrect || !params.step3FinalWasCorrect) {
    return 0;
  }

  const firstTries =
    (params.step1FirstWasCorrect ? 1 : 0) + (params.step3FirstWasCorrect ? 1 : 0);

  // Both first-try correct.
  if (firstTries === 2) {
    return params.usedHint ? 2 : 3;
  }

  // One first-try correct, one retry-correct.
  if (firstTries === 1) {
    return params.usedHint ? 1 : 2;
  }

  // Neither first-try correct, both retry-correct.
  return params.usedHint ? 1 : 1;
}

export function step1FeedbackForOption(level: ReaderLevel, optionId: string): string {
  const step = level.step_1_claim;
  if (step.feedback.correct.option_ids.includes(optionId)) {
    return step.feedback.correct.text;
  }
  return step.feedback.by_option[optionId] ?? "";
}

export function step3BranchKeyForStep2(optionId: string): "why_yes" | "why_no" {
  return optionId === "yes_strong" ? "why_yes" : "why_no";
}

export function step3BranchFor(level: ReaderLevel, step2OptionId: string | null | undefined) {
  if (!step2OptionId) {
    return null;
  }
  return level.step_3[step3BranchKeyForStep2(step2OptionId)];
}

export function step3FeedbackForOption(
  level: ReaderLevel,
  step2OptionId: string,
  optionId: string,
): string {
  const branch = step3BranchFor(level, step2OptionId);
  if (!branch) {
    return "";
  }
  if (branch.feedback.correct.option_ids.includes(optionId)) {
    return branch.feedback.correct.text;
  }
  return branch.feedback.by_option[optionId] ?? "";
}

export async function getQuizAttempt(
  runId: string,
  levelId: string,
): Promise<QuizAttempt | null> {
  return prisma.quizAttempt.findUnique({
    where: {
      unique_run_level_quiz_attempt: {
        runId,
        levelId,
      },
    },
  });
}

export async function syncRunStars(run: Run): Promise<void> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { runId: run.runId },
    select: { starsEarned: true },
  });

  const totalStars = attempts.reduce((sum, attempt) => sum + attempt.starsEarned, 0);

  await prisma.run.update({
    where: { runId: run.runId },
    data: {
      starsEarned: totalStars,
    },
  });
}
