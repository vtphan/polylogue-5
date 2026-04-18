"use client";

import type { AssistivePackage, PersistedSession } from "@/lib/types/content";

type ComparisonViewProps = {
  assistivePackage: AssistivePackage;
  onOpenDiscussion: () => void;
  session: PersistedSession;
};

type SavedResponseCard = {
  judgment: string;
  responseText: string;
  studentId: string;
  turnId: string | null;
};

function getSavedResponses(session: PersistedSession): SavedResponseCard[] {
  return Object.values(session.responses)
    .filter((value): value is SavedResponseCard => {
      return (
        typeof value === "object" &&
        value !== null &&
        "studentId" in value &&
        "responseText" in value
      );
    })
    .filter((value) => value.turnId === session.current_focal_turn_id)
    .map((value) => ({
      ...value,
      judgment:
        typeof session.evaluative_judgments[`${session.current_focal_turn_id}:${value.studentId}`] === "string"
          ? String(session.evaluative_judgments[`${session.current_focal_turn_id}:${value.studentId}`])
          : "unscored",
    }));
}

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

export function ComparisonView({
  assistivePackage,
  onOpenDiscussion,
  session,
}: ComparisonViewProps) {
  const savedResponses = getSavedResponses(session);
  const discussionCues = getDiscussionCues(assistivePackage, session.current_focal_turn_id);
  const primaryCue = discussionCues[0];

  return (
    <section className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-white/88 p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Comparison View
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Reveal what each student saw in this focal turn.
            </h2>
          </div>

          <div className="rounded-full border border-[var(--line)] bg-[var(--background)]/70 px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]">
            {session.current_focal_turn_id?.toUpperCase() ?? "turn pending"}
          </div>
        </div>

        <div className="grid gap-3">
          {savedResponses.map((response) => {
            const student = session.roster.find((entry) => entry.id === response.studentId);
            return (
              <article
                key={`${response.turnId}:${response.studentId}`}
                className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--background)]/72 p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-[var(--surface-ink)]">
                    {student?.name ?? response.studentId}
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                    {response.judgment}
                  </span>
                </div>
                <p className="text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">{response.responseText}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Discussion support
        </p>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              First cue
            </div>
            <p className="mt-3 text-sm leading-6 text-white/86">
              {primaryCue && typeof primaryCue === "object" && "text" in primaryCue
                ? String(primaryCue.text)
                : "The first discussion cue for this turn will appear here when available."}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Talk moves
            </div>
            <div className="mt-3 grid gap-2">
              {assistivePackage.discussion_support.talk_moves.slice(0, 3).map((move) => (
                <div key={move} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
                  {move}
                </div>
              ))}
            </div>
          </div>

          <button
            className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
            onClick={onOpenDiscussion}
            type="button"
          >
            Continue to discussion
          </button>
        </div>
      </section>
    </section>
  );
}
