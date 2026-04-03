"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LensBadge } from "@/components/framework/lens-badge";
import type { LensId } from "@/lib/constants/lens-colors";

/* ─── Types ──────────────────────────────────────────────────── */

interface Artifacts {
  scenario: {
    topic: string;
    context: string;
    personas: { name: string; perspective: string; weaknesses: string }[];
    target_facets: {
      facet_id: string;
      target_quality: string;
      primary_lens: string;
      signal_mechanism: string;
      carrier_persona: string;
    }[];
    turn_outline: { speaker: string; accomplishes: string }[];
    discussion_dynamic: string;
  };
  transcript: {
    turns: { speaker: string; turn_id: string; sentences: { text: string }[] }[];
    personas: { name: string; perspective: string }[];
  };
  analysis: {
    passage_analyses: {
      passage_id: string;
      facet_annotations: { facet_id: string; quality_level: string; primary_lens: string }[];
      diversity_potential: { expected_lens_split: string };
    }[];
  };
  scaffolding: {
    passage_scaffolding: {
      passage_id: string;
      evaluate: { difficulty: string; partial_hints: { hints: string[] }[] };
      common_misreadings: { misreadings: string[] }[];
      observation_rubric: unknown[];
    }[];
  };
  session: {
    passages: { passage_id: string }[];
    lens_definitions: { lens_id: string; name: string }[];
    evaluate_phase: { completion_threshold: number };
  };
}

interface StageInfo {
  id: string;
  name: string;
  agents: string[];
  inputs: string[];
  outputs: { label: string; tab?: string }[];
  getKeyDecisions: (artifacts: Artifacts) => string[];
}

const STAGES: StageInfo[] = [
  {
    id: "scenario",
    name: "Scenario Planning",
    agents: ["Planning agent", "Validation agent"],
    inputs: ["Operator prompt"],
    outputs: [{ label: "scenario.yaml" }],
    getKeyDecisions: (a) => {
      const tf = a.scenario.target_facets ?? [];
      const personas = a.scenario.personas ?? [];
      return [
        `${personas.length} personas: ${personas.map((p) => p.name).join(", ")}`,
        `${tf.length} targeted facets: ${tf.map((f) => `${f.facet_id} (${f.target_quality})`).join(", ")}`,
        ...(a.scenario.discussion_dynamic
          ? [`Dynamic: ${a.scenario.discussion_dynamic.slice(0, 120)}...`]
          : []),
      ];
    },
  },
  {
    id: "transcript",
    name: "Transcript",
    agents: ["Dialog writer", "Transcript ID"],
    inputs: ["scenario.yaml (barrier-filtered)"],
    outputs: [{ label: "transcript.yaml", tab: "transcript" }],
    getKeyDecisions: (a) => {
      const turns = a.transcript.turns ?? [];
      const speakers = [...new Set(turns.map((t) => t.speaker))];
      const wordCount = turns.reduce(
        (sum, t) => sum + t.sentences.reduce((s, sent) => s + sent.text.split(" ").length, 0),
        0
      );
      return [
        `${turns.length} turns across ${speakers.length} speakers`,
        `~${wordCount} words total`,
      ];
    },
  },
  {
    id: "analysis",
    name: "Analysis",
    agents: ["Evaluator"],
    inputs: ["transcript.yaml", "scenario.yaml"],
    outputs: [
      { label: "analysis.yaml", tab: "analysis" },
      { label: "facilitation.yaml (initial)", tab: "facilitation" },
    ],
    getKeyDecisions: (a) => {
      const passages = a.analysis.passage_analyses ?? [];
      const totalAnnotations = passages.reduce(
        (sum, p) => sum + p.facet_annotations.length,
        0
      );
      const facetIds = [
        ...new Set(passages.flatMap((p) => p.facet_annotations.map((fa) => fa.facet_id))),
      ];
      return [
        `${passages.length} passages analyzed`,
        `${totalAnnotations} facet annotations across ${facetIds.length} unique facets`,
      ];
    },
  },
  {
    id: "scaffolding",
    name: "Scaffolding",
    agents: ["Scaffolding ID"],
    inputs: ["analysis.yaml", "scenario.yaml"],
    outputs: [
      { label: "scaffolding.yaml", tab: "scaffolding" },
      { label: "facilitation.yaml (enriched)", tab: "facilitation" },
    ],
    getKeyDecisions: (a) => {
      const scaff = a.scaffolding.passage_scaffolding ?? [];
      const totalHints = scaff.reduce(
        (sum, ps) =>
          sum + ps.evaluate.partial_hints.reduce((s, ph) => s + ph.hints.length, 0),
        0
      );
      const totalMisreadings = scaff.reduce(
        (sum, ps) =>
          sum +
          ps.common_misreadings.reduce((s, mr) => s + mr.misreadings.length, 0),
        0
      );
      const difficulties = scaff.map((ps) => `${ps.passage_id}: ${ps.evaluate.difficulty}`);
      return [
        `${totalHints} hints across ${scaff.length} passages`,
        `${totalMisreadings} misreading redirects`,
        `Difficulties: ${difficulties.join(", ")}`,
      ];
    },
  },
  {
    id: "session",
    name: "Session Config",
    agents: ["Configure"],
    inputs: ["All artifacts"],
    outputs: [{ label: "session.yaml" }],
    getKeyDecisions: (a) => {
      const sess = a.session;
      return [
        `${sess.passages?.length ?? 0} passages configured`,
        `${sess.lens_definitions?.length ?? 0} lenses: ${(sess.lens_definitions ?? []).map((l) => l.name).join(", ")}`,
        `Completion threshold: ${sess.evaluate_phase?.completion_threshold ?? "N/A"}`,
      ];
    },
  },
];

/* ─── Main Component ─────────────────────────────────────────── */

interface PipelineWalkthroughProps {
  artifacts: Artifacts;
  scenarioId: string;
  topic: string;
}

export function PipelineWalkthrough({
  artifacts,
  scenarioId,
  topic,
}: PipelineWalkthroughProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showBarrier, setShowBarrier] = useState(false);

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">{topic}</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        5-stage pipeline flow showing how each artifact was produced.
      </p>

      {/* Horizontal flow */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-stretch gap-0 pb-4">
          {STAGES.map((stage, idx) => (
            <div key={stage.id} className="flex items-stretch">
              {/* Information barrier between Stage 2 (index 1) and Stage 3 (index 2) */}
              {idx === 2 && (
                <div className="flex items-stretch">
                  <div className="flex items-center px-1 text-slate-400">→</div>
                  <button
                    onClick={() => setShowBarrier(!showBarrier)}
                    className="mx-1 flex items-center rounded border-2 border-dashed border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                  >
                    <span className="[writing-mode:vertical-lr] rotate-180">
                      INFORMATION BARRIER
                    </span>
                  </button>
                  <div className="flex items-center px-1 text-slate-400">→</div>
                </div>
              )}
              {idx > 0 && idx !== 2 && (
                <div className="flex items-center px-1 text-slate-400">→</div>
              )}
              <StageCard
                stage={stage}
                isExpanded={expandedStage === stage.id}
                onToggle={() =>
                  setExpandedStage(expandedStage === stage.id ? null : stage.id)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Information barrier detail */}
      {showBarrier && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold text-red-800">Information Barrier</h3>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="mb-1 font-medium text-red-700">Stripped (dialog writer cannot see):</p>
                <ul className="ml-4 list-disc text-muted-foreground">
                  <li>target_facets (all facet IDs and signal mechanisms)</li>
                  <li>discussion_dynamic</li>
                  <li>Lens names, cognitive patterns, social dynamics</li>
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-green-700">Kept (dialog writer sees):</p>
                <ul className="ml-4 list-disc text-muted-foreground">
                  {artifacts.scenario.personas.map((p) => (
                    <li key={p.name}>
                      <strong>{p.name}:</strong> {p.perspective.trim().slice(0, 80)}...
                    </li>
                  ))}
                  <li>Topic: {artifacts.scenario.topic}</li>
                  <li>Context: {artifacts.scenario.context?.slice(0, 80)}...</li>
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground">Why:</p>
                <p className="text-muted-foreground">
                  So the discussion reads as natural conversation, not a pedagogical exercise.
                  The dialog writer creates authentic student voices because it doesn&apos;t know
                  what the framework is looking for.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded stage detail */}
      {expandedStage && (
        <StageDetail
          stage={STAGES.find((s) => s.id === expandedStage)!}
          artifacts={artifacts}
          scenarioId={scenarioId}
        />
      )}
    </div>
  );
}

/* ─── Stage Card ─────────────────────────────────────────────── */

function StageCard({
  stage,
  isExpanded,
  onToggle,
}: {
  stage: StageInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex min-w-[140px] flex-col rounded-lg border-2 p-3 text-left text-xs transition-all hover:shadow-md ${
        isExpanded ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"
      }`}
    >
      <span className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
        Stage {STAGES.indexOf(stage) + 1}
      </span>
      <span className="mb-2 text-sm font-semibold">{stage.name}</span>
      <span className="text-muted-foreground">
        {stage.agents.join(", ")}
      </span>
    </button>
  );
}

/* ─── Stage Detail ───────────────────────────────────────────── */

function StageDetail({
  stage,
  artifacts,
  scenarioId,
}: {
  stage: StageInfo;
  artifacts: Artifacts;
  scenarioId: string;
}) {
  const decisions = stage.getKeyDecisions(artifacts);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-3 font-semibold">{stage.name}</h3>
        <div className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Agents
            </p>
            <ul className="space-y-1">
              {stage.agents.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Inputs
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {stage.inputs.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <p className="mb-1 mt-3 text-xs font-semibold uppercase text-muted-foreground">
              Outputs
            </p>
            <ul className="space-y-1">
              {stage.outputs.map((o) =>
                o.tab ? (
                  <li key={o.label}>
                    <Link
                      href={`/researcher/scenario/${scenarioId}/artifacts?tab=${o.tab}`}
                      className="text-blue-600 hover:underline"
                    >
                      {o.label} →
                    </Link>
                  </li>
                ) : (
                  <li key={o.label} className="text-muted-foreground">
                    {o.label}
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
              Key Decisions
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {decisions.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>

            {/* Show targeted facets for Stage 1 */}
            {stage.id === "scenario" && artifacts.scenario.target_facets && (
              <div className="mt-2 flex flex-wrap gap-1">
                {artifacts.scenario.target_facets.map((tf) => (
                  <span key={tf.facet_id} className="flex items-center gap-1">
                    <LensBadge lens={tf.primary_lens as LensId} />
                    <Badge variant="secondary" className="text-[10px]">
                      {tf.facet_id.replace(/_/g, " ")} ({tf.target_quality})
                    </Badge>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
