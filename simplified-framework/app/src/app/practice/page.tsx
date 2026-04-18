import Link from "next/link";
import { redirect } from "next/navigation";
import { loadPracticeExercises } from "@/lib/practice";
import { prisma } from "@/lib/db";
import {
  REQUIRED_PRACTICE_COUNT,
  getActiveStudentFromCookies,
} from "@/lib/students";

export default async function PracticePage() {
  const student = await getActiveStudentFromCookies();
  if (!student) {
    redirect("/");
  }

  const [exercises, attempts] = await Promise.all([
    loadPracticeExercises(),
    prisma.practiceAttempt.findMany({
      where: { studentId: student.id, completedAt: { not: null } },
      select: { flawId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const completedFlawIds = new Set(attempts.map((attempt) => attempt.flawId));
  const completedCount = completedFlawIds.size;
  const remainingCount = Math.max(0, REQUIRED_PRACTICE_COUNT - completedCount);

  return (
    <div className="page-wide">
      <header className="page-header">
        <p className="eyebrow">Practice</p>
        <h1>Pick a flaw exercise for {student.name}.</h1>
        <p>
          Finish all five once to unlock story mode. Replays stay available any time.
        </p>
      </header>

      <section className="panel stack">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">Unlock progress</p>
            <h2>
              {completedCount} of {REQUIRED_PRACTICE_COUNT} completed
            </h2>
          </div>
          <p className="subdued">
            {remainingCount === 0
              ? "Story mode is unlocked."
              : `${remainingCount} exercise${remainingCount === 1 ? "" : "s"} left before stories unlock.`}
          </p>
        </div>

        <ul className="selector-list">
          {exercises.map((exercise) => {
            const completed = completedFlawIds.has(exercise.flawId);

            return (
              <li key={exercise.flawId} className="selector-item">
                <Link href={`/practice/${exercise.flawId}`} className="selector-target practice-card">
                  <div className="story-picker-card__copy">
                    <div>
                      <div className="selector-title">{exercise.title}</div>
                      <div className="selector-hint">{exercise.flawId.replaceAll("_", " ")}</div>
                    </div>
                    <div className="story-picker-card__state">
                      {completed ? "Completed" : "Open"}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="action-row">
          <Link href="/" className="secondary">
            Home
          </Link>
          <Link href={remainingCount === 0 ? "/stories" : "/"} className="primary">
            {remainingCount === 0 ? "Read a story" : "Come back to stories later"}
          </Link>
        </div>
      </section>
    </div>
  );
}
