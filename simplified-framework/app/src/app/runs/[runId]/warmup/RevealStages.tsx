"use client";

import { useState, type ReactNode } from "react";

export type RevealStage = {
  key: string;
  label: string;
  content: string;
  advanceButtonLabel: string;
  highlight?: boolean;
};

// Progressive-disclosure helper for the modeled + guided-reveal scaffolds.
// Each press of the advance button unlocks the next stage; the finalAction
// (typically the Continue form) only appears after the last stage has been
// revealed. Reveal state is intentionally ephemeral — reload starts fresh.
export function RevealStages({
  stages,
  finalAction,
}: {
  stages: RevealStage[];
  finalAction: ReactNode;
}) {
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= stages.length;

  return (
    <div className="reveal-stages">
      <div className="reveal-stack" aria-live="polite">
        {stages.slice(0, revealed).map((stage) => (
          <section
            key={stage.key}
            className={`reveal-stage${stage.highlight ? " reveal-stage--highlight" : ""}`}
          >
            <p className="warmup-label">{stage.label}</p>
            <p>{stage.content}</p>
          </section>
        ))}
      </div>

      {allRevealed ? (
        <div className="reveal-final">{finalAction}</div>
      ) : (
        <div className="reveal-advance-row">
          <button
            type="button"
            className="secondary reveal-advance"
            onClick={() => setRevealed((n) => Math.min(n + 1, stages.length))}
          >
            {stages[revealed].advanceButtonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
