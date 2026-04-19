"use client";

import { openQuizHintAction, submitQuizAnswerAction } from "@/app/actions";
import type { ReaderLevel } from "@/lib/content";
import type { QuizAttempt } from "@prisma/client";

function feedbackTextForOption(level: ReaderLevel, optionId: string): string {
  if (level.feedback.correct.option_ids.includes(optionId)) {
    return level.feedback.correct.text;
  }
  return level.feedback.by_option[optionId] ?? "";
}

type QuizPanelProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  onClose: () => void;
};

export function QuizPanel({ runId, sceneIndex, level, attempt, onClose }: QuizPanelProps) {
  const isLocked = Boolean(attempt?.lockedAt);
  const isRetry = Boolean(attempt?.firstOptionId) && !isLocked;

  const firstOptionId = attempt?.firstOptionId ?? null;
  const finalOptionId = attempt?.finalOptionId ?? firstOptionId;
  const correctOptionIds = new Set(level.feedback.correct.option_ids);
  const wasCorrect =
    isLocked && finalOptionId ? correctOptionIds.has(finalOptionId) : false;

  const headerEyebrow = isLocked ? "Answered" : isRetry ? "Try once more" : "Question";

  return (
    <div
      className={`quiz-panel stack${isLocked ? " quiz-panel--locked" : ""}`}
    >
      <div className="quiz-panel__header">
        <div className="quiz-panel__titles">
          <p className="eyebrow">{headerEyebrow}</p>
          <h3>{level.title}</h3>
        </div>
        {!isLocked && level.hint && !attempt?.usedHint ? (
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

      {!isLocked && level.hint && attempt?.usedHint ? (
        <div className="hint-card">
          <p className="eyebrow">Hint</p>
          <p>{level.hint}</p>
        </div>
      ) : null}

      <p className="quiz-prompt">{level.prompt}</p>

      {isLocked ? (
        <p
          className={`quiz-status ${
            wasCorrect ? "quiz-status--correct" : "quiz-status--wrong"
          }`}
        >
          {wasCorrect
            ? `Correct · ${attempt?.starsEarned ?? 0} stars`
            : "Not quite right"}
        </p>
      ) : null}

      <div className="quiz-options">
        {level.answer_options.map((option) => {
          const isCorrectOption = correctOptionIds.has(option.option_id);
          const isChosen =
            option.option_id === firstOptionId || option.option_id === finalOptionId;

          let stateClass = "";
          let showFeedback = false;
          let feedbackText = "";
          let disabled = false;

          if (isLocked) {
            // Reveal: color each chosen option by *its own* correctness, so
            // a retry where the first pick was wrong and the second was
            // right renders the first option red and the second green.
            if (isChosen) {
              stateClass = isCorrectOption
                ? " quiz-option--correct"
                : " quiz-option--wrong";
              showFeedback = true;
              feedbackText = feedbackTextForOption(level, option.option_id);
            } else if (isCorrectOption && !wasCorrect) {
              // Reveal the best answer only when the student never picked
              // it — otherwise the correctly-picked option already shows
              // its feedback above.
              stateClass = " quiz-option--correct quiz-option--best";
              showFeedback = true;
              feedbackText = level.feedback.correct.text;
            }
            disabled = true;
          } else if (isRetry) {
            // Retry: the first-picked (wrong) option is highlighted red and
            // not re-selectable; other options are still active.
            if (option.option_id === firstOptionId) {
              stateClass = " quiz-option--wrong";
              showFeedback = true;
              feedbackText = feedbackTextForOption(level, firstOptionId);
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
            <form key={option.option_id} action={submitQuizAnswerAction}>
              <input type="hidden" name="run_id" value={runId} />
              <input type="hidden" name="scene_index" value={sceneIndex} />
              <input type="hidden" name="level_id" value={level.level_id} />
              <input type="hidden" name="option_id" value={option.option_id} />
              <button type="submit" className={`quiz-option${stateClass}`}>
                {content}
              </button>
            </form>
          );
        })}
      </div>

      {isLocked ? (
        <div className="quiz-takeaway">
          <p className="quiz-answer-review__label">Takeaway</p>
          <p>{level.takeaway ?? "Look closely at the reasoning move in this turn."}</p>
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
