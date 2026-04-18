"use client";

import Link from "next/link";
import { useState } from "react";
import { finishReadingAction } from "@/app/actions";
import type { TranscriptScene } from "@/lib/domain";

type ReadingSurfaceProps = {
  runId: string;
  isComplete: boolean;
  previously: string | null;
  summary: string;
  scenes: TranscriptScene[];
};

type View = { kind: "orientation" } | { kind: "scene"; index: number };

export function ReadingSurface({
  runId,
  isComplete,
  previously,
  summary,
  scenes,
}: ReadingSurfaceProps) {
  // Completed runs skip straight to the transcript — there's no new reading
  // work to orient to, only a link back to the finished episode.
  const [view, setView] = useState<View>(
    isComplete ? { kind: "scene", index: 0 } : { kind: "orientation" },
  );

  if (view.kind === "orientation") {
    return (
      <section className="reading-orientation panel stack" aria-label="Episode orientation">
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
        <div className="continue-row">
          <button
            type="button"
            className="primary"
            onClick={() => setView({ kind: "scene", index: 0 })}
          >
            Start Reading
          </button>
        </div>
      </section>
    );
  }

  const sceneIndex = view.index;
  const scene = scenes[sceneIndex];
  const isFirstScene = sceneIndex === 0;
  const isLastScene = sceneIndex === scenes.length - 1;

  const goPrev = () => {
    if (isFirstScene) {
      setView({ kind: "orientation" });
    } else {
      setView({ kind: "scene", index: sceneIndex - 1 });
    }
  };

  const goNext = () => {
    if (!isLastScene) {
      setView({ kind: "scene", index: sceneIndex + 1 });
    }
  };

  return (
    <div className="reading-scene" aria-label={`Scene ${sceneIndex + 1} of ${scenes.length}`}>
      <section className="reading-scene-main" aria-label="Scene dialog">
        <header className="reading-scene-header">
          <p className="eyebrow">
            Scene {sceneIndex + 1} of {scenes.length}
          </p>
        </header>
        <ol className="transcript-turns">
          {scene.turns.map((turn) => (
            <li key={turn.turn_id} className="turn">
              <span className="turn-speaker">{turn.speaker}</span>
              <p className="turn-text">{turn.text}</p>
            </li>
          ))}
        </ol>

        <div className="scene-nav">
          {isFirstScene ? (
            isComplete ? (
              <span />
            ) : (
              <button type="button" className="secondary" onClick={goPrev}>
                Back to summary
              </button>
            )
          ) : (
            <button type="button" className="secondary" onClick={goPrev}>
              ← Previous scene
            </button>
          )}

          {!isLastScene ? (
            <button type="button" className="primary" onClick={goNext}>
              Next scene →
            </button>
          ) : isComplete ? (
            <Link href={`/runs/${runId}/level`} className="primary">
              Back to your finished episode
            </Link>
          ) : (
            <form action={finishReadingAction} className="scene-nav-form">
              <input type="hidden" name="run_id" value={runId} />
              <button type="submit" className="primary">
                Continue
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="reading-scene-drawer" aria-label="Scene summary">
        <p className="eyebrow">
          Scene {sceneIndex + 1} of {scenes.length}
        </p>
        <p className="scene-summary">{scene.summary}</p>
      </aside>
    </div>
  );
}
