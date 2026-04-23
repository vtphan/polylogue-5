"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { recordSceneViewAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import { QuizPanel } from "@/app/runs/[runId]/_components/QuizPanel";
import type { ReaderLevel } from "@/lib/content";
import type { TranscriptScene, TranscriptTurn } from "@/lib/domain";
import { computeLevelStars, type LevelStars } from "@/lib/grading";
import type { QuizAttempt } from "@prisma/client";

type SceneSummary = {
  scene_id: string;
  index: number;
  summary: string;
  turns: TranscriptTurn[];
};

type ContinuousSceneReaderProps = {
  runId: string;
  episodeTitle: string;
  episodeSummary: string;
  scenes: TranscriptScene[];
  levels: ReaderLevel[];
  attempts: QuizAttempt[];
  initialSceneIndex: number;
  openLevelId: string | null;
  runStarsEarned: number;
};

function speakerDisplayName(id: string): string {
  const firstToken = id.split("_")[0];
  if (!firstToken) return id;
  return firstToken.charAt(0).toUpperCase() + firstToken.slice(1);
}

export function ContinuousSceneReader({
  runId,
  episodeTitle,
  episodeSummary,
  scenes,
  levels,
  attempts,
  initialSceneIndex,
  openLevelId,
  runStarsEarned,
}: ContinuousSceneReaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const openQuiz = useCallback(
    (levelId: string) => {
      router.replace(`${pathname}?open=${encodeURIComponent(levelId)}`, { scroll: false });
    },
    [pathname, router],
  );

  const closeQuiz = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);
  const levelsByTurnId = useMemo(
    () => new Map(levels.map((level) => [level.turn_id, level])),
    [levels],
  );

  const sceneSummaries = useMemo<SceneSummary[]>(
    () =>
      scenes.map((scene, index) => ({
        scene_id: scene.scene_id,
        index: index + 1,
        summary: scene.summary,
        turns: scene.turns,
      })),
    [scenes],
  );

  const attemptsByLevelId = useMemo(
    () => new Map(attempts.map((attempt) => [attempt.levelId, attempt])),
    [attempts],
  );

  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(
    Math.min(Math.max(initialSceneIndex, 1), sceneSummaries.length),
  );

  const displayedScene = useMemo(
    () =>
      sceneSummaries.find((scene) => scene.index === currentSceneIndex) ??
      sceneSummaries[0],
    [sceneSummaries, currentSceneIndex],
  );

  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const sceneRefs = useRef<Map<number, HTMLElement>>(new Map());
  const didInitialScrollRef = useRef(false);
  const lastPersistedSceneRef = useRef<number | null>(null);

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

  const sceneRatioCacheRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const cache = sceneRatioCacheRef.current;
    cache.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.sceneIndex ?? 0);
          if (idx < 1) continue;
          cache.set(idx, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestIdx = 0;
        let bestRatio = -1;
        for (const [idx, ratio] of cache) {
          if (ratio > bestRatio) {
            bestIdx = idx;
            bestRatio = ratio;
          }
        }
        if (bestIdx > 0) {
          setCurrentSceneIndex((prev) => (prev === bestIdx ? prev : bestIdx));
        }
      },
      {
        root: container,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const node of sceneRefs.current.values()) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sceneSummaries.length]);

  useEffect(() => {
    if (lastPersistedSceneRef.current === currentSceneIndex) return;

    const timeout = window.setTimeout(() => {
      const fd = new FormData();
      fd.append("run_id", runId);
      fd.append("scene_index", String(currentSceneIndex));
      void recordSceneViewAction(fd);
      lastPersistedSceneRef.current = currentSceneIndex;
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [currentSceneIndex, runId]);

  const activeLevel = openLevelId
    ? levels.find((level) => level.level_id === openLevelId) ?? null
    : null;
  const activeAttempt = activeLevel ? attemptsByLevelId.get(activeLevel.level_id) ?? null : null;
  const activeAnchorSpeaker = useMemo(() => {
    if (!activeLevel) return "";
    for (const scene of scenes) {
      for (const turn of scene.turns) {
        if (turn.turn_id === activeLevel.turn_id) {
          return speakerDisplayName(turn.speaker);
        }
      }
    }
    return "";
  }, [activeLevel, scenes]);

  return (
    <div className={`scene-shell${openLevelId ? " scene-shell--quiz-open" : ""}`}>
      <header className="scene-shell__header">
        <div className="scene-shell__titles">
          <p className="eyebrow">Episode</p>
          <div className="scene-shell__title-row">
            <h1 className="scene-shell__title">{episodeTitle}</h1>
            <div className="scene-shell__header-actions">
              <details className="episode-about">
                <summary className="episode-about__toggle" aria-label="Synopsis">
                  <span>Synopsis</span>
                </summary>
                <div className="episode-about__popover" role="note">
                  <p className="eyebrow">Synopsis</p>
                  <p>{episodeSummary}</p>
                </div>
              </details>
            </div>
          </div>
        </div>
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
                    const flaggedLevel =
                      levelsByTurnId.get(turn.turn_id) ?? null;
                    const flaggedAttempt = flaggedLevel
                      ? attemptsByLevelId.get(flaggedLevel.level_id) ?? null
                      : null;
                    const flaggedOpen =
                      flaggedLevel !== null && openLevelId === flaggedLevel.level_id;
                    const toggleQuiz = flaggedLevel
                      ? () => {
                          if (window.getSelection()?.toString()) return;
                          if (flaggedOpen) {
                            closeQuiz();
                          } else {
                            openQuiz(flaggedLevel.level_id);
                          }
                        }
                      : undefined;
                    const handleIconClick = flaggedLevel
                      ? (event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation();
                          if (flaggedOpen) {
                            closeQuiz();
                          } else {
                            openQuiz(flaggedLevel.level_id);
                          }
                        }
                      : undefined;
                    return (
                      <li
                        key={turn.turn_id}
                        className={`scene-turn scene-turn--dialog${
                          flaggedLevel ? " scene-turn--flagged" : ""
                        }${flaggedOpen ? " scene-turn--flagged-open" : ""}`}
                        onClick={toggleQuiz}
                      >
                        <p className="scene-turn__speaker">{turn.speaker}</p>
                        <p className="scene-turn__text">{turn.text}</p>
                        {flaggedLevel && handleIconClick ? (
                          <FlaggedTurnIcon
                            level={flaggedLevel}
                            attempt={flaggedAttempt}
                            isOpen={flaggedOpen}
                            onClick={handleIconClick}
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
              sceneIndex={currentSceneIndex}
              level={activeLevel}
              attempt={activeAttempt}
              anchorSpeaker={activeAnchorSpeaker}
              onClose={closeQuiz}
            />
          ) : null}
        </aside>
      </div>

      <nav className="scene-bottom-bar" aria-label="Episode navigation">
        <div className="scene-bottom-bar__side scene-bottom-bar__side--left">
          <Link href="/stories" className="ghost">
            ← Episodes
          </Link>
        </div>
        <div className="scene-bottom-bar__center">
          <StarRow earned={runStarsEarned} total={levels.length * 3} />
        </div>
        <div className="scene-bottom-bar__side scene-bottom-bar__side--right" />
      </nav>
    </div>
  );
}

function FlaggedTurnIcon({
  level,
  attempt,
  isOpen,
  onClick,
}: {
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  isOpen: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const locked = Boolean(attempt?.lockedAt);
  const stars: LevelStars | null = locked && attempt
    ? computeLevelStars({
        level,
        step1FinalOption: attempt.step1FinalOption,
        step2Option: attempt.step2Option,
        step3FinalOption: attempt.step3FinalOption,
      })
    : null;

  let icon = "?";
  let variant = "";
  let label = locked ? "Re-open this question" : "Open the question for this turn";

  if (stars) {
    // The chip's ✓/✗ reflects Star 2 (polarity) specifically — the central
    // critical-thinking call. The three-star row below carries the full
    // per-star breakdown.
    if (stars.polarity) {
      icon = "✓";
      variant = " flagged-turn__chip--correct";
    } else {
      icon = "✗";
      variant = " flagged-turn__chip--wrong";
    }
  }

  if (isOpen) {
    variant += " flagged-turn__chip--open";
    label = "Close the question";
  }

  return (
    <div className="flagged-turn__chip-stack">
      <button
        type="button"
        className={`flagged-turn__chip${variant}`}
        title={label}
        aria-label={label}
        onClick={onClick}
      >
        {icon}
      </button>
      {stars ? (
        <div className="flagged-turn__stars" aria-label={`${stars.total} of 3 stars`}>
          <StarPip earned={stars.claim} />
          <StarPip earned={stars.polarity} />
          <StarPip earned={stars.reasoning} />
        </div>
      ) : null}
    </div>
  );
}

function StarPip({ earned }: { earned: boolean }) {
  return (
    <span
      className={`flagged-turn__star${earned ? " flagged-turn__star--earned" : " flagged-turn__star--empty"}`}
      aria-hidden="true"
    >
      ★
    </span>
  );
}
