"""
Render the explanatory heatmap with pie-wedge markers that encode
cross-lens visibility inside each connection dot.

This is a variant of framework_heatmaps.py. It produces only one figure,
explanatory-heatmap-wedge.png, and leaves the plain heatmap script alone.

Reading the figure:
  - Rows are facets, grouped by primary lens.
  - Columns are explanatory variables (cognitive patterns | social dynamics).
  - Each dot represents a connection listed in §4 of the framework doc:
    a cognitive or social force that causes that facet to come out weak.
  - The dot's composition encodes cross-lens visibility, which is a
    property of the facet (the row):
        * The dominant wedge (~60% of the circle, at the top) is the
          facet's PRIMARY lens color.
        * Smaller wedges beneath split the remainder and show the
          SECONDARY lenses through which the facet is also visible.
        * A facet with no cross-lens visibility (e.g. inferential
          validity) renders as a single-color dot.
  - Row labels are still bolded in the primary lens color as a
    redundant anchor.

The redundancy is intentional: cross-lens visibility is a facet-level
fact, so every dot in a row carries the same wedge pattern. This keeps
the two relations (explanatory connection, cross-lens visibility)
visually orthogonal even though they share one figure.

Usage:
    python3 framework/docs/framework_heatmaps_wedge.py
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, Patch, Wedge

# ---------------------------------------------------------------------------
# Framework data (source of truth: framework/docs/conceptual-framework.md)
# ---------------------------------------------------------------------------

LENS_COLORS = {
    "evidence": "#1f78b4",  # blue
    "logic":    "#6a3d9a",  # purple
    "scope":    "#33a02c",  # green
}

LENS_ORDER = ["evidence", "logic", "scope"]

SOCIAL_TINT    = "#8a5a2a"  # warm brown
COGNITIVE_TINT = "#2c5266"  # cool dark teal-slate — complement of SOCIAL_TINT
BG_COLOR       = "#fafafa"

# (facet_id, display_label, primary_lens)
FACETS: list[tuple[str, str, str]] = [
    ("source_credibility",     "source credibility",     "evidence"),
    ("source_diversity",       "source diversity",       "evidence"),
    ("relevance",              "relevance",              "evidence"),
    ("sufficiency",            "sufficiency",            "evidence"),
    ("inferential_validity",   "inferential validity",   "logic"),
    ("internal_consistency",   "internal consistency",   "logic"),
    ("reasoning_completeness", "reasoning completeness", "logic"),
    ("perspective_engagement",    "perspective engagement",    "scope"),
    ("consequence_consideration", "consequence consideration", "scope"),
    ("condition_sensitivity",     "condition sensitivity",     "scope"),
]

COGNITIVE_PATTERNS: list[tuple[str, str]] = [
    ("confirmation_bias",        "confirmation bias"),
    ("tunnel_vision",            "tunnel vision"),
    ("overgeneralization",       "overgeneralization"),
    ("false_cause",              "false cause"),
    ("uncritical_acceptance",    "uncritical acceptance"),
    ("black_and_white_thinking", "black-and-white thinking"),
    ("egocentric_thinking",      "egocentric thinking"),
    ("false_certainty",          "false certainty"),
]

SOCIAL_DYNAMICS: list[tuple[str, str]] = [
    ("group_pressure",      "group pressure"),
    ("conflict_avoidance",  "conflict avoidance"),
    ("authority_deference", "authority deference"),
]

EXPLANATORY_CONNECTIONS: dict[str, set[str]] = {
    "source_credibility":       {"uncritical_acceptance", "authority_deference"},
    "source_diversity":         {"confirmation_bias", "tunnel_vision", "group_pressure"},
    "relevance":                {"confirmation_bias", "overgeneralization"},
    "sufficiency":              {"overgeneralization", "false_certainty",
                                 "group_pressure", "authority_deference"},
    "inferential_validity":     {"false_cause", "black_and_white_thinking"},
    "internal_consistency":     {"tunnel_vision", "group_pressure", "conflict_avoidance"},
    "reasoning_completeness":   {"uncritical_acceptance", "false_certainty",
                                 "authority_deference"},
    "perspective_engagement":   {"confirmation_bias", "egocentric_thinking",
                                 "group_pressure", "conflict_avoidance",
                                 "authority_deference"},
    "consequence_consideration":{"tunnel_vision", "black_and_white_thinking",
                                 "group_pressure"},
    "condition_sensitivity":    {"tunnel_vision", "overgeneralization",
                                 "egocentric_thinking", "false_certainty",
                                 "group_pressure"},
}

CROSS_LENS: dict[str, tuple[str, list[str]]] = {
    "source_credibility":       ("evidence", ["logic"]),
    "source_diversity":         ("evidence", ["scope"]),
    "relevance":                ("evidence", ["logic"]),
    "sufficiency":              ("evidence", ["logic", "scope"]),
    "inferential_validity":     ("logic",    []),
    "internal_consistency":     ("logic",    ["evidence"]),
    "reasoning_completeness":   ("logic",    ["evidence"]),
    "perspective_engagement":   ("scope",    ["evidence", "logic"]),
    "consequence_consideration":("scope",    ["logic"]),
    "condition_sensitivity":    ("scope",    ["evidence", "logic"]),
}

OUTPUT_DIR = Path(__file__).resolve().parent

# Visual tuning
DOT_RADIUS    = 0.36     # radius of the pie-wedge markers in cell units
PRIMARY_SPAN  = 216      # degrees of the circle taken by the primary lens wedge
WEDGE_EDGE    = "white"  # stroke between wedges
WEDGE_LW      = 0.8


# ---------------------------------------------------------------------------
# Wedge geometry
# ---------------------------------------------------------------------------

def facet_wedge_spec(facet_id: str) -> list[tuple[float, float, str]]:
    """Return the [(theta1, theta2, color), ...] wedge segments for a facet.

    The primary wedge is centered at the top of the circle (90 degrees),
    occupies PRIMARY_SPAN degrees, and is colored by the primary lens.
    Secondary lens wedges fill the remaining arc equally, in the order
    they appear in the CROSS_LENS table.
    """
    primary, secondaries = CROSS_LENS[facet_id]

    if not secondaries:
        return [(0.0, 360.0, LENS_COLORS[primary])]

    primary_half = PRIMARY_SPAN / 2
    p_start = 90 - primary_half   # e.g. -18
    p_end   = 90 + primary_half   # e.g. 198
    wedges = [(p_start, p_end, LENS_COLORS[primary])]

    remaining = 360 - PRIMARY_SPAN
    per_sec = remaining / len(secondaries)
    cur = p_end
    for lens in secondaries:
        wedges.append((cur, cur + per_sec, LENS_COLORS[lens]))
        cur += per_sec
    return wedges


def draw_facet_marker(ax: plt.Axes, x: float, y: float, facet_id: str) -> None:
    """Draw the composite pie-wedge marker for a facet at grid position (x, y)."""
    spec = facet_wedge_spec(facet_id)

    if len(spec) == 1:
        # Single-color dot — cleaner than a degenerate wedge.
        theta1, theta2, color = spec[0]
        ax.add_patch(Circle(
            (x, y), radius=DOT_RADIUS,
            facecolor=color, edgecolor="white", linewidth=WEDGE_LW,
        ))
        return

    for theta1, theta2, color in spec:
        ax.add_patch(Wedge(
            center=(x, y), r=DOT_RADIUS,
            theta1=theta1, theta2=theta2,
            facecolor=color, edgecolor=WEDGE_EDGE, linewidth=WEDGE_LW,
        ))


# ---------------------------------------------------------------------------
# Figure construction
# ---------------------------------------------------------------------------

def lens_group_boundaries() -> list[int]:
    boundaries: list[int] = []
    prev_lens: str | None = None
    for idx, (_fid, _label, lens) in enumerate(FACETS):
        if prev_lens is not None and lens != prev_lens:
            boundaries.append(idx)
        prev_lens = lens
    return boundaries


def render_explanatory_wedge_heatmap() -> Path:
    explanatory: list[tuple[str, str, str]] = \
        [(vid, label, "cognitive") for vid, label in COGNITIVE_PATTERNS] + \
        [(vid, label, "social")    for vid, label in SOCIAL_DYNAMICS]

    n_rows = len(FACETS)
    n_cols = len(explanatory)
    n_cognitive = len(COGNITIVE_PATTERNS)

    fig, ax = plt.subplots(figsize=(13, 7.5))
    ax.set_facecolor(BG_COLOR)

    # Background grid of faint cells for orientation.
    for i in range(n_rows):
        for j in range(n_cols):
            ax.add_patch(plt.Rectangle(
                (j - 0.5, i - 0.5), 1, 1,
                facecolor="white", edgecolor="#e5e5e5", linewidth=0.6,
                zorder=0,
            ))

    # Connection markers.
    for i, (fid, _label, _lens) in enumerate(FACETS):
        causes = EXPLANATORY_CONNECTIONS[fid]
        for j, (vid, _vlabel, _kind) in enumerate(explanatory):
            if vid in causes:
                draw_facet_marker(ax, x=j, y=i, facet_id=fid)

    # Axes, ticks, labels.
    ax.set_xlim(-0.6, n_cols - 0.4)
    ax.set_ylim(n_rows - 0.4, -0.6)  # invert y to match row-down orientation
    ax.set_aspect("equal")

    ax.set_xticks(np.arange(n_cols))
    ax.set_xticklabels([label for _vid, label, _kind in explanatory],
                       rotation=45, ha="right", fontsize=13)
    # Color tick labels to match their column-group header.
    for j, label in enumerate(ax.get_xticklabels()):
        kind = explanatory[j][2]
        label.set_color(SOCIAL_TINT if kind == "social" else COGNITIVE_TINT)
        label.set_fontweight("bold")
    ax.set_yticks(np.arange(n_rows))
    ax.set_yticklabels([label for _fid, label, _lens in FACETS], fontsize=13)
    for i, label in enumerate(ax.get_yticklabels()):
        lens = FACETS[i][2]
        label.set_color(LENS_COLORS[lens])
        label.set_fontweight("bold")

    ax.tick_params(length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)

    # Heavy vertical separator between cognitive and social columns.
    ax.axvline(x=n_cognitive - 0.5, color="black", linewidth=2.5, zorder=1)

    # Horizontal separators between lens groups.
    for b in lens_group_boundaries():
        ax.axhline(y=b - 0.5, color="black", linewidth=1.8, zorder=1)

    # Column group headers.
    header_y = -1.1
    ax.text((n_cognitive - 1) / 2, header_y,
            "COGNITIVE BIASES",
            ha="center", va="bottom",
            fontsize=14, fontweight="bold", color=COGNITIVE_TINT)
    ax.text(n_cognitive + (n_cols - n_cognitive - 1) / 2, header_y,
            "SOCIAL DYNAMICS",
            ha="center", va="bottom",
            fontsize=14, fontweight="bold", color=SOCIAL_TINT)

    # Legend 1: evaluative lenses, with canonical questions from §2.1.
    lens_handles = [
        Patch(facecolor=LENS_COLORS["evidence"],
              label="Evidence\nis the claim supported?"),
        Patch(facecolor=LENS_COLORS["logic"],
              label="Logic\ndoes the reasoning hold?"),
        Patch(facecolor=LENS_COLORS["scope"],
              label="Scope\nis the analysis thorough?"),
    ]
    lens_legend = ax.legend(
        handles=lens_handles, loc="upper left",
        bbox_to_anchor=(1.02, 1.0), frameon=False,
        title="Lenses that reveal reasoning", title_fontsize=12, fontsize=10,
        labelspacing=1.1, handletextpad=0.8,
    )
    lens_legend._legend_box.align = "left"
    # Re-add the first legend so the second ax.legend() call does not
    # replace it.
    ax.add_artist(lens_legend)

    # Legend 2: forces that weaken thinking, with canonical glosses
    # from apps/lens/docs/teacher-overview.md.
    group_handles = [
        Patch(facecolor=COGNITIVE_TINT,
              label="Cognitive biases\nhabits inside one person's head"),
        Patch(facecolor=SOCIAL_TINT,
              label="Social dynamics\npatterns of group interaction"),
    ]
    group_legend = ax.legend(
        handles=group_handles, loc="upper left",
        bbox_to_anchor=(1.02, 0.52), frameon=False,
        title="Forces that weaken reasoning", title_fontsize=12, fontsize=10,
        labelspacing=1.1, handletextpad=0.8,
    )
    group_legend._legend_box.align = "left"

    # fig.suptitle(
    #     "Explanatory connections with cross-lens visibility",
    #     fontsize=15, fontweight="bold", x=0.1, ha="left", y=0.97,
    # )

    out = OUTPUT_DIR / "conceptual-framework.png"
    fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white",
                bbox_extra_artists=[lens_legend, group_legend])
    plt.close(fig)
    return out


def main() -> None:
    plt.rcParams["font.family"] = "DejaVu Sans"
    out = render_explanatory_wedge_heatmap()
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
