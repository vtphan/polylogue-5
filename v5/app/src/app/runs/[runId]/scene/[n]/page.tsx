import { notFound, redirect } from "next/navigation";
import { ContinuousSceneReader } from "@/app/runs/[runId]/_components/ContinuousSceneReader";
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

export default async function ScenePage({ params, searchParams }: ScenePageProps) {
  const { runId, n } = await params;
  const { open } = await searchParams;
  const sceneIndex = Number(n);
  if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
    notFound();
  }
  if (sceneIndex === 0) {
    redirect(`/runs/${runId}/scene/1`);
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

  const quizAttempts = await prisma.quizAttempt.findMany({ where: { runId } });
  const numericEpisodeMatch = run.episodeId.match(/(\d+)$/);
  const episodeLabel = numericEpisodeMatch
    ? `Episode ${Number(numericEpisodeMatch[1])}`
    : run.episodeId;

  return (
    <ContinuousSceneReader
      runId={runId}
      episodeLabel={episodeLabel}
      episodeTitle={lessonPackage.title}
      episodeSummary={lessonPackage.summary}
      scenes={transcript.scenes}
      levels={lessonPackage.levels}
      attempts={quizAttempts}
      initialSceneIndex={sceneIndex}
      openLevelId={open ?? null}
      runStarsEarned={run.starsEarned}
    />
  );
}
