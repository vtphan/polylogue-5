import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  openPracticeHintAction,
  submitPracticeExerciseAction,
} from "@/app/actions";
import { getPracticeExercise } from "@/lib/practice";
import { prisma } from "@/lib/db";
import { getActiveStudentFromCookies } from "@/lib/students";

type PracticeExercisePageProps = {
  params: Promise<{ flaw_id: string }>;
  searchParams: Promise<{ choice?: string; hint?: string }>;
};

export default async function PracticeExercisePage({
  params,
  searchParams,
}: PracticeExercisePageProps) {
  const [{ flaw_id: flawId }, { choice, hint }] = await Promise.all([params, searchParams]);

  const student = await getActiveStudentFromCookies();
  if (!student) {
    redirect("/");
  }

  const exercise = await getPracticeExercise(flawId);
  if (!exercise) {
    notFound();
  }

  const completedAttempt = await prisma.practiceAttempt.findUnique({
    where: {
      unique_student_practice_flaw: {
        studentId: student.id,
        flawId,
      },
    },
    select: { completedAt: true },
  });

  const selectedOption =
    exercise.options.find((option) => option.optionId === choice) ?? null;
  const isCorrect = selectedOption
    ? exercise.feedback.correct.optionIds.includes(selectedOption.optionId)
    : false;

  return (
    <div className="page-wide">
      <header className="page-header">
        <p className="eyebrow">Practice exercise</p>
        <h1>{exercise.title}</h1>
        <p>{completedAttempt?.completedAt ? "Completed for this profile." : "Complete once to count toward story unlock."}</p>
      </header>

      <section className="panel stack practice-panel">
        <div className="stack">
          <p className="eyebrow">Scenario</p>
          <p>{exercise.scenario}</p>
        </div>

        <div className="stack">
          <h2>{exercise.prompt}</h2>

          {selectedOption ? null : (
            <>
              {hint === "open" ? (
                <div className="practice-hint">
                  <p className="eyebrow">Hint</p>
                  <p>{exercise.hint}</p>
                </div>
              ) : (
                <form action={openPracticeHintAction}>
                  <input type="hidden" name="flaw_id" value={exercise.flawId} />
                  <button type="submit" className="ghost">
                    Hint
                  </button>
                </form>
              )}

              <div className="quiz-options">
                {exercise.options.map((option) => (
                  <form key={option.optionId} action={submitPracticeExerciseAction}>
                    <input type="hidden" name="flaw_id" value={exercise.flawId} />
                    <input type="hidden" name="option_id" value={option.optionId} />
                    <button type="submit" className="quiz-option">
                      {option.text}
                    </button>
                  </form>
                ))}
              </div>
            </>
          )}

          {selectedOption ? (
            <div className="practice-reveal stack">
              <p className={`quiz-status ${isCorrect ? "quiz-status--correct" : "quiz-status--wrong"}`}>
                {isCorrect ? "Best answer chosen" : "Not the best answer"}
              </p>
              <div className="quiz-answer-review__card">
                <p className="quiz-answer-review__label">Your choice</p>
                <p>{selectedOption.text}</p>
              </div>
              <div className="practice-feedback-card">
                <p className="quiz-answer-review__label">
                  {isCorrect ? "This is the best answer because..." : "This is not the best answer because..."}
                </p>
                <p>
                  {isCorrect
                    ? exercise.feedback.correct.text
                    : exercise.feedback.byOption[selectedOption.optionId] ?? ""}
                </p>
              </div>
              <div className="practice-feedback-card">
                <p className="quiz-answer-review__label">Worked explanation</p>
                <p>{exercise.workedExplanation}</p>
              </div>
              <div className="practice-feedback-card">
                <p className="quiz-answer-review__label">Takeaway</p>
                <p>{exercise.takeaway}</p>
              </div>
              <div className="action-row">
                <Link href="/practice" className="primary">
                  Done
                </Link>
                <Link href={`/practice/${exercise.flawId}`} className="secondary">
                  Try again
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
