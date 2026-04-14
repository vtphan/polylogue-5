import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, Panel, PageHero, StatusPill, ArtifactPills } from "@/components/ui";
import { loadStory } from "@/lib/artifacts/loaders";

function formatTimestamp(value?: string) {
  if (!value) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await loadStory(storyId);

  if (!story) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/stories", label: "Stories" },
          { label: story.title },
        ]}
      />

      <PageHero
        kicker="Story Detail"
        title={story.title}
        subtitle="Episode-level artifact coverage, pipeline completeness, and direct entry points into the viewer."
      />

      <div className="grid detail-grid">
        <aside className="stack">
          <Panel>
            <div className="stack">
              <div className="kv">
                <div className="kv-label">Story ID</div>
                <div className="kv-value">{story.storyId}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Episodes</div>
                <div className="kv-value">{story.episodeCount}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Completed</div>
                <div className="kv-value">{story.completedEpisodeCount}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Last Updated</div>
                <div className="kv-value">{formatTimestamp(story.lastUpdated)}</div>
              </div>
            </div>
          </Panel>
        </aside>

        <section className="panel">
          <h2 className="section-title">Episodes</h2>
          <table className="episode-table">
            <thead>
              <tr>
                <th>Episode</th>
                <th>Topic</th>
                <th>Status</th>
                <th>Files</th>
                <th>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {story.episodes.map((episode) => (
                <tr key={episode.episodeId}>
                  <td>
                    <Link href={`/stories/${story.storyId}/episodes/${episode.episodeId}`}>
                      {episode.title}
                    </Link>
                  </td>
                  <td>{episode.topic ?? "Topic not yet generated"}</td>
                  <td>
                    <StatusPill status={episode.status} />
                  </td>
                  <td>
                    <ArtifactPills fileNames={episode.fileNames} />
                  </td>
                  <td>
                    <div className="stack">
                      <span>{episode.lastPipelineEvent ?? "No pipeline log yet"}</span>
                      <span className="muted">{formatTimestamp(episode.lastUpdated)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
