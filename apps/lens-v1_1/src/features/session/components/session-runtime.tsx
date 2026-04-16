"use client";

import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/features/session/store/use-session-store";
import {
  buildRuntimeLevels,
  buildWarmupTurnIds,
  getAvailableLevelById,
  getTurnText,
  type RuntimeLevel,
} from "@/features/session/lib/runtime";
import { getLastSessionId, loadSession } from "@/lib/storage/session-storage";
import type { LoaderBundle } from "@/lib/types/content";

type SessionRuntimeProps = {
  bundle: LoaderBundle;
};

type ProbeOption = {
  text?: string;
};

type ProbeEntry = {
  question?: string;
  options?: ProbeOption[];
};

type SupportStep = {
  id: string;
  label: string;
  text: string;
};

function getProbeEntry(bundle: LoaderBundle, turnId: string | null): ProbeEntry | null {
  if (!turnId) {
    return null;
  }

  const probesRoot = bundle.assistivePackage.diagnostic_support.probes as Record<string, unknown>;
  const facet = probesRoot.facet;
  const byTurn = facet && typeof facet === "object" ? (facet as Record<string, unknown>).by_turn : null;

  if (!byTurn || typeof byTurn !== "object") {
    return null;
  }

  return ((byTurn as Record<string, unknown>)[turnId] as ProbeEntry | undefined) ?? null;
}

function getProbeText(bundle: LoaderBundle, turnId: string | null): string {
  return getProbeEntry(bundle, turnId)?.question?.trim() || "A worked example will appear here.";
}

function getProbeOptions(bundle: LoaderBundle, turnId: string | null): string[] {
  const options = getProbeEntry(bundle, turnId)?.options;
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => option.text?.trim())
    .filter((option): option is string => Boolean(option));
}

function getAttentionTargets(bundle: LoaderBundle, turnId: string | null): string[] {
  if (!turnId) {
    return [];
  }

  return bundle.assistivePackage.front_door_support.attention_targets
    .filter((item) => item.source_turns?.includes(turnId))
    .map((item) => item.text.trim())
    .filter(Boolean);
}

function getSupportOpening(bundle: LoaderBundle, turnId: string | null): string | null {
  if (!turnId) {
    return null;
  }

  const interventionsRoot = bundle.assistivePackage.diagnostic_support.interventions as Record<string, unknown>;
  const byTurn = interventionsRoot.by_turn;
  if (!byTurn || typeof byTurn !== "object") {
    return null;
  }

  const turnEntry = (byTurn as Record<string, unknown>)[turnId];
  if (!turnEntry || typeof turnEntry !== "object") {
    return null;
  }

  const blankPage = (turnEntry as Record<string, unknown>).blank_page;
  if (!blankPage || typeof blankPage !== "object") {
    return null;
  }

  const opening = (blankPage as Record<string, unknown>).opening;
  return typeof opening === "string" ? opening.trim() : null;
}

function getSupportSteps(bundle: LoaderBundle, turnId: string | null): SupportStep[] {
  if (!turnId) {
    return [];
  }

  const interventionsRoot = bundle.assistivePackage.diagnostic_support.interventions as Record<string, unknown>;
  const byTurn = interventionsRoot.by_turn;
  if (!byTurn || typeof byTurn !== "object") {
    return [];
  }

  const turnEntry = (byTurn as Record<string, unknown>)[turnId];
  if (!turnEntry || typeof turnEntry !== "object") {
    return [];
  }

  const blankPage = (turnEntry as Record<string, unknown>).blank_page;
  if (!blankPage || typeof blankPage !== "object") {
    return [];
  }

  const ladder = (blankPage as Record<string, unknown>).ladder;
  if (!Array.isArray(ladder)) {
    return [];
  }

  return ladder.flatMap((step, index) => {
    if (!step || typeof step !== "object" || !("text" in step)) {
      return [];
    }

    const stepRecord = step as { type?: string; text?: string };
    if (!stepRecord.text) {
      return [];
    }

    return [
      {
        id: `${turnId}-support-${index + 1}`,
        label: stepRecord.type ?? `support-${index + 1}`,
        text: stepRecord.text.trim(),
      },
    ];
  });
}

function getWorkedExample(bundle: LoaderBundle, turnId: string | null): string {
  const workedExample = getSupportSteps(bundle, turnId).find((step) => step.label === "worked_example");
  if (workedExample) {
    return workedExample.text;
  }

  return getSupportOpening(bundle, turnId) ?? getProbeText(bundle, turnId);
}

function getEpisodeTitle(bundle: LoaderBundle): string {
  return bundle.manifest.sessions[0]?.label ?? bundle.sessionConfig.config_id;
}

function getEpisodeSubtitle(): string {
  return "Read the transcript first. Then move through warm-ups and challenge levels one turn at a time.";
}

function ReadingScreen({
  bundle,
  onContinue,
}: {
  bundle: LoaderBundle;
  onContinue: () => void;
}) {
  return (
    <section className="episode-shell">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Episode</p>
          <h1>{getEpisodeTitle(bundle)}</h1>
          <p className="body">{getEpisodeSubtitle()}</p>
        </div>
        <div className="hero-actions">
          <button className="primary" onClick={onContinue} type="button">
            Start warm-up
          </button>
          <p className="microcopy">You will read first, then complete 2 warm-ups before the challenge levels begin.</p>
        </div>
      </div>

      <div className="episode-grid">
        <section className="panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Transcript</p>
              <h2>Read the full episode</h2>
            </div>
            <span className="meta-pill">{bundle.transcript.turns.length} turns</span>
          </div>
          <div className="transcript">
            {bundle.transcript.turns.map((turn) => (
              <article key={turn.turn_id} className="turn-card">
                <div className="turn-meta">
                  <span>{turn.speaker}</span>
                  <span>{turn.turn_id}</span>
                </div>
                {turn.sentences.map((sentence) => (
                  <p key={sentence.sentence_id}>{sentence.text}</p>
                ))}
              </article>
            ))}
          </div>
        </section>

        <aside className="rail">
          <div className="panel rail-panel">
            <p className="eyebrow">Cast</p>
            <h2>Who is in this episode</h2>
            <div className="persona-list">
              {bundle.transcript.personas.map((persona) => (
                <article key={persona.name} className="persona-card">
                  <h3>{persona.name}</h3>
                  <p>{persona.perspective}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel rail-panel">
            <p className="eyebrow">Flow</p>
            <h2>What happens next</h2>
            <ol className="flow-list">
              <li>Read the transcript.</li>
              <li>See one modeled warm-up.</li>
              <li>Try one guided warm-up.</li>
              <li>Complete the challenge levels.</li>
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}

function WarmupModeledScreen({
  bundle,
  turnId,
  onContinue,
}: {
  bundle: LoaderBundle;
  turnId: string | null;
  onContinue: () => void;
}) {
  return (
    <section className="episode-shell">
      <section className="panel wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Warm-Up 1</p>
            <h1>See one worked example</h1>
          </div>
          <span className="badge">Training</span>
        </div>
        <p className="body">
          This first example shows the kind of reasoning problem you will be looking for later.
        </p>

        <div className="level-layout">
          <div className="main-stack">
            <div className="turn-card spotlight">
              <div className="turn-meta">
                <span>Focus turn</span>
                <span>{turnId?.toUpperCase() ?? "Warm-Up"}</span>
              </div>
              {getTurnText(bundle, turnId).map((sentence, index) => (
                <p key={index}>{sentence}</p>
              ))}
            </div>

            <div className="support-card lesson-card">
              <div className="support-title">Why this turn is problematic</div>
              <p>{getWorkedExample(bundle, turnId)}</p>
            </div>
          </div>

          <aside className="support-card sidebar-card">
            <div className="support-title">What to learn from this</div>
            <p>{getSupportOpening(bundle, turnId) ?? "Look for the missing step between a reason and a conclusion."}</p>
            <button className="primary" onClick={onContinue} type="button">
              Continue to warm-up 2
            </button>
          </aside>
        </div>
      </section>
    </section>
  );
}

function WarmupGuidedScreen({
  bundle,
  turnId,
  onContinue,
  onSecondaryAction,
}: {
  bundle: LoaderBundle;
  turnId: string | null;
  onContinue: () => void;
  onSecondaryAction: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [revealed, setRevealed] = useState(false);
  const options = getProbeOptions(bundle, turnId);

  return (
    <section className="episode-shell">
      <section className="panel wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Warm-Up 2</p>
            <h1>Try one guided example</h1>
          </div>
          <span className="badge">Practice</span>
        </div>

        <div className="level-layout">
          <div className="main-stack">
            <div className="turn-card spotlight">
              <div className="turn-meta">
                <span>Focus turn</span>
                <span>{turnId?.toUpperCase() ?? "Warm-Up"}</span>
              </div>
              {getTurnText(bundle, turnId).map((sentence, index) => (
                <p key={index}>{sentence}</p>
              ))}
            </div>

            <div className="question-card">
              <p className="question">{getProbeText(bundle, turnId)}</p>
              <div className="option-grid">
                {options.map((option) => (
                  <button
                    key={option}
                    className={selected === option ? "option selected" : "option"}
                    onClick={() => setSelected(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {revealed ? (
              <div className="support-card lesson-card">
                <div className="support-title">Worked explanation</div>
                <p>{getWorkedExample(bundle, turnId)}</p>
              </div>
            ) : null}
          </div>

          <aside className="support-card sidebar-card">
            <div className="support-title">How this warm-up works</div>
            <p>Choose the option that feels strongest, then reveal the explanation and compare it to your choice.</p>
            <div className="stack-actions">
              <button
                className="secondary"
                disabled={!selected}
                onClick={() => setRevealed(true)}
                type="button"
              >
                Reveal explanation
              </button>
              <button
                className="primary"
                disabled={!revealed}
                onClick={onContinue}
                type="button"
              >
                Start challenge levels
              </button>
              <button className="ghost" onClick={onSecondaryAction} type="button">
                Skip this warm-up
              </button>
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function LevelScreen({
  bundle,
  index,
  total,
  level,
  supportSeen,
  onSupportStep,
  onSave,
}: {
  bundle: LoaderBundle;
  index: number;
  total: number;
  level: RuntimeLevel;
  supportSeen: string[];
  onSupportStep: (step: string) => void;
  onSave: (initialAnswer: string, finalAnswer: string) => void;
}) {
  const [stage, setStage] = useState<"intro" | "challenge" | "review">("intro");
  const [selected, setSelected] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const supportSteps = getSupportSteps(bundle, level.turnId);
  const visibleSupport = supportSteps.filter((step) => supportSeen.includes(step.id));

  const answerChanged = Boolean(selected && finalAnswer && selected !== finalAnswer);

  return (
    <section className="episode-shell">
      <section className="panel wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Challenge Level</p>
            <h1>{level.id.replace("-", " ")}</h1>
          </div>
          <div className="progress-cluster">
            <span className="meta-pill">
              {index + 1} of {total}
            </span>
            <span className="badge">{level.turnId.toUpperCase()}</span>
          </div>
        </div>

        <div className="progress-bar" aria-hidden="true">
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        <div className="level-layout">
          <div className="main-stack">
            <div className="turn-card spotlight">
              <div className="turn-meta">
                <span>Focus turn</span>
                <span>{level.turnId.toUpperCase()}</span>
              </div>
              {getTurnText(bundle, level.turnId).map((sentence, indexText) => (
                <p key={indexText}>{sentence}</p>
              ))}
            </div>

            {stage === "intro" ? (
              <div className="question-card">
                <div className="support-title">Level challenge</div>
                <p className="question">{level.question}</p>
                <button className="primary" onClick={() => setStage("challenge")} type="button">
                  Begin level
                </button>
              </div>
            ) : null}

            {stage === "challenge" ? (
              <div className="question-card">
                <p className="question">{level.question}</p>
                <div className="option-grid">
                  {level.options.map((option) => {
                    const isSelected = selected === option;
                    return (
                      <button
                        key={option}
                        className={isSelected ? "option selected" : "option"}
                        onClick={() => {
                          setSelected(option);
                          setFinalAnswer(option);
                        }}
                        type="button"
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="action-row">
                  <button className="secondary" onClick={() => setStage("intro")} type="button">
                    Back
                  </button>
                  <button
                    className="primary"
                    disabled={!selected}
                    onClick={() => setStage("review")}
                    type="button"
                  >
                    Review answer
                  </button>
                </div>
              </div>
            ) : null}

            {stage === "review" ? (
              <div className="resolution-card">
                <div className="support-title">Review and commit</div>
                <p className="body compact">
                  Check your first answer, then decide whether you want to keep it or change it after using support.
                </p>
                <div className="review-grid">
                  <div className="review-card">
                    <span className="review-label">First answer</span>
                    <p>{selected}</p>
                  </div>
                  <div className="review-card">
                    <span className="review-label">Support used</span>
                    <p>{visibleSupport.length === 0 ? "None yet" : `${visibleSupport.length} step(s) opened`}</p>
                  </div>
                </div>
                <label className="field">
                  <span>Final answer</span>
                  <select
                    value={finalAnswer}
                    onChange={(event) => setFinalAnswer(event.target.value)}
                  >
                    <option value="">Select your final answer</option>
                    {level.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="microcopy">
                  {answerChanged ? "You changed your answer after reviewing the turn." : "You kept your original answer."}
                </p>
                <div className="action-row">
                  <button className="secondary" onClick={() => setStage("challenge")} type="button">
                    Revisit choices
                  </button>
                  <button
                    className="primary"
                    disabled={!selected || !finalAnswer}
                    onClick={() => onSave(selected, finalAnswer)}
                    type="button"
                  >
                    Complete level
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="support-column">
            <div className="support-card sidebar-card">
              <div className="support-title">What to notice</div>
              {getAttentionTargets(bundle, level.turnId).length === 0 ? (
                <p>Read the turn again and look for a gap between the reason given and the conclusion claimed.</p>
              ) : (
                getAttentionTargets(bundle, level.turnId).map((item) => <p key={item}>{item}</p>)
              )}
            </div>

            <div className="support-card sidebar-card">
              <div className="support-title">Support ladder</div>
              {getSupportOpening(bundle, level.turnId) ? <p>{getSupportOpening(bundle, level.turnId)}</p> : null}
              <div className="stack-actions">
                {supportSteps.map((step) => (
                  <button
                    key={step.id}
                    className="secondary"
                    onClick={() => onSupportStep(step.id)}
                    type="button"
                  >
                    Reveal {step.label.replace("_", " ")}
                  </button>
                ))}
              </div>
              {visibleSupport.map((step) => (
                <div key={step.id} className="support-reveal">
                  <div className="support-label">{step.label.replace("_", " ")}</div>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function CompletionScreen({ earned, totalLevels }: { earned: string[]; totalLevels: number }) {
  return (
    <section className="episode-shell">
      <section className="panel">
        <p className="eyebrow">Complete</p>
        <h1>Episode complete</h1>
        <p className="body">
          You finished the current sequence of challenge levels. Progress is stored locally so the runtime can resume later.
        </p>
        <div className="summary-grid">
          <div className="summary-card">
            <span className="review-label">Levels completed</span>
            <p>{totalLevels}</p>
          </div>
          <div className="summary-card">
            <span className="review-label">Badges earned</span>
            <p>{earned.length}</p>
          </div>
        </div>
        <div className="badge-list">
          {earned.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}

export function SessionRuntime({ bundle }: SessionRuntimeProps) {
  const session = useSessionStore((state) => state.session);
  const initializeSession = useSessionStore((state) => state.initializeSession);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const finishReading = useSessionStore((state) => state.finishReading);
  const finishWarmup = useSessionStore((state) => state.finishWarmup);
  const skipGuidedWarmup = useSessionStore((state) => state.skipGuidedWarmup);
  const viewSupportStep = useSessionStore((state) => state.viewSupportStep);
  const saveLevel = useSessionStore((state) => state.saveLevel);

  const levels = useMemo(() => buildRuntimeLevels(bundle), [bundle]);
  const warmups = useMemo(() => buildWarmupTurnIds(bundle), [bundle]);

  useEffect(() => {
    if (session) {
      return;
    }

    const lastSessionId = getLastSessionId();
    const storedSession = lastSessionId ? loadSession(lastSessionId) : null;

    if (storedSession && storedSession.config_id === bundle.sessionConfig.config_id) {
      hydrateSession(storedSession);
      return;
    }

    initializeSession(bundle);
  }, [bundle, hydrateSession, initializeSession, session]);

  const activeSession = session;
  const currentLevel = activeSession
    ? getAvailableLevelById(bundle, activeSession.current_level_id) ?? levels[0] ?? null
    : null;
  const currentLevelIndex = currentLevel ? levels.findIndex((level) => level.id === currentLevel.id) : -1;

  if (!activeSession) {
    return null;
  }

  if (activeSession.current_phase === "read") {
    return <ReadingScreen bundle={bundle} onContinue={finishReading} />;
  }

  if (activeSession.current_phase === "warmup" && !activeSession.warmup_state.modeled_complete) {
    return <WarmupModeledScreen bundle={bundle} onContinue={() => finishWarmup("modeled")} turnId={warmups.modeled} />;
  }

  if (activeSession.current_phase === "warmup" && !activeSession.warmup_state.guided_complete) {
    return (
      <WarmupGuidedScreen
        key={`guided-${warmups.guided ?? "default"}`}
        bundle={bundle}
        onContinue={() => finishWarmup("guided")}
        onSecondaryAction={skipGuidedWarmup}
        turnId={warmups.guided}
      />
    );
  }

  if (activeSession.current_phase === "level" && currentLevel) {
    return (
      <LevelScreen
        bundle={bundle}
        index={Math.max(currentLevelIndex, 0)}
        key={currentLevel.id}
        level={currentLevel}
        onSave={(initialAnswer, finalAnswer) => saveLevel(currentLevel, initialAnswer, finalAnswer)}
        onSupportStep={(step) => viewSupportStep(currentLevel.id, step)}
        supportSeen={activeSession.scaffold_usage[currentLevel.id] ?? []}
        total={levels.length}
      />
    );
  }

  return <CompletionScreen earned={activeSession.badge_state.earned} totalLevels={levels.length} />;
}
