"use client";

import type { PersistedSession } from "@/lib/types/content";

type ProgressPanelProps = {
  session: PersistedSession;
};

type Badge = {
  id: string;
  label: string;
};

function getBadges(session: PersistedSession): Badge[] {
  return Array.isArray(session.progress_state.badges)
    ? (session.progress_state.badges as Badge[])
    : [];
}

function completedCount(session: PersistedSession): number {
  return Object.values(session.cohort_response_state).filter((value) => value === "saved").length;
}

export function ProgressPanel({ session }: ProgressPanelProps) {
  const badges = getBadges(session);
  const recognitions = Array.isArray(session.recognition_state.peer_awards)
    ? (session.recognition_state.peer_awards as Array<{
        id: string;
        studentId: string;
        studentName: string;
        label: string;
      }>)
    : [];

  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
        Progress and recognition
      </p>

      <div className="mt-5 grid gap-4">
        <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Momentum
          </div>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-white/84">
            <div>Stage: {session.current_backbone_stage}</div>
            <div>Saved responses this round: {completedCount(session)}</div>
            <div>
              Revision saved: {session.progress_state.revision_saved === true ? "yes" : "no"}
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            App-awarded badges
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.length === 0 ? (
              <span className="text-sm text-white/72">Badges will appear as the group progresses.</span>
            ) : (
              badges.map((badge) => (
                <span
                  key={badge.id}
                  className="rounded-full bg-[var(--gold)] px-3 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                >
                  {badge.label}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
            Peer recognition
          </div>
          <div className="mt-3 text-sm leading-6 text-white/84">
            {recognitions.length === 0
              ? "Peer recognitions will appear after the group names concrete contributions during completion."
              : recognitions.map((recognition) => `${recognition.studentName}: ${recognition.label}`).join(", ")}
          </div>
        </div>
      </div>
    </section>
  );
}
