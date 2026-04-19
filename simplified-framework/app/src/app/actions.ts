"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  loadReaderLessonPackageByPaths,
  loadReaderTranscriptByPaths,
} from "@/lib/content";
import { getQuizAttempt, starsForLockedQuiz, syncRunStars } from "@/lib/quiz";
import {
  createStudent,
  getActiveStudentFromCookies,
  getStudentById,
  hasCompletedAllPractice,
  writeStudentCookies,
} from "@/lib/students";
import { getRunForStudent, type SessionRun } from "@/lib/runs";
import { createOrResumeRun } from "@/lib/runs";
import { routeForRun } from "@/lib/routing";
import { getPracticeExercise } from "@/lib/practice";

async function getCatalogEpisodeForRun(run: SessionRun) {
  const catalogEpisode = await prisma.catalogEpisode.findUnique({
    where: {
      storyId_episodeId: {
        storyId: run.storyId,
        episodeId: run.episodeId,
      },
    },
  });
  if (!catalogEpisode) {
    throw new Error(
      `Missing catalog episode for run "${run.runId}" (${run.storyId}/${run.episodeId})`,
    );
  }
  return catalogEpisode;
}

async function requireActiveStudent() {
  const student = await getActiveStudentFromCookies();
  if (!student) {
    redirect("/");
  }
  return student;
}

async function requireOwnedRun(runId: string) {
  const student = await requireActiveStudent();
  const run = await getRunForStudent(runId, student.id);
  if (!run) {
    throw new Error(`Unknown run "${runId}" for active student`);
  }
  return { student, run };
}

async function getReaderLevelForRun(run: SessionRun, levelId: string) {
  const catalogEpisode = await getCatalogEpisodeForRun(run);
  const lessonPackage = await loadReaderLessonPackageByPaths(catalogEpisode.lessonPackagePath);
  const level = lessonPackage.levels.find((entry) => entry.level_id === levelId);
  if (!level) {
    throw new Error(`Unknown level "${levelId}" for run "${run.runId}"`);
  }
  return level;
}

export async function selectStudentAction(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") ?? "");

  if (!studentId) {
    throw new Error("Missing student selection");
  }

  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error(`Unknown student "${studentId}"`);
  }

  await writeStudentCookies(student.id);
  revalidatePath("/");
  redirect("/");
}

export async function createStudentAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const student = await createStudent(name);
  await writeStudentCookies(student.id);
  revalidatePath("/");
  redirect("/");
}

export async function openStoryAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get("story_id") ?? "");
  const episodeId = String(formData.get("episode_id") ?? "");

  if (!storyId || !episodeId) {
    throw new Error("Missing story or episode selection");
  }

  const student = await requireActiveStudent();
  const practiceComplete = await hasCompletedAllPractice(student.id);
  if (!practiceComplete) {
    redirect("/practice");
  }

  const run = await createOrResumeRun({
    studentId: student.id,
    storyId,
    episodeId,
  });

  revalidatePath("/stories");
  redirect(routeForRun(run));
}

export async function openPracticeHintAction(formData: FormData): Promise<void> {
  const flawId = String(formData.get("flaw_id") ?? "");
  if (!flawId) {
    throw new Error("Missing flaw id");
  }

  await requireActiveStudent();

  redirect(`/practice/${flawId}?hint=open`);
}

export async function submitPracticeExerciseAction(formData: FormData): Promise<void> {
  const flawId = String(formData.get("flaw_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");

  if (!flawId || !optionId) {
    throw new Error("Missing practice exercise parameters");
  }

  const student = await requireActiveStudent();
  const exercise = await getPracticeExercise(flawId);
  if (!exercise) {
    throw new Error(`Unknown practice flaw "${flawId}"`);
  }

  const optionExists = exercise.options.some((option) => option.optionId === optionId);
  if (!optionExists) {
    throw new Error(`Unknown option "${optionId}" for practice flaw "${flawId}"`);
  }

  await prisma.practiceAttempt.upsert({
    where: {
      unique_student_practice_flaw: {
        studentId: student.id,
        flawId,
      },
    },
    update: {
      completedAt: new Date(),
    },
    create: {
      studentId: student.id,
      flawId,
      completedAt: new Date(),
    },
  });

  await writeStudentCookies(student.id);
  revalidatePath("/");
  revalidatePath("/practice");
  revalidatePath("/stories");
  redirect(`/practice/${flawId}?choice=${encodeURIComponent(optionId)}`);
}

export async function goToSceneAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const targetSceneIndex = Number(formData.get("target_scene_index") ?? "");

  if (!runId) {
    throw new Error("Missing run id");
  }
  if (!Number.isInteger(targetSceneIndex) || targetSceneIndex < 0) {
    throw new Error("Invalid target scene index");
  }

  const { run } = await requireOwnedRun(runId);
  const catalogEpisode = await getCatalogEpisodeForRun(run);
  const transcript = await loadReaderTranscriptByPaths(catalogEpisode.transcriptPath);
  const sceneCount = transcript.scenes.length;
  const boundedTarget = Math.min(targetSceneIndex, sceneCount);

  await prisma.run.update({
    where: { runId },
    data: {
      currentSceneIndex: boundedTarget,
      sceneHighWaterMark: Math.max(run.sceneHighWaterMark, boundedTarget),
      ...(boundedTarget === sceneCount && !run.readingFinishedAt
        ? { readingFinishedAt: new Date() }
        : {}),
    },
  });

  revalidatePath(`/runs/${runId}/scene/${boundedTarget}`);
  redirect(`/runs/${runId}/scene/${boundedTarget}`);
}

export async function recordSceneViewAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");

  if (!runId) {
    throw new Error("Missing run id");
  }
  if (!Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Invalid scene index");
  }

  const { run } = await requireOwnedRun(runId);
  const catalogEpisode = await getCatalogEpisodeForRun(run);
  const transcript = await loadReaderTranscriptByPaths(catalogEpisode.transcriptPath);
  const sceneCount = transcript.scenes.length;
  const boundedTarget = Math.min(sceneIndex, sceneCount);

  await prisma.run.update({
    where: { runId },
    data: {
      currentSceneIndex: boundedTarget,
      sceneHighWaterMark: Math.max(run.sceneHighWaterMark, boundedTarget),
      ...(boundedTarget === sceneCount && !run.readingFinishedAt
        ? { readingFinishedAt: new Date() }
        : {}),
    },
  });
}

export async function openQuizPanelAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  if (!runId || !levelId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing quiz panel parameters");
  }

  await requireOwnedRun(runId);
  redirect(`/runs/${runId}/scene/${sceneIndex}?open=${encodeURIComponent(levelId)}`);
}

export async function closeQuizPanelAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  if (!runId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing quiz close parameters");
  }

  await requireOwnedRun(runId);
  redirect(`/runs/${runId}/scene/${sceneIndex}`);
}

export async function openQuizHintAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  if (!runId || !levelId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing quiz hint parameters");
  }

  const { run } = await requireOwnedRun(runId);
  const level = await getReaderLevelForRun(run, levelId);
  const existing = await getQuizAttempt(runId, levelId);
  if (!level.hint || existing?.lockedAt) {
    redirect(`/runs/${runId}/scene/${sceneIndex}?open=${encodeURIComponent(levelId)}`);
  }

  if (existing) {
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data: { usedHint: true },
    });
  } else {
    await prisma.quizAttempt.create({
      data: {
        runId,
        levelId,
        turnId: level.turn_id,
        usedHint: true,
      },
    });
  }

  revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
  redirect(
    `/runs/${runId}/scene/${sceneIndex}?open=${encodeURIComponent(levelId)}&hint=open`,
  );
}

export async function submitQuizAnswerAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  if (!runId || !levelId || !optionId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing quiz answer parameters");
  }

  const { run } = await requireOwnedRun(runId);
  const level = await getReaderLevelForRun(run, levelId);
  const existing = await getQuizAttempt(runId, levelId);
  if (existing?.lockedAt) {
    redirect(`/runs/${runId}/scene/${sceneIndex}?open=${encodeURIComponent(levelId)}`);
  }

  const validOptionIds = new Set(level.answer_options.map((option) => option.option_id));
  if (!validOptionIds.has(optionId)) {
    throw new Error(`Unknown option "${optionId}" for level "${levelId}"`);
  }

  if (existing?.firstOptionId && existing.firstOptionId === optionId) {
    throw new Error(`Option "${optionId}" has already been used for level "${levelId}"`);
  }

  const isCorrect = level.feedback.correct.option_ids.includes(optionId);

  if (!existing || !existing.firstOptionId) {
    if (isCorrect) {
      const usedHint = Boolean(existing?.usedHint);
      if (existing) {
        await prisma.quizAttempt.update({
          where: { id: existing.id },
          data: {
            firstOptionId: optionId,
            finalOptionId: optionId,
            starsEarned: starsForLockedQuiz({
              usedHint,
              firstWasCorrect: true,
              secondWasCorrect: true,
            }),
            lockedAt: new Date(),
          },
        });
      } else {
        await prisma.quizAttempt.create({
          data: {
            runId,
            levelId,
            turnId: level.turn_id,
            firstOptionId: optionId,
            finalOptionId: optionId,
            starsEarned: starsForLockedQuiz({
              usedHint: false,
              firstWasCorrect: true,
              secondWasCorrect: true,
            }),
            lockedAt: new Date(),
          },
        });
      }
      await syncRunStars(run);
      revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
      redirect(`/runs/${runId}/scene/${sceneIndex}`);
    }

    if (existing) {
      await prisma.quizAttempt.update({
        where: { id: existing.id },
        data: { firstOptionId: optionId },
      });
    } else {
      await prisma.quizAttempt.create({
        data: {
          runId,
          levelId,
          turnId: level.turn_id,
          firstOptionId: optionId,
        },
      });
    }

    revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
    redirect(`/runs/${runId}/scene/${sceneIndex}?open=${encodeURIComponent(levelId)}`);
  }

  await prisma.quizAttempt.update({
    where: { id: existing.id },
    data: {
      finalOptionId: optionId,
      starsEarned: starsForLockedQuiz({
        usedHint: existing.usedHint,
        firstWasCorrect: false,
        secondWasCorrect: isCorrect,
      }),
      lockedAt: new Date(),
    },
  });

  await syncRunStars(run);
  revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
  redirect(`/runs/${runId}/scene/${sceneIndex}`);
}
