"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FaHeart, FaStar } from "react-icons/fa6";
import type { Transcript } from "@/lib/domain";
import { getAllTurns } from "@/lib/transcript";

type SessionChromeData = {
  studentName: string;
  groupName: string;
  badgeCounts: Record<"correct_answer", number>;
  totalBadges: number;
  completedLevels: number;
  totalLevels: number;
  completedSteps: number;
  totalSteps: number;
  remainingSteps: number;
  lifelines: { initial: number; used: number; remaining: number };
};

type WorkspaceFlash = {
  key: string;
  tone: "success" | "encourage";
  title: string;
  detail: string;
};

type LessonWorkspaceProps = {
  episodeTitle: string;
  progressLabel: string;
  phaseLabel?: string | null;
  sessionChrome: SessionChromeData;
  transcript: Transcript;
  targetTurnId: string;
  drawerTitle: string;
  reopenLabel: string;
  flash?: WorkspaceFlash | null;
  children: ReactNode;
};

const BADGE_CHIPS = [
  {
    key: "correct_answer",
    description: "You locked the right answer on a level",
    Icon: FaStar,
  },
] as const;

function WorkspaceFlashMessage({ flash }: { flash: WorkspaceFlash }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 4200);
    const url = new URL(window.location.href);
    if (url.searchParams.has("flash")) {
      url.searchParams.delete("flash");
      window.history.replaceState({}, "", url.toString());
    }
    return () => window.clearTimeout(timeout);
  }, [flash.key]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`workspace-flash workspace-flash--${flash.tone}`}
      role="status"
      aria-live="polite"
    >
      <p className="workspace-flash-title">{flash.title}</p>
      <p className="workspace-flash-detail">{flash.detail}</p>
    </div>
  );
}

// Transcript-first layout per the "episode turns visible at all times"
// principle. The work (warm-up / level question / feedback) lives in a
// drawer: side panel on >= 900px, bottom sheet on narrower viewports.
//
// Open-by-default on every render so (a) arriving at a phase shows the work
// without extra clicks and (b) after any server-action redirect the student
// lands back in the answer surface. Closing is purely ephemeral client state.
export function LessonWorkspace({
  episodeTitle,
  progressLabel,
  phaseLabel,
  sessionChrome,
  transcript,
  targetTurnId,
  drawerTitle,
  reopenLabel,
  flash,
  children,
}: LessonWorkspaceProps) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const targetRef = useRef<HTMLLIElement | null>(null);
  const allTurns = useMemo(() => getAllTurns(transcript), [transcript]);
  const progressPercent = Math.max(
    0,
    Math.min(100, (sessionChrome.completedSteps / sessionChrome.totalSteps) * 100),
  );

  // Auto-scroll the targeted turn into center view on mount and whenever the
  // target changes (e.g., advancing from level N → N+1 renders a new page
  // with a new targetTurnId).
  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetTurnId]);

  return (
    <div className={`lesson-workspace${drawerOpen ? " drawer-open" : ""}`}>
      <header className="workspace-header">
        <div className="workspace-titles">
          <p className="eyebrow">{progressLabel}</p>
          <h1 className="workspace-title">{episodeTitle}</h1>
        </div>
        <div className="workspace-header-actions">
          {phaseLabel ? (
            <span className="phase-pill">{phaseLabel}</span>
          ) : null}
          {!drawerOpen ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setDrawerOpen(true)}
            >
              {reopenLabel}
            </button>
          ) : null}
        </div>
      </header>

      <section
        className="transcript-canvas"
        aria-label="Episode transcript"
      >
        <ol className="transcript-turns">
          {allTurns.map((turn) => {
            const isTarget = turn.turn_id === targetTurnId;
            return (
              <li
                key={turn.turn_id}
                ref={isTarget ? targetRef : undefined}
                className={`turn${isTarget ? " turn--target" : ""}`}
                aria-current={isTarget ? "true" : undefined}
              >
                <span className="turn-speaker">{turn.speaker}</span>
                <p className="turn-text">{turn.text}</p>
                {isTarget && !drawerOpen ? (
                  <button
                    type="button"
                    className="turn-chip"
                    onClick={() => setDrawerOpen(true)}
                  >
                    {reopenLabel}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      {drawerOpen ? (
        <>
          <div
            className="drawer-backdrop"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="work-drawer" aria-label={drawerTitle}>
            <header className="drawer-header">
              <p className="eyebrow">{drawerTitle}</p>
              <button
                type="button"
                className="drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close and read the transcript"
              >
                ×
              </button>
            </header>
            <div className="drawer-body">{children}</div>
          </aside>
        </>
      ) : null}

      {flash ? <WorkspaceFlashMessage flash={flash} /> : null}

      <aside className="session-bar" aria-label="Session status">
        <div className="session-bar__primary">
          <div className="session-bar__identity">
            <p className="session-bar__eyebrow">{sessionChrome.studentName}</p>
            <p className="session-bar__headline">
              {sessionChrome.groupName} · {progressLabel}
              {phaseLabel ? ` · ${phaseLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="session-bar__stats" aria-label="Your progress">
          <div className="session-bar__medals" aria-label="Lives and stars">
            {sessionChrome.lifelines.initial > 0 ? (
              <span
                className="session-medal-group"
                aria-label={`Lives left: ${sessionChrome.lifelines.remaining} of ${sessionChrome.lifelines.initial}`}
              >
                {Array.from({ length: sessionChrome.lifelines.initial }).map(
                  (_, index) => {
                    const spent = index >= sessionChrome.lifelines.remaining;
                    return (
                      <span
                        key={index}
                        className={`session-medal session-medal--heart${
                          spent ? " session-medal--heart-spent" : ""
                        }`}
                        title={
                          spent
                            ? "Hint used — one life spent"
                            : "Life still available"
                        }
                        aria-hidden="true"
                      >
                        <FaHeart />
                      </span>
                    );
                  },
                )}
              </span>
            ) : null}
            {BADGE_CHIPS.map(({ key, description, Icon }) => {
              const count = sessionChrome.badgeCounts[key];
              if (count <= 0) {
                return null;
              }
              const tooltip = `${description} (${count})`;
              return (
                <span
                  key={key}
                  className="session-medal-group"
                  aria-label={`Correct answers: ${count}`}
                >
                  {Array.from({ length: count }).map((_, index) => (
                    <span
                      key={index}
                      className="session-medal session-medal--star"
                      title={tooltip}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                  ))}
                </span>
              );
            })}
          </div>
        </div>

        <div className="session-bar__progress" aria-label="Session progress">
          <div className="session-bar__progress-copy">
            <p className="session-bar__progress-label">
              {sessionChrome.completedSteps} of {sessionChrome.totalSteps} steps done
            </p>
            <p className="session-bar__progress-subdued">
              {sessionChrome.remainingSteps === 0
                ? "Final step reached"
                : `${sessionChrome.remainingSteps} ${
                    sessionChrome.remainingSteps === 1 ? "step" : "steps"
                  } left`}
            </p>
          </div>
          <div className="session-progress-track" aria-hidden="true">
            <span
              className="session-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
