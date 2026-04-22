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
  const step2Option = attempt?.step2Option ?? null;
  const levelLocked = Boolean(attempt?.lockedAt);

  // Polarity alignment determines whether "Actually" fires in completed mode.
  // Misalignment surfaces the opposite branch's reasoning so the student sees
  // the authored reading.
  const isMisaligned =
    step2Option !== null && !polarityMatched(level.polarity, step2Option);

  return (
    <div className={`quiz-panel stack${levelLocked ? " quiz-panel--locked" : ""}`}>
      <PanelHeader
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        attempt={attempt}
        levelLocked={levelLocked}
      />

      <ClaimCard
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        attempt={attempt}
        anchorSpeaker={anchorSpeaker}
      />

      {step1Locked ? (
        <YourTakeCard
          runId={runId}
          sceneIndex={sceneIndex}
          level={level}
          attempt={attempt}
          anchorSpeaker={anchorSpeaker}
        />
      ) : null}

      {levelLocked && isMisaligned && step2Option ? (
        <ActuallyCard level={level} step2Option={step2Option} />
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

  return (
    <>
      <div className="quiz-panel__header">
        <div className="quiz-panel__titles">
          <p className="eyebrow">{levelLocked ? "Answered" : "Reasoning check"}</p>
        </div>
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

type ClaimCardProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  anchorSpeaker: string;
};

function ClaimCard({
  runId,
  sceneIndex,
  level,
  attempt,
  anchorSpeaker,
}: ClaimCardProps) {
  const locked = Boolean(attempt?.step1LockedAt);

  if (locked) {
    const step1 = level.step_1_claim;
    const correctIds = step1.feedback.correct.option_ids;
    const correctOption = findCorrectOption(step1.options, step1.feedback);
    const finalOptionId = attempt?.step1FinalOption ?? null;
    const claimStarEarned = Boolean(finalOptionId && correctIds.includes(finalOptionId));
    const wrongPick =
      !claimStarEarned && finalOptionId
        ? step1.options.find((o) => o.option_id === finalOptionId) ?? null
        : null;

    return (
      <NarrativeCard eyebrow={`What ${anchorSpeaker} is arguing`}>
        {correctOption ? (
          <p className="narrative-card__claim">
            {correctOption.text}
            {claimStarEarned ? <EarnedMark /> : null}
          </p>
        ) : null}
        <p className="narrative-card__body">{step1.feedback.correct.text}</p>
        {wrongPick ? (
          <p className="narrative-card__your-pick">
            You picked: &ldquo;{wrongPick.text}&rdquo;
          </p>
        ) : null}
      </NarrativeCard>
    );
  }

  return (
    <section className="quiz-step stack">
      <p className="eyebrow">Claim</p>
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

type YourTakeCardProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  anchorSpeaker: string;
};

function YourTakeCard({
  runId,
  sceneIndex,
  level,
  attempt,
  anchorSpeaker,
}: YourTakeCardProps) {
  const step2Option = attempt?.step2Option ?? null;
  const levelLocked = Boolean(attempt?.lockedAt);

  if (levelLocked && step2Option && attempt) {
    return (
      <YourTakeNarrative level={level} step2Option={step2Option} attempt={attempt} />
    );
  }

  if (!step2Option) {
    return (
      <Step2Picker
        runId={runId}
        sceneIndex={sceneIndex}
        level={level}
        anchorSpeaker={anchorSpeaker}
      />
    );
  }

  return (
    <Step3Picker
      runId={runId}
      sceneIndex={sceneIndex}
      level={level}
      attempt={attempt}
      step2Option={step2Option}
    />
  );
}

type Step2PickerProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  anchorSpeaker: string;
};

function Step2Picker({ runId, sceneIndex, level, anchorSpeaker }: Step2PickerProps) {
  return (
    <section className="quiz-step stack">
      <p className="eyebrow">Your take</p>
      <p className="quiz-prompt">Do you buy {anchorSpeaker}&apos;s argument?</p>
      <div className="quiz-options">
        {level.step_2_judgment.options.map((option) => (
          <form key={option.option_id} action={submitStep2Action}>
            <input type="hidden" name="run_id" value={runId} />
            <input type="hidden" name="scene_index" value={sceneIndex} />
            <input type="hidden" name="level_id" value={level.level_id} />
            <input type="hidden" name="option_id" value={option.option_id} />
            <button type="submit" className="quiz-option">
              <span className="quiz-option__text">{option.text}</span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}

type Step3PickerProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  step2Option: string;
};

function Step3Picker({
  runId,
  sceneIndex,
  level,
  attempt,
  step2Option,
}: Step3PickerProps) {
  const branch = level.step_3[step3BranchKeyForStep2(step2Option)];
  const routing = level.step_2_judgment.routing_text;

  return (
    <section className="quiz-step stack">
      <p className="eyebrow">Your take</p>
      {routing ? <p className="quiz-routing">{routing}</p> : null}
      <p className="quiz-prompt">{branch.prompt}</p>
      <OptionsPicker
        runId={runId}
        sceneIndex={sceneIndex}
        levelId={level.level_id}
        actionName="step3"
        options={branch.options}
        feedback={branch.feedback}
        firstOptionId={attempt?.step3FirstOption ?? null}
      />
    </section>
  );
}

type YourTakeNarrativeProps = {
  level: ReaderLevel;
  step2Option: string;
  attempt: QuizAttempt;
};

function YourTakeNarrative({
  level,
  step2Option,
  attempt,
}: YourTakeNarrativeProps) {
  const branchKey = step3BranchKeyForStep2(step2Option);
  const branch = level.step_3[branchKey];
  const polarityStarEarned = polarityMatched(level.polarity, step2Option);

  const step3FinalOption = attempt.step3FinalOption ?? null;
  const step3Correct =
    step3FinalOption !== null &&
    branch.feedback.correct.option_ids.includes(step3FinalOption);
  // Reasoning star is conditional on polarity match.
  const reasoningStarEarned = polarityStarEarned && step3Correct;

  const framing =
    step2Option === "yes_strong"
      ? "You thought it was strong."
      : "You weren't convinced.";

  const wrongStep3Pick =
    !step3Correct && step3FinalOption
      ? branch.options.find((o) => o.option_id === step3FinalOption) ?? null
      : null;

  return (
    <NarrativeCard eyebrow="Your take">
      <p className="narrative-card__claim">
        {framing}
        {polarityStarEarned ? <EarnedMark /> : null}
      </p>
      <p className="narrative-card__body">
        {branch.feedback.correct.text}
        {reasoningStarEarned ? <EarnedMark /> : null}
      </p>
      {wrongStep3Pick ? (
        <p className="narrative-card__your-pick">
          You picked: &ldquo;{wrongStep3Pick.text}&rdquo;
        </p>
      ) : null}
    </NarrativeCard>
  );
}

function EarnedMark() {
  return (
    <span className="earned-mark" aria-label="earned">
      ✓
    </span>
  );
}

type ActuallyCardProps = {
  level: ReaderLevel;
  step2Option: string;
};

function ActuallyCard({ level, step2Option }: ActuallyCardProps) {
  // Opposite branch from the student's Step 2 pick — the authored reasoning
  // they would otherwise never see.
  const studentBranch = step3BranchKeyForStep2(step2Option);
  const oppositeBranch =
    studentBranch === "why_yes" ? level.step_3.why_no : level.step_3.why_yes;

  return (
    <NarrativeCard eyebrow="Actually" variant="actually">
      <p className="narrative-card__body">{oppositeBranch.feedback.correct.text}</p>
    </NarrativeCard>
  );
}

function TakeawayCard({ takeaway }: { takeaway: string }) {
  return (
    <NarrativeCard eyebrow="Takeaway" variant="takeaway">
      <p className="narrative-card__body">{takeaway}</p>
    </NarrativeCard>
  );
}

type NarrativeCardProps = {
  eyebrow: string;
  variant?: "default" | "actually" | "takeaway";
  children: React.ReactNode;
};

function NarrativeCard({ eyebrow, variant = "default", children }: NarrativeCardProps) {
  const variantClass =
    variant === "actually"
      ? " narrative-card--actually"
      : variant === "takeaway"
        ? " narrative-card--takeaway"
        : "";
  return (
    <section className={`narrative-card${variantClass}`}>
      <p className="eyebrow">{eyebrow}</p>
      {children}
    </section>
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
            <div
              key={option.option_id}
              className="quiz-option quiz-option--readonly quiz-option--wrong"
              aria-disabled="true"
            >
              <span className="quiz-option__text">{option.text}</span>
              <span className="quiz-option__feedback">
                {feedback.by_option[option.option_id] ?? ""}
              </span>
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

function findCorrectOption(
  options: AnswerOption[],
  feedback: StepFeedback,
): AnswerOption | undefined {
  return options.find((option) =>
    feedback.correct.option_ids.includes(option.option_id),
  );
}
