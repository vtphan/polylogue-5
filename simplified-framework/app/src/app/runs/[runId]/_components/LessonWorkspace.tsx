"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FaArrowsRotate,
  FaBookOpen,
  FaCircleCheck,
  FaFlagCheckered,
  FaLightbulb,
  FaSeedling,
} from "react-icons/fa6";
import type { Transcript } from "@/lib/domain";

type SessionChromeData = {
  studentName: string;
  groupName: string;
  badgeCounts: Record<
    | "read_the_episode"
    | "finished_warmup"
    | "level_complete"
    | "used_help_and_kept_going"
    | "changed_my_mind"
    | "episode_complete",
    number
  >;
  totalBadges: number;
  completedLevels: number;
  totalLevels: number;
  completedSteps: number;
  totalSteps: number;
  remainingSteps: number;
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
  phaseLabel: string;
  sessionChrome: SessionChromeData;
  transcript: Transcript;
  targetTurnId: string;
  drawerTitle: string;
  reopenLabel: string;
  flash?: WorkspaceFlash | null;
  children: ReactNode;
};

const BADGE_CHIPS = [
  { key: "read_the_episode", label: "Read", Icon: FaBookOpen },
  { key: "finished_warmup", label: "Warm-up", Icon: FaSeedling },
  { key: "level_complete", label: "Levels", Icon: FaCircleCheck },
  { key: "used_help_and_kept_going", label: "Hints", Icon: FaLightbulb },
  { key: "changed_my_mind", label: "Changed", Icon: FaArrowsRotate },
  { key: "episode_complete", label: "Done", Icon: FaFlagCheckered },
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
          <span className="phase-pill">{phaseLabel}</span>
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
          {transcript.turns.map((turn) => {
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
              {sessionChrome.groupName} · {progressLabel} · {phaseLabel}
            </p>
          </div>
        </div>

        <div className="session-bar__stats" aria-label="Your progress">
          <div className="session-bar__badges" aria-label="Earned badges">
            {BADGE_CHIPS.map(({ key, label, Icon }) => (
              <span key={key} className="session-badge-chip" title={label}>
                <Icon aria-hidden="true" />
                <span className="session-badge-chip__count">
                  {sessionChrome.badgeCounts[key]}
                </span>
              </span>
            ))}
          </div>
          <div className="session-pill">
            <span className="session-pill__count">{sessionChrome.totalBadges}</span>
            <span className="session-pill__label">badges</span>
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
