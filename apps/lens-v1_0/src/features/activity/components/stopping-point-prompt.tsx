"use client";

import type { StoppingPoint } from "@/features/activity/engine";

type StoppingPointPromptProps = {
  focalTurnId: string | null;
  onContinue: () => void;
  onPause: () => void;
  point: StoppingPoint;
};

function promptTitle(point: StoppingPoint): string {
  switch (point) {
    case "round-complete":
      return "Good stopping point after the round";
    case "revision-reached":
      return "Good stopping point after revision";
    case "episode-complete":
      return "Episode complete";
    default:
      return "Stopping point";
  }
}

export function StoppingPointPrompt({
  focalTurnId,
  onContinue,
  onPause,
  point,
}: StoppingPointPromptProps) {
  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        Stopping point
      </p>
      <h2 className="mt-3 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
        {promptTitle(point)}
      </h2>
      <p className="mt-4 text-sm leading-6 text-white/84">
        {focalTurnId
          ? `The group has reached a structural checkpoint on ${focalTurnId.toUpperCase()}.`
          : "The group has reached a structural checkpoint in the current session."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
          onClick={onContinue}
          type="button"
        >
          Continue
        </button>
        <button
          className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-white"
          onClick={onPause}
          type="button"
        >
          Pause for now
        </button>
      </div>
    </section>
  );
}
