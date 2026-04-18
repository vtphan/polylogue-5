import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizPanel } from "@/app/runs/[runId]/_components/QuizPanel";
import { goToSceneAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import {
  loadReaderLessonPackageByPaths,
  loadReaderTranscriptByPaths,
} from "@/lib/content";
import { prisma } from "@/lib/db";
import { getRunForStudent } from "@/lib/runs";
import { getActiveStudentFromCookies } from "@/lib/students";

type ScenePageProps = {
  params: Promise<{ runId: string; n: string }>;
  searchParams: Promise<{ open?: string }>;
};

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
    <form action={goToSceneAction}>
      <input type="hidden" name="run_id" value={runId} />
      <input type="hidden" name="target_scene_index" value={targetSceneIndex} />
      <button type="submit" className={className}>
        {label}
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

  const levelsByTurnId = new Map(lessonPackage.levels.map((level) => [level.turn_id, level]));

  if (sceneIndex === 0) {
    return (
      <div className="page-wide">
        <header className="page-header">
          <p className="eyebrow">Start</p>
          <h1>{lessonPackage.title}</h1>
          <p>Orientation before scene 1.</p>
        </header>

        <section className="panel stack orientation-card">
          {lessonPackage.previously ? (
            <div className="orientation-block stack">
              <p className="eyebrow">Previously</p>
              <p>{lessonPackage.previously}</p>
            </div>
          ) : null}
          <div className="orientation-block stack">
            <p className="eyebrow">Summary</p>
            <p>{lessonPackage.summary || transcript.scenes[0]?.summary || transcript.title}</p>
          </div>
          <div className="scene-nav">
            <SceneNavForm
              runId={runId}
              targetSceneIndex={1}
              label="Continue"
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

  return (
    <div className="page-wide scene-reader">
      <header className="page-header">
        <p className="eyebrow">
          Scene {sceneIndex} of {sceneCount}
        </p>
        <h1>{transcript.title}</h1>
        <p>{scene.summary}</p>
      </header>

      <section className="panel stack">
        <ol className="scene-turns">
          {scene.turns.map((turn) => {
            const level = levelsByTurnId.get(turn.turn_id);
            const flagged = Boolean(level);
            return (
              <li
                key={turn.turn_id}
                className={`scene-turn ${turn.kind === "action" ? "scene-turn--action" : ""}`}
              >
                {turn.kind === "dialog" ? (
                  <p className="scene-turn__speaker">{turn.speaker}</p>
                ) : (
                  <p className="scene-turn__speaker scene-turn__speaker--action">Action</p>
                )}
                <div className="scene-turn__bubble">
                  <p>{turn.text}</p>
                  {flagged ? (
                    <span className="scene-turn__flag" aria-label="Quiz available on this turn">
                      ◉
                    </span>
                  ) : null}
                </div>
                {level ? (
                  <QuizPanel
                    runId={runId}
                    sceneIndex={sceneIndex}
                    level={level}
                    attempt={attemptsByLevelId.get(level.level_id) ?? null}
                    open={open === level.level_id || Boolean(attemptsByLevelId.get(level.level_id)?.firstOptionId && !attemptsByLevelId.get(level.level_id)?.lockedAt)}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="panel scene-nav-panel">
        <StarRow earned={run.starsEarned} />
        <div className="scene-nav scene-nav--with-recap">
          {sceneIndex > 0 ? (
            <SceneNavForm
              runId={runId}
              targetSceneIndex={sceneIndex - 1}
              label={sceneIndex === 1 ? "Back to start" : "Previous"}
              className="secondary"
            />
          ) : (
            <span />
          )}
          {run.readingFinishedAt && sceneIndex < sceneCount ? (
            <Link href={`/runs/${runId}/complete`} className="ghost">
              Recap
            </Link>
          ) : null}
          {sceneIndex < sceneCount ? (
            <SceneNavForm
              runId={runId}
              targetSceneIndex={sceneIndex + 1}
              label="Next"
              className="primary"
            />
          ) : (
            <Link href={`/runs/${runId}/complete`} className="primary">
              Recap
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
