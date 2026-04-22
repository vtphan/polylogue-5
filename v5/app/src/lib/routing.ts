import type { Run } from "@prisma/client";

export function routeForRun(run: Run): string {
  const sceneIndex = Math.max(1, run.currentSceneIndex);
  return `/runs/${run.runId}/scene/${sceneIndex}`;
}
