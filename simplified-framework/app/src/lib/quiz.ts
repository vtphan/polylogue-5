import "server-only";

import { prisma } from "@/lib/db";
import type { ReaderLevel } from "@/lib/content";
import type { QuizAttempt, Run } from "@prisma/client";

export function starsForLockedQuiz(params: {
  usedHint: boolean;
  firstWasCorrect: boolean;
  secondWasCorrect: boolean;
}): number {
  if (params.firstWasCorrect) {
    return params.usedHint ? 2 : 3;
  }
  if (params.secondWasCorrect) {
    return params.usedHint ? 1 : 2;
  }
  return 0;
}

export function feedbackTextForOption(level: ReaderLevel, optionId: string): string {
  if (level.feedback.correct.option_ids.includes(optionId)) {
    return level.feedback.correct.text;
  }
  return level.feedback.by_option[optionId] ?? "";
}

export async function getQuizAttempt(runId: string, levelId: string): Promise<QuizAttempt | null> {
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

  const quizStars = attempts.reduce((sum, attempt) => sum + attempt.starsEarned, 0);
  const earnsBonus = quizStars >= 9;

  await prisma.run.update({
    where: { runId: run.runId },
    data: {
      starsEarned: quizStars + (earnsBonus ? 1 : 0),
      bonusEarnedAt:
        earnsBonus && !run.bonusEarnedAt
          ? new Date()
          : earnsBonus
            ? run.bonusEarnedAt
            : null,
    },
  });
}
