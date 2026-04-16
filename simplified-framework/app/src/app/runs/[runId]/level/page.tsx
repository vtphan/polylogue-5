import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRun } from "@/lib/runs";
import { routeForRun } from "@/lib/routing";
import { loadLessonPackage, loadTranscript } from "@/lib/content";
import {
  continueFromLevelFeedbackAction,
  openLevelHintAction,
  submitLevelAnswerAction,
} from "@/app/actions";
import {
  deriveLevelStep,
  feedbackForOption,
  getLevelHintEvent,
  getLevelResponse,
  nextLevel,
  resolveActiveLevel,
} from "@/lib/levels";
import { LessonWorkspace } from "../_components/LessonWorkspace";
import type {
  AnswerOption,
  LessonLevel,
} from "@/lib/domain";
import type { LevelResponse } from "@prisma/client";

type LevelPageProps = {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ hint?: string }>;
};

function LevelQuestionView({
  runId,
  level,
  hintOpen,
}: {
  runId: string;
  level: LessonLevel;
  hintOpen: boolean;
}) {
  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">Your turn</p>
        <h2 className="drawer-title">{level.title}</h2>
      </div>

      <form action={submitLevelAnswerAction} className="stack">
        <input type="hidden" name="run_id" value={runId} />

        <fieldset className="answer-options">
          <legend className="warmup-label">{level.prompt}</legend>
          {level.answer_options.map((option: AnswerOption) => (
            <label key={option.option_id} className="answer-option">
              <input
                type="radio"
                name="selected_answer_id"
                value={option.option_id}
                required
              />
              <span className="answer-option-text">{option.text}</span>
            </label>
          ))}
        </fieldset>

        <div className="action-row">
          <button type="submit" className="primary">
            Submit
          </button>
        </div>
      </form>

      {level.hint ? (
        <div className="hint-area">
          {hintOpen ? (
            <div className="hint-card">
              <p className="warmup-label">Hint</p>
              <p>{level.hint}</p>
            </div>
          ) : (
            <form action={openLevelHintAction} className="inline-form">
              <input type="hidden" name="run_id" value={runId} />
              <button type="submit" className="ghost">
                Need a hint?
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function LevelFeedbackView({
  runId,
  level,
  response,
  hintShown,
  isFinalLevel,
}: {
  runId: string;
  level: LessonLevel;
  response: LevelResponse;
  hintShown: boolean;
  isFinalLevel: boolean;
}) {
  // §10.32 / §10.35: reload reconstructs the read-only submitted choice from
  // level_responses.initial_answer. In M3's single-submit flow final_answer
  // equals initial_answer, but we read initial_answer to match the spec
  // exactly — later revision-capable milestones will need the distinction.
  const submittedOptionId = response.initialAnswer;
  const selectedOption = level.answer_options.find(
    (option) => option.option_id === submittedOptionId,
  );
  const feedback = selectedOption
    ? feedbackForOption(level, submittedOptionId)
    : null;

  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">What this shows</p>
        <h2 className="drawer-title">{level.title}</h2>
      </div>

      <div className="warmup-body stack">
        <div>
          <p className="warmup-label">Question</p>
          <p className="warmup-prompt">{level.prompt}</p>
        </div>

        <div className="selected-answer" aria-live="polite">
          <p className="warmup-label">Your answer</p>
          {selectedOption ? (
            <p className="selected-answer-text">{selectedOption.text}</p>
          ) : (
            <p className="selected-answer-text subdued">
              We couldn&apos;t match your saved answer to the current options. Please let your teacher know.
            </p>
          )}
        </div>

        {feedback ? (
          <div
            className={`reveal-stage${feedback.isCorrect ? " reveal-stage--highlight" : ""}`}
          >
            <p className="warmup-label">
              {feedback.isCorrect ? "That lands it" : "Let's look again"}
            </p>
            <p>{feedback.text}</p>
          </div>
        ) : null}

        {hintShown && level.hint ? (
          <div className="hint-card">
            <p className="warmup-label">Hint you opened</p>
            <p>{level.hint}</p>
          </div>
        ) : null}
      </div>

      <form action={continueFromLevelFeedbackAction} className="continue-row">
        <input type="hidden" name="run_id" value={runId} />
        <button type="submit" className="primary">
          {isFinalLevel ? "Finish the episode" : "Continue"}
        </button>
      </form>
    </div>
  );
}

function CompleteHandoffView({ runId }: { runId: string }) {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Episode complete</p>
        <h1>You finished every level</h1>
        <p className="muted">
          Your answers and hint history are saved. The completion screen opens here when the next milestone ships.
        </p>
      </header>

      <section className="panel stack">
        <p className="subdued">
          You can close this tab and come back later — your run stays saved.
        </p>
        <div className="action-row">
          <Link href="/" className="ghost">
            Switch student
          </Link>
          <Link href={`/runs/${runId}/read`} className="ghost">
            Re-read the transcript
          </Link>
        </div>
      </section>
    </div>
  );
}

export default async function LevelPage({ params, searchParams }: LevelPageProps) {
  const { runId } = await params;
  const { hint } = await searchParams;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  // Terminal state wins, regardless of currentPhase. If status is complete
  // but currentPhase drifted (historical bug recovery, direct URL), still
  // render the handoff — never redirect, which would loop against
  // routeForRun's status-first rule.
  if (run.status === "complete") {
    return <CompleteHandoffView runId={run.runId} />;
  }
  // Phase gate. Level UI is valid only when the run is in the level phase.
  if (run.currentPhase !== "level") {
    redirect(routeForRun(run));
  }

  const [lessonPackage, transcript] = await Promise.all([
    loadLessonPackage(run.episodeSource),
    loadTranscript(run.episodeSource),
  ]);

  const level = resolveActiveLevel(lessonPackage, run.currentLevelId);
  const [response, hintEvent] = await Promise.all([
    getLevelResponse(run.runId, level.level_id),
    getLevelHintEvent(run.runId, level.level_id),
  ]);

  const step = deriveLevelStep({
    response,
    hintEvent,
    hintQueryOpen: hint === "open",
  });

  const totalLevels = lessonPackage.levels.length;
  const isFinal = nextLevel(lessonPackage, level.level_id) === null;
  const progressLabel = `Level ${level.sequence_index} of ${totalLevels}`;

  if (step.kind === "feedback") {
    return (
      <LessonWorkspace
        episodeTitle={lessonPackage.episode.title}
        progressLabel={progressLabel}
        phaseLabel="Level · feedback"
        transcript={transcript}
        targetTurnId={level.turn_id}
        drawerTitle="Feedback"
        reopenLabel="See your feedback"
      >
        <LevelFeedbackView
          runId={run.runId}
          level={level}
          response={response!}
          hintShown={Boolean(hintEvent)}
          isFinalLevel={isFinal}
        />
      </LessonWorkspace>
    );
  }

  return (
    <LessonWorkspace
      episodeTitle={lessonPackage.episode.title}
      progressLabel={progressLabel}
      phaseLabel="Level"
      transcript={transcript}
      targetTurnId={level.turn_id}
      drawerTitle="Challenge question"
      reopenLabel="Answer about this turn"
    >
      <LevelQuestionView
        runId={run.runId}
        level={level}
        hintOpen={step.hintOpen}
      />
    </LessonWorkspace>
  );
}
