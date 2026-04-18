"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LensBadge } from "@/components/framework/lens-badge";
import { LENS_COLORS, type LensId } from "@/lib/constants/lens-colors";
import type { FrameworkData } from "./page";

interface IllustrativeExampleViewProps {
  data: FrameworkData;
  onNavigate: (level: string) => void;
}

const PASSAGE = [
  {
    speaker: "Alex",
    text: "My cousin went to the science museum and said it was boring. Let's do the amusement park for our field trip instead.",
  },
  {
    speaker: "Sam",
    text: "Yeah, that makes sense. The amusement park is way more fun.",
  },
  {
    speaker: "Alex",
    text: "So it's settled then.",
  },
];

const LENS_OBSERVATIONS: Record<LensId, string> = {
  evidence:
    "Alex's only source is one cousin's opinion. That's pretty thin evidence for a whole class decision.",
  logic:
    "Even if the museum is boring, how does that mean the amusement park is better? That's a jump.",
  scope:
    "They're only thinking about fun. What about cost, what they'd learn, what the teacher wants?",
};

const FACET_REVEALS: Record<LensId, { id: string; name: string; quality: string; observation: string }> = {
  evidence: {
    id: "sufficiency",
    name: "Sufficiency",
    quality: "weak",
    observation: "one opinion supporting a big conclusion",
  },
  logic: {
    id: "inferential_validity",
    name: "Inferential Validity",
    quality: "weak",
    observation: '"museum is boring" does not lead to "amusement park is better"',
  },
  scope: {
    id: "perspective_engagement",
    name: "Perspective Engagement",
    quality: "weak",
    observation: 'only the "fun" dimension considered',
  },
};

export function IllustrativeExampleView({ data, onNavigate }: IllustrativeExampleViewProps) {
  const [activeLens, setActiveLens] = useState<LensId | null>(null);
  const [showExplanatory, setShowExplanatory] = useState(false);

  const facetMap = Object.fromEntries(data.facets.map((f) => [f.id, f]));

  return (
    <div className="space-y-6 pt-4">
      {/* Passage */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            The Passage
          </h3>
          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            {PASSAGE.map((turn, i) => (
              <div key={i}>
                <span className="font-semibold">{turn.speaker}:</span>{" "}
                <span className="text-sm">{turn.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lens buttons */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Three lenses, three observations
        </h3>
        <div className="flex gap-2">
          {(["evidence", "logic", "scope"] as const).map((lens) => {
            const colors = LENS_COLORS[lens];
            const isActive = activeLens === lens;
            return (
              <Button
                key={lens}
                variant={isActive ? "default" : "outline"}
                className={
                  isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border} hover:opacity-90`
                    : ""
                }
                onClick={() => {
                  setActiveLens(lens);
                  setShowExplanatory(false);
                }}
              >
                {data.lenses.find((l) => l.id === lens)?.name ?? lens}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Lens observation */}
      {activeLens && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2">
              <LensBadge lens={activeLens} size="md" />
              <span className="text-sm italic text-muted-foreground">
                {data.lenses.find((l) => l.id === activeLens)?.question}
              </span>
            </div>
            <p className="text-sm">{LENS_OBSERVATIONS[activeLens]}</p>
          </CardContent>
        </Card>
      )}

      {/* Facet reveal */}
      {activeLens && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              The facet revealed
            </h3>
            <div className="flex items-start gap-3">
              <LensBadge lens={activeLens} />
              <div>
                <p className="text-sm">
                  sees <strong>weak {FACET_REVEALS[activeLens].name.toLowerCase()}</strong> —{" "}
                  {FACET_REVEALS[activeLens].observation}
                </p>
                {/* Expandable facet detail */}
                <FacetDetail facet={facetMap[FACET_REVEALS[activeLens].id]} />
              </div>
            </div>

            {/* Cross-lens annotation */}
            <div className="mt-4 rounded border-l-4 border-violet-300 bg-violet-50 p-3 text-sm text-muted-foreground">
              Notice that <strong>sufficiency</strong> is visible through both Evidence and Logic.
              &ldquo;The conclusion is bigger than the evidence supports&rdquo; is both an evidence
              quantity problem and a reasoning gap. When two students with different lenses both
              notice this, that overlap is what makes their conversation productive.
            </div>

            {!showExplanatory && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowExplanatory(true)}
              >
                Why did they reason this way? →
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Explanatory variables */}
      {activeLens && showExplanatory && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Why did they reason this way?
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  Cognitive
                </span>
                <div>
                  <p className="text-sm font-medium">Overgeneralization</p>
                  <p className="text-xs text-muted-foreground">
                    Alex heard one opinion and treated it as settled fact.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  Social
                </span>
                <div>
                  <p className="text-sm font-medium">Conformity</p>
                  <p className="text-xs text-muted-foreground">
                    Sam went along immediately without questioning.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded border-l-4 border-violet-300 bg-violet-50 p-3 text-sm text-muted-foreground">
              This is the <strong>Evaluate → Explain</strong> arc. The lenses tell you what&apos;s
              wrong. The explanatory variables tell you why it happened. In a session, students do
              this same two-phase progression — first observing through their lens, then explaining
              using cognitive and social vocabulary.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => onNavigate("reference")}
          className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
        >
          See the full framework →
        </button>
      </div>
    </div>
  );
}

function FacetDetail({ facet }: { facet?: FrameworkData["facets"][number] }) {
  const [expanded, setExpanded] = useState(false);
  if (!facet) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        {expanded ? "Hide detail" : "Show detail"}
      </button>
      {expanded && (
        <div className="mt-2 rounded border bg-slate-50 p-3 text-xs">
          <p className="mb-1">
            <strong>Definition:</strong> {facet.definition}
          </p>
          <p className="mb-1">
            <strong>Strong:</strong> {facet.quality_range.strong}
          </p>
          <p className="mb-1">
            <strong>Weak:</strong> {facet.quality_range.weak}
          </p>
          {facet.cross_lens_visibility.length > 0 && (
            <p>
              <strong>Also visible through:</strong>{" "}
              {facet.cross_lens_visibility.map((l) => (
                <LensBadge key={l} lens={l as LensId} className="mr-1" />
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
