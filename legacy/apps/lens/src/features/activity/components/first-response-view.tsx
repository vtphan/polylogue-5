"use client";

import { useMemo, useState } from "react";
import { appKeyToTranscriptTurnId, transcriptTurnIdToAppKey } from "@/lib/content/turn-ids";
import type { AssistivePackage, PersistedSession, Transcript } from "@/lib/types/content";

type FirstResponseViewProps = {
  assistivePackage: AssistivePackage;
  onBackToReading: () => void;
  onSaveResponse: (payload: { judgment: string; responseText: string }) => void;
  session: PersistedSession;
  transcript: Transcript;
};

const judgmentOptions = ["strong", "weak", "questionable"] as const;

export function FirstResponseView({
  assistivePackage,
  onBackToReading,
  onSaveResponse,
  session,
  transcript,
}: FirstResponseViewProps) {
  const [judgment, setJudgment] = useState<string>("questionable");
  const [responseText, setResponseText] = useState<string>("");
  const [supportOpen, setSupportOpen] = useState<boolean>(false);

  const selectedTurn = transcript.turns.find(
    (turn) =>
      session.current_focal_turn_id &&
      transcriptTurnIdToAppKey(turn.turn_id) === session.current_focal_turn_id,
  );

  const attentionTargets = assistivePackage.front_door_support.attention_targets.filter((item) =>
    session.current_focal_turn_id ? item.source_turns?.includes(session.current_focal_turn_id) : false,
  );

  const sentenceFrames = assistivePackage.front_door_support.sentence_frame_seeds.filter((item) =>
    session.current_focal_turn_id ? item.source_turns?.includes(session.current_focal_turn_id) : false,
  );

  const modeledExamples = assistivePackage.front_door_support.modeled_episode_examples.filter((item) =>
    session.current_focal_turn_id ? item.source_turns?.includes(session.current_focal_turn_id) : false,
  );

  const transferExamples = assistivePackage.front_door_support.transfer_examples.filter((item) =>
    session.current_focal_turn_id ? item.source_turns?.includes(session.current_focal_turn_id) : false,
  );

  const probe = useMemo(() => {
    const probesRoot = assistivePackage.diagnostic_support.probes as Record<string, unknown>;
    const facet = probesRoot.facet;
    if (!facet || typeof facet !== "object" || !session.current_focal_turn_id) {
      return null;
    }

    const byTurn = (facet as Record<string, unknown>).by_turn;
    if (!byTurn || typeof byTurn !== "object") {
      return null;
    }

    const candidate = (byTurn as Record<string, unknown>)[session.current_focal_turn_id];
    return typeof candidate === "object" && candidate !== null ? candidate : null;
  }, [assistivePackage.diagnostic_support.probes, session.current_focal_turn_id]);

  const roundProgress = session.roster.map((student) => ({
    ...student,
    state: session.cohort_response_state[student.id],
  }));

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="lens-panel rounded-[2rem] p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              First Response
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              {session.current_focal_turn_id
                ? `Respond to ${session.current_focal_turn_id.toUpperCase()}`
                : "Respond to the selected focal turn"}
            </h2>
          </div>

          <div className="rounded-full border border-[var(--line)] bg-[var(--background)]/70 px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]">
            Active student: {session.active_student_id}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.35rem] border border-[var(--gold)] bg-[linear-gradient(180deg,rgba(255,248,229,0.84),rgba(255,252,246,0.96))] p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--surface-ink)]">
                {selectedTurn?.speaker ?? "Selected turn"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                {session.current_focal_turn_id
                  ? appKeyToTranscriptTurnId(session.current_focal_turn_id)
                  : "turn_pending"}
              </div>
            </div>

            <div className="grid gap-2 text-sm leading-6 text-[color:rgba(29,36,48,0.86)]">
              {selectedTurn?.sentences.map((sentence) => (
                <p key={sentence.sentence_id}>{sentence.text}</p>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.35rem] border border-[var(--line)] bg-white/72 p-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--surface-ink)]">
                What seems strong, weak, or questionable here?
              </span>
              <select
                className="rounded-[1rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-3 outline-none"
                onChange={(event) => setJudgment(event.target.value)}
                value={judgment}
              >
                {judgmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[var(--surface-ink)]">
                Initial response
              </span>
              <textarea
                className="min-h-40 rounded-[1rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-3 outline-none"
                onChange={(event) => setResponseText(event.target.value)}
                placeholder="Write a short first move tied to this focal turn."
                value={responseText}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[var(--surface-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!responseText.trim()}
                onClick={() => onSaveResponse({ judgment, responseText: responseText.trim() })}
                type="button"
              >
                Save response
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={() => setSupportOpen((currentValue) => !currentValue)}
                type="button"
              >
                {supportOpen ? "Hide support" : "Need help"}
              </button>
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--surface-ink)]"
                onClick={onBackToReading}
                type="button"
              >
                Back to reading
              </button>
            </div>

            {supportOpen && (
              <div className="grid gap-3 rounded-[1rem] border border-[var(--line)] bg-[var(--background)]/72 p-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--surface-ink)]">Probe</div>
                  <p className="mt-2 text-sm leading-6 text-[color:rgba(29,36,48,0.82)]">
                    {probe && "question" in probe
                      ? String(probe.question)
                      : "A turn-specific noticing probe will appear here when available."}
                  </p>
                </div>

                {probe && "options" in probe && Array.isArray(probe.options) && (
                  <div className="grid gap-2">
                    {probe.options.slice(0, 3).map((option, index) => (
                      <div
                        key={index}
                        className="rounded-[0.9rem] border border-[var(--line)] bg-white px-3 py-3 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]"
                      >
                        {typeof option === "object" && option !== null && "text" in option
                          ? String(option.text)
                          : "Option unavailable"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="lens-dark-panel rounded-[2rem] p-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Support and handoff
        </p>

        <div className="mt-5 grid gap-4">
          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              What to notice
            </div>
            <div className="mt-3 grid gap-3">
              {attentionTargets.length === 0 ? (
                <p className="text-sm leading-6 text-white/82">
                  Immediate noticing support for this turn will appear here when the package provides it.
                </p>
              ) : (
                attentionTargets.map((target) => (
                  <div key={target.support_id} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
                    {target.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Sentence frames
            </div>
            <div className="mt-3 grid gap-3">
              {sentenceFrames.length === 0 ? (
                <p className="text-sm leading-6 text-white/82">
                  Package-backed sentence frames for this turn will surface here in the support panel slice.
                </p>
              ) : (
                sentenceFrames.slice(0, 2).map((frame) => (
                  <div key={frame.support_id} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
                    <div className="font-semibold">{frame.frame}</div>
                    <div className="mt-1 text-white/74">{frame.seed}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Modeled example
            </div>
            <div className="mt-3 grid gap-3">
              {modeledExamples.length === 0 ? (
                <p className="text-sm leading-6 text-white/82">
                  Modeled examples for this turn will appear here when available.
                </p>
              ) : (
                modeledExamples.slice(0, 1).map((example) => (
                  <div key={example.support_id} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
                    {example.model_text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Transfer example
            </div>
            <div className="mt-3 grid gap-3">
              {transferExamples.length === 0 ? (
                <p className="text-sm leading-6 text-white/82">
                  Transfer examples for this turn will appear here when available.
                </p>
              ) : (
                transferExamples.slice(0, 1).map((example) => (
                  <div key={example.support_id} className="rounded-[1rem] border border-white/10 bg-white/8 p-3 text-sm leading-6 text-white/86">
                    {example.example_text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
              Round-robin progress
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roundProgress.map((student) => {
                const isActive = student.id === session.active_student_id;
                return (
                  <span
                    key={student.id}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      student.state === "saved"
                        ? "bg-[var(--moss)] text-white"
                        : isActive
                          ? "bg-[var(--gold)] text-[var(--surface-ink)]"
                          : "border border-white/12 bg-white/8 text-white"
                    }`}
                  >
                    {student.name} · {student.state}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
