"use client";

import {
  openQuizHintAction,
  submitStep1Action,
  submitStep2Action,
  submitStep3Action,
} from "@/app/actions";
import type { ReaderLevel } from "@/lib/content";
import type { AnswerOption, StepFeedback } from "@/lib/domain";
import {
  polarityMatched,
  step3BranchKeyForStep2,
} from "@/lib/grading";
import type { QuizAttempt } from "@prisma/client";
import { FiCheck, FiCornerDownRight } from "react-icons/fi";

type QuizPanelProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  anchorSpeaker: string;
  onClose: () => void;
};

// Active mode handles correctness feedback through in-the-moment retry
// reveals. Completed mode is pure authored content keyed to the student's
// Y/N judgment. The boundary is attempt.lockedAt, set when Step 3 locks.
export function QuizPanel({
  runId,
  sceneIndex,
  level,
  attempt,
  anchorSpeaker,
  onClose,
}: QuizPanelProps) {
  const step1Locked = Boolean(attempt?.step1LockedAt);
  const levelLocked = Boolean(attempt?.lockedAt);

  return (
    <div className={`quiz-panel stack${levelLocked ? " quiz-panel--locked" : ""}`}>
      <PanelHeader
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        attempt={attempt}
        levelLocked={levelLocked}
      />

      <Step1Section
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        attempt={attempt}
        anchorSpeaker={anchorSpeaker}
      />

      {step1Locked ? (
        <QuizBody
          runId={runId}
          sceneIndex={sceneIndex}
          level={level}
          attempt={attempt}
          anchorSpeaker={anchorSpeaker}
          levelLocked={levelLocked}
        />
      ) : null}

      {levelLocked ? <TakeawayCard takeaway={level.takeaway} /> : null}

      <div className="quiz-close-row">
        <button
          type="button"
          className="secondary quiz-close"
          onClick={onClose}
          aria-label="Close question"
        >
          Close
        </button>
      </div>
    </div>
  );
}

type PanelHeaderProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  levelLocked: boolean;
};

function PanelHeader({
  runId,
  sceneIndex,
  level,
  attempt,
  levelLocked,
}: PanelHeaderProps) {
  const showHintButton = !levelLocked && Boolean(level.hint) && !attempt?.usedHint;
  const showHintCard = !levelLocked && Boolean(level.hint) && Boolean(attempt?.usedHint);

  if (!showHintButton && !showHintCard) {
    return null;
  }

  return (
    <>
      <div className="quiz-panel__header">
        {showHintButton ? (
          <form action={openQuizHintAction} className="quiz-hint-form">
            <input type="hidden" name="run_id" value={runId} />
            <input type="hidden" name="scene_index" value={sceneIndex} />
            <input type="hidden" name="level_id" value={level.level_id} />
            <button
              type="submit"
              className="quiz-hint-button"
              aria-label="Show a hint"
              title="Show a hint"
            >
              <span aria-hidden="true">💡</span>
            </button>
          </form>
        ) : null}
      </div>
      {showHintCard ? (
        <div className="hint-card">
          <p className="eyebrow">Hint</p>
          <p>{level.hint}</p>
        </div>
      ) : null}
    </>
  );
}

type Step1SectionProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  anchorSpeaker: string;
};

function Step1Section({
  runId,
  sceneIndex,
  level,
  attempt,
  anchorSpeaker,
}: Step1SectionProps) {
  const locked = Boolean(attempt?.step1LockedAt);

  if (locked) {
    const step1 = level.step_1_claim;
    const firstOptionId = attempt?.step1FirstOption ?? null;
    const finalOptionId = attempt?.step1FinalOption ?? null;

    return (
      <section className="quiz-step stack">
        <p className="quiz-prompt">{`What ${anchorSpeaker} is arguing`}</p>
        <AttemptReviewOptionsList
          options={step1.options}
          feedback={step1.feedback}
          firstOptionId={firstOptionId}
          finalOptionId={finalOptionId}
        />
      </section>
    );
  }

  return (
    <section className="quiz-step stack">
      <p className="quiz-prompt">{level.step_1_claim.prompt}</p>
      <OptionsPicker
        runId={runId}
        sceneIndex={sceneIndex}
        levelId={level.level_id}
        actionName="step1"
        options={level.step_1_claim.options}
        feedback={level.step_1_claim.feedback}
        firstOptionId={attempt?.step1FirstOption ?? null}
      />
    </section>
  );
}

type QuizBodyProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  anchorSpeaker: string;
  levelLocked: boolean;
};

function QuizBody({
  runId,
  sceneIndex,
  level,
  attempt,
  anchorSpeaker,
  levelLocked,
}: QuizBodyProps) {
  const step2Option = attempt?.step2Option ?? null;

  if (!step2Option) {
    return (
      <Step2Section
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        anchorSpeaker={anchorSpeaker}
      />
    );
  }

  return (
    <>
      <Step3Section
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        attempt={attempt}
        step2Option={step2Option}
        levelLocked={levelLocked}
      />
      {levelLocked ? <ActuallySection level={level} step2Option={step2Option} /> : null}
    </>
  );
}

type Step2SectionProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  anchorSpeaker: string;
};

function Step2Section({ runId, sceneIndex, level, anchorSpeaker }: Step2SectionProps) {
  return (
    <section className="quiz-step stack">
      <p className="quiz-prompt">Do you think {anchorSpeaker}&apos;s argument is strong?</p>
      <div className="quiz-options quiz-options--binary">
        {level.step_2_judgment.options.map((option) => (
          <form key={option.option_id} action={submitStep2Action}>
            <input type="hidden" name="run_id" value={runId} />
            <input type="hidden" name="scene_index" value={sceneIndex} />
            <input type="hidden" name="level_id" value={level.level_id} />
            <input type="hidden" name="option_id" value={option.option_id} />
            <button type="submit" className="quiz-option">
              <span className="quiz-option__text">
                {option.option_id === "yes_strong" ? "Yes" : "No"}
              </span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}

type Step3SectionProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  step2Option: string;
  levelLocked: boolean;
};

function Step3Section({
  runId,
  sceneIndex,
  level,
  attempt,
  step2Option,
  levelLocked,
}: Step3SectionProps) {
  const branch = level.step_3[step3BranchKeyForStep2(step2Option)];
  const prompt = getStep3Prompt(step2Option);
  const step3FirstOption = attempt?.step3FirstOption ?? null;
  const step3FinalOption = attempt?.step3FinalOption ?? null;

  return (
    <section className="quiz-step stack">
      <p className="quiz-prompt">{prompt}</p>
      {levelLocked ? (
        <AttemptReviewOptionsList
          options={branch.options}
          feedback={branch.feedback}
          firstOptionId={step3FirstOption}
          finalOptionId={step3FinalOption}
        />
      ) : (
        <OptionsPicker
          runId={runId}
          sceneIndex={sceneIndex}
          levelId={level.level_id}
          actionName="step3"
          options={branch.options}
          feedback={branch.feedback}
          firstOptionId={step3FirstOption}
        />
      )}
    </section>
  );
}

function ActuallySection({
  level,
  step2Option,
}: {
  level: ReaderLevel;
  step2Option: string;
}) {
  if (polarityMatched(level.polarity, step2Option)) {
    return null;
  }

  const branchKey = step3BranchKeyForStep2(step2Option);
  const oppositeBranch =
    branchKey === "why_yes" ? level.step_3.why_no : level.step_3.why_yes;

  return (
    <section className="quiz-step quiz-step--actually stack">
      <p className="quiz-prompt">{getActuallyPrompt(step2Option)}</p>
      <FeedbackCard>{oppositeBranch.feedback.correct.text}</FeedbackCard>
    </section>
  );
}

function TakeawayCard({ takeaway }: { takeaway: string }) {
  return (
    <NarrativeCard title="Takeaway" variant="takeaway">
      <p className="narrative-card__body">{takeaway}</p>
    </NarrativeCard>
  );
}

function getStep3Prompt(step2Option: string): string {
  return step2Option === "yes_strong"
    ? "So, you think the argument is strong. Why?"
    : "So, you think the argument is weak. Why?";
}

function getActuallyPrompt(step2Option: string): string {
  return step2Option === "yes_strong"
    ? "You thought the argument was strong, but actually it isn't convincing."
    : "You weren't convinced by the argument, but actually it is strong.";
}

type NarrativeCardProps = {
  title: string;
  variant?: "default" | "actually" | "takeaway";
  children: React.ReactNode;
};

function NarrativeCard({ title, variant = "default", children }: NarrativeCardProps) {
  const variantClass =
    variant === "actually"
      ? " narrative-card--actually"
      : variant === "takeaway"
        ? " narrative-card--takeaway"
        : "";
  return (
    <section className={`narrative-card${variantClass}`}>
      <h3 className="narrative-card__title">{title}</h3>
      {children}
    </section>
  );
}

type AttemptReviewOptionsListProps = {
  options: AnswerOption[];
  feedback: StepFeedback;
  firstOptionId: string | null;
  finalOptionId: string | null;
};

function AttemptReviewOptionsList({
  options,
  feedback,
  firstOptionId,
  finalOptionId,
}: AttemptReviewOptionsListProps) {
  const correctIds = new Set(feedback.correct.option_ids);
  const hadRetry =
    Boolean(firstOptionId) && Boolean(finalOptionId) && firstOptionId !== finalOptionId;

  return (
    <div className="quiz-options">
      {options.map((option) => {
        const isCorrect = correctIds.has(option.option_id);
        const isFirstAttempt = option.option_id === firstOptionId;
        const isFinalAnswer = option.option_id === finalOptionId;
        const wasAttempted = isFirstAttempt || isFinalAnswer;
        const isOpenByDefault = isCorrect || wasAttempted;
        const feedbackText = isCorrect
          ? feedback.correct.text
          : feedback.by_option[option.option_id] ?? "";
        const labels = [
          hadRetry && isFirstAttempt && !isFinalAnswer
            ? "Your first attempt"
            : isFinalAnswer
              ? "Your answer"
              : null,
          isCorrect ? "Best explanation" : null,
        ].filter(Boolean);

        return (
          <details
            key={option.option_id}
            className={`quiz-review-option${wasAttempted ? " quiz-review-option--attempted" : ""}`}
            open={isOpenByDefault}
          >
            <summary className="quiz-review-option__summary">
              <span className="quiz-review-option__collapsed" aria-label="Show choice and feedback">
                ...
              </span>
              <span className="quiz-review-option__card">
                {labels.length > 0 ? (
                  <span className="quiz-review-option__labels">
                    {labels.join(" · ")}
                  </span>
                ) : null}
                <span className="quiz-option__text">{option.text}</span>
                {isCorrect ? (
                  <FiCheck className="quiz-review-option__check" aria-label="Best answer" />
                ) : null}
              </span>
            </summary>
            {feedbackText ? <FeedbackCard>{feedbackText}</FeedbackCard> : null}
          </details>
        );
      })}
    </div>
  );
}

type OptionsPickerProps = {
  runId: string;
  sceneIndex: number;
  levelId: string;
  actionName: "step1" | "step3";
  options: AnswerOption[];
  feedback: StepFeedback;
  firstOptionId: string | null;
};

// Pre-lock options renderer for Step 1 and Step 3. Once a step locks, its
// card transitions to narrative form; this component is not used there.
// The only non-trivial state it handles is the retry window — a wrong first
// pick is readonly (red + by_option feedback), other options remain live.
function OptionsPicker({
  runId,
  sceneIndex,
  levelId,
  actionName,
  options,
  feedback,
  firstOptionId,
}: OptionsPickerProps) {
  const action = actionName === "step1" ? submitStep1Action : submitStep3Action;

  return (
    <div className="quiz-options">
      {options.map((option) => {
        const isFirstWrongPick = option.option_id === firstOptionId;

        if (isFirstWrongPick) {
          return (
            <div key={option.option_id} className="quiz-option-stack">
              <ReadonlyOptionCard text={option.text} tone="wrong" />
              <FeedbackCard live="polite">
                {feedback.by_option[option.option_id] ?? ""}
              </FeedbackCard>
            </div>
          );
        }

        return (
          <form key={option.option_id} action={action}>
            <input type="hidden" name="run_id" value={runId} />
            <input type="hidden" name="scene_index" value={sceneIndex} />
            <input type="hidden" name="level_id" value={levelId} />
            <input type="hidden" name="option_id" value={option.option_id} />
            <button type="submit" className="quiz-option">
              <span className="quiz-option__text">{option.text}</span>
            </button>
          </form>
        );
      })}
    </div>
  );
}

function ReadonlyOptionCard({
  text,
  tone,
  picked = false,
}: {
  text: string;
  tone: "neutral" | "correct" | "wrong";
  picked?: boolean;
}) {
  const toneClass =
    tone === "correct"
      ? " quiz-option--correct"
      : tone === "wrong"
        ? " quiz-option--wrong"
        : " quiz-option--dimmed";
  const pickedClass = picked ? " quiz-option--picked" : "";

  return (
    <div
      className={`quiz-option quiz-option--readonly${toneClass}${pickedClass}`}
      aria-disabled="true"
    >
      <span className="quiz-option__text">{text}</span>
    </div>
  );
}

function FeedbackCard({
  live,
  children,
}: {
  live?: "off" | "polite" | "assertive";
  children: React.ReactNode;
}) {
  return (
    <div className="quiz-feedback-card" aria-live={live}>
      <FiCornerDownRight className="quiz-feedback-card__icon" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
