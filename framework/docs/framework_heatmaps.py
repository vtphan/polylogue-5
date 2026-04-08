"""
Render heatmaps for the Polylogue conceptual framework.

Produces two figures:

1. explanatory-heatmap.png
     Rows    = facets (grouped by primary lens)
     Columns = explanatory variables (cognitive patterns | social dynamics)
     Cells   = filled with the ROW'S lens color when §4 lists the connection

2. cross-lens-heatmap.png
     Rows    = facets (grouped by primary lens)
     Columns = the three lenses
     Cells   = filled with the COLUMN'S lens color; full saturation for the
               primary lens, ~35% alpha for "also visible through"

Both figures share the same lens color vocabulary as the Graphviz diagram:
Evidence = blue, Logic = purple, Scope = green. Row labels are colored and
bolded by the facet's primary lens; horizontal separators mark lens group
boundaries.

Usage:
    python3 framework/docs/framework_heatmaps.py
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import to_rgba
from matplotlib.patches import Patch

# ---------------------------------------------------------------------------
# Framework data (source of truth: framework/docs/conceptual-framework.md)
# ---------------------------------------------------------------------------

LENS_COLORS = {
    "evidence": "#1f78b4",  # blue
    "logic":    "#6a3d9a",  # purple
    "scope":    "#33a02c",  # green
}

# Muted tints used for column-group headers (cognitive vs. social).
COGNITIVE_TINT = "#3a4a66"  # slate blue-gray
SOCIAL_TINT    = "#8a5a2a"  # warm brown

EMPTY_CELL = (0.96, 0.96, 0.96, 1.0)

# (facet_id, display_label, primary_lens) — ordered as they appear in §2.2.
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

# Explanatory connections from §4. facet_id -> set of variable_ids that cause
# weakness on that facet (both cognitive and social).
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

# Cross-lens visibility from §3. facet_id -> (primary, also_visible_set)
CROSS_LENS: dict[str, tuple[str, set[str]]] = {
    "source_credibility":       ("evidence", {"logic"}),
    "source_diversity":         ("evidence", {"scope"}),
    "relevance":                ("evidence", {"logic"}),
    "sufficiency":              ("evidence", {"scope", "logic"}),
    "inferential_validity":     ("logic",    set()),
    "internal_consistency":     ("logic",    {"evidence"}),
    "reasoning_completeness":   ("logic",    {"evidence"}),
    "perspective_engagement":   ("scope",    {"evidence", "logic"}),
    "consequence_consideration":("scope",    {"logic"}),
    "condition_sensitivity":    ("scope",    {"logic", "evidence"}),
}

OUTPUT_DIR = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

def blend_on_white(hex_color: str, alpha: float) -> tuple[float, float, float, float]:
    """Alpha-composite a color onto white. Keeps PNGs robust across viewers."""
    r, g, b, _ = to_rgba(hex_color)
    return (alpha * r + (1 - alpha),
            alpha * g + (1 - alpha),
            alpha * b + (1 - alpha),
            1.0)


def full(hex_color: str) -> tuple[float, float, float, float]:
    return to_rgba(hex_color, 1.0)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def lens_group_boundaries() -> list[int]:
    """Row indices where a new lens group begins (excluding row 0)."""
    boundaries: list[int] = []
    prev_lens: str | None = None
    for idx, (_fid, _label, lens) in enumerate(FACETS):
        if prev_lens is not None and lens != prev_lens:
            boundaries.append(idx)
        prev_lens = lens
    return boundaries


def style_main_axes(ax: plt.Axes, n_rows: int, n_cols: int,
                    x_labels: list[str], y_labels: list[str]) -> None:
    ax.set_xticks(np.arange(n_cols))
    ax.set_xticklabels(x_labels, rotation=45, ha="right")
    ax.set_yticks(np.arange(n_rows))
    ax.set_yticklabels(y_labels)
    for i, label in enumerate(ax.get_yticklabels()):
        lens = FACETS[i][2]
        label.set_color(LENS_COLORS[lens])
        label.set_fontweight("bold")
    # Thin white grid between cells (drawn as minor ticks).
    ax.set_xticks(np.arange(n_cols + 1) - 0.5, minor=True)
    ax.set_yticks(np.arange(n_rows + 1) - 0.5, minor=True)
    ax.grid(which="minor", color="white", linewidth=1.2)
    ax.tick_params(which="minor", length=0, labelsize=14)
    ax.tick_params(which="major", length=0, labelsize=14)
    for spine in ax.spines.values():
        spine.set_visible(False)


# ---------------------------------------------------------------------------
# Figure 1: explanatory connections heatmap
# ---------------------------------------------------------------------------

def render_explanatory_heatmap() -> Path:
    explanatory: list[tuple[str, str, str]] = \
        [(vid, label, "cognitive") for vid, label in COGNITIVE_PATTERNS] + \
        [(vid, label, "social")    for vid, label in SOCIAL_DYNAMICS]

    n_rows = len(FACETS)
    n_cols = len(explanatory)
    n_cognitive = len(COGNITIVE_PATTERNS)

    # Build an RGBA image: each connected cell is the ROW'S lens color.
    cells = np.zeros((n_rows, n_cols, 4))
    for i, (fid, _label, lens) in enumerate(FACETS):
        row_color = full(LENS_COLORS[lens])
        causes = EXPLANATORY_CONNECTIONS[fid]
        for j, (vid, _vlabel, _kind) in enumerate(explanatory):
            if vid in causes:
                cells[i, j] = row_color
            else:
                cells[i, j] = EMPTY_CELL

    fig, ax_main = plt.subplots(figsize=(12.5, 7.2))
    ax_main.imshow(cells, aspect="auto", interpolation="nearest")
    style_main_axes(
        ax_main, n_rows, n_cols,
        x_labels=[label for _vid, label, _kind in explanatory],
        y_labels=[label for _fid, label, _lens in FACETS],
    )

    # Heavy vertical separator between cognitive and social columns.
    ax_main.axvline(x=n_cognitive - 0.5, color="black", linewidth=2.5)

    # Horizontal separators between lens groups.
    for b in lens_group_boundaries():
        ax_main.axhline(y=b - 0.5, color="black", linewidth=1.8)

    # Column-group headers, colored to match the tint palette.
    header_y = -1.15
    ax_main.text((n_cognitive - 1) / 2, header_y,
                 "COGNITIVE PATTERNS",
                 ha="center", va="bottom",
                 fontsize=16, fontweight="bold", color=COGNITIVE_TINT)
    ax_main.text(n_cognitive + (n_cols - n_cognitive - 1) / 2, header_y,
                 "SOCIAL DYNAMICS",
                 ha="center", va="bottom",
                 fontsize=16, fontweight="bold", color=SOCIAL_TINT)

    # ax_main.set_title(
    #     "Explanatory connections — which forces cause each facet to weaken",
    #     fontsize=13, pad=34, loc="left",
    # )

    # Lens legend on the right.
    handles = [
        Patch(facecolor=LENS_COLORS["evidence"], label="Evidence lens"),
        Patch(facecolor=LENS_COLORS["logic"],    label="Logic lens"),
        Patch(facecolor=LENS_COLORS["scope"],    label="Scope lens"),
    ]
    ax_main.legend(handles=handles, loc="upper left",
                   bbox_to_anchor=(1.02, 1.0), frameon=False,
                   title="Primary lens", title_fontsize=14, fontsize=13)

    out = OUTPUT_DIR / "explanatory-heatmap.png"
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return out


# ---------------------------------------------------------------------------
# Figure 2: cross-lens visibility heatmap
# ---------------------------------------------------------------------------

def render_cross_lens_heatmap() -> Path:
    lens_order = ["evidence", "logic", "scope"]
    lens_display = {"evidence": "Evidence", "logic": "Logic", "scope": "Scope"}

    n_rows = len(FACETS)
    n_cols = len(lens_order)

    cells = np.zeros((n_rows, n_cols, 4))
    for i, (fid, _label, _lens) in enumerate(FACETS):
        primary, also = CROSS_LENS[fid]
        for j, lens in enumerate(lens_order):
            if lens == primary:
                cells[i, j] = full(LENS_COLORS[lens])
            elif lens in also:
                cells[i, j] = blend_on_white(LENS_COLORS[lens], 0.35)
            else:
                cells[i, j] = EMPTY_CELL

    fig, ax_main = plt.subplots(figsize=(6.5, 6.5))
    ax_main.imshow(cells, aspect="auto", interpolation="nearest")
    style_main_axes(
        ax_main, n_rows, n_cols,
        x_labels=[lens_display[l] for l in lens_order],
        y_labels=[label for _fid, label, _lens in FACETS],
    )
    # Horizontal label for the lens columns doesn't need rotation.
    ax_main.set_xticklabels([lens_display[l] for l in lens_order], rotation=0)

    # Horizontal separators between lens groups.
    for b in lens_group_boundaries():
        ax_main.axhline(y=b - 0.5, color="black", linewidth=1.8)

    ax_main.set_title(
        "Cross-lens visibility — which lens(es) reveal each facet",
        fontsize=13, pad=18, loc="left",
    )

    # Saturation legend: solid vs. faded, in a neutral lens (Logic) for demo.
    demo = LENS_COLORS["logic"]
    handles = [
        Patch(facecolor=full(demo), label="primary lens"),
        Patch(facecolor=blend_on_white(demo, 0.35),
              label="also visible through"),
    ]
    ax_main.legend(handles=handles, loc="upper left",
                   bbox_to_anchor=(1.02, 1.0), frameon=False,
                   title="Visibility", title_fontsize=10, fontsize=9)

    out = OUTPUT_DIR / "cross-lens-heatmap.png"
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return out


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    plt.rcParams["font.family"] = "DejaVu Sans"
    out1 = render_explanatory_heatmap()
    out2 = render_cross_lens_heatmap()
    print(f"wrote {out1}")
    print(f"wrote {out2}")


if __name__ == "__main__":
    main()
