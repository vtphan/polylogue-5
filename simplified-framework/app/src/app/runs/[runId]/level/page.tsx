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
import {
  deriveEarnedBadges,
  groupBadgesByCategory,
  loadCompletionInputs,
  type Badge,
  type BadgeCategory,
} from "@/lib/completion";
import { loadSessionChrome } from "@/lib/session-chrome";
import { LessonWorkspace } from "../_components/LessonWorkspace";
import type {
  AnswerOption,
  LessonLevel,
  LessonPackage,
} from "@/lib/domain";
import type { LevelResponse } from "@prisma/client";

type LevelPageProps = {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ hint?: string; flash?: string }>;
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
            Check my answer
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
  // §10.59: the locked answer is `final_answer`. In the immediate-lock path
  // final_answer equals initial_answer; in the retry-finalize path it is the
  // second-submission answer. Fall back to initial_answer only defensively —
  // any completed row always has final_answer set.
  const lockedOptionId = response.finalAnswer ?? response.initialAnswer;
  const selectedOption = level.answer_options.find(
    (option) => option.option_id === lockedOptionId,
  );
  const feedback = selectedOption
    ? feedbackForOption(level, lockedOptionId)
    : null;
  // §10.59: subdued acknowledgement when the second-submission corrected the
  // first wrong answer. Gated on correctness — a wrong-then-different-wrong
  // sequence does not receive this copy.
  const correctedOnRetry = response.answerChanged && feedback?.isCorrect === true;

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
              We couldn&apos;t match the answer you picked to the current options. Please let your teacher know.
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
            {correctedOnRetry ? (
              <p className="subdued">You changed your mind and landed it.</p>
            ) : null}
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

// §10.58: retry-open state. A LevelResponse row exists with initial_answer
// set (the student's first wrong submission) and completed_at null. The
// student sees deterministic feedback for that first answer and gets one
// more accepted submission, which locks the level.
function LevelRetryView({
  runId,
  level,
  firstAnswer,
  hintOpen,
}: {
  runId: string;
  level: LessonLevel;
  firstAnswer: string;
  hintOpen: boolean;
}) {
  const firstOption = level.answer_options.find(
    (option) => option.option_id === firstAnswer,
  );
  const firstFeedback = firstOption ? feedbackForOption(level, firstAnswer) : null;

  return (
    <div className="drawer-card stack">
      <div>
        <p className="eyebrow">One more try</p>
        <h2 className="drawer-title">{level.title}</h2>
      </div>

      <div className="selected-answer" aria-live="polite">
        <p className="warmup-label">Your first answer</p>
        {firstOption ? (
          <p className="selected-answer-text">{firstOption.text}</p>
        ) : (
          <p className="selected-answer-text subdued">
            We couldn&apos;t match your first answer to the current options. Please let your teacher know.
          </p>
        )}
      </div>

      {firstFeedback ? (
        <div className="reveal-stage">
          <p className="warmup-label">Let&apos;s look again</p>
          <p>{firstFeedback.text}</p>
        </div>
      ) : null}

      <form action={submitLevelAnswerAction} className="stack">
        <input type="hidden" name="run_id" value={runId} />

        <fieldset className="answer-options">
          <legend className="warmup-label">Take another look: {level.prompt}</legend>
          {level.answer_options.map((option: AnswerOption) => {
            // §10.58: the first-picked option is disabled on retry — the
            // student cannot re-submit the same wrong answer. The server
            // also rejects this case defensively.
            const alreadyTried = option.option_id === firstAnswer;
            return (
              <label
                key={option.option_id}
                className={`answer-option${alreadyTried ? " answer-option--disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="selected_answer_id"
                  value={option.option_id}
                  required
                  disabled={alreadyTried}
                />
                <span className="answer-option-text">{option.text}</span>
                {alreadyTried ? (
                  <span className="answer-option-note">Already tried</span>
                ) : null}
              </label>
            );
          })}
        </fieldset>

        <div className="action-row">
          <button type="submit" className="primary">
            Try this answer
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

const BADGE_CATEGORY_HEADINGS: Record<BadgeCategory, string> = {
  read_the_episode: "Reading",
  finished_warmup: "Warm-up",
  level_complete: "Levels",
  used_help_and_kept_going: "Used help and kept going",
  changed_my_mind: "Changed my mind",
  episode_complete: "Episode",
};

function EarnedBadgesBlock({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return null;
  }
  const grouped = groupBadgesByCategory(badges);
  return (
    <section className="completion-badges" aria-label="Earned accomplishments">
      <header className="completion-badges-header">
        <p className="eyebrow">What you earned</p>
        <p className="subdued">Saved from your work on this episode.</p>
      </header>
      <div className="completion-badges-groups">
        {grouped.map(({ category, badges: badgesInCategory }) => (
          <div key={category} className="completion-badge-group">
            <p className="completion-badge-group-title">
              {BADGE_CATEGORY_HEADINGS[category]}
            </p>
            <ul className="completion-badge-list">
              {badgesInCategory.map((badge, index) => (
                <li
                  key={`${badge.category}-${index}`}
                  className="completion-badge"
                >
                  <span className="completion-badge-label">{badge.label}</span>
                  {badge.description ? (
                    <span className="completion-badge-description">
                      {badge.description}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompletionSurface({
  runId,
  lessonPackage,
  badges,
  levelCount,
}: {
  runId: string;
  lessonPackage: LessonPackage;
  badges: Badge[];
  levelCount: number;
}) {
  return (
    <div className="page completion-page">
      <header className="completion-header">
        <p className="eyebrow">Episode complete</p>
        <h1 className="completion-title">{lessonPackage.episode.title}</h1>
        <p className="completion-summary">
          You finished the reading, both warm-ups, and all {levelCount}{" "}
          {levelCount === 1 ? "level" : "levels"}. Come back to it anytime.
        </p>
      </header>

      <section
        className="completion-takeaway"
        aria-label="Final takeaway"
      >
        <p className="eyebrow">Final takeaway</p>
        <blockquote className="completion-takeaway-quote">
          {lessonPackage.episode.final_takeaway}
        </blockquote>
      </section>

      <EarnedBadgesBlock badges={badges} />

      <section className="completion-actions" aria-label="What&rsquo;s next">
        <div className="action-row">
          <Link href="/" className="primary">
            Switch student
          </Link>
          <Link href={`/runs/${runId}/read`} className="secondary">
            Re-read the transcript
          </Link>
        </div>
      </section>
    </div>
  );
}

export default async function LevelPage({ params, searchParams }: LevelPageProps) {
  const { runId } = await params;
  const { hint, flash } = await searchParams;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  // Terminal state wins, regardless of currentPhase. If status is complete
  // but currentPhase drifted (historical bug recovery, direct URL), still
  // render the completion surface — never redirect, which would loop against
  // routeForRun's status-first rule.
  if (run.status === "complete") {
    const [lessonPackage, completionInputs] = await Promise.all([
      loadLessonPackage(run.episodeSource),
      loadCompletionInputs(run.runId),
    ]);
    if (!completionInputs) {
      notFound();
    }
    const badges = deriveEarnedBadges(completionInputs, lessonPackage);
    return (
      <CompletionSurface
        runId={run.runId}
        lessonPackage={lessonPackage}
        badges={badges}
        levelCount={lessonPackage.levels.length}
      />
    );
  }
  // Phase gate. Level UI is valid only when the run is in the level phase.
  if (run.currentPhase !== "level") {
    redirect(routeForRun(run));
  }

  const [lessonPackage, transcript] = await Promise.all([
    loadLessonPackage(run.episodeSource),
    loadTranscript(run.episodeSource),
  ]);
  const sessionChrome = await loadSessionChrome(run, lessonPackage);

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
  const feedback = response?.completedAt
    ? feedbackForOption(level, response.finalAnswer ?? response.initialAnswer)
    : null;
  const flashMessage =
    flash === "warmup-badge"
      ? {
          key: "warmup-badge",
          tone: "success" as const,
          title: "Badge earned: Finished the warm-up",
          detail: "You’re ready for the challenge levels now.",
        }
      : flash === "retry-open"
        ? {
            key: "retry-open",
            tone: "encourage" as const,
            title: "Not yet, but you get one more try.",
            detail: "Look back at this turn and pick a different answer when you’re ready.",
          }
        : flash === "level-locked" && response?.completedAt
          ? feedback?.isCorrect
            ? response.answerChanged
              ? {
                  key: "level-locked-corrected",
                  tone: "success" as const,
                  title: "Nice recovery.",
                  detail: "You changed your mind, landed the answer, and earned your level badge.",
                }
              : {
                  key: "level-locked-correct",
                  tone: "success" as const,
                  title: "Nice work.",
                  detail: "You landed the answer and earned your level badge.",
                }
            : {
                key: "level-locked-wrong",
                tone: "encourage" as const,
                title: "Thanks for sticking with it.",
                detail: "You can keep moving and keep building the skill on the next level.",
              }
          : null;

  if (step.kind === "feedback") {
    return (
      <LessonWorkspace
        episodeTitle={lessonPackage.episode.title}
        progressLabel={progressLabel}
        phaseLabel="Level · feedback"
        sessionChrome={sessionChrome}
        transcript={transcript}
        targetTurnId={level.turn_id}
        drawerTitle="Feedback"
        reopenLabel="See your feedback"
        flash={flashMessage}
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

  if (step.kind === "retry") {
    return (
      <LessonWorkspace
        episodeTitle={lessonPackage.episode.title}
        progressLabel={progressLabel}
        phaseLabel="Level · one more try"
        sessionChrome={sessionChrome}
        transcript={transcript}
        targetTurnId={level.turn_id}
        drawerTitle="One more try"
        reopenLabel="Take another look"
        flash={flashMessage}
      >
        <LevelRetryView
          runId={run.runId}
          level={level}
          firstAnswer={step.firstAnswer}
          hintOpen={step.hintOpen}
        />
      </LessonWorkspace>
    );
  }

  return (
    <LessonWorkspace
      episodeTitle={lessonPackage.episode.title}
      progressLabel={progressLabel}
      phaseLabel="Level"
      sessionChrome={sessionChrome}
      transcript={transcript}
      targetTurnId={level.turn_id}
      drawerTitle="Challenge question"
      reopenLabel="Answer about this turn"
      flash={flashMessage}
    >
      <LevelQuestionView
        runId={run.runId}
        level={level}
        hintOpen={step.hintOpen}
      />
    </LessonWorkspace>
  );
}
