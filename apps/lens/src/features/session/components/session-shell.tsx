"use client";

import { useEffect, useMemo, useState } from "react";
import { ComparisonView } from "@/features/activity/components/comparison-view";
import { CompletionView } from "@/features/activity/components/completion-view";
import { FirstResponseView } from "@/features/activity/components/first-response-view";
import { DiscussionView } from "@/features/activity/components/discussion-view";
import { RevisionView } from "@/features/activity/components/revision-view";
import { StoppingPointPrompt } from "@/features/activity/components/stopping-point-prompt";
import { ProgressPanel } from "@/features/progress/components/progress-panel";
import { useSessionStore } from "@/features/session/store/use-session-store";
import { EpisodeReadingView } from "@/features/episode/components/episode-reading-view";
import { getLastSessionId, loadSession, loadSessionIndex } from "@/lib/storage/session-storage";
import type {
  AssistivePackage,
  PersistedSession,
  SessionConfig,
  SessionIndexEntry,
  Student,
  Transcript,
} from "@/lib/types/content";

type SessionShellProps = {
  assistivePackage: AssistivePackage;
  sessionConfig: SessionConfig;
  episodeTitle: string;
  episodeContext: string;
  transcript: Transcript;
};

type Screen = "start" | "setup" | "landing" | "reading" | "respond" | "compare" | "discuss" | "revise" | "complete";

function deriveRoster(sessionConfig: SessionConfig): Student[] {
  return sessionConfig.group?.students ?? [];
}

function parseRosterDraft(rosterDraft: string): Student[] {
  return rosterDraft
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `s${index + 1}`,
      name,
    }));
}

function loadResumeTarget(): PersistedSession | null {
  const lastSessionId = getLastSessionId();
  if (!lastSessionId) {
    return null;
  }

  return loadSession(lastSessionId);
}

function stageLabel(session: PersistedSession | null): string {
  if (!session) {
    return "not started";
  }

  return session.current_backbone_stage;
}

export function SessionShell({
  assistivePackage,
  sessionConfig,
  episodeTitle,
  episodeContext,
  transcript,
}: SessionShellProps) {
  const session = useSessionStore((state) => state.session);
  const initializeSession = useSessionStore((state) => state.initializeSession);
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

  const defaultRoster = useMemo(() => deriveRoster(sessionConfig), [sessionConfig]);
  const [resumeTarget] = useState<PersistedSession | null>(() => loadResumeTarget());
  const [screen, setScreen] = useState<Screen>(() => (resumeTarget ? "landing" : "start"));
  const [recentSessions, setRecentSessions] = useState<SessionIndexEntry[]>(() => loadSessionIndex());
  const [rosterDraft, setRosterDraft] = useState(
    defaultRoster.map((student) => student.name).join("\n"),
  );
  const [resumeError, setResumeError] = useState<string | null>(null);

  useEffect(() => {
    if (resumeTarget) {
      hydrateSession(resumeTarget);
    }
  }, [hydrateSession, resumeTarget]);

  function refreshRecentSessions() {
    setRecentSessions(loadSessionIndex());
  }

  function startNewSession() {
    setResumeError(null);
    setRosterDraft(defaultRoster.map((student) => student.name).join("\n"));
    setScreen("setup");
  }

  function pauseToStart() {
    refreshRecentSessions();
    setResumeError(null);
    setScreen("start");
  }

  function resumeSession(localSessionId: string) {
    const storedSession = loadSession(localSessionId);
    if (!storedSession) {
      setResumeError("That saved local session could not be loaded. It may be stale or malformed.");
      refreshRecentSessions();
      return;
    }

    setResumeError(null);
    hydrateSession(storedSession);
    setScreen(
      storedSession.current_backbone_stage === "revise"
        ? "revise"
        : storedSession.progress_state.episode_complete === true
          ? "complete"
        : storedSession.current_backbone_stage === "discuss"
          ? "discuss"
          : storedSession.current_backbone_stage === "compare"
            ? "compare"
            : storedSession.current_backbone_stage === "respond" && storedSession.current_focal_turn_id
              ? "respond"
              : storedSession.current_focal_turn_id
                ? "reading"
                : "landing",
    );
  }

  function continueFromSetup() {
    const roster = parseRosterDraft(rosterDraft);
    if (roster.length === 0) {
      setResumeError("Enter at least one student before starting the shared-device session.");
      return;
    }

    setResumeError(null);
    initializeSession(sessionConfig, roster);
    refreshRecentSessions();
    setScreen("landing");
  }

  const latestSessionEntry = recentSessions[0] ?? null;

  const resolvedScreen: Screen =
    session?.progress_state.episode_complete === true
      ? "complete"
      : session?.current_backbone_stage === "revise"
      ? "revise"
      : session?.current_backbone_stage === "discuss" &&
          (screen === "compare" || screen === "discuss" || screen === "respond")
        ? "discuss"
        : session?.current_backbone_stage === "compare" &&
            (screen === "respond" || screen === "compare")
          ? "compare"
          : screen;

  return (
    <section className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-white/88 p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
        {resolvedScreen === "start" && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Start / Resume
              </p>
              <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Pick up a table session or start a new one.
              </h2>
            </div>

            <button
              className="rounded-[1.25rem] bg-[var(--surface-ink)] px-5 py-4 text-left text-white"
              onClick={startNewSession}
              type="button"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--gold)]">
                Start new
              </div>
              <div className="mt-1 text-lg font-semibold">Create a fresh shared-device session</div>
            </button>

            {latestSessionEntry ? (
              <button
                className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--background)]/70 px-5 py-4 text-left"
                onClick={() => resumeSession(latestSessionEntry.local_session_id)}
                type="button"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Resume latest
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--surface-ink)]">
                  {latestSessionEntry.group_label}
                </div>
                <div className="mt-2 text-sm leading-6 text-[color:rgba(37,50,68,0.72)]">
                  Stage <code>{latestSessionEntry.current_backbone_stage}</code>
                  {latestSessionEntry.current_focal_turn_id ? (
                    <>
                      {" "}on <code>{latestSessionEntry.current_focal_turn_id}</code>
                    </>
                  ) : null}
                </div>
              </button>
            ) : null}

            {resumeError ? (
              <div className="rounded-[1.25rem] border border-[rgba(146,74,48,0.24)] bg-[rgba(255,245,236,0.92)] px-4 py-4 text-sm leading-6 text-[rgba(114,56,34,0.92)]">
                {resumeError}
              </div>
            ) : null}

            <div className="grid gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Recent sessions
              </div>
              {recentSessions.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] px-4 py-5 text-sm leading-6 text-[color:rgba(29,36,48,0.72)]">
                  No local sessions yet. Starting a new one will create the first browser-local record.
                </div>
              ) : (
                recentSessions.slice(0, 4).map((entry) => (
                  <button
                    key={entry.local_session_id}
                    className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-4 text-left"
                    onClick={() => resumeSession(entry.local_session_id)}
                    type="button"
                  >
                    <div className="text-sm font-semibold text-[var(--surface-ink)]">{entry.group_label}</div>
                    <div className="mt-1 text-sm text-[color:rgba(37,50,68,0.72)]">
                      {entry.config_id} · {entry.current_backbone_stage}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                      updated {new Date(entry.updated_at).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {resolvedScreen === "setup" && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Group Setup
              </p>
              <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Confirm the roster for this shared device.
              </h2>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--surface-ink)]">
                One student per line
              </span>
              <textarea
                className="min-h-48 rounded-[1.25rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-4 outline-none"
                onChange={(event) => setRosterDraft(event.target.value)}
                value={rosterDraft}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white"
                onClick={continueFromSetup}
                type="button"
              >
                Continue to episode
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={pauseToStart}
                type="button"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {resolvedScreen === "landing" && session && (
          <div className="grid gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Episode Landing
              </p>
              <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {episodeTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:rgba(29,36,48,0.78)]">{episodeContext}</p>
            </div>

            <div className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)]/70 p-5 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]">
              <div>
                Active stage: <code>{stageLabel(session)}</code>
              </div>
              <div>
                Active student: <code>{session.active_student_id}</code>
              </div>
              <div>
                Pacing policy: <code>{session.pacing_policy}</code>
              </div>
              <div>
                Focal turn: <code>{session.current_focal_turn_id ?? "not selected yet"}</code>
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Group roster
              </div>
              <div className="flex flex-wrap gap-2">
                {session.roster.map((student) => {
                  const active = student.id === session.active_student_id;
                  return (
                    <span
                      key={student.id}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        active
                          ? "bg-[var(--surface-ink)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--surface-ink)]"
                      }`}
                    >
                      {student.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setScreen("reading")}
                type="button"
              >
                Begin reading
              </button>
              <button
                className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white"
                onClick={pauseToStart}
                type="button"
              >
                Pause and return
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={() => setScreen("setup")}
                type="button"
              >
                Edit roster
              </button>
            </div>
          </div>
        )}

        {resolvedScreen === "reading" && session && (
          <div className="grid gap-4">
            <div className="flex justify-end">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={pauseToStart}
                type="button"
              >
                Pause session
              </button>
            </div>
            <EpisodeReadingView
              assistivePackage={assistivePackage}
              onSelectFocalTurn={(turnId) => {
                selectFocalTurn(turnId);
                setScreen("respond");
              }}
              session={session}
              transcript={transcript}
            />
          </div>
        )}

        {resolvedScreen === "respond" && session && (
          <div className="grid gap-4">
            <div className="flex justify-end">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={pauseToStart}
                type="button"
              >
                Pause session
              </button>
            </div>
            <FirstResponseView
              assistivePackage={assistivePackage}
              onBackToReading={() => setScreen("reading")}
              onSaveResponse={(payload) => {
                saveActiveStudentResponse(payload);
              }}
              session={session}
              transcript={transcript}
            />
          </div>
        )}

        {resolvedScreen === "compare" && session && (
          <div className="grid gap-4">
            <div className="flex justify-end">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={pauseToStart}
                type="button"
              >
                Pause session
              </button>
            </div>
            <ComparisonView
              assistivePackage={assistivePackage}
              onOpenDiscussion={() => {
                openDiscussion();
                setScreen("discuss");
              }}
              session={session}
            />
          </div>
        )}

        {resolvedScreen === "discuss" && session && (
          <div className="grid gap-4">
            <div className="flex justify-end">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={pauseToStart}
                type="button"
              >
                Pause session
              </button>
            </div>
            <DiscussionView
              assistivePackage={assistivePackage}
              onMoveToRevision={() => {
                moveToRevision();
                setScreen("revise");
              }}
              session={session}
            />
          </div>
        )}

        {resolvedScreen === "revise" && session && (
          <div className="grid gap-6">
            <RevisionView
              onContinue={() => {
                completeEpisode();
                setScreen("complete");
              }}
              onSaveRevision={(payload) => saveRevision(payload)}
              session={session}
            />

            {session.pacing_policy === "guided" && stoppingPoint === "revision-reached" && (
              <StoppingPointPrompt
                focalTurnId={session.current_focal_turn_id}
                onContinue={() => {
                  completeEpisode();
                  setScreen("complete");
                }}
                onPause={pauseToStart}
                point={stoppingPoint}
              />
            )}
          </div>
        )}

        {resolvedScreen === "complete" && session && (
          <CompletionView
            onAwardRecognition={(payload) => awardPeerRecognition(payload)}
            onReturnToStart={pauseToStart}
            onSaveTakeaway={(payload) => saveTransferTakeaway(payload)}
            session={session}
          />
        )}
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Shell status
        </p>
        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Current screen
            </div>
            <div className="mt-2 text-lg font-semibold capitalize">{resolvedScreen}</div>
          </div>
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
            This shell now treats pause and resume as first-class local behaviors. Returning to start never
            discards progress because each stage change is persisted into browser-local storage.
          </div>
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
            Resume behavior is backed by the browser-local session index. New sessions are created from the
            current config and saved immediately when initialized.
          </div>
          {session && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              Latest checkpoint: stage <code>{session.current_backbone_stage}</code>
              {session.current_focal_turn_id ? (
                <>
                  {" "}at <code>{session.current_focal_turn_id}</code>
                </>
              ) : null}
              . Active student is <code>{session.active_student_id}</code>.
            </div>
          )}
          {resolvedScreen === "reading" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              The reading view now renders the real transcript, marks package-driven focal turns, and uses
              current assistive-package attention targets as immediate noticing support.
            </div>
          )}
          {resolvedScreen === "respond" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              The first-response flow is now round-robin and turn-bound. It saves a short response plus an
              evaluative judgment against the currently selected focal turn.
            </div>
          )}
          {resolvedScreen === "compare" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              Once every student in the round has saved a response, the app now auto-advances into a
              comparison reveal with saved responses, the first discussion cue, and starter talk moves.
            </div>
          )}
          {resolvedScreen === "discuss" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              The discussion view now supports cue cycling, full talk-move access, and consensus checks
              before the group advances to revision.
            </div>
          )}
          {resolvedScreen === "revise" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              Reaching revision now marks the v1 `revise` stopping point. Saving a revision updates the
              current-turn response in browser-local state.
            </div>
          )}
          {resolvedScreen === "complete" && (
            <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
              The flow now has an explicit completion and transfer state, so guided sessions can stop cleanly
              and open sessions can continue without losing the round summary.
            </div>
          )}
        </div>
      </section>

      {session && <ProgressPanel session={session} />}
    </section>
  );
}
