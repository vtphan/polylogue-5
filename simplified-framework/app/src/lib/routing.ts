import type { SessionRun } from "@prisma/client";

// Phase-driven route resolver. One source of truth used by both the identity
// redirect (after createOrResumeRun) and the warm-up page's phase gate, so
// routeForRun(run) can be trusted not to send a run back to a page whose own
// gate will reject it.
export function routeForRun(run: SessionRun): string {
  if (run.status === "complete" || run.currentPhase === "complete") {
    return `/runs/${run.runId}/level`;
  }
  switch (run.currentPhase) {
    case "level":
      return `/runs/${run.runId}/level`;
    case "warmup":
      return `/runs/${run.runId}/warmup`;
    case "read":
    default:
      return `/runs/${run.runId}/entry`;
  }
}
