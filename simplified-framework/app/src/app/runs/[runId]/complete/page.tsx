import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StarRow } from "@/app/_components/StarRow";
import { prisma } from "@/lib/db";
import { getRun } from "@/lib/runs";

type CompletePageProps = {
  params: Promise<{ runId: string }>;
};

export default async function CompletePage({ params }: CompletePageProps) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }
  if (!run.readingFinishedAt) {
    redirect(`/runs/${runId}/scene/${run.currentSceneIndex}`);
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

  return (
    <div className="page complete-page">
      <header className="page-header">
        <p className="eyebrow">Episode recap</p>
        <h1>{catalogEpisode.episodeTitle}</h1>
      </header>

      <section className="panel stack complete-panel">
        <StarRow earned={run.starsEarned} size="hero" />
        <div className="action-row">
          <Link href={`/runs/${runId}/scene/0`} className="primary">
            Read again
          </Link>
          <Link href="/" className="secondary">
            Home
          </Link>
        </div>
      </section>
    </div>
  );
}
