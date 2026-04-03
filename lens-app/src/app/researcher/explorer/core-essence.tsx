"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LENS_COLORS } from "@/lib/constants/lens-colors";

interface CoreEssenceViewProps {
  onNavigate: (level: string) => void;
}

export function CoreEssenceView({ onNavigate }: CoreEssenceViewProps) {
  return (
    <div className="space-y-8 pt-4">
      {/* Flow Diagram */}
      <div className="rounded-lg border bg-white p-8">
        <div className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Observe → Explain
        </div>
        <div className="flex items-center justify-center gap-4">
          <DiagramNode
            label="Lens"
            subtitle="perspective"
            question="How are you looking?"
            colorClass="bg-slate-100 border-slate-300"
            onClick={() => onNavigate("example")}
          />
          <Arrow label="reveals" />
          <DiagramNode
            label="Facet"
            subtitle="dimension"
            question="What specific thing do you see?"
            colorClass="bg-violet-50 border-violet-300"
            onClick={() => onNavigate("example")}
          />
          <Arrow label="explained by" />
          <DiagramNode
            label="Explanatory Variable"
            subtitle="cause"
            question="Why did they think this way?"
            colorClass="bg-rose-50 border-rose-300"
            onClick={() => onNavigate("example")}
          />
        </div>
      </div>

      {/* Three key relationships */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">Lens → Facet</h3>
            <p className="text-sm text-muted-foreground">
              A lens is a perspective for looking at reasoning. Each lens reveals specific
              facets — concrete dimensions of reasoning quality. Some facets are visible
              through more than one lens. That cross-visibility is what makes peer discussion
              productive: students with different lenses see the same issue from different angles.
            </p>
            <div className="mt-3 flex gap-2">
              {(["logic", "evidence", "scope"] as const).map((l) => (
                <span
                  key={l}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LENS_COLORS[l].bg} ${LENS_COLORS[l].text}`}
                >
                  {l}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">Facet → Explanatory Variable</h3>
            <p className="text-sm text-muted-foreground">
              A facet is <em>what</em> you observe. An explanatory variable is <em>why</em> it
              happened. Explanatory variables come in two kinds: cognitive patterns (individual
              thinking tendencies) and social dynamics (group interaction patterns). Every facet
              connects to at least one of each.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">The Hidden Layer</h3>
            <p className="text-sm text-muted-foreground">
              Students never see facets by name. They observe through lenses (Evaluate phase)
              and explain using cognitive/social vocabulary (Explain phase). Facets are the
              structural layer that connects the two — the scaffolding behind the wall. This
              is what makes the framework teachable without being reductive.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
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

function DiagramNode({
  label,
  subtitle,
  question,
  colorClass,
  onClick,
}: {
  label: string;
  subtitle: string;
  question: string;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[160px] flex-col items-center rounded-lg border-2 p-4 transition-shadow hover:shadow-md ${colorClass}`}
    >
      <span className="text-base font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">({subtitle})</span>
      <span className="mt-2 text-center text-xs italic text-muted-foreground">
        &ldquo;{question}&rdquo;
      </span>
    </button>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center">
        <div className="h-px w-8 bg-slate-400" />
        <div className="border-y-4 border-l-6 border-y-transparent border-l-slate-400" />
      </div>
    </div>
  );
}
