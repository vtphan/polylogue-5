import "server-only";

import { prisma } from "@/lib/db";
import type { QuizAttempt, Run } from "@prisma/client";

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
