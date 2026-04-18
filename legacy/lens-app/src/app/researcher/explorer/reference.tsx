"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LensBadge } from "@/components/framework/lens-badge";
import { LENS_COLORS, type LensId } from "@/lib/constants/lens-colors";
import type { FrameworkData, Facet, ExplanatoryVariable } from "./page";

interface ReferenceViewProps {
  data: FrameworkData;
}

export function ReferenceView({ data }: ReferenceViewProps) {
  return (
    <div className="pt-4">
      <Tabs defaultValue="facets">
        <TabsList>
          <TabsTrigger value="facets">Facets</TabsTrigger>
          <TabsTrigger value="lenses">Lenses</TabsTrigger>
          <TabsTrigger value="variables">Explanatory Variables</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="facets">
          <FacetsTab facets={data.facets} variables={data.explanatoryVariables} />
        </TabsContent>
        <TabsContent value="lenses">
          <LensesTab data={data} />
        </TabsContent>
        <TabsContent value="variables">
          <VariablesTab data={data} />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionsTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Tab 1: Facets by Lens ──────────────────────────────────── */

function FacetsTab({
  facets,
  variables,
}: {
  facets: Facet[];
  variables: FrameworkData["explanatoryVariables"];
}) {
  const lensOrder: LensId[] = ["evidence", "logic", "scope"];
  const evMap = Object.fromEntries([
    ...variables.cognitive_patterns.map((v) => [v.id, v]),
    ...variables.social_dynamics.map((v) => [v.id, v]),
  ]);

  return (
    <div className="space-y-6 pt-4">
      {lensOrder.map((lens) => {
        const lensFacets = facets.filter((f) => f.primary_lens === lens);
        return (
          <div key={lens}>
            <div className="mb-3 flex items-center gap-2">
              <LensBadge lens={lens} size="md" />
              <span className="text-sm text-muted-foreground">
                {lensFacets.length} facets
              </span>
            </div>
            <div className="space-y-2">
              {lensFacets.map((facet) => (
                <FacetRow key={facet.id} facet={facet} evMap={evMap} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FacetRow({
  facet,
  evMap,
}: {
  facet: Facet;
  evMap: Record<string, ExplanatoryVariable>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
      >
        <span className="font-medium">{facet.name}</span>
        <span className="flex-1 truncate text-sm text-muted-foreground">
          {facet.definition}
        </span>
        <LensBadge lens={facet.primary_lens as LensId} />
        <Badge variant="secondary" className="text-xs">
          {facet.priority_tier}
        </Badge>
        <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Strong Signal
              </p>
              <p className="text-muted-foreground">{facet.quality_range.strong}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Weak Signal
              </p>
              <p className="text-muted-foreground">{facet.quality_range.weak}</p>
            </div>
          </div>

          {facet.cross_lens_visibility.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Cross-lens Visibility
              </p>
              <div className="flex gap-1">
                {facet.cross_lens_visibility.map((l) => (
                  <LensBadge key={l} lens={l as LensId} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Cognitive Patterns
              </p>
              <div className="flex flex-wrap gap-1">
                {facet.explanatory_connections.cognitive_patterns.map((id) => (
                  <span
                    key={id}
                    className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
                  >
                    {evMap[id]?.name ?? id}
                  </span>
                ))}
                {facet.explanatory_connections.cognitive_patterns.length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Social Dynamics
              </p>
              <div className="flex flex-wrap gap-1">
                {facet.explanatory_connections.social_dynamics.map((id) => (
                  <span
                    key={id}
                    className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                  >
                    {evMap[id]?.name ?? id}
                  </span>
                ))}
                {facet.explanatory_connections.social_dynamics.length === 0 && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab 2: Lenses ──────────────────────────────────────────── */

function LensesTab({ data }: { data: FrameworkData }) {
  return (
    <div className="grid gap-4 pt-4 md:grid-cols-3">
      {data.lenses.map((lens) => {
        const primaryFacets = data.facets.filter((f) => f.primary_lens === lens.id);
        const crossCount = data.facets.filter(
          (f) => f.primary_lens !== lens.id && f.cross_lens_visibility.includes(lens.id)
        ).length;
        const colors = LENS_COLORS[lens.id as LensId];
        return (
          <Card key={lens.id} className={`border-2 ${colors.border}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LensBadge lens={lens.id as LensId} size="md" label={lens.name} />
              </CardTitle>
              <p className="text-sm italic text-muted-foreground">{lens.question}</p>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">{lens.description}</p>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Primary Facets ({primaryFacets.length})
                </p>
                <ul className="space-y-1">
                  {primaryFacets.map((f) => (
                    <li key={f.id} className="text-sm">
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
              {crossCount > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  + {crossCount} cross-visible facet{crossCount > 1 ? "s" : ""} from other lenses
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Tab 3: Explanatory Variables ───────────────────────────── */

function VariablesTab({ data }: { data: FrameworkData }) {
  return (
    <div className="space-y-6 pt-4">
      <VariableSection
        title="Cognitive Patterns"
        badgeClass="bg-orange-100 text-orange-700"
        variables={data.explanatoryVariables.cognitive_patterns}
        facets={data.facets}
        kind="cognitive_patterns"
      />
      <VariableSection
        title="Social Dynamics"
        badgeClass="bg-purple-100 text-purple-700"
        variables={data.explanatoryVariables.social_dynamics}
        facets={data.facets}
        kind="social_dynamics"
      />
    </div>
  );
}

function VariableSection({
  title,
  badgeClass,
  variables,
  facets,
  kind,
}: {
  title: string;
  badgeClass: string;
  variables: ExplanatoryVariable[];
  facets: Facet[];
  kind: "cognitive_patterns" | "social_dynamics";
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({variables.length})
      </h3>
      <div className="space-y-2">
        {variables.map((v) => (
          <VariableRow
            key={v.id}
            variable={v}
            badgeClass={badgeClass}
            facets={facets}
            kind={kind}
          />
        ))}
      </div>
    </div>
  );
}

function VariableRow({
  variable,
  badgeClass,
  facets,
  kind,
}: {
  variable: ExplanatoryVariable;
  badgeClass: string;
  facets: Facet[];
  kind: "cognitive_patterns" | "social_dynamics";
}) {
  const [expanded, setExpanded] = useState(false);
  const connected = facets.filter((f) =>
    f.explanatory_connections[kind].includes(variable.id)
  );

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
      >
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {variable.name}
        </span>
        <span className="flex-1 text-sm text-muted-foreground">{variable.description}</span>
        <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Connected Facets ({connected.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {connected.map((f) => (
              <span
                key={f.id}
                className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs"
              >
                <LensBadge lens={f.primary_lens as LensId} />
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab 4: Connections Matrix ──────────────────────────────── */

function ConnectionsTab({ data }: { data: FrameworkData }) {
  const lensOrder: LensId[] = ["evidence", "logic", "scope"];
  const allCogPatterns = data.explanatoryVariables.cognitive_patterns;
  const allSocDynamics = data.explanatoryVariables.social_dynamics;

  return (
    <div className="overflow-x-auto pt-4">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-2 py-1 text-left font-semibold">
              Facet
            </th>
            {lensOrder.map((l) => (
              <th
                key={l}
                className={`px-2 py-1 text-center font-medium capitalize ${LENS_COLORS[l].text}`}
              >
                {l}
              </th>
            ))}
            <th className="border-l px-1" />
            {allCogPatterns.map((cp) => (
              <th
                key={cp.id}
                className="max-w-[60px] px-1 py-1 text-center font-normal"
                title={cp.name}
              >
                <span className="inline-block -rotate-45 whitespace-nowrap text-[10px]">
                  {cp.name}
                </span>
              </th>
            ))}
            <th className="border-l px-1" />
            {allSocDynamics.map((sd) => (
              <th
                key={sd.id}
                className="max-w-[60px] px-1 py-1 text-center font-normal"
                title={sd.name}
              >
                <span className="inline-block -rotate-45 whitespace-nowrap text-[10px]">
                  {sd.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.facets.map((facet) => (
            <tr key={facet.id} className="border-t hover:bg-muted/30">
              <td className="sticky left-0 bg-white px-2 py-1.5 font-medium">
                {facet.name}
              </td>
              {/* Lens columns */}
              {lensOrder.map((lens) => {
                const isPrimary = facet.primary_lens === lens;
                const isCross = facet.cross_lens_visibility.includes(lens);
                return (
                  <td key={lens} className="px-2 py-1.5 text-center">
                    {isPrimary && (
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${LENS_COLORS[lens].dot}`}
                        title="Primary lens"
                      />
                    )}
                    {isCross && (
                      <span
                        className={`inline-block h-3 w-3 rounded-full border-2 ${LENS_COLORS[lens].border}`}
                        title="Cross-visible"
                      />
                    )}
                  </td>
                );
              })}
              <td className="border-l" />
              {/* Cognitive pattern columns */}
              {allCogPatterns.map((cp) => {
                const connected = facet.explanatory_connections.cognitive_patterns.includes(cp.id);
                return (
                  <td key={cp.id} className="px-1 py-1.5 text-center">
                    {connected && (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
                    )}
                  </td>
                );
              })}
              <td className="border-l" />
              {/* Social dynamics columns */}
              {allSocDynamics.map((sd) => {
                const connected = facet.explanatory_connections.social_dynamics.includes(sd.id);
                return (
                  <td key={sd.id} className="px-1 py-1.5 text-center">
                    {connected && (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-slate-500" /> Primary lens
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-400" /> Cross-visible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" /> Cognitive pattern
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" /> Social dynamic
        </span>
      </div>
    </div>
  );
}
