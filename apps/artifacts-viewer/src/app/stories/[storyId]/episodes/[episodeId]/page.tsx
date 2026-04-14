import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArtifactPills,
  Breadcrumbs,
  EmptyState,
  Panel,
  StatusPill,
  TabsNav,
} from "@/components/ui";
import {
  getEpisodeTabHref,
  loadEpisode,
  normalizeTranscriptTurnId,
} from "@/lib/artifacts/loaders";
import type { ArtifactFileName } from "@/lib/artifacts/types";

const TAB_KEYS = [
  "overview",
  "transcript",
  "ground truth",
  "diagnostic",
  "prose",
  "discussion",
  "package",
  "pipeline",
  "raw yaml",
] as const;

function titleFromEpisodeId(episodeId: string) {
  return episodeId.replace("episode_", "Episode ");
}

function getTab(searchTab?: string) {
  if (!searchTab) {
    return "overview";
  }
  return TAB_KEYS.includes(searchTab.toLowerCase() as (typeof TAB_KEYS)[number])
    ? searchTab.toLowerCase()
    : "overview";
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderOverview(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const episode = asRecord(bundle.files["episode.yaml"]);
  const personas = asArray<Record<string, unknown>>(episode?.personas);
  const goals = asArray<string>(episode?.instructional_goals);

  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Episode Summary</h2>
        <div className="meta-table">
          <div className="kv">
            <div className="kv-label">Topic</div>
            <div className="kv-value">{bundle.topic ?? "No topic available"}</div>
          </div>
          <div className="kv">
            <div className="kv-label">Context</div>
            <div className="kv-value">
              {typeof episode?.context === "string" ? episode.context : "No context available"}
            </div>
          </div>
        </div>
      </Panel>

      <div className="two-col">
        <Panel>
          <h2 className="section-title">Instructional Goals</h2>
          {goals.length > 0 ? (
            <ul className="list">
              {goals.map((goal, index) => (
                <li key={`${goal}-${index}`}>{goal}</li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No instructional goals available yet." />
          )}
        </Panel>

        <Panel>
          <h2 className="section-title">Derived Metrics</h2>
          <div className="pill-row">
            <span className="pill">{bundle.derived.turnCount} turns</span>
            <span className="pill">{bundle.derived.passageCount} passages</span>
            <span className="pill">{bundle.derived.probeTurnCount} probe turns</span>
            <span className="pill">{bundle.derived.discussionCueCount} discussion cues</span>
          </div>
        </Panel>
      </div>

      <Panel>
        <h2 className="section-title">Personas</h2>
        {personas.length > 0 ? (
          <div className="grid story-grid">
            {personas.map((persona, index) => (
              <div key={`${persona.name}-${index}`} className="turn-card">
                <div className="turn-heading">
                  <strong>{typeof persona.name === "string" ? persona.name : "Unknown"}</strong>
                </div>
                <p className="turn-text">
                  {typeof persona.perspective === "string"
                    ? persona.perspective
                    : "Perspective not available."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Personas are not available in this episode yet." />
        )}
      </Panel>
    </div>
  );
}

function renderTranscript(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const transcript = asRecord(bundle.files["transcript.yaml"]);
  const turns = asArray<Record<string, unknown>>(transcript?.turns);
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  const groundTruth = asRecord(packageRoot?.ground_truth ?? bundle.files["ground_truth.yaml"]);
  const diagnostic = asRecord(packageRoot?.diagnostic ?? bundle.files["diagnostic.yaml"]);
  const discussion = asRecord(packageRoot?.discussion ?? bundle.files["discussion.yaml"]);

  const passages = asArray<Record<string, unknown>>(groundTruth?.passages);
  const turnAnnotations = passages.flatMap((passage) =>
    asArray<Record<string, unknown>>(passage.turn_annotations),
  );
  const annotationMap = new Map(
    turnAnnotations
      .map((annotation) => [annotation.turn_id, annotation] as const)
      .filter(([turnId]) => typeof turnId === "string"),
  );
  const probeByTurn = asRecord(asRecord(asRecord(diagnostic?.probes)?.facet)?.by_turn);
  const cuesByTurn = asRecord(asRecord(asRecord(discussion?.discussion_cues)?.by_turn));

  if (turns.length === 0) {
    return <EmptyState message="Transcript not available for this episode yet." />;
  }

  return (
    <Panel>
      <h2 className="section-title">Transcript Spine</h2>
      <div className="turn-list">
        {turns.map((turn, index) => {
          const rawTurnId = typeof turn.turn_id === "string" ? turn.turn_id : `turn_${index + 1}`;
          const compactTurn = normalizeTranscriptTurnId(rawTurnId);
          const annotation = annotationMap.get(compactTurn);
          const facetSignals = asArray<Record<string, unknown>>(annotation?.facet_signals);
          const probe = asRecord(probeByTurn?.[compactTurn]);
          const cueSet = asArray<Record<string, unknown>>(cuesByTurn?.[compactTurn]);
          const sentences = asArray<Record<string, unknown>>(turn.sentences)
            .map((sentence) => sentence.text)
            .filter((text): text is string => typeof text === "string");

          return (
            <article key={rawTurnId} className="turn-card">
              <div className="turn-heading">
                <span className="speaker">
                  {typeof turn.speaker === "string" ? turn.speaker : "Unknown"}
                </span>
                <span className="turn-id">
                  {rawTurnId} / {compactTurn}
                </span>
                {facetSignals.map((signal, signalIndex) => (
                  <span key={`${rawTurnId}-${signalIndex}`} className="pill">
                    {typeof signal.facet_ref === "string" ? signal.facet_ref : "facet"}
                  </span>
                ))}
                {probe ? <span className="pill">probe</span> : null}
                {cueSet.length > 0 ? <span className="pill">{cueSet.length} cues</span> : null}
              </div>
              <p className="turn-text">{sentences.join(" ")}</p>

              {(annotation || probe || cueSet.length > 0) && (
                <div className="stack" style={{ marginTop: "0.9rem" }}>
                  {annotation ? (
                    <div className="kv">
                      <div className="kv-label">Ground Truth</div>
                      <div className="kv-value">
                        {typeof annotation.why_it_matters === "string"
                          ? annotation.why_it_matters
                          : "Turn annotation present."}
                      </div>
                    </div>
                  ) : null}

                  {probe ? (
                    <div className="kv">
                      <div className="kv-label">Probe</div>
                      <div className="kv-value">
                        {typeof probe.question === "string" ? probe.question : "Probe available."}
                      </div>
                    </div>
                  ) : null}

                  {cueSet.length > 0 ? (
                    <div className="kv">
                      <div className="kv-label">Discussion Cues</div>
                      <ul className="list">
                        {cueSet.slice(0, 3).map((cue, cueIndex) => (
                          <li key={`${rawTurnId}-cue-${cueIndex}`}>
                            {typeof cue.text === "string" ? cue.text : "Cue text unavailable"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function renderGroundTruth(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  const groundTruth = asRecord(packageRoot?.ground_truth ?? bundle.files["ground_truth.yaml"]);
  const passages = asArray<Record<string, unknown>>(groundTruth?.passages);

  if (passages.length === 0) {
    return <EmptyState message="Ground truth is not available for this episode yet." />;
  }

  return (
    <div className="stack">
      {passages.map((passage, index) => (
        <Panel key={`${passage.passage_id}-${index}`}>
          <h2 className="section-title">
            {typeof passage.passage_id === "string" ? passage.passage_id : `Passage ${index + 1}`}
          </h2>
          <div className="stack">
            <div className="kv">
              <div className="kv-label">Turn Range</div>
              <div className="kv-value">
                {asArray<string>(passage.turn_range).join(", ") || "Not available"}
              </div>
            </div>

            <div className="two-col">
              <div>
                <div className="kv-label">Facets Present</div>
                <ul className="list">
                  {asArray<Record<string, unknown>>(passage.facets_present).map((facet, facetIndex) => (
                    <li key={`${passage.passage_id}-facet-${facetIndex}`}>
                      <strong>{typeof facet.facet_ref === "string" ? facet.facet_ref : "facet"}</strong>
                      {" · "}
                      {typeof facet.one_line === "string" ? facet.one_line : "No summary"}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="kv-label">Tempting But Absent</div>
                <ul className="list">
                  {asArray<Record<string, unknown>>(passage.facets_absent_but_tempting).map(
                    (facet, facetIndex) => (
                      <li key={`${passage.passage_id}-tempting-${facetIndex}`}>
                        <strong>{typeof facet.facet_ref === "string" ? facet.facet_ref : "facet"}</strong>
                        {" · "}
                        {typeof facet.why_tempting === "string" ? facet.why_tempting : "No note"}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div>
              <div className="kv-label">Lens Visibility</div>
              <div className="pill-row">
                {Object.entries(asRecord(passage.lens_visibility) ?? {}).map(([lens, value]) => {
                  const lensRecord = asRecord(value);
                  return (
                    <span key={lens} className="pill">
                      {lens}: {String(lensRecord?.engagement ?? "unknown")} /{" "}
                      {String(lensRecord?.affordance ?? "unknown")}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function renderDiagnostic(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  const diagnostic = asRecord(packageRoot?.diagnostic ?? bundle.files["diagnostic.yaml"]);
  const probeByTurn = asRecord(asRecord(asRecord(diagnostic?.probes)?.facet)?.by_turn);
  const interventions = asRecord(asRecord(diagnostic?.interventions)?.by_turn);
  const turnIds = Array.from(
    new Set([...(probeByTurn ? Object.keys(probeByTurn) : []), ...(interventions ? Object.keys(interventions) : [])]),
  ).sort();

  if (turnIds.length === 0) {
    return <EmptyState message="Diagnostic artifacts are not available for this episode yet." />;
  }

  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Reactive Routing</h2>
        <p className="turn-text">
          This tab surfaces the probe layer and the intervention dictionary. It is the closest view
          of how the v2 package would behave at runtime.
        </p>
      </Panel>

      {turnIds.map((turnId) => {
        const probe = asRecord(probeByTurn?.[turnId]);
        const intervention = asRecord(interventions?.[turnId]);
        const byFacet = asRecord(intervention?.by_facet);
        const blankPage = asRecord(intervention?.blank_page);
        return (
          <Panel key={turnId}>
            <h2 className="section-title">{turnId}</h2>
            <div className="stack">
              {probe ? (
                <div>
                  <div className="kv-label">Probe Question</div>
                  <div className="kv-value">
                    {typeof probe.question === "string" ? probe.question : "Probe present"}
                  </div>
                  <ul className="list">
                    {asArray<Record<string, unknown>>(probe.options).map((option, index) => (
                      <li key={`${turnId}-option-${index}`}>
                        {typeof option.text === "string" ? option.text : "Option"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {blankPage ? (
                <div>
                  <div className="kv-label">Blank Page Intervention</div>
                  <div className="kv-value">
                    {typeof blankPage.opening === "string" ? blankPage.opening : "Blank-page support"}
                  </div>
                </div>
              ) : null}

              {byFacet ? (
                <div>
                  <div className="kv-label">Facet Interventions</div>
                  <ul className="list">
                    {Object.entries(byFacet).map(([facet, cell]) => {
                      const cellRecord = asRecord(cell);
                      return (
                        <li key={`${turnId}-${facet}`}>
                          <strong>{facet}</strong>
                          {" · "}
                          {String(cellRecord?.role ?? "unknown")}
                          {" · "}
                          {typeof cellRecord?.opening === "string"
                            ? cellRecord.opening
                            : "Intervention present"}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function renderProse(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  const prose = asRecord(packageRoot?.prose ?? bundle.files["prose.yaml"]);
  if (!prose) {
    return <EmptyState message="Prose artifacts are not available for this episode yet." />;
  }

  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Episode Opening</h2>
        <p className="turn-text">
          {typeof prose.episode_opening === "string"
            ? prose.episode_opening
            : "No episode opening available."}
        </p>
      </Panel>

      <div className="two-col">
        <Panel>
          <h2 className="section-title">Entry Prompts</h2>
          <ul className="list">
            {asArray<Record<string, unknown>>(prose.entry_prompts).map((prompt, index) => (
              <li key={`prompt-${index}`}>
                <strong>{String(prompt.lens ?? "lens")}</strong>
                {" · "}
                {typeof prompt.stem === "string" ? prompt.stem : "No stem"}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <h2 className="section-title">Consensus Check</h2>
          <ul className="list">
            {asArray<string>(prose.consensus_check).map((question, index) => (
              <li key={`consensus-${index}`}>{question}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function renderDiscussion(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  const discussion = asRecord(packageRoot?.discussion ?? bundle.files["discussion.yaml"]);
  const cues = asRecord(discussion?.discussion_cues);
  const byTurn = asRecord(cues?.by_turn);
  const episodeScope = asArray<Record<string, unknown>>(cues?.episode_scope);

  if (!byTurn && episodeScope.length === 0) {
    return <EmptyState message="Discussion cues are not available for this episode yet." />;
  }

  return (
    <div className="stack">
      {byTurn
        ? Object.entries(byTurn).map(([turnId, cueList]) => (
            <Panel key={turnId}>
              <h2 className="section-title">{turnId}</h2>
              <ul className="list">
                {asArray<Record<string, unknown>>(cueList).map((cue, index) => (
                  <li key={`${turnId}-cue-${index}`}>
                    <strong>{String(cue.axis ?? "axis")}</strong>
                    {" · "}
                    {typeof cue.text === "string" ? cue.text : "Cue text unavailable"}
                  </li>
                ))}
              </ul>
            </Panel>
          ))
        : null}

      {episodeScope.length > 0 ? (
        <Panel>
          <h2 className="section-title">Episode Scope</h2>
          <ul className="list">
            {episodeScope.map((cue, index) => (
              <li key={`episode-scope-${index}`}>
                {typeof cue.text === "string" ? cue.text : "Cue text unavailable"}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function renderPackage(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const packageRoot = asRecord(bundle.files["assistive_package.yaml"]);
  if (!packageRoot) {
    return <EmptyState message="assistive_package.yaml is not available for this episode yet." />;
  }

  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Merged Runtime View</h2>
        <div className="pill-row">
          {Object.keys(packageRoot).map((key) => (
            <span key={key} className="pill">
              {key}
            </span>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2 className="section-title">Derived Snapshot</h2>
        <ul className="list">
          <li>{bundle.derived.passageCount} passages</li>
          <li>{bundle.derived.probeTurnCount} probe-bearing turns</li>
          <li>{bundle.derived.discussionCueCount} discussion cues</li>
        </ul>
      </Panel>
    </div>
  );
}

function renderPipeline(bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>) {
  const pipelineLog = asArray<Record<string, unknown>>(bundle.files["pipeline_log.yaml"]);
  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Pipeline Status</h2>
        <div className="pill-row">
          <StatusPill status={bundle.status} />
          <span className="pill">Last updated: {formatTimestamp(bundle.lastUpdated)}</span>
        </div>
        <div style={{ marginTop: "0.85rem" }}>
          <ArtifactPills fileNames={bundle.fileNames} />
        </div>
      </Panel>

      {pipelineLog.length > 0 ? (
        <Panel>
          <h2 className="section-title">Event Log</h2>
          <ul className="list">
            {pipelineLog.map((event, index) => (
              <li key={`event-${index}`}>
                {String(event.timestamp ?? "unknown time")}
                {" · "}
                {String(event.command ?? "unknown command")}
                {" · "}
                {String(event.stage ?? "unknown stage")}
                {" · "}
                {String(event.verdict ?? "unknown verdict")}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <EmptyState message="No pipeline log available for this episode." />
      )}
    </div>
  );
}

function renderRawYaml(
  bundle: NonNullable<Awaited<ReturnType<typeof loadEpisode>>>,
  storyId: string,
  episodeId: string,
  selectedFile?: string,
) {
  const selectedArtifact = selectedFile as ArtifactFileName | undefined;
  const fileName =
    selectedArtifact && bundle.fileNames.includes(selectedArtifact)
      ? selectedArtifact
      : bundle.fileNames[0];
  const raw = fileName ? bundle.rawFiles[fileName] : undefined;

  return (
    <div className="stack">
      <Panel>
        <h2 className="section-title">Files</h2>
        <div className="pill-row">
          {bundle.fileNames.map((name) => (
            <Link
              key={name}
              href={getEpisodeTabHref(storyId, episodeId, "raw yaml", name)}
              className="tab"
            >
              {name}
            </Link>
          ))}
        </div>
      </Panel>

      {raw ? (
        <Panel>
          <h2 className="section-title">{fileName}</h2>
          <pre className="code-block">{raw}</pre>
        </Panel>
      ) : (
        <EmptyState message="No raw YAML available." />
      )}
    </div>
  );
}

export default async function EpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ storyId: string; episodeId: string }>;
  searchParams: Promise<{ tab?: string; file?: string }>;
}) {
  const { storyId, episodeId } = await params;
  const { tab: requestedTab, file } = await searchParams;
  const bundle = await loadEpisode(storyId, episodeId);

  if (!bundle) {
    notFound();
  }

  const activeTab = getTab(requestedTab);
  const title = bundle.topic ?? titleFromEpisodeId(episodeId);
  const tabs = [
    { label: "Overview", href: getEpisodeTabHref(storyId, episodeId, "overview") },
    { label: "Transcript", href: getEpisodeTabHref(storyId, episodeId, "transcript") },
    { label: "Ground Truth", href: getEpisodeTabHref(storyId, episodeId, "ground truth") },
    { label: "Diagnostic", href: getEpisodeTabHref(storyId, episodeId, "diagnostic") },
    { label: "Prose", href: getEpisodeTabHref(storyId, episodeId, "prose") },
    { label: "Discussion", href: getEpisodeTabHref(storyId, episodeId, "discussion") },
    { label: "Package", href: getEpisodeTabHref(storyId, episodeId, "package") },
    { label: "Pipeline", href: getEpisodeTabHref(storyId, episodeId, "pipeline") },
    { label: "Raw YAML", href: getEpisodeTabHref(storyId, episodeId, "raw yaml", file) },
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/stories", label: "Stories" },
          { href: `/stories/${storyId}`, label: storyId },
          { label: titleFromEpisodeId(episodeId) },
        ]}
      />

      <section className="page-hero">
        <p className="page-kicker">Episode Detail</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">
          Story {storyId}. {bundle.title}. Use the transcript as the navigation spine, inspect the
          package layer, and fall back to raw YAML when the episode is still partial.
        </p>
      </section>

      <div className="grid detail-grid">
        <aside className="stack">
          <Panel>
            <div className="stack">
              <div className="pill-row">
                <StatusPill status={bundle.status} />
                <span className="pill">{bundle.title}</span>
              </div>
              <div className="kv">
                <div className="kv-label">Last Updated</div>
                <div className="kv-value">{formatTimestamp(bundle.lastUpdated)}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Last Pipeline Event</div>
                <div className="kv-value">{bundle.lastPipelineEvent ?? "No pipeline event"}</div>
              </div>
              <div className="kv">
                <div className="kv-label">Available Files</div>
                <ArtifactPills fileNames={bundle.fileNames} />
              </div>
            </div>
          </Panel>
        </aside>

        <section>
          <TabsNav tabs={tabs} activeTab={activeTab} />
          {activeTab === "overview" ? renderOverview(bundle) : null}
          {activeTab === "transcript" ? renderTranscript(bundle) : null}
          {activeTab === "ground truth" ? renderGroundTruth(bundle) : null}
          {activeTab === "diagnostic" ? renderDiagnostic(bundle) : null}
          {activeTab === "prose" ? renderProse(bundle) : null}
          {activeTab === "discussion" ? renderDiscussion(bundle) : null}
          {activeTab === "package" ? renderPackage(bundle) : null}
          {activeTab === "pipeline" ? renderPipeline(bundle) : null}
          {activeTab === "raw yaml" ? renderRawYaml(bundle, storyId, episodeId, file) : null}
        </section>
      </div>
    </>
  );
}
