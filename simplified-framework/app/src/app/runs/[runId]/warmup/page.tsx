import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRun } from "@/lib/runs";
import { routeForRun } from "@/lib/routing";
import { loadLessonPackage, loadTranscript } from "@/lib/content";
import {
  completeModeledWarmupAction,
  continueFromGuidedWarmupAction,
  openGuidedHintAction,
  submitGuidedWarmupAction,
} from "@/app/actions";
import {
  deriveWarmupStep,
  getOrCreateWarmupProgress,
  type WarmupProgress,
} from "@/lib/warmup";
import { RevealStages, type RevealStage } from "./RevealStages";
import { LessonWorkspace } from "../_components/LessonWorkspace";
import type {
  AnswerOption,
  GuidedWarmup,
  ModeledWarmup,
} from "@/lib/domain";

type WarmupPageProps = {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ hint?: string }>;
};

function ModeledWarmupView({
  runId,
  warmup,
}: {
  runId: string;
  warmup: ModeledWarmup;
}) {
  const stages: RevealStage[] = [
    {
      key: "what-to-notice",
      label: "What to notice",
      content: <p>{warmup.best_answer_text}</p>,
      advanceButtonLabel: "Show me what to notice",
    },
    {
      key: "why-it-matters",
      label: "Why it matters",
      content: <p>{warmup.worked_explanation}</p>,
      advanceButtonLabel: "Walk me through it",
    },
    {
      key: "takeaway",
      label: "Takeaway",
      content: <p>{warmup.takeaway}</p>,
      advanceButtonLabel: "What's the takeaway?",
      highlight: true,
    },
  ];

  const continueForm = (
    <form action={completeModeledWarmupAction} className="continue-row">
      <input type="hidden" name="run_id" value={runId} />
      <button type="submit" className="primary">
        Continue
      </button>
    </form>
  );

  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">Before you answer on your own</p>
        <h2 className="drawer-title">{warmup.title}</h2>
      </div>
      <div className="warmup-body stack">
        <div>
          <p className="warmup-label">Question</p>
          <p className="warmup-prompt">{warmup.prompt}</p>
        </div>
      </div>
      <RevealStages stages={stages} finalAction={continueForm} />
    </div>
  );
}

function GuidedQuestionView({
  runId,
  warmup,
  progress,
  hintOpen,
}: {
  runId: string;
  warmup: GuidedWarmup;
  progress: WarmupProgress;
  hintOpen: boolean;
}) {
  const showHint = hintOpen || progress.guidedUsedHint;
  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">Your turn</p>
        <h2 className="drawer-title">{warmup.title}</h2>
      </div>

      <form action={submitGuidedWarmupAction} className="stack">
        <input type="hidden" name="run_id" value={runId} />
        <input
          type="hidden"
          name="used_hint"
          value={progress.guidedUsedHint ? "true" : "false"}
        />

        <fieldset className="answer-options">
          <legend className="warmup-label">{warmup.prompt}</legend>
          {warmup.answer_options.map((option: AnswerOption) => (
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

      {warmup.hint ? (
        <div className="hint-area">
          {showHint ? (
            <div className="hint-card">
              <p className="warmup-label">Hint</p>
              <p>{warmup.hint}</p>
            </div>
          ) : (
            <form action={openGuidedHintAction} className="inline-form">
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

function GuidedRevealView({
  runId,
  warmup,
  progress,
}: {
  runId: string;
  warmup: GuidedWarmup;
  progress: WarmupProgress;
}) {
  const selectedOption = progress.guidedSelectedAnswerId
    ? warmup.answer_options.find(
        (option) => option.option_id === progress.guidedSelectedAnswerId,
      ) ?? null
    : null;

  const stages: RevealStage[] = [
    {
      key: "what-this-shows",
      label: "What this shows",
      content: <p>{warmup.best_answer_text}</p>,
      advanceButtonLabel: "Show me what this shows",
    },
    {
      key: "walk-through",
      label: "Walk-through",
      content: <p>{warmup.worked_explanation}</p>,
      advanceButtonLabel: "Walk me through it",
    },
    {
      key: "takeaway",
      label: "Takeaway",
      content: <p>{warmup.takeaway}</p>,
      advanceButtonLabel: "What's the takeaway?",
      highlight: true,
    },
  ];

  const continueForm = (
    <form action={continueFromGuidedWarmupAction} className="continue-row">
      <input type="hidden" name="run_id" value={runId} />
      <button type="submit" className="primary">
        Continue to the challenge
      </button>
    </form>
  );

  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">Let&apos;s look at it together</p>
        <h2 className="drawer-title">{warmup.title}</h2>
      </div>

      <div className="warmup-body stack">
        <div>
          <p className="warmup-label">Question</p>
          <p className="warmup-prompt">{warmup.prompt}</p>
        </div>

        <div className="selected-answer" aria-live="polite">
          <p className="warmup-label">Your answer</p>
          {selectedOption ? (
            <>
              <p className="selected-answer-text">{selectedOption.text}</p>
              <p className="subdued">
                Your answer is saved. You can keep it as you read the explanation.
              </p>
            </>
          ) : (
            <p className="selected-answer-text subdued">
              We couldn&apos;t match your saved answer to the current options. Please let your teacher know.
            </p>
          )}
        </div>
      </div>

      <RevealStages stages={stages} finalAction={continueForm} />
    </div>
  );
}

export default async function WarmupPage({ params, searchParams }: WarmupPageProps) {
  const { runId } = await params;
  const { hint } = await searchParams;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  // Terminal state wins. A completed run that somehow lands here (stale
  // link, direct URL) goes to the complete handoff, never back into warm-ups.
  if (run.status === "complete") {
    redirect(routeForRun(run));
  }
  // Phase gate. Warm-up UI is valid only when the run is in the warmup phase.
  if (run.currentPhase !== "warmup") {
    redirect(routeForRun(run));
  }

  const [lessonPackage, transcript, progress] = await Promise.all([
    loadLessonPackage(run.episodeSource),
    loadTranscript(run.episodeSource),
    getOrCreateWarmupProgress(runId),
  ]);

  const step = deriveWarmupStep(progress);

  if (step === "done") {
    // guided_complete is true but session_runs was not yet updated (shouldn't
    // happen under the transactional continue action, but handle defensively).
    return (
      <div className="page">
        <section className="panel stack">
          <h1>Warm-ups complete</h1>
          <Link href={`/runs/${run.runId}/level`} className="primary">
            Continue to the challenge
          </Link>
        </section>
      </div>
    );
  }

  if (step === "modeled") {
    return (
      <LessonWorkspace
        episodeTitle={lessonPackage.episode.title}
        progressLabel="Warm-up · Modeled"
        phaseLabel="Modeled warm-up"
        transcript={transcript}
        targetTurnId={lessonPackage.warmups.modeled.turn_id}
        drawerTitle="Modeled warm-up"
        reopenLabel="Open the walkthrough"
      >
        <ModeledWarmupView
          runId={run.runId}
          warmup={lessonPackage.warmups.modeled}
        />
      </LessonWorkspace>
    );
  }

  if (step === "guided_question") {
    return (
      <LessonWorkspace
        episodeTitle={lessonPackage.episode.title}
        progressLabel="Warm-up · Guided"
        phaseLabel="Guided warm-up"
        transcript={transcript}
        targetTurnId={lessonPackage.warmups.guided.turn_id}
        drawerTitle="Guided warm-up"
        reopenLabel="Answer about this turn"
      >
        <GuidedQuestionView
          runId={run.runId}
          warmup={lessonPackage.warmups.guided}
          progress={progress}
          hintOpen={hint === "open"}
        />
      </LessonWorkspace>
    );
  }

  return (
    <LessonWorkspace
      episodeTitle={lessonPackage.episode.title}
      progressLabel="Warm-up · Guided"
      phaseLabel="Guided warm-up · explanation"
      transcript={transcript}
      targetTurnId={lessonPackage.warmups.guided.turn_id}
      drawerTitle="Guided warm-up · explanation"
      reopenLabel="Open the explanation"
    >
      <GuidedRevealView
        runId={run.runId}
        warmup={lessonPackage.warmups.guided}
        progress={progress}
      />
    </LessonWorkspace>
  );
}
