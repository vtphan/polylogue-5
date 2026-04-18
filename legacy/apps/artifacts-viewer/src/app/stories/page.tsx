import Link from "next/link";
import { listStories } from "@/lib/artifacts/loaders";
import { Card, PageHero, StatusPill } from "@/components/ui";

function formatTimestamp(value?: string) {
  if (!value) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function StoriesPage() {
  const stories = await listStories();

  return (
    <>
      <PageHero
        kicker="Polylogue v2"
        title="Artifacts Viewer"
        subtitle="Browse generated story artifacts in the repository, inspect episode completeness, and open the merged assistive package from the transcript outward."
      />

      <section className="panel framework-callout">
        <div className="stack">
          <div className="eyebrow">Framework</div>
          <h2 className="section-title">Open the conceptual framework explorer</h2>
          <p className="muted">
            View the reasoning-quality ontology as an interactive map, with lenses, facets, and causal
            forces connected in one place.
          </p>
        </div>
        <Link href="/framework" className="cta subtle">
          Open framework view
        </Link>
      </section>

      <section className="grid story-grid">
        {stories.map((story) => (
          <Card key={story.storyId}>
            <div className="story-card">
              <div className="stack">
                <div className="eyebrow">Story</div>
                <h2 className="story-name">{story.title}</h2>
                <p className="muted">{story.storyId}</p>
              </div>

              <div className="pill-row">
                <span className="pill">{story.episodeCount} episodes</span>
                <span className="pill">{story.completedEpisodeCount} complete</span>
                <span className="pill">{story.inProgressEpisodeCount} in progress</span>
              </div>

              <div className="stack">
                {story.episodes.slice(0, 3).map((episode) => (
                  <div key={episode.episodeId} className="kv">
                    <div className="pill-row">
                      <span className="pill">{episode.title}</span>
                      <StatusPill status={episode.status} />
                    </div>
                    <div className="kv-value">{episode.topic ?? "Topic not yet generated"}</div>
                  </div>
                ))}
              </div>

              <div className="stack">
                <p className="muted">Last updated: {formatTimestamp(story.lastUpdated)}</p>
                <Link href={`/stories/${story.storyId}`} className="cta">
                  Open story
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}
