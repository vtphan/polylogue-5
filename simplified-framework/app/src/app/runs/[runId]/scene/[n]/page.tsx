import { notFound, redirect } from "next/navigation";
import { ContinuousSceneReader } from "@/app/runs/[runId]/_components/ContinuousSceneReader";
import { goToSceneAction } from "@/app/actions";
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
    <form action={goToSceneAction} className="scene-nav-form">
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

  const sceneCount = transcript.scenes.length;
  if (sceneIndex > sceneCount) {
    redirect(`/runs/${runId}/scene/${sceneCount}`);
  }

  // Scene 0 = orientation splash. `Previously` now lives on /stories; splash
  // carries only the summary + Start.
  if (sceneIndex === 0) {
    return (
      <div className="page-wide">
        <header className="page-header">
          <p className="eyebrow">Start</p>
          <h1>{lessonPackage.title}</h1>
        </header>

        <section className="panel stack orientation-card">
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

  const quizAttempts = await prisma.quizAttempt.findMany({ where: { runId } });

  return (
    <ContinuousSceneReader
      runId={runId}
      episodeTitle={lessonPackage.title}
      episodeSummary={lessonPackage.summary}
      characters={transcript.characters}
      scenes={transcript.scenes}
      levels={lessonPackage.levels}
      attempts={quizAttempts}
      initialSceneIndex={sceneIndex}
      openLevelId={open ?? null}
      runStarsEarned={run.starsEarned}
      readingFinished={Boolean(run.readingFinishedAt)}
      runHref={`/runs/${runId}`}
    />
  );
}
