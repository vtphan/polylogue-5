"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { openQuizPanelAction, recordSceneViewAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import { QuizPanel } from "@/app/runs/[runId]/_components/QuizPanel";
import type { ReaderLevel } from "@/lib/content";
import type { TranscriptScene, TranscriptTurn } from "@/lib/domain";
import type { QuizAttempt } from "@prisma/client";

type SceneSummary = {
  scene_id: string;
  index: number;
  summary: string;
  turns: TranscriptTurn[];
  level: ReaderLevel | null;
  flaggedTurn: TranscriptTurn | null;
};

type ContinuousSceneReaderProps = {
  runId: string;
  episodeTitle: string;
  episodeSummary: string;
  characters: string[];
  scenes: TranscriptScene[];
  levels: ReaderLevel[];
  attempts: QuizAttempt[];
  initialSceneIndex: number;
  openLevelId: string | null;
  runStarsEarned: number;
  readingFinished: boolean;
  runHref: string;
};

function capitalize(id: string): string {
  if (!id) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function ContinuousSceneReader({
  runId,
  episodeTitle,
  episodeSummary,
  characters,
  scenes,
  levels,
  attempts,
  initialSceneIndex,
  openLevelId,
  runStarsEarned,
  readingFinished,
  runHref,
}: ContinuousSceneReaderProps) {
  const sceneSummaries = useMemo<SceneSummary[]>(
    () =>
      scenes.map((scene, index) => {
        const sceneTurnIds = new Set(scene.turns.map((turn) => turn.turn_id));
        const level = levels.find((entry) => sceneTurnIds.has(entry.turn_id)) ?? null;
        const flaggedTurn = level
          ? scene.turns.find((turn) => turn.turn_id === level.turn_id) ?? null
          : null;
        return {
          scene_id: scene.scene_id,
          index: index + 1,
          summary: scene.summary,
          turns: scene.turns.filter((turn) => turn.kind !== "action"),
          level,
          flaggedTurn,
        };
      }),
    [scenes, levels],
  );

  const attemptsByLevelId = useMemo(
    () => new Map(attempts.map((attempt) => [attempt.levelId, attempt])),
    [attempts],
  );

  const levelSceneIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const scene of sceneSummaries) {
      if (scene.level) {
        map.set(scene.level.level_id, scene.index);
      }
    }
    return map;
  }, [sceneSummaries]);

  // The scene whose quiz is open (if any). Freezes the rail label during
  // quiz mode so the student sees "Scene N of M" matched to the question.
  const frozenSceneIndex = openLevelId ? levelSceneIndex.get(openLevelId) ?? null : null;

  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(
    Math.min(Math.max(initialSceneIndex, 1), sceneSummaries.length),
  );

  const displayedScene = useMemo(() => {
    const targetIndex = frozenSceneIndex ?? currentSceneIndex;
    return sceneSummaries.find((scene) => scene.index === targetIndex) ?? sceneSummaries[0];
  }, [sceneSummaries, frozenSceneIndex, currentSceneIndex]);

  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const sceneRefs = useRef<Map<number, HTMLElement>>(new Map());
  const didInitialScrollRef = useRef(false);
  const lastPersistedSceneRef = useRef<number | null>(null);

  // One-time scroll to initial scene on first mount. Subsequent URL changes
  // (quiz open/close append ?open) preserve scroll because the client
  // component does not remount across these navigations.
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    didInitialScrollRef.current = true;
    const target = sceneRefs.current.get(
      Math.min(Math.max(initialSceneIndex, 1), sceneSummaries.length),
    );
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, [initialSceneIndex, sceneSummaries.length]);

  // Intersection-driven current-scene tracking. Middle 30% of the scroll
  // container is the trigger band.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            index: Number((entry.target as HTMLElement).dataset.sceneIndex ?? 0),
            ratio: entry.intersectionRatio,
          }))
          .filter((hit) => hit.index >= 1);

        if (visible.length === 0) return;

        visible.sort((a, b) => b.ratio - a.ratio);
        setCurrentSceneIndex((prev) => (prev === visible[0].index ? prev : visible[0].index));
      },
      {
        root: container,
        rootMargin: "-35% 0px -35% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const node of sceneRefs.current.values()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sceneSummaries.length]);

  // Persist current scene to the run record (fire-and-forget, debounced).
  // Skipped while the quiz is open so closing doesn't snap the rail.
  useEffect(() => {
    if (frozenSceneIndex !== null) return;
    if (lastPersistedSceneRef.current === currentSceneIndex) return;

    const timeout = window.setTimeout(() => {
      const fd = new FormData();
      fd.append("run_id", runId);
      fd.append("scene_index", String(currentSceneIndex));
      void recordSceneViewAction(fd);
      lastPersistedSceneRef.current = currentSceneIndex;
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [currentSceneIndex, frozenSceneIndex, runId]);

  const activeLevel = openLevelId
    ? levels.find((level) => level.level_id === openLevelId) ?? null
    : null;
  const activeAttempt = activeLevel ? attemptsByLevelId.get(activeLevel.level_id) ?? null : null;
  const activeFlaggedTurn = activeLevel
    ? sceneSummaries.find((scene) => scene.level?.level_id === activeLevel.level_id)?.flaggedTurn ??
      null
    : null;

  return (
    <div className={`scene-shell${openLevelId ? " scene-shell--quiz-open" : ""}`}>
      <header className="scene-shell__header">
        <div className="scene-shell__titles">
          <p className="eyebrow">Episode</p>
          <h1 className="scene-shell__title">
            {episodeTitle}{" "}
            <details className="episode-about">
              <summary className="episode-about__toggle" aria-label="About this episode">
                ⓘ
              </summary>
              <div className="episode-about__popover" role="note">
                <p className="eyebrow">About this episode</p>
                <p>{episodeSummary}</p>
              </div>
            </details>
          </h1>
        </div>
        <ul className="scene-shell__characters" aria-label="Characters in this episode">
          {characters.map((id) => (
            <li key={id} className="character-chip">
              {capitalize(id)}
            </li>
          ))}
        </ul>
      </header>

      <div className="scene-shell__columns">
        <section
          className="scene-left"
          aria-label="Episode dialog"
          ref={(node) => {
            scrollContainerRef.current = node;
          }}
        >
          <div className="scene-scroll">
            {sceneSummaries.map((scene) => (
              <section
                key={scene.scene_id}
                className="scene-anchor"
                data-scene-index={scene.index}
                ref={(node) => {
                  if (node) sceneRefs.current.set(scene.index, node);
                  else sceneRefs.current.delete(scene.index);
                }}
              >
                <ol className="scene-turns">
                  {scene.turns.map((turn) => {
                    const isFlagged =
                      scene.level !== null && scene.level.turn_id === turn.turn_id;
                    return (
                      <li
                        key={turn.turn_id}
                        className={`scene-turn scene-turn--dialog${
                          isFlagged ? " scene-turn--flagged" : ""
                        }`}
                      >
                        <p className="scene-turn__speaker">{turn.speaker}</p>
                        <p className="scene-turn__text">{turn.text}</p>
                        {isFlagged && scene.level ? (
                          <FlaggedTurnIcon
                            runId={runId}
                            sceneIndex={scene.index}
                            levelId={scene.level.level_id}
                            attempt={attemptsByLevelId.get(scene.level.level_id) ?? null}
                            isOpen={openLevelId === scene.level.level_id}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </section>

        <aside className="scaffold-panel" aria-label="Reading scaffold">
          <section className="scaffold-block scaffold-block--scene">
            <p className="eyebrow">
              Scene {displayedScene.index} of {sceneSummaries.length}
            </p>
            <p className="scaffold-block__body">{displayedScene.summary}</p>
          </section>

          {activeLevel ? (
            <QuizPanel
              runId={runId}
              sceneIndex={frozenSceneIndex ?? displayedScene.index}
              level={activeLevel}
              attempt={activeAttempt}
              flaggedTurn={activeFlaggedTurn}
            />
          ) : null}
        </aside>
      </div>

      <nav className="scene-bottom-bar" aria-label="Episode navigation">
        <div className="scene-bottom-bar__side scene-bottom-bar__side--left" />
        <div className="scene-bottom-bar__center">
          <StarRow earned={runStarsEarned} />
        </div>
        <div className="scene-bottom-bar__side scene-bottom-bar__side--right">
          {readingFinished ? (
            <Link href={`${runHref}/complete`} className="primary">
              Recap →
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

function FlaggedTurnIcon({
  runId,
  sceneIndex,
  levelId,
  attempt,
  isOpen,
}: {
  runId: string;
  sceneIndex: number;
  levelId: string;
  attempt: QuizAttempt | null;
  isOpen: boolean;
}) {
  const locked = Boolean(attempt?.lockedAt);
  const variant = isOpen
    ? " flagged-turn__chip--open"
    : locked
      ? " flagged-turn__chip--locked"
      : "";
  const label = isOpen
    ? "Question is open in the right column"
    : locked
      ? "Review this question"
      : "Open the question for this turn";

  return (
    <form action={openQuizPanelAction} className="flagged-turn__form">
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="scene_index" value={sceneIndex} />
      <input type="hidden" name="level_id" value={levelId} />
      <button
        type="submit"
        className={`flagged-turn__chip${variant}`}
        title={label}
        aria-label={label}
      >
        ?
      </button>
    </form>
  );
}
