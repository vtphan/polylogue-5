"use client";

import { useState } from "react";
import type { FrameworkData } from "@/lib/framework/types";

type NodeKind = "lens" | "facet" | "force";

type GraphNode = {
  id: string;
  kind: NodeKind;
  name: string;
  description: string;
  detail?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fill: string;
  section?: string;
  connections: {
    primaryFacetIds?: string[];
    crossFacetIds?: string[];
    facetIds?: string[];
    lensId?: string;
    crossLensIds?: string[];
    forceIds?: string[];
  };
};

type EdgeKind = "primary" | "cross" | "force";

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  color: string;
};

const LENS_COLORS: Record<string, { stroke: string; fill: string }> = {
  evidence: { stroke: "#295f86", fill: "#d7e8f3" },
  logic: { stroke: "#6a3d9a", fill: "#eadff3" },
  scope: { stroke: "#4d6b40", fill: "#dcebd2" },
};

const FORCE_COLORS = {
  cognitive: { stroke: "#59544d", fill: "#efebe3" },
  social: { stroke: "#8a5a2a", fill: "#f5e6d8" },
};

const LENS_POSITIONS: Record<string, { x: number; y: number }> = {
  evidence: { x: 130, y: 260 },
  logic: { x: 130, y: 610 },
  scope: { x: 130, y: 940 },
};

const FACET_POSITIONS: Record<string, { x: number; y: number }> = {
  source_credibility: { x: 500, y: 100 },
  source_diversity: { x: 500, y: 195 },
  relevance: { x: 500, y: 290 },
  sufficiency: { x: 500, y: 385 },
  inferential_validity: { x: 500, y: 545 },
  internal_consistency: { x: 500, y: 640 },
  reasoning_completeness: { x: 500, y: 735 },
  perspective_engagement: { x: 500, y: 860 },
  consequence_consideration: { x: 500, y: 955 },
  condition_sensitivity: { x: 500, y: 1050 },
};

const FORCE_POSITIONS: Record<string, { x: number; y: number }> = {
  confirmation_bias: { x: 905, y: 70 },
  tunnel_vision: { x: 905, y: 150 },
  overgeneralization: { x: 905, y: 230 },
  false_cause: { x: 905, y: 310 },
  uncritical_acceptance: { x: 905, y: 390 },
  black_and_white_thinking: { x: 905, y: 470 },
  egocentric_thinking: { x: 905, y: 550 },
  false_certainty: { x: 905, y: 630 },
  group_pressure: { x: 905, y: 810 },
  conflict_avoidance: { x: 905, y: 900 },
  authority_deference: { x: 905, y: 990 },
};

function titleCasePriority(priority: string) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function wrapLabel(label: string, maxLength = 16) {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength || current.length === 0) {
      current = next;
      continue;
    }
    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function buildGraph(data: FrameworkData) {
  const lensMap = new Map(data.lenses.map((lens) => [lens.id, lens]));
  const forceMap = new Map(
    [...data.explanatoryVariables.cognitive_patterns, ...data.explanatoryVariables.social_dynamics].map(
      (force) => [force.id, force],
    ),
  );

  const nodes: GraphNode[] = [
    ...data.lenses.map((lens) => ({
      id: lens.id,
      kind: "lens" as const,
      name: lens.name,
      description: cleanText(lens.description),
      detail: lens.question,
      x: LENS_POSITIONS[lens.id]?.x ?? 120,
      y: LENS_POSITIONS[lens.id]?.y ?? 120,
      width: 220,
      height: 84,
      color: LENS_COLORS[lens.id]?.stroke ?? "#211b17",
      fill: LENS_COLORS[lens.id]?.fill ?? "#ffffff",
      connections: {
        primaryFacetIds: data.facets.filter((facet) => facet.primary_lens === lens.id).map((facet) => facet.id),
        crossFacetIds: data.facets
          .filter((facet) => facet.cross_lens_visibility.includes(lens.id))
          .map((facet) => facet.id),
      },
    })),
    ...data.facets.map((facet) => ({
      id: facet.id,
      kind: "facet" as const,
      name: facet.name,
      description: cleanText(facet.definition),
      detail: `Priority: ${titleCasePriority(facet.priority_tier)}`,
      x: FACET_POSITIONS[facet.id]?.x ?? 500,
      y: FACET_POSITIONS[facet.id]?.y ?? 100,
      width: 250,
      height: 64,
      color: LENS_COLORS[facet.primary_lens]?.stroke ?? "#211b17",
      fill: LENS_COLORS[facet.primary_lens]?.fill ?? "#ffffff",
      section: facet.primary_lens,
      connections: {
        lensId: facet.primary_lens,
        crossLensIds: facet.cross_lens_visibility,
        forceIds: [
          ...facet.explanatory_connections.cognitive_patterns,
          ...facet.explanatory_connections.social_dynamics,
        ],
      },
    })),
    ...data.explanatoryVariables.cognitive_patterns.map((force) => ({
      id: force.id,
      kind: "force" as const,
      name: force.name,
      description: cleanText(force.description),
      x: FORCE_POSITIONS[force.id]?.x ?? 900,
      y: FORCE_POSITIONS[force.id]?.y ?? 70,
      width: 230,
      height: 52,
      color: FORCE_COLORS.cognitive.stroke,
      fill: FORCE_COLORS.cognitive.fill,
      section: "cognitive",
      connections: {
        facetIds: data.facets
          .filter((facet) => facet.explanatory_connections.cognitive_patterns.includes(force.id))
          .map((facet) => facet.id),
      },
    })),
    ...data.explanatoryVariables.social_dynamics.map((force) => ({
      id: force.id,
      kind: "force" as const,
      name: force.name,
      description: cleanText(force.description),
      x: FORCE_POSITIONS[force.id]?.x ?? 900,
      y: FORCE_POSITIONS[force.id]?.y ?? 900,
      width: 230,
      height: 52,
      color: FORCE_COLORS.social.stroke,
      fill: FORCE_COLORS.social.fill,
      section: "social",
      connections: {
        facetIds: data.facets
          .filter((facet) => facet.explanatory_connections.social_dynamics.includes(force.id))
          .map((facet) => facet.id),
      },
    })),
  ];

  const edges: GraphEdge[] = [];

  for (const facet of data.facets) {
    edges.push({
      id: `primary-${facet.primary_lens}-${facet.id}`,
      from: facet.primary_lens,
      to: facet.id,
      kind: "primary",
      color: LENS_COLORS[facet.primary_lens]?.stroke ?? "#211b17",
    });

    for (const crossLensId of facet.cross_lens_visibility) {
      edges.push({
        id: `cross-${crossLensId}-${facet.id}`,
        from: crossLensId,
        to: facet.id,
        kind: "cross",
        color: LENS_COLORS[crossLensId]?.stroke ?? "#211b17",
      });
    }

    for (const forceId of facet.explanatory_connections.cognitive_patterns) {
      edges.push({
        id: `force-${forceId}-${facet.id}`,
        from: forceId,
        to: facet.id,
        kind: "force",
        color: FORCE_COLORS.cognitive.stroke,
      });
    }

    for (const forceId of facet.explanatory_connections.social_dynamics) {
      edges.push({
        id: `force-${forceId}-${facet.id}`,
        from: forceId,
        to: facet.id,
        kind: "force",
        color: FORCE_COLORS.social.stroke,
      });
    }
  }

  return { nodes, edges, lensMap, forceMap };
}

function edgePath(from: GraphNode, to: GraphNode) {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  const curve = Math.max(80, (endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`;
}

function nodeNeighborhood(node: GraphNode, includeCrossLens: boolean) {
  const related = new Set<string>([node.id]);

  if (node.kind === "lens") {
    for (const id of node.connections.primaryFacetIds ?? []) {
      related.add(id);
    }
    if (includeCrossLens) {
      for (const id of node.connections.crossFacetIds ?? []) {
        related.add(id);
      }
    }
  }

  if (node.kind === "facet") {
    if (node.connections.lensId) {
      related.add(node.connections.lensId);
    }
    if (includeCrossLens) {
      for (const id of node.connections.crossLensIds ?? []) {
        related.add(id);
      }
    }
    for (const id of node.connections.forceIds ?? []) {
      related.add(id);
    }
  }

  if (node.kind === "force") {
    for (const id of node.connections.facetIds ?? []) {
      related.add(id);
    }
  }

  return related;
}

export function FrameworkVisualization({ data }: { data: FrameworkData }) {
  const [{ nodes, edges, lensMap, forceMap }] = useState(() => buildGraph(data));
  const [selectedNodeId, setSelectedNodeId] = useState<string>("sufficiency");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showCrossLens, setShowCrossLens] = useState(true);

  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const activeNode = activeNodeId ? nodeMap.get(activeNodeId) ?? null : null;
  const highlightedNodeIds = activeNode
    ? nodeNeighborhood(activeNode, showCrossLens)
    : new Set<string>(nodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => showCrossLens || edge.kind !== "cross");

  const relatedEdges = visibleEdges.filter((edge) => {
    if (!activeNode) {
      return true;
    }
    return highlightedNodeIds.has(edge.from) && highlightedNodeIds.has(edge.to);
  });

  let detail:
    | {
        eyebrow: string;
        title: string;
        description: string;
        detail?: string;
        qualityStrong?: string;
        qualityWeak?: string;
        sections: Array<{ heading: string; items: string[] }>;
      }
    | null = null;

  if (activeNode) {
    if (activeNode.kind === "lens") {
      detail = {
        eyebrow: "Lens",
        title: activeNode.name,
        description: activeNode.description,
        detail: activeNode.detail,
        sections: [
          {
            heading: "Primary facets",
            items: (activeNode.connections.primaryFacetIds ?? []).map((id) => nodeMap.get(id)?.name ?? id),
          },
          {
            heading: "Also visible here",
            items: showCrossLens
              ? (activeNode.connections.crossFacetIds ?? []).map((id) => nodeMap.get(id)?.name ?? id)
              : [],
          },
        ],
      };
    } else if (activeNode.kind === "facet") {
      const facet = data.facets.find((entry) => entry.id === activeNode.id);
      if (facet) {
        detail = {
          eyebrow: "Facet",
          title: activeNode.name,
          description: activeNode.description,
          detail: activeNode.detail,
          qualityStrong: cleanText(facet.quality_range.strong),
          qualityWeak: cleanText(facet.quality_range.weak),
          sections: [
            {
              heading: "Primary lens",
              items: facet.primary_lens ? [lensMap.get(facet.primary_lens)?.name ?? facet.primary_lens] : [],
            },
            {
              heading: "Cross-lens visibility",
              items: showCrossLens
                ? facet.cross_lens_visibility.map((id) => lensMap.get(id)?.name ?? id)
                : [],
            },
            {
              heading: "Cognitive biases",
              items: facet.explanatory_connections.cognitive_patterns.map(
                (id) => forceMap.get(id)?.name ?? id,
              ),
            },
            {
              heading: "Social dynamics",
              items: facet.explanatory_connections.social_dynamics.map(
                (id) => forceMap.get(id)?.name ?? id,
              ),
            },
          ],
        };
      }
    } else {
      detail = {
        eyebrow: activeNode.section === "social" ? "Social Dynamic" : "Cognitive Bias",
        title: activeNode.name,
        description: activeNode.description,
        sections: [
          {
            heading: "Commonly weakens",
            items: (activeNode.connections.facetIds ?? []).map((id) => nodeMap.get(id)?.name ?? id),
          },
        ],
      };
    }
  }

  return (
    <div className="framework-layout">
      <section className="panel framework-stage-panel">
        <div className="framework-toolbar">
          <div>
            <p className="page-kicker">Interactive Map</p>
            <h2 className="section-title framework-stage-title">Lenses, facets, and forces</h2>
            <p className="muted framework-stage-copy">
              Hover to preview, click to pin, and toggle cross-lens visibility when you want the secondary
              readings to enter the picture.
            </p>
          </div>
          <button
            type="button"
            className={`framework-toggle ${showCrossLens ? "active" : ""}`}
            onClick={() => setShowCrossLens((value) => !value)}
          >
            {showCrossLens ? "Hide cross-lens edges" : "Show cross-lens edges"}
          </button>
        </div>

        <div className="framework-legend">
          <span className="pill">Solid: primary lens to facet</span>
          <span className="pill">Dashed: cross-lens visibility</span>
          <span className="pill">Muted: forces that weaken facets</span>
        </div>

        <div className="framework-scroll">
          <svg className="framework-canvas" viewBox="0 0 1180 1140" role="img" aria-label="Conceptual framework map">
            <g className="framework-headings">
              <text x="130" y="42">Lenses</text>
              <text x="500" y="42">Facets of reasoning</text>
              <text x="905" y="42">Forces that weaken facets</text>
              <text x="905" y="785" className="framework-subheading">
                Social dynamics
              </text>
            </g>

            {visibleEdges.map((edge) => {
              const from = nodeMap.get(edge.from);
              const to = nodeMap.get(edge.to);
              if (!from || !to) {
                return null;
              }

              const isHighlighted = relatedEdges.some((relatedEdge) => relatedEdge.id === edge.id);

              return (
                <path
                  key={edge.id}
                  d={edgePath(from, to)}
                  className={`framework-edge framework-edge-${edge.kind}`}
                  style={{
                    stroke: edge.color,
                    opacity: activeNode ? (isHighlighted ? 0.95 : 0.14) : edge.kind === "force" ? 0.35 : 0.9,
                  }}
                />
              );
            })}

            {nodes.map((node) => {
              const isActive = activeNodeId === node.id;
              const isHighlighted = highlightedNodeIds.has(node.id);
              const labelLines = wrapLabel(node.name, node.kind === "facet" ? 18 : 16);

              return (
                <g
                  key={node.id}
                  className="framework-node"
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                  onClick={() => setSelectedNodeId(node.id)}
                  tabIndex={0}
                  role="button"
                  onFocus={() => setHoveredNodeId(node.id)}
                  onBlur={() => setHoveredNodeId((current) => (current === node.id ? null : current))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedNodeId(node.id);
                    }
                  }}
                  style={{ opacity: activeNode ? (isHighlighted ? 1 : 0.23) : 1 }}
                  aria-pressed={isActive}
                >
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={node.kind === "lens" ? 20 : 18}
                    fill={node.fill}
                    stroke={node.color}
                    strokeWidth={isActive ? 4 : 2.4}
                  />
                  {node.kind === "lens" ? (
                    <>
                      <text x={node.x + 18} y={node.y + 28} className="framework-node-kicker">
                        {node.name.toUpperCase()}
                      </text>
                      <text x={node.x + 18} y={node.y + 55} className="framework-node-detail">
                        {node.detail}
                      </text>
                    </>
                  ) : (
                    labelLines.map((line, index) => (
                      <text
                        key={`${node.id}-${line}`}
                        x={node.x + 16}
                        y={node.y + 24 + index * 18}
                        className="framework-node-label"
                      >
                        {line}
                      </text>
                    ))
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <aside className="panel framework-detail-panel">
        {detail ? (
          <div className="stack">
            <div>
              <div className="eyebrow">{detail.eyebrow}</div>
              <h2 className="framework-detail-title">{detail.title}</h2>
              <p className="framework-detail-copy">{detail.description}</p>
              {detail.detail ? <p className="framework-detail-meta">{detail.detail}</p> : null}
            </div>

            {"qualityStrong" in detail ? (
              <div className="framework-quality">
                <div className="framework-quality-block">
                  <div className="kv-label">Strong</div>
                  <p>{detail.qualityStrong}</p>
                </div>
                <div className="framework-quality-block">
                  <div className="kv-label">Weak</div>
                  <p>{detail.qualityWeak}</p>
                </div>
              </div>
            ) : null}

            {detail.sections.map((section) =>
              section.items.length > 0 ? (
                <div key={section.heading} className="kv">
                  <div className="kv-label">{section.heading}</div>
                  <div className="framework-chip-list">
                    {section.items.map((item) => (
                      <span key={`${section.heading}-${item}`} className="pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
