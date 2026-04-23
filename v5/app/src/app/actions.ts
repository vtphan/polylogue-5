"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  loadReaderLessonPackageByPaths,
  loadReaderTranscriptByPaths,
} from "@/lib/content";
import { getQuizAttempt, syncRunStars } from "@/lib/quiz";
import { computeLevelStars, step3BranchKeyForStep2 } from "@/lib/grading";
import {
  createStudent,
  getActiveStudentFromCookies,
  getStudentById,
  writeStudentCookies,
} from "@/lib/students";
import { getRunForStudent, type SessionRun } from "@/lib/runs";
import { createOrResumeRun } from "@/lib/runs";
import { routeForRun } from "@/lib/routing";

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
  const redirectTo = String(formData.get("redirect_to") ?? "/") || "/";

  if (!studentId) {
    throw new Error("Missing student selection");
  }

  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error(`Unknown student "${studentId}"`);
  }

  await writeStudentCookies(student.id);
  revalidatePath("/");
  redirect(redirectTo);
}

export async function createStudentAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/") || "/";
  const student = await createStudent(name);
  await writeStudentCookies(student.id);
  revalidatePath("/");
  redirect(redirectTo);
}

export async function openStoryAction(formData: FormData): Promise<void> {
  const storyId = String(formData.get("story_id") ?? "");
  const episodeId = String(formData.get("episode_id") ?? "");

  if (!storyId || !episodeId) {
    throw new Error("Missing story or episode selection");
  }

  const student = await requireActiveStudent();
  const run = await createOrResumeRun({
    studentId: student.id,
    storyId,
    episodeId,
  });

  revalidatePath("/stories");
  redirect(routeForRun(run));
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
    return;
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
}

// --------------------------------------------------------------------------
// Three-step quiz submission actions.
//
// Step 1 and Step 3 share the same first-try + one-retry pattern:
//   - first pick lands in {step,}FirstOption; locks immediately if correct.
//   - second pick (only if first was wrong) lands in {step,}FinalOption and
//     locks the step regardless of correctness.
// Step 2 is a one-shot reflection: one pick, no retry, no correctness.
//
// Whole-level lock + star scoring fires when Step 3 locks.
// --------------------------------------------------------------------------

async function upsertAttemptFields(params: {
  runId: string;
  levelId: string;
  turnId: string;
  data: Record<string, unknown>;
}) {
  const existing = await getQuizAttempt(params.runId, params.levelId);
  if (existing) {
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data: params.data,
    });
    return;
  }
  await prisma.quizAttempt.create({
    data: {
      runId: params.runId,
      levelId: params.levelId,
      turnId: params.turnId,
      ...params.data,
    },
  });
}

export async function submitStep1Action(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  if (!runId || !levelId || !optionId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing step 1 answer parameters");
  }

  const { run } = await requireOwnedRun(runId);
  const level = await getReaderLevelForRun(run, levelId);
  const existing = await getQuizAttempt(runId, levelId);
  if (existing?.step1LockedAt) {
    return;
  }

  const step = level.step_1_claim;
  const validOptionIds = new Set(step.options.map((option) => option.option_id));
  if (!validOptionIds.has(optionId)) {
    throw new Error(`Unknown option "${optionId}" for step 1 of level "${levelId}"`);
  }
  if (existing?.step1FirstOption === optionId) {
    throw new Error(`Option "${optionId}" has already been used for step 1 of level "${levelId}"`);
  }

  const isCorrect = step.feedback.correct.option_ids.includes(optionId);

  if (!existing?.step1FirstOption) {
    // First attempt.
    const data: Record<string, unknown> = { step1FirstOption: optionId };
    if (isCorrect) {
      data.step1FinalOption = optionId;
      data.step1LockedAt = new Date();
    }
    await upsertAttemptFields({
      runId,
      levelId,
      turnId: level.turn_id,
      data,
    });
    revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
    return;
  }

  // Retry — lock the step regardless of correctness.
  await prisma.quizAttempt.update({
    where: { id: existing.id },
    data: {
      step1FinalOption: optionId,
      step1LockedAt: new Date(),
    },
  });
  revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
}

export async function submitStep2Action(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  if (!runId || !levelId || !optionId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing step 2 answer parameters");
  }

  const { run } = await requireOwnedRun(runId);
  const level = await getReaderLevelForRun(run, levelId);
  const existing = await getQuizAttempt(runId, levelId);

  // Step 2 only unlocks after Step 1 is locked.
  if (!existing?.step1LockedAt) {
    throw new Error(`Step 1 must be answered before Step 2 for level "${levelId}"`);
  }
  if (existing.step2Option) {
    return;
  }

  const validOptionIds = new Set(
    level.step_2_judgment.options.map((option) => option.option_id),
  );
  if (!validOptionIds.has(optionId)) {
    throw new Error(`Unknown option "${optionId}" for step 2 of level "${levelId}"`);
  }

  await prisma.quizAttempt.update({
    where: { id: existing.id },
    data: { step2Option: optionId },
  });
  revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
}

export async function submitStep3Action(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const sceneIndex = Number(formData.get("scene_index") ?? "");
  const levelId = String(formData.get("level_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");
  if (!runId || !levelId || !optionId || !Number.isInteger(sceneIndex) || sceneIndex < 1) {
    throw new Error("Missing step 3 answer parameters");
  }

  const { run } = await requireOwnedRun(runId);
  const level = await getReaderLevelForRun(run, levelId);
  const existing = await getQuizAttempt(runId, levelId);

  if (!existing?.step2Option) {
    throw new Error(`Step 2 must be answered before Step 3 for level "${levelId}"`);
  }
  if (existing.step3LockedAt) {
    return;
  }

  const branchKey = step3BranchKeyForStep2(existing.step2Option);
  const branch = level.step_3[branchKey];
  const validOptionIds = new Set(branch.options.map((option) => option.option_id));
  if (!validOptionIds.has(optionId)) {
    throw new Error(`Unknown option "${optionId}" for step 3 of level "${levelId}"`);
  }
  if (existing.step3FirstOption === optionId) {
    throw new Error(`Option "${optionId}" has already been used for step 3 of level "${levelId}"`);
  }

  const isCorrect = branch.feedback.correct.option_ids.includes(optionId);

  if (!existing.step3FirstOption) {
    const data: Record<string, unknown> = { step3FirstOption: optionId };
    if (isCorrect) {
      data.step3FinalOption = optionId;
      data.step3LockedAt = new Date();
    }
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data,
    });

    if (isCorrect) {
      await finalizeLevelLock({ runId, levelId, sceneIndex, run });
    } else {
      revalidatePath(`/runs/${runId}/scene/${sceneIndex}`);
    }
    return;
  }

  // Retry — lock regardless of correctness.
  await prisma.quizAttempt.update({
    where: { id: existing.id },
    data: {
      step3FinalOption: optionId,
      step3LockedAt: new Date(),
    },
  });

  await finalizeLevelLock({ runId, levelId, sceneIndex, run });
}

async function finalizeLevelLock(params: {
  runId: string;
  levelId: string;
  sceneIndex: number;
  run: SessionRun;
}) {
  const attempt = await getQuizAttempt(params.runId, params.levelId);
  if (!attempt) {
    return;
  }

  const level = await getReaderLevelForRun(params.run, params.levelId);

  const stars = computeLevelStars({
    level,
    step1FinalOption: attempt.step1FinalOption,
    step2Option: attempt.step2Option,
    step3FinalOption: attempt.step3FinalOption,
  });

  await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      starsEarned: stars.total,
      lockedAt: new Date(),
    },
  });

  await syncRunStars(params.run);
  revalidatePath(`/runs/${params.runId}/scene/${params.sceneIndex}`);
}
