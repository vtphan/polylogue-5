"use client";

import {
  openQuizHintAction,
  submitStep1Action,
  submitStep2Action,
  submitStep3Action,
} from "@/app/actions";
import type { ReaderLevel } from "@/lib/content";
import type { AnswerOption, StepFeedback } from "@/lib/domain";
import type { QuizAttempt } from "@prisma/client";

type QuizPanelProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  onClose: () => void;
};

export function QuizPanel({ runId, sceneIndex, level, attempt, onClose }: QuizPanelProps) {
  const step1Locked = Boolean(attempt?.step1LockedAt);
  const step1First = attempt?.step1FirstOption ?? null;
  const step1Final = attempt?.step1FinalOption ?? null;
  const step2Option = attempt?.step2Option ?? null;
  const step3Locked = Boolean(attempt?.step3LockedAt);
  const step3First = attempt?.step3FirstOption ?? null;
  const step3Final = attempt?.step3FinalOption ?? null;
  const levelLocked = Boolean(attempt?.lockedAt);

  const step2Revealed = step1Locked;
  const step3Revealed = step2Revealed && Boolean(step2Option);

  const headerEyebrow = levelLocked ? "Answered" : "Reasoning check";

  const step3Branch =
    step2Option === "yes_strong"
      ? level.step_3.why_yes
      : step2Option === "no_unsure"
        ? level.step_3.why_no
        : null;

  return (
    <div className={`quiz-panel stack${levelLocked ? " quiz-panel--locked" : ""}`}>
      <div className="quiz-panel__header">
        <div className="quiz-panel__titles">
          <p className="eyebrow">{headerEyebrow}</p>
          <h3>Three-step reasoning check</h3>
        </div>
        {!levelLocked && level.hint && !attempt?.usedHint ? (
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

      {!levelLocked && level.hint && attempt?.usedHint ? (
        <div className="hint-card">
          <p className="eyebrow">Hint</p>
          <p>{level.hint}</p>
        </div>
      ) : null}

      <StepSection stepLabel="Step 1 — Claim">
        <p className="quiz-prompt">{level.step_1_claim.prompt}</p>
        <GradedOptions
          runId={runId}
          sceneIndex={sceneIndex}
          levelId={level.level_id}
          actionName="step1"
          options={level.step_1_claim.options}
          feedback={level.step_1_claim.feedback}
          firstOptionId={step1First}
          finalOptionId={step1Final}
          locked={step1Locked}
        />
      </StepSection>

      {step2Revealed ? (
        <StepSection stepLabel="Step 2 — Your take">
          <p className="quiz-prompt">{level.step_2_judgment.prompt}</p>
          <ReflectionOptions
            runId={runId}
            sceneIndex={sceneIndex}
            levelId={level.level_id}
            options={level.step_2_judgment.options}
            pickedOptionId={step2Option}
          />
          {step2Option && level.step_2_judgment.routing_text ? (
            <p className="quiz-routing">{level.step_2_judgment.routing_text}</p>
          ) : null}
        </StepSection>
      ) : null}

      {step3Revealed && step3Branch ? (
        <StepSection stepLabel="Step 3 — Why">
          <p className="quiz-prompt">{step3Branch.prompt}</p>
          <GradedOptions
            runId={runId}
            sceneIndex={sceneIndex}
            levelId={level.level_id}
            actionName="step3"
            options={step3Branch.options}
            feedback={step3Branch.feedback}
            firstOptionId={step3First}
            finalOptionId={step3Final}
            locked={step3Locked}
          />
        </StepSection>
      ) : null}

      {levelLocked ? (
        <div className="quiz-takeaway">
          <p className="quiz-answer-review__label">Takeaway</p>
          <p>{level.takeaway}</p>
        </div>
      ) : null}

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

function StepSection({
  stepLabel,
  children,
}: {
  stepLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="quiz-step stack">
      <p className="eyebrow">{stepLabel}</p>
      {children}
    </section>
  );
}

type GradedOptionsProps = {
  runId: string;
  sceneIndex: number;
  levelId: string;
  actionName: "step1" | "step3";
  options: AnswerOption[];
  feedback: StepFeedback;
  firstOptionId: string | null;
  finalOptionId: string | null;
  locked: boolean;
};

function GradedOptions({
  runId,
  sceneIndex,
  levelId,
  actionName,
  options,
  feedback,
  firstOptionId,
  finalOptionId,
  locked,
}: GradedOptionsProps) {
  const correctOptionIds = new Set(feedback.correct.option_ids);
  const isRetry = Boolean(firstOptionId) && !locked;
  const finalOrFirst = finalOptionId ?? firstOptionId;
  const wasCorrect = locked && finalOrFirst ? correctOptionIds.has(finalOrFirst) : false;
  const action = actionName === "step1" ? submitStep1Action : submitStep3Action;

  return (
    <>
      {locked ? (
        <p
          className={`quiz-status ${
            wasCorrect ? "quiz-status--correct" : "quiz-status--wrong"
          }`}
        >
          {wasCorrect ? "Correct" : "Not quite right"}
        </p>
      ) : null}

      <div className="quiz-options">
        {options.map((option) => {
          const isCorrectOption = correctOptionIds.has(option.option_id);
          const isChosen =
            option.option_id === firstOptionId || option.option_id === finalOptionId;

          let stateClass = "";
          let showFeedback = false;
          let feedbackText = "";
          let disabled = false;

          const feedbackForOption = (id: string) => {
            if (correctOptionIds.has(id)) {
              return feedback.correct.text;
            }
            return feedback.by_option[id] ?? "";
          };

          if (locked) {
            if (isChosen) {
              stateClass = isCorrectOption
                ? " quiz-option--correct"
                : " quiz-option--wrong";
              showFeedback = true;
              feedbackText = feedbackForOption(option.option_id);
            } else if (isCorrectOption && !wasCorrect) {
              stateClass = " quiz-option--correct quiz-option--best";
              showFeedback = true;
              feedbackText = feedback.correct.text;
            }
            disabled = true;
          } else if (isRetry) {
            if (option.option_id === firstOptionId) {
              stateClass = " quiz-option--wrong";
              showFeedback = true;
              feedbackText = feedbackForOption(firstOptionId);
              disabled = true;
            }
          }

          const content = (
            <>
              <span className="quiz-option__text">{option.text}</span>
              {showFeedback ? (
                <span className="quiz-option__feedback">{feedbackText}</span>
              ) : null}
            </>
          );

          if (disabled) {
            return (
              <div
                key={option.option_id}
                className={`quiz-option quiz-option--readonly${stateClass}`}
                aria-disabled="true"
              >
                {content}
              </div>
            );
          }

          return (
            <form key={option.option_id} action={action}>
              <input type="hidden" name="run_id" value={runId} />
              <input type="hidden" name="scene_index" value={sceneIndex} />
              <input type="hidden" name="level_id" value={levelId} />
              <input type="hidden" name="option_id" value={option.option_id} />
              <button type="submit" className={`quiz-option${stateClass}`}>
                {content}
              </button>
            </form>
          );
        })}
      </div>
    </>
  );
}

type ReflectionOptionsProps = {
  runId: string;
  sceneIndex: number;
  levelId: string;
  options: AnswerOption[];
  pickedOptionId: string | null;
};

function ReflectionOptions({
  runId,
  sceneIndex,
  levelId,
  options,
  pickedOptionId,
}: ReflectionOptionsProps) {
  return (
    <div className="quiz-options">
      {options.map((option) => {
        const isPicked = option.option_id === pickedOptionId;
        const anyPicked = Boolean(pickedOptionId);

        if (anyPicked) {
          const stateClass = isPicked ? " quiz-option--picked" : "";
          return (
            <div
              key={option.option_id}
              className={`quiz-option quiz-option--readonly${stateClass}`}
              aria-disabled="true"
            >
              <span className="quiz-option__text">{option.text}</span>
            </div>
          );
        }

        return (
          <form key={option.option_id} action={submitStep2Action}>
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
