"use client";

import { useState } from "react";
import type { PersistedSession } from "@/lib/types/content";

type RevisionViewProps = {
  onContinue: () => void;
  onSaveRevision: (payload: { revisionText: string }) => void;
  session: PersistedSession;
};

function latestResponse(session: PersistedSession): string {
  const currentTurnId = session.current_focal_turn_id;
  if (!currentTurnId) {
    return "";
  }

  const responseKey = `${currentTurnId}:${session.active_student_id}`;
  const value = session.responses[responseKey];
  if (typeof value === "object" && value !== null && "responseText" in value) {
    return String(value.responseText);
  }

  return "";
}

export function RevisionView({ onContinue, onSaveRevision, session }: RevisionViewProps) {
  const priorResponse = latestResponse(session);
  const [revisionText, setRevisionText] = useState(priorResponse);

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-white/88 p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
            Revision
          </p>
          <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Confirm or revise the current student response.
          </h2>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--background)]/72 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Prior response
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              {priorResponse || "No prior response found for the active student on this turn."}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--surface-ink)]">
              Revised response
            </span>
            <textarea
              className="min-h-48 rounded-[1rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-3 outline-none"
              onChange={(event) => setRevisionText(event.target.value)}
              value={revisionText}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!revisionText.trim()}
              onClick={() => onSaveRevision({ revisionText: revisionText.trim() })}
              type="button"
            >
              Save revision
            </button>
            <button
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
              onClick={onContinue}
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Stopping point
        </p>
        <div className="mt-5 rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
          Reaching this screen counts as the v1 `revise` stopping point. The next slice can attach a dedicated
          pause/resume prompt here for guided pacing.
        </div>
      </section>
    </section>
  );
}
