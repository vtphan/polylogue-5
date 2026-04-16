"use client";

import { useState } from "react";
import type { AssistivePackage, PersistedSession } from "@/lib/types/content";

type DiscussionViewProps = {
  assistivePackage: AssistivePackage;
  onMoveToRevision: () => void;
  session: PersistedSession;
};

function getDiscussionCues(assistivePackage: AssistivePackage, turnId: string | null) {
  if (!turnId) {
    return [];
  }

  const discussionCueRoot = assistivePackage.discussion_support.discussion_cues as Record<string, unknown>;
  const byTurn = discussionCueRoot.by_turn;
  if (!byTurn || typeof byTurn !== "object") {
    return [];
  }

  const byTurnRecord = byTurn as Record<string, unknown>;
  const cues = byTurnRecord[turnId];
  return Array.isArray(cues) ? cues : [];
}

export function DiscussionView({
  assistivePackage,
  onMoveToRevision,
  session,
}: DiscussionViewProps) {
  const discussionCues = getDiscussionCues(assistivePackage, session.current_focal_turn_id);
  const [cueIndex, setCueIndex] = useState(0);
  const cue = discussionCues[cueIndex];
  const consensusChecks = assistivePackage.discussion_support.consensus_checks;
  const [consensusIndex, setConsensusIndex] = useState(0);

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-white/88 p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Discussion / Deepening
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Face-to-face discussion support for the current focal turn.
            </h2>
          </div>

          <div className="rounded-full border border-[var(--line)] bg-[var(--background)]/70 px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]">
            {session.current_focal_turn_id?.toUpperCase() ?? "turn pending"}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--background)]/72 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Current discussion cue
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              {cue && typeof cue === "object" && "text" in cue
                ? String(cue.text)
                : "A discussion cue for this turn will appear here when available."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)] disabled:opacity-50"
                disabled={discussionCues.length <= 1}
                onClick={() => setCueIndex((current) => (current + 1) % discussionCues.length)}
                type="button"
              >
                Next cue
              </button>
              <button
                className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white"
                onClick={onMoveToRevision}
                type="button"
              >
                Move to revision
              </button>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/72 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Consensus check
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              {consensusChecks[consensusIndex] ??
                "A post-discussion consensus check will appear here when available."}
            </p>
            <div className="mt-4">
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)] disabled:opacity-50"
                disabled={consensusChecks.length <= 1}
                onClick={() => setConsensusIndex((current) => (current + 1) % consensusChecks.length)}
                type="button"
              >
                Next consensus check
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Talk moves
        </p>

        <div className="mt-5 grid gap-3">
          {assistivePackage.discussion_support.talk_moves.map((move) => (
            <div key={move} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
              {move}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
