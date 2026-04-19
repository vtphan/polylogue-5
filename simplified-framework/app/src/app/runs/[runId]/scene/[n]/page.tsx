import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScaffoldPanel } from "@/app/runs/[runId]/_components/ScaffoldPanel";
import { goToSceneAction, openQuizPanelAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import {
  loadReaderLessonPackageByPaths,
  loadReaderTranscriptByPaths,
} from "@/lib/content";
import { prisma } from "@/lib/db";
import { getRunForStudent } from "@/lib/runs";
import { getActiveStudentFromCookies } from "@/lib/students";
import type { QuizAttempt } from "@prisma/client";

type ScenePageProps = {
  params: Promise<{ runId: string; n: string }>;
  searchParams: Promise<{ open?: string }>;
};

function capitalize(id: string): string {
  if (!id) return id;
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function SceneNavForm({
  runId,
  targetSceneIndex,
  label,
  className,
}: {
  runId: string;
  targetSceneIndex: number;
  label: string;
  className: string;
}) {
  return (
    <form action={goToSceneAction} className="scene-nav-form">
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="target_scene_index" value={targetSceneIndex} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

function FlaggedTurnIcon({
  runId,
  sceneIndex,
  levelId,
  attempt,
  isOpen,
}: {
  runId: string;
  sceneIndex: number;
  levelId: string;
  attempt: QuizAttempt | null;
  isOpen: boolean;
}) {
  const locked = Boolean(attempt?.lockedAt);
  const variant = isOpen
    ? " flagged-turn__chip--open"
    : locked
      ? " flagged-turn__chip--locked"
      : "";
  const label = isOpen
    ? "Question is open in the right column"
    : locked
      ? "Review this question"
      : "Open the question for this turn";

  return (
    <form action={openQuizPanelAction} className="flagged-turn__form">
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="scene_index" value={sceneIndex} />
      <input type="hidden" name="level_id" value={levelId} />
      <button
        type="submit"
        className={`flagged-turn__chip${variant}`}
        title={label}
        aria-label={label}
      >
        ?
      </button>
    </form>
  );
}

export default async function ScenePage({ params, searchParams }: ScenePageProps) {
  const { runId, n } = await params;
  const { open } = await searchParams;
  const sceneIndex = Number(n);
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
    notFound();
  }

  const student = await getActiveStudentFromCookies();
  if (!student) {
    redirect("/");
  }

  const run = await getRunForStudent(runId, student.id);
  if (!run) {
    notFound();
  }

  const catalogEpisode = await prisma.catalogEpisode.findUnique({
    where: {
      storyId_episodeId: {
        storyId: run.storyId,
        episodeId: run.episodeId,
      },
    },
  });
  if (!catalogEpisode) {
    notFound();
  }

  const [lessonPackage, transcript] = await Promise.all([
    loadReaderLessonPackageByPaths(catalogEpisode.lessonPackagePath),
    loadReaderTranscriptByPaths(catalogEpisode.transcriptPath),
  ]);
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { runId },
  });
  const attemptsByLevelId = new Map(quizAttempts.map((attempt) => [attempt.levelId, attempt]));

  const sceneCount = transcript.scenes.length;
  if (sceneIndex > sceneCount) {
    redirect(`/runs/${runId}/scene/${sceneCount}`);
  }

  // Scene 0 = orientation splash. Stay single-column here — a two-column
  // shell on a splash screen adds scan-overhead without useful scaffold.
  if (sceneIndex === 0) {
    return (
      <div className="page-wide">
        <header className="page-header">
          <p className="eyebrow">Start</p>
          <h1>{lessonPackage.title}</h1>
        </header>

        <section className="panel stack orientation-card">
          {lessonPackage.previously ? (
            <div className="orientation-block stack">
              <p className="eyebrow">Previously</p>
              <p>{lessonPackage.previously}</p>
            </div>
          ) : null}
          <div className="orientation-block stack">
            <p className="eyebrow">What this episode is about</p>
            <p>{lessonPackage.summary}</p>
          </div>
          <div className="scene-nav">
            <SceneNavForm
              runId={runId}
              targetSceneIndex={1}
              label="Start reading"
              className="primary"
            />
          </div>
        </section>
      </div>
    );
  }

  const scene = transcript.scenes[sceneIndex - 1];
  if (!scene) {
    notFound();
  }

  const sceneTurnIds = new Set(scene.turns.map((turn) => turn.turn_id));
  const sceneLevel =
    lessonPackage.levels.find((level) => sceneTurnIds.has(level.turn_id)) ?? null;
  const sceneAttempt = sceneLevel
    ? attemptsByLevelId.get(sceneLevel.level_id) ?? null
    : null;
  const flaggedTurn = sceneLevel
    ? scene.turns.find((turn) => turn.turn_id === sceneLevel.turn_id) ?? null
    : null;

  // Server-driven quiz-open state: URL `?open=<level_id>` means the quiz is
  // showing in the right rail. Also auto-open when the student is mid-attempt
  // (first answer submitted, not yet locked) so a refresh doesn't drop them
  // back into reading mode with unsaved progress hidden.
  const attemptOpen = Boolean(
    sceneAttempt?.firstOptionId && !sceneAttempt?.lockedAt,
  );
  const quizOpen =
    sceneLevel !== null && (open === sceneLevel.level_id || attemptOpen);

  return (
    <div className={`scene-shell${quizOpen ? " scene-shell--quiz-open" : ""}`}>
      <header className="scene-shell__header">
        <div className="scene-shell__titles">
          <p className="eyebrow">
            Scene {sceneIndex} of {sceneCount}
          </p>
          <h1 className="scene-shell__title">{transcript.title}</h1>
        </div>
        <ul className="scene-shell__characters" aria-label="Characters in this episode">
          {transcript.characters.map((id) => (
            <li key={id} className="character-chip">
              {capitalize(id)}
            </li>
          ))}
        </ul>
      </header>

      <div className="scene-shell__columns">
        <section className="scene-left" aria-label="Scene dialog">
          <ol className="scene-turns">
            {scene.turns
              .filter((turn) => turn.kind !== "action")
              .map((turn) => {
              const isFlagged = sceneLevel?.turn_id === turn.turn_id;
              return (
                <li
                  key={turn.turn_id}
                  className={`scene-turn scene-turn--dialog${
                    isFlagged ? " scene-turn--flagged" : ""
                  }`}
                >
                  <p className="scene-turn__speaker">{turn.speaker}</p>
                  <p className="scene-turn__text">{turn.text}</p>
                  {isFlagged && sceneLevel ? (
                    <FlaggedTurnIcon
                      runId={runId}
                      sceneIndex={sceneIndex}
                      levelId={sceneLevel.level_id}
                      attempt={sceneAttempt}
                      isOpen={quizOpen}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        <ScaffoldPanel
          runId={runId}
          sceneIndex={sceneIndex}
          sceneIsFirst={sceneIndex === 1}
          sceneSummary={scene.summary}
          episodeTitle={lessonPackage.title}
          episodeSummary={lessonPackage.summary}
          previously={lessonPackage.previously ?? null}
          level={sceneLevel}
          attempt={sceneAttempt}
          flaggedTurn={flaggedTurn}
          quizOpen={quizOpen}
        />
      </div>

      <nav className="scene-bottom-bar" aria-label="Scene navigation">
        <div className="scene-bottom-bar__side scene-bottom-bar__side--left">
          {sceneIndex > 0 ? (
            <SceneNavForm
              runId={runId}
              targetSceneIndex={sceneIndex - 1}
              label={sceneIndex === 1 ? "← Start" : "← Previous"}
              className="secondary"
            />
          ) : (
            <span />
          )}
        </div>

        <div className="scene-bottom-bar__center">
          <StarRow earned={run.starsEarned} />
        </div>

        <div className="scene-bottom-bar__side scene-bottom-bar__side--right">
          {run.readingFinishedAt && sceneIndex < sceneCount ? (
            <Link href={`/runs/${runId}/complete`} className="ghost">
              Recap
            </Link>
          ) : null}
          {sceneIndex < sceneCount ? (
            <SceneNavForm
              runId={runId}
              targetSceneIndex={sceneIndex + 1}
              label="Next →"
              className="primary"
            />
          ) : (
            <Link href={`/runs/${runId}/complete`} className="primary">
              Recap →
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
