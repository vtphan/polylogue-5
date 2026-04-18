import { redirect } from "next/navigation";
import { openStoryAction } from "@/app/actions";
import { StarRow } from "@/app/_components/StarRow";
import { listCatalogEpisodes } from "@/lib/catalog";
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

  const grouped = new Map<
    string,
    Array<{
      storyId: string;
      episodeId: string;
      storyTitle: string;
      episodeTitle: string;
      stateLabel: string;
      starsEarned: number;
    }>
  >();

  for (const episode of episodes) {
    const run = runsByEpisode.get(`${episode.storyId}::${episode.episodeId}`);
    const stateLabel = run
      ? run.readingFinishedAt
        ? "Open recap"
        : "Resume"
      : "Open";

    const bucket = grouped.get(episode.storyTitle) ?? [];
    bucket.push({
      storyId: episode.storyId,
      episodeId: episode.episodeId,
      storyTitle: episode.storyTitle,
      episodeTitle: episode.episodeTitle,
      stateLabel,
      starsEarned: run?.starsEarned ?? 0,
    });
    grouped.set(episode.storyTitle, bucket);
  }

  return (
    <div className="page-wide">
      <header className="page-header">
        <p className="eyebrow">Read a story</p>
        <h1>Pick an episode for {student.name}.</h1>
        <p>
          Episodes stay in a fixed order. Finished runs reopen on the recap screen;
          unfinished runs resume from their saved spot.
        </p>
      </header>

      <div className="stack">
        {Array.from(grouped.entries()).map(([storyTitle, storyEpisodes]) => (
          <section key={storyTitle} className="panel stack">
            <div className="home-section-heading">
              <div>
                <p className="eyebrow">Story</p>
                <h2>{storyTitle}</h2>
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
                      <StarRow earned={episode.starsEarned} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
