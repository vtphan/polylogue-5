import Link from "next/link";
import { redirect } from "next/navigation";
import { openStoryAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import { listCatalogEpisodes } from "@/lib/catalog";
import { loadReaderLessonPackageByPaths } from "@/lib/content";
import { listStudentRuns } from "@/lib/runs";
import {
  getActiveStudentFromCookies,
  hasCompletedAllPractice,
} from "@/lib/students";

export default async function StoriesPage() {
  const student = await getActiveStudentFromCookies();
  if (!student) {
    redirect("/");
  }

  const practiceComplete = await hasCompletedAllPractice(student.id);
  if (!practiceComplete) {
    redirect("/practice");
  }

  const [episodes, runs] = await Promise.all([
    listCatalogEpisodes(),
    listStudentRuns(student.id),
  ]);

  const runsByEpisode = new Map(
    runs.map((run) => [`${run.storyId}::${run.episodeId}`, run]),
  );

  // Read each episode's lesson package so the card can surface its summary
  // (and `previously` continuity blurb) as decision-time context. Catalog
  // stays path-only; this is a /stories render-time read.
  type EpisodeBlurb = { summary: string; previously: string | null };
  const blurbByKey = new Map<string, EpisodeBlurb>();
  await Promise.all(
    episodes.map(async (episode) => {
      const key = `${episode.storyId}::${episode.episodeId}`;
      try {
        const lessonPackage = await loadReaderLessonPackageByPaths(episode.lessonPackagePath);
        blurbByKey.set(key, {
          summary: lessonPackage.summary,
          previously: lessonPackage.previously ?? null,
        });
      } catch {
        blurbByKey.set(key, { summary: "", previously: null });
      }
    }),
  );

  const grouped = new Map<
    string,
    Array<{
      storyId: string;
      episodeId: string;
      storyHeading: string;
      premise: string;
      episodeTitle: string;
      summary: string;
      previously: string | null;
      stateLabel: string;
      starsEarned: number;
    }>
  >();

  for (const episode of episodes) {
    const key = `${episode.storyId}::${episode.episodeId}`;
    const run = runsByEpisode.get(key);
    const stateLabel = run ? "Resume" : "Read";
    const blurb = blurbByKey.get(key);

    const bucket = grouped.get(episode.storyId) ?? [];
    bucket.push({
      storyId: episode.storyId,
      episodeId: episode.episodeId,
      storyHeading: episode.story.title,
      premise: episode.story.premise,
      episodeTitle: episode.episodeTitle,
      summary: blurb?.summary ?? "",
      previously: blurb?.previously ?? null,
      stateLabel,
      starsEarned: run?.starsEarned ?? 0,
    });
    grouped.set(episode.storyId, bucket);
  }

  return (
    <div className="page-wide">
      <header className="page-header">
        <p className="eyebrow">Read a story</p>
        <h1>Pick an episode for {student.name}.</h1>
        <p>
          Episodes stay in a fixed order. Tap a card to open the episode and start reading.
        </p>
      </header>

      <div className="stack">
        {Array.from(grouped.entries()).map(([storyId, storyEpisodes]) => (
          <section key={storyId} className="panel stack">
            <div className="home-section-heading">
              <div>
                <p className="eyebrow">Story</p>
                <h2>{storyEpisodes[0]?.storyHeading}</h2>
                {storyEpisodes[0]?.premise ? <p>{storyEpisodes[0].premise}</p> : null}
              </div>
            </div>

            <ul className="selector-list">
              {storyEpisodes.map((episode) => (
                <li key={`${episode.storyId}-${episode.episodeId}`} className="selector-item">
                  <form action={openStoryAction}>
                    <input type="hidden" name="story_id" value={episode.storyId} />
                    <input type="hidden" name="episode_id" value={episode.episodeId} />
                    <button type="submit" className="selector-target story-picker-card">
                      <div className="story-picker-card__copy">
                        <div>
                          <div className="selector-title">{episode.episodeTitle}</div>
                          <div className="selector-hint">{episode.episodeId}</div>
                        </div>
                        <div className="story-picker-card__state">{episode.stateLabel}</div>
                      </div>
                      {episode.previously ? (
                        <p className="story-picker-card__previously">
                          <span className="story-picker-card__previously-label">Previously</span>{" "}
                          {episode.previously}
                        </p>
                      ) : null}
                      {episode.summary ? (
                        <p className="story-picker-card__summary">{episode.summary}</p>
                      ) : null}
                      <StarRow earned={episode.starsEarned} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="stories-home-row">
        <Link href="/" className="stories-home-link" aria-label="Back to home — switch profile">
          <span className="stories-home-link__icon" aria-hidden="true">⌂</span>
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
