"use client";

import Link from "next/link";
import { useState } from "react";
import { finishReadingAction } from "@/app/actions";
import type { TranscriptScene } from "@/lib/domain";

type ReadingSurfaceProps = {
  episodeTitle: string;
  runId: string;
  isComplete: boolean;
  previously: string | null;
  summary: string;
  scenes: TranscriptScene[];
};

type View = { kind: "orientation" } | { kind: "scene"; index: number };

export function ReadingSurface({
  episodeTitle,
  runId,
  isComplete,
  previously,
  summary,
  scenes,
}: ReadingSurfaceProps) {
  // Completed runs skip orientation — there's no new reading work to orient
  // to, only scene navigation plus a link back to the finished episode.
  const [view, setView] = useState<View>(
    isComplete ? { kind: "scene", index: 0 } : { kind: "orientation" },
  );

  const isOrientation = view.kind === "orientation";
  const sceneIndex = isOrientation ? -1 : view.index;
  const scene = !isOrientation ? scenes[sceneIndex] : null;
  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === scenes.length - 1;

  const phaseEyebrow = isOrientation
    ? "Reading · Overview"
    : `Reading · Scene ${sceneIndex + 1} of ${scenes.length}`;

  const goToScene = (index: number) => setView({ kind: "scene", index });
  const goPrev = () => {
    if (isOrientation) return;
    if (isFirstScene) {
      setView({ kind: "orientation" });
    } else {
      goToScene(sceneIndex - 1);
    }
  };
  const goNext = () => {
    if (isOrientation) {
      goToScene(0);
    } else if (!isLastScene) {
      goToScene(sceneIndex + 1);
    }
  };

  // Left button in the bottom bar. Orientation has no back target; completed
  // runs on scene 1 also hide it (no orientation to return to).
  const renderPrev = () => {
    if (isOrientation) return <span />;
    if (isFirstScene && isComplete) return <span />;
    return (
      <button type="button" className="secondary" onClick={goPrev}>
        {isFirstScene ? "Back to overview" : "← Previous scene"}
      </button>
    );
  };

  // Right control. Orientation → Start Reading. Scenes 1..N-1 → Next scene.
  // Final scene → Continue (incomplete) or Back-to-finished link (complete).
  const renderPrimary = () => {
    if (isOrientation) {
      return (
        <button type="button" className="primary" onClick={() => goToScene(0)}>
          Start Reading
        </button>
      );
    }
    if (!isLastScene) {
      return (
        <button type="button" className="primary" onClick={goNext}>
          Next scene →
        </button>
      );
    }
    if (isComplete) {
      return (
        <Link href={`/runs/${runId}/level`} className="primary">
          Back to your finished episode
        </Link>
      );
    }
    return (
      <form action={finishReadingAction} className="reading-bottom-bar__form">
        <input type="hidden" name="run_id" value={runId} />
        <button type="submit" className="primary">
          Continue
        </button>
      </form>
    );
  };

  return (
    <div className="reading-workspace">
      <header className="workspace-header">
        <div className="workspace-titles">
          <p className="eyebrow">{phaseEyebrow}</p>
          <h1 className="workspace-title">{episodeTitle}</h1>
        </div>
      </header>

      <section className="reading-canvas" aria-label={isOrientation ? "Episode overview" : `Scene ${sceneIndex + 1}`}>
        {isOrientation ? (
          <div className="orientation-stack">
            {previously ? (
              <div className="orientation-block">
                <p className="eyebrow">Previously</p>
                <p className="orientation-body">{previously}</p>
              </div>
            ) : null}
            <div className="orientation-block">
              <p className="eyebrow">What this episode is about</p>
              <p className="orientation-body">{summary}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="scene-info" aria-label="Scene summary">
              <p className="eyebrow">
                Scene {sceneIndex + 1} of {scenes.length}
              </p>
              <p className="scene-summary">{scene!.summary}</p>
            </div>
            <ol className="transcript-turns">
              {scene!.turns.map((turn) => (
                <li key={turn.turn_id} className="turn">
                  <span className="turn-speaker">{turn.speaker}</span>
                  <p className="turn-text">{turn.text}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <nav className="reading-bottom-bar" aria-label="Reading navigation">
        <div className="reading-bottom-bar__side reading-bottom-bar__side--left">
          {renderPrev()}
        </div>
        <div className="reading-bottom-bar__center" aria-hidden={isOrientation}>
          {isOrientation ? null : (
            <span className="reading-bottom-bar__indicator">
              Scene {sceneIndex + 1} of {scenes.length}
            </span>
          )}
        </div>
        <div className="reading-bottom-bar__side reading-bottom-bar__side--right">
          {renderPrimary()}
        </div>
      </nav>
    </div>
  );
}
