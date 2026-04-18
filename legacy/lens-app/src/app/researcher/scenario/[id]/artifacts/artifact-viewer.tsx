"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LensBadge } from "@/components/framework/lens-badge";
import { LENS_COLORS, type LensId } from "@/lib/constants/lens-colors";

/* ─── Types ──────────────────────────────────────────────────── */

interface Turn {
  speaker: string;
  turn_id: string;
  sentences: { text: string; sentence_id: string }[];
}

interface FacetAnnotation {
  facet_id: string;
  quality_level: string;
  evidence_sentences: string[];
  primary_lens: string;
  also_visible_through: string[];
  explanatory_variables: {
    cognitive_pattern: string | null;
    social_dynamic: string | null;
    interaction: string | null;
  };
  was_targeted: boolean;
  notes: string;
}

interface PassageAnalysis {
  passage_id: string;
  turns: string[];
  sentence_range: string[];
  facet_annotations: FacetAnnotation[];
  ai_perspective_evaluate: {
    through_logic: { observation: string | null; key_sentences: string[] };
    through_evidence: { observation: string | null; key_sentences: string[] };
    through_scope: { observation: string | null; key_sentences: string[] };
    what_to_notice: string;
    what_to_notice_sentences: string[];
  };
  ai_perspective_explain: {
    explanatory_note: string;
    cognitive_connection: string;
    social_connection: string | null;
    interaction_note: string | null;
  };
  diversity_potential: {
    expected_lens_split: string;
    likely_student_observations: {
      lens: string;
      observations: string[];
      might_miss: string[];
    }[];
  };
}

interface PassageScaffolding {
  passage_id: string;
  evaluate: {
    difficulty: string;
    partial_hints: { lens: string; hints: string[] }[];
    lens_entry_prompts: { lens: string; prompt: string }[];
    ai_reflection_prompts: { lens: string; prompt: string }[];
  };
  explain: {
    passage_sentence_starters: { category: string; starter: string }[];
    bridge_prompts: { lens: string; prompt: string }[];
    ai_reflection_prompt: string;
  };
  common_misreadings: { lens: string; misreadings: string[] }[];
  observation_rubric: { lens: string; levels: Record<string, string> }[];
  explanation_rubric: Record<string, Record<string, string>>;
}

interface PassageGuide {
  passage_id: string;
  turns: string[];
  summary: string;
  whats_here: {
    facet: string;
    quality: string;
    visible_through: string[];
    explanation: string;
  }[];
  evaluate: Record<string, unknown>;
  explain: Record<string, unknown>;
  likely_observations: {
    lens: string;
    will_likely_see: string[];
    might_miss: string[];
  }[];
}

interface Artifacts {
  transcript: { turns: Turn[]; personas: { name: string; perspective: string }[] };
  analysis: { passage_analyses: PassageAnalysis[] };
  scaffolding: { passage_scaffolding: PassageScaffolding[] };
  facilitation: {
    overview: Record<string, string>;
    passage_guides: PassageGuide[];
    debrief: {
      key_takeaways: string[];
      cross_group_prompts: string[];
      connection_to_next: string;
    };
  };
  scenario: {
    target_facets: {
      facet_id: string;
      target_quality: string;
      signal_mechanism: string;
      carrier_persona: string;
    }[];
  };
}

interface ArtifactViewerProps {
  artifacts: Artifacts;
  scenarioId: string;
  topic: string;
}

/* ─── Main Component ─────────────────────────────────────────── */

export function ArtifactViewer({ artifacts, topic }: ArtifactViewerProps) {
  const [activeTab, setActiveTab] = useState("transcript");

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">{topic}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Annotated artifact views with cross-references.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="scaffolding">Scaffolding</TabsTrigger>
          <TabsTrigger value="facilitation">Facilitation</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          <TranscriptView
            turns={artifacts.transcript.turns}
            personas={artifacts.transcript.personas}
            passages={artifacts.analysis.passage_analyses}
            targetFacets={artifacts.scenario?.target_facets}
            onNavigate={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="analysis">
          <AnalysisView
            passages={artifacts.analysis.passage_analyses}
            onNavigate={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="scaffolding">
          <ScaffoldingView scaffolding={artifacts.scaffolding.passage_scaffolding} />
        </TabsContent>
        <TabsContent value="facilitation">
          <FacilitationView facilitation={artifacts.facilitation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Transcript Tab ─────────────────────────────────────────── */

function TranscriptView({
  turns,
  personas,
  passages,
  targetFacets,
  onNavigate,
}: {
  turns: Turn[];
  personas: { name: string; perspective: string }[];
  passages: PassageAnalysis[];
  targetFacets?: Artifacts["scenario"]["target_facets"];
  onNavigate: (tab: string) => void;
}) {
  const [showDesignIntent, setShowDesignIntent] = useState(false);
  const [selectedTurn, setSelectedTurn] = useState<string | null>(null);

  // Build a map of turn_id → passage + annotations
  const turnToPassage = new Map<string, PassageAnalysis>();
  for (const p of passages) {
    for (const t of p.turns) {
      turnToPassage.set(t, p);
    }
  }

  // Build a map of sentence_id → facet annotations
  const sentenceToAnnotations = new Map<string, FacetAnnotation[]>();
  for (const p of passages) {
    for (const fa of p.facet_annotations) {
      for (const sid of fa.evidence_sentences) {
        const existing = sentenceToAnnotations.get(sid) ?? [];
        existing.push(fa);
        sentenceToAnnotations.set(sid, existing);
      }
    }
  }

  // Track which passage boundary we've shown
  const shownPassages = new Set<string>();

  // Speaker colors
  const speakerColors = ["bg-blue-50", "bg-amber-50", "bg-green-50", "bg-rose-50"];
  const speakerMap = new Map<string, number>();
  personas.forEach((p, i) => speakerMap.set(p.name, i));

  return (
    <div className="space-y-4 pt-4">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDesignIntent}
            onChange={(e) => setShowDesignIntent(e.target.checked)}
            className="rounded"
          />
          Design intent overlay
        </label>
        <button
          onClick={() => onNavigate("analysis")}
          className="text-xs text-blue-600 hover:underline"
        >
          View full analysis →
        </button>
      </div>

      {/* Personas */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        {personas.map((p) => (
          <span key={p.name}>
            <strong>{p.name}:</strong> {p.perspective.trim()}
          </span>
        ))}
      </div>

      {/* Turns */}
      <div className="space-y-1">
        {turns.map((turn) => {
          const passage = turnToPassage.get(turn.turn_id);
          const passageBoundary =
            passage && !shownPassages.has(passage.passage_id)
              ? passage.passage_id
              : null;
          if (passageBoundary) shownPassages.add(passageBoundary);

          const colorIdx = speakerMap.get(turn.speaker) ?? 0;
          const isSelected = selectedTurn === turn.turn_id;

          // Collect annotations for this turn's sentences
          const turnAnnotations: FacetAnnotation[] = [];
          for (const s of turn.sentences) {
            const anns = sentenceToAnnotations.get(s.sentence_id) ?? [];
            for (const a of anns) {
              if (!turnAnnotations.find((x) => x.facet_id === a.facet_id)) {
                turnAnnotations.push(a);
              }
            }
          }

          return (
            <div key={turn.turn_id}>
              {passageBoundary && (
                <div className="mb-2 mt-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {passageBoundary.replace("_", " ")}
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <div className="flex gap-2">
                {/* Facet margin markers */}
                <div className="flex w-6 shrink-0 flex-col gap-0.5 pt-1">
                  {turnAnnotations.map((fa) => (
                    <span
                      key={fa.facet_id}
                      className={`h-2 w-2 rounded-full ${LENS_COLORS[fa.primary_lens as LensId]?.dot ?? "bg-slate-400"}`}
                      title={`${fa.facet_id} (${fa.quality_level}) — ${fa.primary_lens}`}
                    />
                  ))}
                </div>

                {/* Turn bubble */}
                <button
                  onClick={() => setSelectedTurn(isSelected ? null : turn.turn_id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors ${speakerColors[colorIdx % speakerColors.length]} ${isSelected ? "ring-2 ring-blue-300" : "hover:opacity-80"}`}
                >
                  <span className="font-semibold">{turn.speaker}: </span>
                  {turn.sentences.map((s) => s.text).join(" ")}
                </button>
              </div>

              {/* Expanded annotation detail */}
              {isSelected && turnAnnotations.length > 0 && (
                <div className="ml-8 mt-1 space-y-1 rounded border bg-white p-3 text-xs">
                  {turnAnnotations.map((fa) => (
                    <div key={fa.facet_id} className="flex items-start gap-2">
                      <LensBadge lens={fa.primary_lens as LensId} />
                      <span className="font-medium">{fa.facet_id.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{fa.quality_level}</Badge>
                      {fa.also_visible_through.map((l) => (
                        <LensBadge key={l} lens={l as LensId} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Design intent overlay */}
              {showDesignIntent && turnAnnotations.some((fa) => fa.was_targeted) && (
                <div className="ml-8 mt-1 rounded border-l-2 border-violet-300 bg-violet-50 px-3 py-1 text-xs text-muted-foreground">
                  {turnAnnotations
                    .filter((fa) => fa.was_targeted)
                    .map((fa) => {
                      const tf = targetFacets?.find((t) => t.facet_id === fa.facet_id);
                      return (
                        <div key={fa.facet_id}>
                          <strong>{fa.facet_id.replace(/_/g, " ")}:</strong>{" "}
                          {tf
                            ? `Designed as ${tf.target_quality} signal via "${tf.signal_mechanism}" (carrier: ${tf.carrier_persona})`
                            : fa.notes}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Analysis Tab ───────────────────────────────────────────── */

function AnalysisView({
  passages,
  onNavigate,
}: {
  passages: PassageAnalysis[];
  onNavigate: (tab: string) => void;
}) {
  return (
    <div className="space-y-6 pt-4">
      {passages.map((p) => (
        <Card key={p.passage_id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{p.passage_id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              <span className="text-xs font-normal text-muted-foreground">
                Turns: {p.turns.join(", ")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Facet Annotations */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Facet Annotations ({p.facet_annotations.length})
              </h4>
              <div className="space-y-2">
                {p.facet_annotations.map((fa) => (
                  <FacetAnnotationCard key={fa.facet_id} annotation={fa} />
                ))}
              </div>
            </div>

            {/* AI Perspective — Evaluate */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                AI Perspective — Evaluate
              </h4>
              <div className="space-y-2">
                {(["evidence", "logic", "scope"] as const).map((lens) => {
                  const key = `through_${lens}` as keyof typeof p.ai_perspective_evaluate;
                  const perspective = p.ai_perspective_evaluate[key] as {
                    observation: string | null;
                    key_sentences: string[];
                  };
                  if (!perspective?.observation) return null;
                  return (
                    <div
                      key={lens}
                      className={`rounded-lg border p-3 ${LENS_COLORS[lens].bg}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <LensBadge lens={lens} />
                      </div>
                      <p className="text-sm">{perspective.observation}</p>
                      {perspective.key_sentences.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Key: {perspective.key_sentences.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
                {p.ai_perspective_evaluate.what_to_notice && (
                  <div className="rounded border-l-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm italic text-muted-foreground">
                    {p.ai_perspective_evaluate.what_to_notice}
                  </div>
                )}
              </div>
            </div>

            {/* AI Perspective — Explain */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                AI Perspective — Explain
              </h4>
              <div className="space-y-2 text-sm">
                {p.ai_perspective_explain.explanatory_note && (
                  <p>{p.ai_perspective_explain.explanatory_note}</p>
                )}
                {p.ai_perspective_explain.cognitive_connection && (
                  <div className="rounded bg-orange-50 p-3">
                    <span className="text-xs font-medium text-orange-700">Cognitive: </span>
                    {p.ai_perspective_explain.cognitive_connection}
                  </div>
                )}
                {p.ai_perspective_explain.social_connection && (
                  <div className="rounded bg-purple-50 p-3">
                    <span className="text-xs font-medium text-purple-700">Social: </span>
                    {p.ai_perspective_explain.social_connection}
                  </div>
                )}
              </div>
            </div>

            {/* Diversity Potential */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Diversity Potential
              </h4>
              <p className="mb-2 text-sm text-muted-foreground">
                {p.diversity_potential.expected_lens_split}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {p.diversity_potential.likely_student_observations.map((obs) => (
                  <div key={obs.lens} className="rounded border p-2 text-xs">
                    <LensBadge lens={obs.lens as LensId} className="mb-1" />
                    <div>
                      <p className="font-medium">Will likely see:</p>
                      <ul className="ml-3 list-disc">
                        {obs.observations.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                    {obs.might_miss.length > 0 && (
                      <div className="mt-1">
                        <p className="font-medium text-muted-foreground">Might miss:</p>
                        <ul className="ml-3 list-disc text-muted-foreground">
                          {obs.might_miss.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate("transcript")}
              className="text-xs text-blue-600 hover:underline"
            >
              ← View in transcript
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FacetAnnotationCard({ annotation: fa }: { annotation: FacetAnnotation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded border p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-left text-sm"
      >
        <LensBadge lens={fa.primary_lens as LensId} />
        <span className="font-medium">{fa.facet_id.replace(/_/g, " ")}</span>
        <Badge variant={fa.quality_level === "weak" ? "destructive" : "default"}>
          {fa.quality_level}
        </Badge>
        {fa.was_targeted && (
          <Badge variant="secondary" className="text-[10px]">
            targeted
          </Badge>
        )}
        {fa.also_visible_through.map((l) => (
          <LensBadge key={l} lens={l as LensId} />
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>
            <strong>Evidence:</strong> {fa.evidence_sentences.join(", ")}
          </p>
          {fa.explanatory_variables.cognitive_pattern && (
            <p>
              <strong>Cognitive:</strong> {fa.explanatory_variables.cognitive_pattern.replace(/_/g, " ")}
            </p>
          )}
          {fa.explanatory_variables.social_dynamic && (
            <p>
              <strong>Social:</strong> {fa.explanatory_variables.social_dynamic.replace(/_/g, " ")}
            </p>
          )}
          {fa.notes && <p className="italic">{fa.notes}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Scaffolding Tab ────────────────────────────────────────── */

function ScaffoldingView({
  scaffolding,
}: {
  scaffolding: PassageScaffolding[];
}) {
  const [showRationale, setShowRationale] = useState(false);

  return (
    <div className="space-y-6 pt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showRationale}
          onChange={(e) => setShowRationale(e.target.checked)}
          className="rounded"
        />
        Hint rationale overlay
      </label>

      {scaffolding.map((ps) => (
        <Card key={ps.passage_id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {ps.passage_id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              <Badge variant="secondary">{ps.evaluate.difficulty}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hints */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Evaluate Hints
              </h4>
              <div className="space-y-2">
                {ps.evaluate.partial_hints.map((ph) => (
                  <div key={ph.lens}>
                    <LensBadge lens={ph.lens as LensId} className="mb-1" />
                    <ul className="ml-4 list-disc text-sm">
                      {ph.hints.map((h, i) => (
                        <li key={i}>
                          {h}
                          {showRationale && (
                            <span className="ml-1 text-xs italic text-violet-600">
                              (directs attention without naming the facet)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Lens Entry Prompts */}
            {ps.evaluate.lens_entry_prompts.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Lens Entry Prompts
                </h4>
                <div className="space-y-1">
                  {ps.evaluate.lens_entry_prompts.map((lep) => (
                    <div key={lep.lens} className="flex items-start gap-2 text-sm">
                      <LensBadge lens={lep.lens as LensId} />
                      <span>{lep.prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observation Rubric */}
            {ps.observation_rubric.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Observation Rubric
                </h4>
                <div className="space-y-2">
                  {ps.observation_rubric.map((r) => (
                    <div key={r.lens} className="rounded border p-2">
                      <LensBadge lens={r.lens as LensId} className="mb-1" />
                      <div className="grid gap-1 text-xs sm:grid-cols-3">
                        {Object.entries(r.levels).map(([level, desc]) => (
                          <div key={level} className="rounded bg-slate-50 p-2">
                            <span className="font-medium capitalize">{level}</span>
                            <p className="text-muted-foreground">{desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentence Starters */}
            {ps.explain.passage_sentence_starters.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Sentence Starters
                </h4>
                <div className="space-y-1">
                  {ps.explain.passage_sentence_starters.map((ss, i) => (
                    <div key={i} className="text-sm">
                      <Badge variant="secondary" className="mr-1 text-[10px]">
                        {ss.category}
                      </Badge>
                      <span className="italic">&ldquo;{ss.starter}&rdquo;</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bridge Prompts */}
            {ps.explain.bridge_prompts.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Bridge Prompts
                </h4>
                <div className="space-y-1">
                  {ps.explain.bridge_prompts.map((bp) => (
                    <div key={bp.lens} className="flex items-start gap-2 text-sm">
                      <LensBadge lens={bp.lens as LensId} />
                      <span>{bp.prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Misreadings */}
            {ps.common_misreadings.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Common Misreadings
                </h4>
                <div className="space-y-2">
                  {ps.common_misreadings.map((mr) => (
                    <div key={mr.lens}>
                      <LensBadge lens={mr.lens as LensId} className="mb-1" />
                      <ul className="ml-4 list-disc text-sm text-muted-foreground">
                        {mr.misreadings.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Facilitation Tab ───────────────────────────────────────── */

function FacilitationView({
  facilitation,
}: {
  facilitation: Artifacts["facilitation"];
}) {
  const [showFacetVocab, setShowFacetVocab] = useState(false);

  return (
    <div className="space-y-6 pt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showFacetVocab}
          onChange={(e) => setShowFacetVocab(e.target.checked)}
          className="rounded"
        />
        Show facet vocabulary overlay
      </label>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(facilitation.overview).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>{" "}
              <span className="text-muted-foreground">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Passage Guides */}
      {facilitation.passage_guides.map((pg) => (
        <Card key={pg.passage_id}>
          <CardHeader>
            <CardTitle className="text-base">
              {pg.passage_id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{pg.summary}</p>

            {/* What's here */}
            {showFacetVocab && pg.whats_here.length > 0 && (
              <div className="rounded border-l-2 border-violet-300 bg-violet-50 p-3">
                <h5 className="mb-1 text-xs font-semibold uppercase text-violet-700">
                  Framework: What&apos;s Here
                </h5>
                <div className="space-y-1">
                  {pg.whats_here.map((wh) => (
                    <div key={wh.facet} className="flex items-start gap-2 text-xs">
                      <span className="font-medium">{wh.facet.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{wh.quality}</Badge>
                      <span className="flex gap-1">
                        {wh.visible_through.map((l) => (
                          <LensBadge key={l} lens={l as LensId} />
                        ))}
                      </span>
                      <span className="text-muted-foreground">{wh.explanation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Likely observations */}
            {pg.likely_observations && pg.likely_observations.length > 0 && (
              <div>
                <h5 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Likely Observations
                </h5>
                <div className="grid gap-2 sm:grid-cols-3">
                  {pg.likely_observations.map((obs) => (
                    <div key={obs.lens} className="rounded border p-2 text-xs">
                      <LensBadge lens={obs.lens as LensId} className="mb-1" />
                      <ul className="ml-3 list-disc">
                        {obs.will_likely_see.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                      {obs.might_miss.length > 0 && (
                        <div className="mt-1 text-muted-foreground">
                          <p className="font-medium">May miss:</p>
                          <ul className="ml-3 list-disc">
                            {obs.might_miss.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Debrief */}
      {facilitation.debrief && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Whole-Class Debrief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Key Takeaways
              </h5>
              <ul className="ml-4 list-disc text-muted-foreground">
                {facilitation.debrief.key_takeaways.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Cross-Group Prompts
              </h5>
              <ul className="ml-4 list-disc text-muted-foreground">
                {facilitation.debrief.cross_group_prompts.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            {facilitation.debrief.connection_to_next && (
              <div>
                <h5 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Connection to Next
                </h5>
                <p className="text-muted-foreground">
                  {facilitation.debrief.connection_to_next}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
