"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOrResumeRun, getRun, markReadingComplete, type SessionRun } from "@/lib/runs";
import { routeForRun } from "@/lib/routing";
import {
  completeModeledWarmup,
  continueFromGuidedWarmup,
  recordGuidedHintOpened,
  submitGuidedWarmup,
} from "@/lib/warmup";
import {
  continueFromLevelFeedback,
  recordLevelHintOpened,
  submitLevelAnswer,
} from "@/lib/levels";

// Shared guard for every warm-up-only action. Throwing here (instead of
// silently no-op-ing) prevents a direct POST from bypassing the read → warmup
// transition and writing warm-up state for a run that hasn't reached that
// phase yet.
async function requireWarmupRun(runId: string): Promise<SessionRun> {
  const run = await getRun(runId);
  if (!run) {
    throw new Error(`Unknown run "${runId}"`);
  }
  if (run.currentPhase !== "warmup") {
    throw new Error(
      `Run "${runId}" is not in warmup phase (current: ${run.currentPhase})`,
    );
  }
  return run;
}

// Level actions require current_phase = level. The saved-complete handoff
// state is read-only on the client side (no mutation actions bound to it), so
// we do not accept `complete` here — only a run actively on a level can open a
// hint, submit, or press Continue.
async function requireLevelRun(runId: string): Promise<SessionRun> {
  const run = await getRun(runId);
  if (!run) {
    throw new Error(`Unknown run "${runId}"`);
  }
  if (run.currentPhase !== "level") {
    throw new Error(
      `Run "${runId}" is not in level phase (current: ${run.currentPhase})`,
    );
  }
  if (!run.currentLevelId) {
    throw new Error(
      `Run "${runId}" is in level phase but current_level_id is unset`,
    );
  }
  return run;
}

export async function selectStudentAction(formData: FormData): Promise<void> {
  const groupId = String(formData.get("group_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");

  if (!groupId || !studentId) {
    throw new Error("Missing group or student selection");
  }

  const run = await createOrResumeRun({ groupId, studentId });
  redirect(routeForRun(run));
}

export async function finishReadingAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  // markReadingComplete is a no-op for already-completed runs. Route via
  // routeForRun so a completed run goes to the handoff instead of looping
  // through /warmup.
  const run = await markReadingComplete(runId);
  revalidatePath(`/runs/${runId}`, "layout");
  redirect(routeForRun(run));
}

export async function completeModeledWarmupAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  await requireWarmupRun(runId);
  await completeModeledWarmup(runId);
  revalidatePath(`/runs/${runId}/warmup`);
  redirect(`/runs/${runId}/warmup`);
}

export async function submitGuidedWarmupAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const selectedAnswerId = String(formData.get("selected_answer_id") ?? "");
  const usedHint = formData.get("used_hint") === "true";

  if (!runId) {
    throw new Error("Missing run id");
  }
  if (!selectedAnswerId) {
    throw new Error("Missing selected answer");
  }

  const run = await requireWarmupRun(runId);
  await submitGuidedWarmup({ run, selectedAnswerId, usedHint });
  revalidatePath(`/runs/${runId}/warmup`);
  redirect(`/runs/${runId}/warmup`);
}

export async function openGuidedHintAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  await requireWarmupRun(runId);
  await recordGuidedHintOpened(runId);
  revalidatePath(`/runs/${runId}/warmup`);
  redirect(`/runs/${runId}/warmup?hint=open`);
}

export async function continueFromGuidedWarmupAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  const run = await requireWarmupRun(runId);
  await continueFromGuidedWarmup(run);
  revalidatePath(`/runs/${runId}`, "layout");
  redirect(`/runs/${runId}/level`);
}

export async function openLevelHintAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  const run = await requireLevelRun(runId);
  await recordLevelHintOpened({ run, levelId: run.currentLevelId! });
  revalidatePath(`/runs/${runId}/level`);
  redirect(`/runs/${runId}/level?hint=open`);
}

export async function submitLevelAnswerAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  const selectedAnswerId = String(formData.get("selected_answer_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }
  if (!selectedAnswerId) {
    throw new Error("Missing selected answer");
  }

  const run = await requireLevelRun(runId);
  await submitLevelAnswer({ run, selectedAnswerId });
  revalidatePath(`/runs/${runId}/level`);
  redirect(`/runs/${runId}/level`);
}

export async function continueFromLevelFeedbackAction(formData: FormData): Promise<void> {
  const runId = String(formData.get("run_id") ?? "");
  if (!runId) {
    throw new Error("Missing run id");
  }

  const run = await requireLevelRun(runId);
  await continueFromLevelFeedback(run);
  revalidatePath(`/runs/${runId}`, "layout");
  redirect(`/runs/${runId}/level`);
}
