import {
  closeQuizPanelAction,
  openQuizHintAction,
  submitQuizAnswerAction,
} from "@/app/actions";
import type { ReaderLevel } from "@/lib/content";
import type { TranscriptTurn } from "@/lib/domain";
import { feedbackTextForOption } from "@/lib/quiz";
import type { QuizAttempt } from "@prisma/client";

type QuizPanelProps = {
  runId: string;
  sceneIndex: number;
  level: ReaderLevel;
  attempt: QuizAttempt | null;
  flaggedTurn: TranscriptTurn | null;
};

function FlaggedTurnQuote({ turn }: { turn: TranscriptTurn | null }) {
  if (!turn || turn.kind !== "dialog" || !turn.speaker) return null;
  return (
    <blockquote className="quiz-quote">
      <p className="quiz-quote__text">&ldquo;{turn.text}&rdquo;</p>
      <p className="quiz-quote__attrib">— {turn.speaker}</p>
    </blockquote>
  );
}

function BackToReadingButton({
  runId,
  sceneIndex,
}: {
  runId: string;
  sceneIndex: number;
}) {
  return (
    <form action={closeQuizPanelAction} className="quiz-back-form">
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="scene_index" value={sceneIndex} />
      <button type="submit" className="ghost quiz-back">
        ← Back to reading
      </button>
    </form>
  );
}

export function QuizPanel({
  runId,
  sceneIndex,
  level,
  attempt,
  flaggedTurn,
}: QuizPanelProps) {
  const isLocked = Boolean(attempt?.lockedAt);
  const isRetry = Boolean(attempt?.firstOptionId) && !isLocked;
  const selectedOptionId = attempt?.finalOptionId ?? attempt?.firstOptionId ?? null;
  const correctOptionIds = new Set(level.feedback.correct.option_ids);
  const correctOptions = level.answer_options.filter((option) =>
    correctOptionIds.has(option.option_id),
  );

  if (isLocked) {
    const selected = level.answer_options.find((option) => option.option_id === selectedOptionId);
    const wasCorrect = selectedOptionId
      ? level.feedback.correct.option_ids.includes(selectedOptionId)
      : false;
    const feedback = selectedOptionId ? feedbackTextForOption(level, selectedOptionId) : "";

    return (
      <div className="quiz-panel quiz-panel--reveal stack">
        <div className="quiz-panel__header">
          <div>
            <p className="eyebrow">Answered</p>
            <h3>{level.title}</h3>
          </div>
          <BackToReadingButton runId={runId} sceneIndex={sceneIndex} />
        </div>

        <FlaggedTurnQuote turn={flaggedTurn} />

        <p className={`quiz-status ${wasCorrect ? "quiz-status--correct" : "quiz-status--wrong"}`}>
          {wasCorrect ? `Correct · ${attempt?.starsEarned ?? 0} stars` : "Not quite right"}
        </p>

        <div className="quiz-answer-review stack">
          <p className="quiz-answer-review__label">Your answer</p>
          <div className="quiz-answer-review__card">
            <p>{selected?.text ?? "No saved answer"}</p>
            <p className="subdued">{feedback}</p>
          </div>
        </div>

        {!wasCorrect ? (
          <div className="quiz-answer-review stack">
            <p className="quiz-answer-review__label">Best answer</p>
            <div className="quiz-answer-review__card">
              <p>{correctOptions.map((option) => option.text).join(", ") || "No authored best answer"}</p>
              <p className="subdued">{level.feedback.correct.text}</p>
            </div>
          </div>
        ) : null}

        <div className="quiz-answer-review stack">
          <p className="quiz-answer-review__label">Takeaway</p>
          <div className="quiz-answer-review__card">
            <p>{level.takeaway ?? "Look closely at the reasoning move in this turn."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-panel stack">
      <div className="quiz-panel__header">
        <div>
          <p className="eyebrow">{isRetry ? "Try once more" : "Question"}</p>
          <h3>{level.title}</h3>
        </div>
        <BackToReadingButton runId={runId} sceneIndex={sceneIndex} />
      </div>

      <FlaggedTurnQuote turn={flaggedTurn} />

      <p className="quiz-prompt">{level.prompt}</p>

      {attempt?.firstOptionId && !isLocked ? (
        <div className="quiz-answer-review stack">
          <p className="quiz-answer-review__label">First answer</p>
          <div className="quiz-answer-review__card">
            <p>
              {
                level.answer_options.find((option) => option.option_id === attempt.firstOptionId)?.text
              }
            </p>
            <p className="subdued">{feedbackTextForOption(level, attempt.firstOptionId)}</p>
          </div>
        </div>
      ) : null}

      <div className="quiz-options">
        {level.answer_options.map((option) => {
          const disabled = attempt?.firstOptionId === option.option_id && !isLocked;
          return (
            <form key={option.option_id} action={submitQuizAnswerAction}>
              <input type="hidden" name="run_id" value={runId} />
              <input type="hidden" name="scene_index" value={sceneIndex} />
              <input type="hidden" name="level_id" value={level.level_id} />
              <input type="hidden" name="option_id" value={option.option_id} />
              <button
                type="submit"
                className={`quiz-option ${disabled ? "quiz-option--disabled" : ""}`}
                disabled={disabled}
              >
                {option.text}
              </button>
            </form>
          );
        })}
      </div>

      {level.hint ? (
        attempt?.usedHint ? (
          <div className="hint-card">
            <p className="eyebrow">Hint</p>
            <p>{level.hint}</p>
          </div>
        ) : (
          <form action={openQuizHintAction}>
            <input type="hidden" name="run_id" value={runId} />
            <input type="hidden" name="scene_index" value={sceneIndex} />
            <input type="hidden" name="level_id" value={level.level_id} />
            <button type="submit" className="secondary">
              Hint
            </button>
          </form>
        )
      ) : null}
    </div>
  );
}
