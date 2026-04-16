"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ComparisonView } from "@/features/activity/components/comparison-view";
import { CompletionView } from "@/features/activity/components/completion-view";
import { DiscussionView } from "@/features/activity/components/discussion-view";
import { FirstResponseView } from "@/features/activity/components/first-response-view";
import { RevisionView } from "@/features/activity/components/revision-view";
import { StoppingPointPrompt } from "@/features/activity/components/stopping-point-prompt";
import { EpisodeReadingView } from "@/features/episode/components/episode-reading-view";
import { deriveSessionRouteStage, sessionStagePath, type SessionRouteStage } from "@/features/session/lib/routes";
import { useSessionStore } from "@/features/session/store/use-session-store";
import { loadSession } from "@/lib/storage/session-storage";
import type { AssistivePackage, Transcript } from "@/lib/types/content";

type SessionStagePageProps = {
  assistivePackage: AssistivePackage;
  episodeTitle: string;
  sessionId: string;
  stage: SessionRouteStage;
  transcript: Transcript;
};

function currentStepLabel(stage: SessionRouteStage): string {
  const labels: Record<SessionRouteStage, string> = {
    landing: "landing",
    read: "reading",
    respond: "first response",
    compare: "comparison",
    discuss: "discussion",
    revise: "revision",
    complete: "completion",
  };

  return labels[stage];
}

export function SessionStagePage({
  assistivePackage,
  episodeTitle,
  sessionId,
  stage,
  transcript,
}: SessionStagePageProps) {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const selectFocalTurn = useSessionStore((state) => state.selectFocalTurn);
  const saveActiveStudentResponse = useSessionStore((state) => state.saveActiveStudentResponse);
  const openDiscussion = useSessionStore((state) => state.openDiscussion);
  const moveToRevision = useSessionStore((state) => state.moveToRevision);
  const saveRevision = useSessionStore((state) => state.saveRevision);
  const completeEpisode = useSessionStore((state) => state.completeEpisode);
  const saveTransferTakeaway = useSessionStore((state) => state.saveTransferTakeaway);
  const awardPeerRecognition = useSessionStore((state) => state.awardPeerRecognition);
  const stoppingPoint = useSessionStore((state) => state.stoppingPoint);
  const storedSession = useMemo(() => {
    if (session?.local_session_id === sessionId) {
      return session;
    }

    return loadSession(sessionId);
  }, [session, sessionId]);

  useEffect(() => {
    if (session?.local_session_id === sessionId) {
      return;
    }

    if (!storedSession) {
      return;
    }

    hydrateSession(storedSession);
  }, [hydrateSession, session?.local_session_id, sessionId, storedSession]);

  useEffect(() => {
    if (!session || session.local_session_id !== sessionId) {
      return;
    }

    const nextStage = deriveSessionRouteStage(session);
    if (nextStage !== stage) {
      router.replace(sessionStagePath(sessionId, nextStage));
    }
  }, [router, session, sessionId, stage]);

  const rosterSummary = useMemo(() => {
    if (!session || session.local_session_id !== sessionId) {
      return [];
    }

    return session.roster.map((student) => ({
      ...student,
      active: student.id === session.active_student_id,
      saved: session.cohort_response_state[student.id] === "saved",
    }));
  }, [session, sessionId]);

  if (!storedSession) {
    return (
      <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
        <section className="mx-auto max-w-4xl">
          <div className="lens-panel rounded-[2rem] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Session Missing
            </p>
            <h1 className="mt-3 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              This saved session is no longer available in local storage.
            </h1>
            <div className="mt-6">
              <Link
                className="rounded-full bg-[var(--surface-ink)] px-5 py-3 text-sm font-semibold text-white"
                href="/"
              >
                Return home
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!session || session.local_session_id !== sessionId) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="lens-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                {episodeTitle}
              </p>
              <h1 className="mt-2 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {currentStepLabel(stage)}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {rosterSummary.map((student) => (
                <span
                  key={student.id}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    student.saved
                      ? "bg-[var(--moss)] text-white"
                      : student.active
                        ? "bg-[var(--surface-ink)] text-white"
                        : "border border-[var(--line)] bg-white text-[var(--surface-ink)]"
                  }`}
                >
                  {student.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
              href="/"
            >
              Pause and return home
            </Link>
            <Link
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
              href={`/session/${sessionId}`}
            >
              Session overview
            </Link>
          </div>
        </header>

        {stage === "read" && (
          <EpisodeReadingView
            assistivePackage={assistivePackage}
            onSelectFocalTurn={(turnId) => {
              selectFocalTurn(turnId);
            }}
            session={session}
            transcript={transcript}
          />
        )}

        {stage === "respond" && (
          <FirstResponseView
            assistivePackage={assistivePackage}
            onBackToReading={() => router.push(`/session/${sessionId}/read`)}
            onSaveResponse={(payload) => {
              saveActiveStudentResponse(payload);
            }}
            session={session}
            transcript={transcript}
          />
        )}

        {stage === "compare" && (
          <ComparisonView
            assistivePackage={assistivePackage}
            onOpenDiscussion={() => {
              openDiscussion();
            }}
            session={session}
          />
        )}

        {stage === "discuss" && (
          <DiscussionView
            assistivePackage={assistivePackage}
            onMoveToRevision={() => {
              moveToRevision();
            }}
            session={session}
          />
        )}

        {stage === "revise" && (
          <div className="grid gap-6">
            <RevisionView
              onContinue={() => {
                completeEpisode();
              }}
              onSaveRevision={(payload) => saveRevision(payload)}
              session={session}
            />

            {session.pacing_policy === "guided" && stoppingPoint === "revision-reached" && (
              <StoppingPointPrompt
                focalTurnId={session.current_focal_turn_id}
                onContinue={() => {
                  completeEpisode();
                }}
                onPause={() => router.push("/")}
                point={stoppingPoint}
              />
            )}
          </div>
        )}

        {stage === "complete" && (
          <CompletionView
            onAwardRecognition={(payload) => awardPeerRecognition(payload)}
            onReturnToStart={() => router.push("/")}
            onSaveTakeaway={(payload) => saveTransferTakeaway(payload)}
            session={session}
          />
        )}
      </section>
    </main>
  );
}
