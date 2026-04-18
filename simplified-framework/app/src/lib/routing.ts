import type { Run } from "@prisma/client";

export function routeForRun(run: Run): string {
  if (run.readingFinishedAt) {
    return `/runs/${run.runId}/complete`;
  }

  return `/runs/${run.runId}/scene/${run.currentSceneIndex}`;
}
