"use client";

import type { AssistivePackage, PersistedSession, Transcript } from "@/lib/types/content";
import { transcriptTurnIdToAppKey } from "@/lib/content/turn-ids";

type EpisodeReadingViewProps = {
  assistivePackage: AssistivePackage;
  onSelectFocalTurn: (turnId: string) => void;
  session: PersistedSession;
  transcript: Transcript;
};

function turnLabel(turnId: string): string {
  return turnId.toUpperCase();
}

export function EpisodeReadingView({
  assistivePackage,
  onSelectFocalTurn,
  session,
  transcript,
}: EpisodeReadingViewProps) {
  const focalTurnIds = assistivePackage.analytic_core.passages[0]?.target_turn_ids ?? [];
  const selectedTurnId = session.current_focal_turn_id;
  const selectedAttentionTargets = assistivePackage.front_door_support.attention_targets.filter((item) =>
    selectedTurnId ? item.source_turns?.includes(selectedTurnId) : false,
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
      <section className="lens-panel rounded-[2rem] p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Episode Reading
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Whole discussion with focal turns in context
            </h2>
          </div>

          <div className="rounded-full border border-[var(--line)] bg-[var(--background)]/70 px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]">
            Active student: {session.active_student_id}
          </div>
        </div>

        <div className="grid gap-3">
          {transcript.turns.map((turn) => {
            const appTurnId = transcriptTurnIdToAppKey(turn.turn_id);
            const isFocal = focalTurnIds.includes(appTurnId);
            const isSelected = selectedTurnId === appTurnId;

            return (
              <article
                key={turn.turn_id}
                className={`rounded-[1.35rem] border px-4 py-4 transition ${
                  isSelected
                    ? "border-[var(--accent)] bg-[linear-gradient(180deg,rgba(246,211,191,0.7),rgba(255,247,240,0.95))] shadow-[0_12px_28px_rgba(191,90,54,0.12)]"
                    : isFocal
                      ? "border-[var(--gold)] bg-[linear-gradient(180deg,rgba(255,248,229,0.84),rgba(255,252,246,0.94))]"
                      : "border-[var(--line)] bg-white/72"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[var(--surface-ink)]">
                    {turn.speaker}
                  </div>
                  <div className="flex items-center gap-2">
                    {isFocal && (
                      <span className="rounded-full bg-[var(--gold)]/18 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                        focal
                      </span>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:rgba(37,50,68,0.62)]">
                      {turnLabel(appTurnId)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
                  {turn.sentences.map((sentence) => (
                    <p key={sentence.sentence_id}>{sentence.text}</p>
                  ))}
                </div>

                {isFocal && (
                  <div className="mt-4">
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        isSelected
                          ? "bg-[var(--surface-ink)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--surface-ink)]"
                      }`}
                      onClick={() => onSelectFocalTurn(appTurnId)}
                      type="button"
                    >
                      {isSelected ? "Selected for this round" : "Select focal turn"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="lens-dark-panel rounded-[2rem] p-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Current focus
        </p>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Stage
            </div>
            <div className="mt-2 text-lg font-semibold capitalize">{session.current_backbone_stage}</div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Selected focal turn
            </div>
            <div className="mt-2 text-lg font-semibold">
              {selectedTurnId ? turnLabel(selectedTurnId) : "Choose one from the transcript"}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              What to notice
            </div>
            {selectedAttentionTargets.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-white/82">
                The immediate noticing support will appear here once the group chooses a focal turn.
              </p>
            ) : (
              <div className="mt-3 grid gap-3">
                {selectedAttentionTargets.map((target) => (
                  <div
                    key={target.support_id}
                    className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86"
                  >
                    {target.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/82">
            Focal-turn selection is a group action. The active student chooses for the table, and that turn
            stays locked until the round-robin first responses are complete.
          </div>
        </div>
      </section>
    </section>
  );
}
