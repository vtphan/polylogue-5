#!/usr/bin/env python3
"""Validate a Polylogue story (a design doc plus a directory of per-episode
drafts) against the cross-episode coverage rules from
framework/docs/story-pipeline-revision.md Part 3, as updated by the
Part 13 episodes-first revision.

Inputs (the new model — see Part 13):
  - framework/docs/stories/{story_id}.md — the story design doc.
    Markdown with YAML frontmatter at the top:
      ---
      story_id: ...
      title: ...
      coverage_mode: full | focused
      declared_facets: [...]
      declared_cognitive_patterns: [...]
      declared_social_dynamics: [...]
      episode_count: N
      ---
      (rest of the file is prose: premise, setting, cast, arc, stakes)
  - framework/docs/stories/{story_id}/episode_{NN}.md — one per episode.
    Markdown with YAML frontmatter (the operator's authoring artifact;
    Appendix B of the spec) plus a prose body.

Optionally, also checks artifacts/{story_id}/episodes/episode_NN/analysis.yaml
(the post-pipeline analyses from Phase 7) for the hedged-annotation rule. If
present, the rule is checked; if absent, that rule is skipped with a note.

Writes:
  - framework/docs/stories/{story_id}-validation-report.yaml — the audit
    sidecar. Neither the design doc nor any episode draft is mutated.

Checks:
  1. Coverage_mode floor
       - full: declared lists must include all 10 facets, all 8 cognitive
         patterns, all 3 social dynamics.
       - focused: >=3 facets, >=1 cognitive pattern, >=1 social dynamic.
  2. Per-draft schema sanity (light): every episode draft has the
     required frontmatter fields, episode_number is unique and in
     [1, episode_count], lead_characters has 2-5 names, primary_lens is
     valid, mixed_valence_shape is valid.
  3. Lens distribution: every lens (logic, evidence, scope) appears as
     primary_lens in >=1 episode AND no lens appears in more than half
     the episodes (rounded down).
  4. Mixed_valence_shape rotation: no single shape in more than half the
     episodes.
  5. Strength rotation: no character carries more than half the story's
     strengths.
  6. Weakness rotation: no character carries more than half the story's
     weaknesses (counted across episode draft targets[].carrier).
  7. Coverage closure (computed as union across all episode draft frontmatter):
       - Every declared facet has at least one weakness episode and at
         least one strength episode.
       - Every declared cognitive pattern is carried in >=1 episode.
       - Every declared social dynamic is carried in >=1 episode.
       For full mode, "declared" means the full reference inventory.
  8. Hedged-annotation rule (only if analysis.yaml files exist under
     artifacts/{story_id}/episodes/episode_NN/):
       - Every declared cognitive_pattern has >=1 unhedged annotation
         (string-typed, not list-typed) across the story.
       - Every declared social_dynamic has >=1 unhedged annotation.

The cast-tendency consistency check from the previous model is GONE.
Under the episodes-first model there is no separately-authored cast for
an episode to be inconsistent with; character consistency is a prose-on-
prose review job for story_consistency_reviewer (Part 13.7).

Exit code: 0 if all checks pass, 1 otherwise. Sidecar is always written.

Usage:
    python3 framework/pipeline/scripts/validate_story.py \\
        --story saving-the-maker-space \\
        [--stories-root framework/docs/stories] \\
        [--reference framework/reference] \\
        [--artifacts-root artifacts]
"""

import argparse
import glob
import os
import re
import sys

import yaml

LENSES = ["logic", "evidence", "scope"]
VALID_SHAPES = {
    "early_strength_collapse",
    "strength_prevails",
    "stalemate",
    "self_correction",
    "unresolved_disagreement",
}

FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?\n)---\s*(?:\n|$)", re.DOTALL)


def load_yaml(path):
    with open(path) as f:
        return yaml.safe_load(f)


def parse_frontmatter(path):
    """Read a Markdown file and return (frontmatter_dict, body_str).

    Returns (None, "") if no frontmatter is found.
    """
    with open(path) as f:
        text = f.read()
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    fm_text = m.group(1)
    body = text[m.end():]
    try:
        fm = yaml.safe_load(fm_text) or {}
    except yaml.YAMLError:
        return None, body
    if not isinstance(fm, dict):
        return None, body
    return fm, body


def load_reference(reference_dir):
    facets = load_yaml(os.path.join(reference_dir, "facet_inventory.yaml")) or {}
    expvars = load_yaml(os.path.join(reference_dir, "explanatory_variables.yaml")) or {}
    facet_ids = {f["id"] for f in (facets.get("facets") or [])}
    cog_ids = {p["id"] for p in (expvars.get("cognitive_patterns") or [])}
    soc_ids = {d["id"] for d in (expvars.get("social_dynamics") or [])}
    return facet_ids, cog_ids, soc_ids


def load_episode_analyses(story_id, artifacts_root):
    """Return a dict {episode_number: analysis_yaml_dict}, or {} if none."""
    out = {}
    pattern = os.path.join(
        artifacts_root, story_id, "episodes", "episode_*", "analysis.yaml"
    )
    for path in sorted(glob.glob(pattern)):
        ep_dir = os.path.basename(os.path.dirname(path))
        try:
            num = int(ep_dir.split("_")[-1])
        except ValueError:
            continue
        try:
            out[num] = load_yaml(path)
        except Exception:
            pass
    return out


def collect_unhedged_labels(analyses):
    """From analysis.yaml files, return (cog_unhedged, soc_unhedged) sets:
    cognitive_patterns and social_dynamics that have at least one
    *string-typed* (single-label, confident) annotation."""
    cog_unhedged = set()
    soc_unhedged = set()
    for analysis in analyses.values():
        if not analysis:
            continue
        for passage in (analysis.get("passage_analyses") or []):
            for ann in (passage.get("facet_annotations") or []):
                ev = ann.get("explanatory_variables") or {}
                cp = ev.get("cognitive_pattern")
                sd = ev.get("social_dynamic")
                if isinstance(cp, str) and cp:
                    cog_unhedged.add(cp)
                if isinstance(sd, str) and sd:
                    soc_unhedged.add(sd)
    return cog_unhedged, soc_unhedged


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--story", required=True,
                    help="story_id (kebab-case identifier matching the design doc filename)")
    ap.add_argument("--stories-root", default="framework/docs/stories",
                    help="Root directory of story design docs and per-episode drafts")
    ap.add_argument("--reference", default="framework/reference")
    ap.add_argument("--artifacts-root", default="artifacts",
                    help="Root directory of pipeline artifacts (used to find analysis.yaml files)")
    args = ap.parse_args()

    story_id = args.story
    design_doc_path = os.path.join(args.stories_root, f"{story_id}.md")
    drafts_dir = os.path.join(args.stories_root, story_id)

    if not os.path.exists(design_doc_path):
        print(f"ERROR: story design doc not found: {design_doc_path}", file=sys.stderr)
        return 2

    facet_ids, cog_ids, soc_ids = load_reference(args.reference)

    issues = []

    def fail(check, msg):
        issues.append({"check": check, "severity": "FAIL", "message": msg})

    # ---- Load story design doc frontmatter ----
    story_fm, _ = parse_frontmatter(design_doc_path)
    if story_fm is None:
        fail("design_doc_frontmatter",
             f"{design_doc_path}: missing or unparseable YAML frontmatter")
        story_fm = {}

    coverage_mode = story_fm.get("coverage_mode")
    declared_facets = set(story_fm.get("declared_facets") or [])
    declared_cog = set(story_fm.get("declared_cognitive_patterns") or [])
    declared_soc = set(story_fm.get("declared_social_dynamics") or [])
    declared_ep_count = story_fm.get("episode_count")

    # ---- Check 1: coverage_mode floor ----
    if coverage_mode == "full":
        if declared_facets != facet_ids:
            fail("coverage_mode_full",
                 f"full coverage requires all {len(facet_ids)} facets; "
                 f"missing: {sorted(facet_ids - declared_facets)}")
        if declared_cog != cog_ids:
            fail("coverage_mode_full",
                 f"full coverage requires all {len(cog_ids)} cognitive "
                 f"patterns; missing: {sorted(cog_ids - declared_cog)}")
        if declared_soc != soc_ids:
            fail("coverage_mode_full",
                 f"full coverage requires all {len(soc_ids)} social "
                 f"dynamics; missing: {sorted(soc_ids - declared_soc)}")
    elif coverage_mode == "focused":
        if len(declared_facets) < 3:
            fail("coverage_mode_focused",
                 f"focused coverage requires >=3 facets, got {len(declared_facets)}")
        if len(declared_cog) < 1:
            fail("coverage_mode_focused",
                 "focused coverage requires >=1 cognitive pattern")
        if len(declared_soc) < 1:
            fail("coverage_mode_focused",
                 "focused coverage requires >=1 social dynamic")
    else:
        fail("coverage_mode",
             f"coverage_mode must be 'full' or 'focused', got {coverage_mode!r}")

    for fid in declared_facets - facet_ids:
        fail("unknown_facet", f"declared_facets contains unknown facet_id: {fid}")
    for cid in declared_cog - cog_ids:
        fail("unknown_pattern", f"declared_cognitive_patterns contains unknown id: {cid}")
    for sid in declared_soc - soc_ids:
        fail("unknown_dynamic", f"declared_social_dynamics contains unknown id: {sid}")

    # ---- Load per-episode drafts ----
    drafts = []  # list of (episode_number, frontmatter_dict, draft_path)
    if os.path.isdir(drafts_dir):
        for path in sorted(glob.glob(os.path.join(drafts_dir, "episode_*.md"))):
            fm, _ = parse_frontmatter(path)
            if fm is None:
                fail("draft_frontmatter",
                     f"{path}: missing or unparseable YAML frontmatter")
                continue
            ep = fm.get("episode_number")
            if not isinstance(ep, int):
                fail("draft_episode_number",
                     f"{path}: episode_number must be an integer, got {ep!r}")
                continue
            drafts.append((ep, fm, path))
    else:
        fail("drafts_dir_missing",
             f"per-episode drafts directory not found: {drafts_dir}")

    drafts.sort(key=lambda t: t[0])
    n_episodes = len(drafts)
    half = n_episodes // 2

    # ---- Check 2: per-draft schema sanity + episode_number coverage ----
    seen_eps = set()
    for ep, fm, path in drafts:
        if ep in seen_eps:
            fail("draft_duplicate_episode",
                 f"{path}: duplicate episode_number {ep}")
        seen_eps.add(ep)
        if declared_ep_count and not (1 <= ep <= declared_ep_count):
            fail("draft_episode_oob",
                 f"{path}: episode_number {ep} outside [1, {declared_ep_count}]")
        leads = fm.get("lead_characters") or []
        if not (2 <= len(leads) <= 5):
            fail("draft_lead_count",
                 f"episode {ep}: lead_characters must have 2-5 names, got {len(leads)}")
        # Carrier-in-leads rule: every strength and weakness carrier must be
        # a lead character in the same episode. Otherwise the carrier has no
        # speaker slot in the transcript and the designed beat cannot land.
        leads_set = set(leads)
        for ts in (fm.get("strengths") or []):
            c = ts.get("carrier")
            if c and c not in leads_set:
                fail("strength_carrier_not_lead",
                     f"episode {ep}: strengths[].carrier '{c}' is not in "
                     f"lead_characters {leads}; a designed carrier must be "
                     f"able to speak in the episode")
        for tf in (fm.get("targets") or []):
            c = tf.get("carrier")
            if c and c not in leads_set:
                fail("weakness_carrier_not_lead",
                     f"episode {ep}: targets[].carrier '{c}' is not in "
                     f"lead_characters {leads}; a designed carrier must be "
                     f"able to speak in the episode")
        pl = fm.get("primary_lens")
        if pl not in LENSES:
            fail("draft_primary_lens",
                 f"episode {ep}: primary_lens must be one of {LENSES}, got {pl!r}")
        sh = fm.get("mixed_valence_shape")
        if sh not in VALID_SHAPES:
            fail("draft_shape",
                 f"episode {ep}: mixed_valence_shape must be one of {sorted(VALID_SHAPES)}, got {sh!r}")

    if declared_ep_count and n_episodes != declared_ep_count:
        # Not necessarily a fatal error mid-Phase-6 (operator may not have
        # written all drafts yet), but flag it.
        fail("draft_count_mismatch",
             f"episode_count is {declared_ep_count} but found {n_episodes} draft(s)")

    # ---- Check 3: lens distribution ----
    lens_counts = {l: 0 for l in LENSES}
    for ep, fm, _ in drafts:
        pl = fm.get("primary_lens")
        if pl in lens_counts:
            lens_counts[pl] += 1
    if n_episodes >= 1:
        for lens, count in lens_counts.items():
            if count == 0:
                fail("lens_starved",
                     f"lens '{lens}' is never primary; the perspectival learning "
                     f"model requires every lens to lead at least one episode")
            if count > half:
                fail("lens_dominant",
                     f"lens '{lens}' is primary in {count}/{n_episodes} episodes "
                     f"(more than half); rebalance the arc")

    # ---- Check 4: shape rotation ----
    shape_counts = {}
    for ep, fm, _ in drafts:
        s = fm.get("mixed_valence_shape")
        if s:
            shape_counts[s] = shape_counts.get(s, 0) + 1
    for shape, count in shape_counts.items():
        if count > half:
            fail("shape_dominant",
                 f"mixed_valence_shape '{shape}' appears in {count}/{n_episodes} "
                 f"episodes (more than half); vary the shape across the arc")

    # ---- Check 5, 6: strength + weakness rotation ----
    strengths_per_char = {}
    weaknesses_per_char = {}
    for ep, fm, path in drafts:
        for ts in (fm.get("strengths") or []):
            c = ts.get("carrier")
            if c:
                strengths_per_char[c] = strengths_per_char.get(c, 0) + 1
        for tf in (fm.get("targets") or []):
            c = tf.get("carrier")
            if c:
                weaknesses_per_char[c] = weaknesses_per_char.get(c, 0) + 1
    total_strengths = sum(strengths_per_char.values())
    total_weaknesses = sum(weaknesses_per_char.values())
    s_half = total_strengths // 2
    w_half = total_weaknesses // 2
    for c, n in strengths_per_char.items():
        if n > s_half and total_strengths > 1:
            fail("strength_concentration",
                 f"character '{c}' carries {n}/{total_strengths} strengths "
                 f"(more than half); rotate strength carriers across episodes")
    for c, n in weaknesses_per_char.items():
        if n > w_half and total_weaknesses > 1:
            fail("weakness_concentration",
                 f"character '{c}' carries {n}/{total_weaknesses} weaknesses "
                 f"(more than half); rotate weakness carriers across episodes")

    # ---- Check 7: coverage closure ----
    facet_weakness_eps = {}
    facet_strength_eps = {}
    pattern_eps = {}
    dynamic_eps = {}
    for ep, fm, path in drafts:
        for tf in (fm.get("targets") or []):
            f_id = tf.get("facet")
            if f_id:
                facet_weakness_eps.setdefault(f_id, []).append(ep)
                if f_id not in facet_ids:
                    fail("unknown_facet_in_draft",
                         f"episode {ep} targets references unknown facet '{f_id}'")
            cp = tf.get("cognitive_pattern")
            if cp:
                pattern_eps.setdefault(cp, []).append(ep)
                if cp not in cog_ids:
                    fail("unknown_pattern_in_draft",
                         f"episode {ep} targets references unknown cognitive_pattern '{cp}'")
                if not (isinstance(tf.get("cognitive_signal"), str) and tf.get("cognitive_signal").strip()):
                    fail("draft_signal_missing",
                         f"episode {ep} target facet '{f_id}' has cognitive_pattern '{cp}' but no cognitive_signal")
            sd = tf.get("social_dynamic")
            if sd:
                dynamic_eps.setdefault(sd, []).append(ep)
                if sd not in soc_ids:
                    fail("unknown_dynamic_in_draft",
                         f"episode {ep} targets references unknown social_dynamic '{sd}'")
                if not (isinstance(tf.get("social_signal"), str) and tf.get("social_signal").strip()):
                    fail("draft_signal_missing",
                         f"episode {ep} target facet '{f_id}' has social_dynamic '{sd}' but no social_signal")
        for ts in (fm.get("strengths") or []):
            f_id = ts.get("facet")
            if f_id:
                facet_strength_eps.setdefault(f_id, []).append(ep)
                if f_id not in facet_ids:
                    fail("unknown_facet_in_draft",
                         f"episode {ep} strengths references unknown facet '{f_id}'")

    for f_id in declared_facets:
        if f_id not in facet_weakness_eps:
            fail("facet_no_weakness_episode",
                 f"declared facet '{f_id}' never appears as a weakness in any episode draft")
        if f_id not in facet_strength_eps:
            fail("facet_no_strength_episode",
                 f"declared facet '{f_id}' never appears as a strength in any episode draft")
    for p in declared_cog:
        if p not in pattern_eps:
            fail("pattern_uncovered",
                 f"declared cognitive_pattern '{p}' never appears in any episode draft")
    for d in declared_soc:
        if d not in dynamic_eps:
            fail("dynamic_uncovered",
                 f"declared social_dynamic '{d}' never appears in any episode draft")

    # ---- Check 8: hedged-annotation rule (only if analyses exist) ----
    analyses = load_episode_analyses(story_id, args.artifacts_root)
    hedged_check_ran = bool(analyses)
    if hedged_check_ran:
        cog_unhedged, soc_unhedged = collect_unhedged_labels(analyses)
        for p in declared_cog:
            if p not in cog_unhedged:
                fail("pattern_no_unhedged",
                     f"declared cognitive_pattern '{p}' has no unhedged "
                     f"(single-label) annotation in any episode's analysis.yaml; "
                     f"hedged annotations do not satisfy coverage")
        for d in declared_soc:
            if d not in soc_unhedged:
                fail("dynamic_no_unhedged",
                     f"declared social_dynamic '{d}' has no unhedged "
                     f"(single-label) annotation in any episode's analysis.yaml")

    # ---- Build the audit block ----
    audit = {
        "story_id": story_id,
        "coverage_mode": coverage_mode,
        "episode_count_declared": declared_ep_count,
        "episode_count_found": n_episodes,
        "facets": {
            f_id: {
                "weakness_episodes": sorted(facet_weakness_eps.get(f_id, [])),
                "strength_episodes": sorted(facet_strength_eps.get(f_id, [])),
            }
            for f_id in sorted(declared_facets)
        },
        "cognitive_patterns": {
            p: {"episodes": sorted(pattern_eps.get(p, []))}
            for p in sorted(declared_cog)
        },
        "social_dynamics": {
            d: {"episodes": sorted(dynamic_eps.get(d, []))}
            for d in sorted(declared_soc)
        },
        "lens_distribution": dict(lens_counts),
        "shape_distribution": shape_counts,
        "strengths_per_character": strengths_per_char,
        "weaknesses_per_character": weaknesses_per_char,
        "hedged_annotation_check_ran": hedged_check_ran,
    }

    report = {
        "story_id": story_id,
        "result": "PASS" if not any(i["severity"] == "FAIL" for i in issues) else "FAIL",
        "issues": issues,
        "audit": audit,
    }

    sidecar_path = os.path.join(args.stories_root, f"{story_id}-validation-report.yaml")
    with open(sidecar_path, "w") as f:
        yaml.safe_dump(report, f, sort_keys=False)

    # ---- Print report to stdout ----
    print("=" * 64)
    print(f"Story validation: {story_id}")
    print("=" * 64)
    print(f"Design doc:    {design_doc_path}")
    print(f"Drafts dir:    {drafts_dir}")
    print(f"Sidecar:       {sidecar_path}")
    print(f"Coverage mode: {coverage_mode}")
    print(f"Episodes:      {n_episodes} (declared: {declared_ep_count})")
    if not hedged_check_ran:
        print("Note: no analysis.yaml files found; hedged-annotation check skipped.")
    print()

    if not issues:
        print("Result: PASS — all coverage checks satisfied.")
        return 0

    fails = [i for i in issues if i["severity"] == "FAIL"]
    print(f"Result: FAIL ({len(fails)} fail)")
    print()
    for i in issues:
        print(f"  [{i['severity']}] {i['check']}: {i['message']}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
