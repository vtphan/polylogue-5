"use client";

import { useState } from "react";
import type { PersistedSession } from "@/lib/types/content";

type CompletionViewProps = {
  onAwardRecognition: (payload: { studentId: string; label: string }) => void;
  onReturnToStart: () => void;
  onSaveTakeaway: (payload: { takeaway: string }) => void;
  session: PersistedSession;
};

const recognitionLabels = [
  "Evidence Spotter",
  "Bridge Builder",
  "Careful Listener",
];

export function CompletionView({
  onAwardRecognition,
  onReturnToStart,
  onSaveTakeaway,
  session,
}: CompletionViewProps) {
  const [takeaway, setTakeaway] = useState(session.transfer_takeaway ?? "");
  const [selectedRecognition, setSelectedRecognition] = useState(recognitionLabels[0]);
  const completedCount = Object.values(session.cohort_response_state).filter(
    (value) => value === "saved",
  ).length;
  const peerAwards = Array.isArray(session.recognition_state.peer_awards)
    ? (session.recognition_state.peer_awards as Array<{
        id: string;
        studentId: string;
        studentName: string;
        label: string;
      }>)
    : [];

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-white/88 p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
            Episode Completion
          </p>
          <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Wrap the round and carry one move back to PBL.
          </h2>
        </div>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--background)]/72 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Completion summary
            </div>
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              <div>Current focal turn: {session.current_focal_turn_id?.toUpperCase() ?? "none"}</div>
              <div>Students with saved round responses: {completedCount}</div>
              <div>Revision saved: {session.progress_state.revision_saved === true ? "yes" : "no"}</div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--surface-ink)]">
              What could your group carry into your own discussion?
            </span>
            <textarea
              className="min-h-40 rounded-[1rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-3 outline-none"
              onChange={(event) => setTakeaway(event.target.value)}
              value={takeaway}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!takeaway.trim()}
              onClick={() => onSaveTakeaway({ takeaway: takeaway.trim() })}
              type="button"
            >
              Save takeaway
            </button>
            <button
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
              onClick={onReturnToStart}
              type="button"
            >
              Return to start
            </button>
          </div>

          <div className="rounded-[1.35rem] border border-[var(--line)] bg-white/72 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Peer recognition
            </div>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              End the round by naming a concrete contribution another student made in the discussion.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {recognitionLabels.map((label) => (
                <button
                  key={label}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${
                    selectedRecognition === label
                      ? "bg-[var(--surface-ink)] text-white"
                      : "border border-[var(--line)] bg-white text-[var(--surface-ink)]"
                  }`}
                  onClick={() => setSelectedRecognition(label)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {session.roster.map((student) => (
                <button
                  key={student.id}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                  onClick={() =>
                    onAwardRecognition({
                      studentId: student.id,
                      label: selectedRecognition,
                    })
                  }
                  type="button"
                >
                  Recognize {student.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Status
        </p>
        <div className="mt-5 rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
          This view is the first explicit episode-complete state for the v1 backbone. The next iteration can
          layer in next-episode continuation and richer progress/recognition summaries.
        </div>
        <div className="mt-4 rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Shared recognitions
          </div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-white/84">
            {peerAwards.length === 0 ? (
              <div>No peer recognitions saved yet.</div>
            ) : (
              peerAwards.map((award) => (
                <div key={award.id}>
                  {award.studentName}: {award.label}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
