import "server-only";

import {
  countBadgesByCategory,
  deriveEarnedBadges,
  loadCompletionInputs,
  type BadgeCategory,
} from "@/lib/completion";
import { getStudent } from "@/lib/config";
import type { LessonPackage } from "@/lib/domain";
import type { SessionRun } from "@/lib/runs";

export type SessionChromeData = {
  studentName: string;
  groupName: string;
  badgeCounts: Record<BadgeCategory, number>;
  totalBadges: number;
  completedLevels: number;
  totalLevels: number;
  completedSteps: number;
  totalSteps: number;
  remainingSteps: number;
};

export async function loadSessionChrome(
  run: SessionRun,
  lessonPackage: LessonPackage,
): Promise<SessionChromeData> {
  const [studentData, completionInputs] = await Promise.all([
    getStudent(run.groupId, run.studentId),
    loadCompletionInputs(run.runId),
  ]);

  const badges = completionInputs
    ? deriveEarnedBadges(completionInputs, lessonPackage)
    : [];
  const badgeCounts = countBadgesByCategory(badges);
  const completedLevels = completionInputs
    ? completionInputs.levelResponses.filter((response) => response.completedAt).length
    : 0;
  const completedWarmups =
    (completionInputs?.warmupProgress?.modeledComplete ? 1 : 0) +
    (completionInputs?.warmupProgress?.guidedComplete ? 1 : 0);
  const totalSteps = lessonPackage.levels.length + 2;
  const completedSteps = Math.min(totalSteps, completedWarmups + completedLevels);

  return {
    studentName: studentData?.student.name ?? "Student",
    groupName: studentData?.group.name ?? "Group",
    badgeCounts,
    totalBadges: badges.length,
    completedLevels,
    totalLevels: lessonPackage.levels.length,
    completedSteps,
    totalSteps,
    remainingSteps: Math.max(0, totalSteps - completedSteps),
  };
}
