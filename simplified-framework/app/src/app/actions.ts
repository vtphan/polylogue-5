"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOrResumeRun, markReadingComplete, type SessionRun } from "@/lib/runs";

// Map a run's current state to the Milestone-1-visible route that should
// reopen it. Later milestones will extend this for level / complete phases.
function routeForRun(run: SessionRun): string {
  if (run.status === "complete" || run.currentPhase === "complete") {
    return `/runs/${run.runId}/warmup`;
  }
  if (run.readingComplete || run.currentPhase !== "read") {
    return `/runs/${run.runId}/warmup`;
  }
  return `/runs/${run.runId}/entry`;
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

  await markReadingComplete(runId);
  revalidatePath(`/runs/${runId}`, "layout");
  redirect(`/runs/${runId}/warmup`);
}
