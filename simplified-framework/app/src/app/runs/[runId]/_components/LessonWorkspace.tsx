"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Transcript } from "@/lib/domain";

type LessonWorkspaceProps = {
  episodeTitle: string;
  progressLabel: string;
  phaseLabel: string;
  transcript: Transcript;
  targetTurnId: string;
  drawerTitle: string;
  reopenLabel: string;
  children: ReactNode;
};

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
  transcript,
  targetTurnId,
  drawerTitle,
  reopenLabel,
  children,
}: LessonWorkspaceProps) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const targetRef = useRef<HTMLLIElement | null>(null);

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
    </div>
  );
}
