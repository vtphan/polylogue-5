import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun, listGroupRuns } from "@/lib/runs";
import { getGroup } from "@/lib/config";
import { loadLessonPackage, loadTranscript } from "@/lib/content";
import type { RunPhase } from "@/lib/domain";
import type { SessionRun } from "@prisma/client";
import { ReadingSurface } from "./ReadingSurface";

const PHASE_LABELS: Record<RunPhase | "not_started", string> = {
  not_started: "Not started",
  read: "Reading",
  warmup: "Warm-up",
  level: "Challenge",
  complete: "Complete",
};

type ReadPageProps = {
  params: Promise<{ runId: string }>;
};

function choosePeerRun(current: SessionRun | undefined, candidate: SessionRun): SessionRun {
  if (!current) {
    return candidate;
  }
  if (current.status !== "in_progress" && candidate.status === "in_progress") {
    return candidate;
  }
  if (current.status === "in_progress" && candidate.status !== "in_progress") {
    return current;
  }
  return candidate.updatedAt > current.updatedAt ? candidate : current;
}

export default async function TranscriptReadingPage({ params }: ReadPageProps) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  const [lessonPackage, transcript, group, groupRuns] = await Promise.all([
    loadLessonPackage(run.episodeSource),
    loadTranscript(run.episodeSource),
    getGroup(run.groupId),
    listGroupRuns({
      configId: run.configId,
      episodeSource: run.episodeSource,
      groupId: run.groupId,
    }),
  ]);

  const runsByStudent = new Map<string, SessionRun>();
  for (const entry of groupRuns) {
    runsByStudent.set(
      entry.studentId,
      choosePeerRun(runsByStudent.get(entry.studentId), entry),
    );
  }

  return (
    <div className="page-wide">
      <header className="reading-header">
        <p className="eyebrow">
          {group?.name ?? "Group"} · {lessonPackage.episode.title}
        </p>
        <h1>Read the transcript</h1>
        <p className="subdued">Take your time. When you finish, press Continue.</p>
      </header>

      <ReadingSurface
        runId={run.runId}
        isComplete={run.status === "complete"}
        previously={lessonPackage.episode.previously ?? null}
        summary={lessonPackage.episode.summary}
        scenes={transcript.scenes}
      />

      {group ? (
        <aside className="peer-row" aria-label="Group progress">
          {group.students.map((student) => {
            const otherRun = runsByStudent.get(student.student_id);
            const phase: RunPhase | "not_started" = otherRun
              ? (otherRun.status === "complete"
                  ? "complete"
                  : (otherRun.currentPhase as RunPhase))
              : "not_started";
            const isSelf = student.student_id === run.studentId;
            return (
              <span
                key={student.student_id}
                className={`peer-chip${isSelf ? " self" : ""}`}
              >
                <span className="peer-chip-name">
                  {student.name}
                  {isSelf ? " (you)" : ""}
                </span>
                <span className="peer-chip-status">{PHASE_LABELS[phase]}</span>
              </span>
            );
          })}
        </aside>
      ) : null}

      <Link className="back-link" href={`/runs/${run.runId}/entry`}>
        ← Back to episode
      </Link>
    </div>
  );
}
