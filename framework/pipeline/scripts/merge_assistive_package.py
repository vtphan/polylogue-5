#!/usr/bin/env python3
"""Merge four agent outputs into assistive_package.yaml.

Concatenates ground_truth, diagnostic, prose, and discussion into a single
file, computes deterministic derivations, and runs 13 mandatory integrity
checks. Exits nonzero if any mandatory check fails.

Usage:
    python3 merge_assistive_package.py <episode_dir> [--schema-version 0.2.0]

The script reads:
    <episode_dir>/ground_truth.yaml  (or ground_truth_generated.yaml)
    <episode_dir>/diagnostic.yaml    (or diagnostic_generated.yaml)
    <episode_dir>/prose.yaml         (or prose_generated.yaml)
    <episode_dir>/discussion.yaml    (or discussion_generated.yaml)

And writes:
    <episode_dir>/assistive_package.yaml

Source: framework/docs/artifacts-generation.md
"""

import os
import re
import sys
import argparse
import datetime
import yaml


def load_file(episode_dir, name, generated_name):
    """Load a YAML file, preferring the generated version if it exists."""
    gen_path = os.path.join(episode_dir, generated_name)
    gold_path = os.path.join(episode_dir, name)
    path = gen_path if os.path.exists(gen_path) else gold_path
    if not os.path.exists(path):
        print(f"ERROR: Neither {gen_path} nor {gold_path} found")
        sys.exit(1)
    with open(path) as f:
        return yaml.safe_load(f), path


def load_reference(ref_dir="framework/reference"):
    """Load canonical reference data."""
    refs = {}
    for name in ["facet_inventory", "lenses", "explanatory_variables", "wrestling_gates", "app_check_model"]:
        path = os.path.join(ref_dir, f"{name}.yaml")
        if os.path.exists(path):
            with open(path) as f:
                refs[name] = yaml.safe_load(f)
    return refs


def load_migration_rules(refs):
    app_check = refs.get("app_check_model", {}).get("app_check_model", {})
    return (app_check.get("migration_rules") or {}).get("front_door_use_when", {})


def migrate_use_when(value, migration_rules):
    if not value:
        return value
    return migration_rules.get(value, value)


def build_target_focus(passage):
    """Build deterministic wrong_focus comparison targets for a passage."""
    passage_id = passage.get("passage_id")
    target_turn_ids = []
    for facet in passage.get("facets_present", []):
        for tid in facet.get("evidence_turns", []):
            if tid not in target_turn_ids:
                target_turn_ids.append(tid)
    if not target_turn_ids:
        target_turn_ids = list(passage.get("turn_range", []))[:1]

    speaker_by_turn = {
        ann.get("turn_id"): ann.get("speaker")
        for ann in passage.get("turn_annotations", [])
        if ann.get("turn_id") and ann.get("speaker")
    }
    target_character_ids = []
    for tid in target_turn_ids:
        speaker = speaker_by_turn.get(tid)
        if speaker and speaker not in target_character_ids:
            target_character_ids.append(speaker)

    return {
        "passage_id": passage_id,
        "target_passage_id": passage_id,
        "target_turn_ids": target_turn_ids,
        "target_character_ids": target_character_ids,
        "turn_range": passage.get("turn_range", []),
        "lens_visibility": passage.get("lens_visibility", {}),
        "facets_present": passage.get("facets_present", []),
    }


def _normalize_attention_targets(prose, migration_rules):
    items = []
    for item in prose.get("attention_targets", []) or []:
        normalized = dict(item)
        normalized["use_when"] = migrate_use_when(item.get("use_when"), migration_rules)
        items.append(normalized)
    return items


def _normalize_sentence_frame_seeds(prose, migration_rules):
    items = []
    if prose.get("sentence_frame_seeds"):
        for item in prose.get("sentence_frame_seeds", []):
            normalized = dict(item)
            normalized["use_when"] = migrate_use_when(item.get("use_when"), migration_rules)
            items.append(normalized)
        return items

    for idx, item in enumerate(prose.get("entry_prompts", []) or [], start=1):
        items.append({
            "passage_id": item.get("passage_id"),
            "support_id": f"{item.get('passage_id')}_sf_{idx:02d}",
            "use_when": "low_articulation",
            "lens": item.get("lens"),
            "frame": item.get("stem", ""),
            "seed": "",
        })
    return items


def _normalize_modeled_examples(prose, migration_rules):
    items = []
    if prose.get("modeled_episode_examples"):
        for item in prose.get("modeled_episode_examples", []):
            normalized = dict(item)
            normalized["use_when"] = migrate_use_when(item.get("use_when"), migration_rules)
            items.append(normalized)
        return items

    for idx, item in enumerate(prose.get("explicit_scaffolds", []) or [], start=1):
        if item.get("type") != "modeled_episode_example":
            continue
        items.append({
            "passage_id": item.get("passage_id"),
            "support_id": f"{item.get('passage_id')}_me_{idx:02d}",
            "use_when": migrate_use_when(item.get("use_when"), migration_rules),
            "lens": item.get("lens"),
            "source_turns": item.get("source_turns", []),
            "model_text": item.get("model_text", ""),
            "why_this_counts": item.get("why_this_counts", ""),
            "handoff_prompt": item.get("transfer_prompt", ""),
        })
    return items


def _normalize_transfer_examples(prose, migration_rules):
    items = []
    if prose.get("transfer_examples"):
        for item in prose.get("transfer_examples", []):
            normalized = dict(item)
            normalized["use_when"] = migrate_use_when(item.get("use_when"), migration_rules)
            items.append(normalized)
        return items

    for idx, item in enumerate(prose.get("explicit_scaffolds", []) or [], start=1):
        if item.get("type") != "transfer_example":
            continue
        items.append({
            "passage_id": item.get("passage_id"),
            "support_id": f"{item.get('passage_id')}_te_{idx:02d}",
            "use_when": migrate_use_when(item.get("use_when"), migration_rules),
            "lens": item.get("lens"),
            "example_text": item.get("model_text", ""),
            "why_this_counts": item.get("why_this_counts", ""),
            "handoff_prompt": item.get("transfer_prompt", ""),
        })
    return items


def project_front_door_support(prose, migration_rules):
    return {
        "attention_targets": _normalize_attention_targets(prose, migration_rules),
        "sentence_frame_seeds": _normalize_sentence_frame_seeds(prose, migration_rules),
        "modeled_episode_examples": _normalize_modeled_examples(prose, migration_rules),
        "transfer_examples": _normalize_transfer_examples(prose, migration_rules),
    }


def _project_cue(cue, default_phase):
    projected = dict(cue)
    projected["phase"] = default_phase if cue.get("continuation_of") is None else "mid_discussion"
    projected["facet_focus"] = cue.get("angle")
    projected["lens_focus"] = cue.get("lens")
    explanatory_ref = cue.get("explanatory_ref")
    if explanatory_ref:
        projected["explanatory_focus"] = explanatory_ref
    return projected


def project_discussion_support(disc, prose):
    by_turn = {}
    for turn_id, cues in (disc.get("discussion_cues", {}) or {}).get("by_turn", {}).items():
        by_turn[turn_id] = [_project_cue(cue, "group_start") for cue in cues]
    episode_scope = [
        _project_cue(cue, "group_start")
        for cue in (disc.get("discussion_cues", {}) or {}).get("episode_scope", [])
    ]
    return {
        "discussion_cues": {
            "by_turn": by_turn,
            "episode_scope": episode_scope,
        },
        "talk_moves": disc.get("talk_moves", []),
        "consensus_checks": prose.get("consensus_check", []),
    }


def load_story_design(story_id):
    """Load story design doc frontmatter for calibration_warnings."""
    path = f"framework/stories/{story_id}.md"
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        content = f.read()
    # Extract YAML frontmatter
    if content.startswith("---"):
        end = content.index("---", 3)
        return yaml.safe_load(content[3:end]) or {}
    return {}


def extract_calibration_warnings(story_doc_path):
    """Extract verbatim teacher-facing calibration warning bullets from a story doc."""
    if not os.path.exists(story_doc_path):
        return []

    with open(story_doc_path) as f:
        lines = f.readlines()

    in_section = False
    bullets = []
    for raw_line in lines:
        stripped = raw_line.strip()
        if not in_section:
            if stripped == "### Calibration Warnings":
                in_section = True
            continue

        if stripped.startswith("#"):
            break
        if stripped.startswith("- ") or stripped.startswith("* "):
            bullets.append(stripped[2:].strip())

    return bullets


# ──────────────────────────────────────────────
# Integrity checks (§2.6)
# ──────────────────────────────────────────────

class IntegrityChecker:
    def __init__(self, gt, diag, prose, disc, refs, story_fm):
        self.gt = gt
        self.diag = diag
        self.prose = prose
        self.disc = disc
        self.refs = refs
        self.story_fm = story_fm
        self.errors = []
        self.warnings = []
        self.facet_to_lens = self._build_facet_to_lens()

    def run_all(self):
        self.check_01_role_matching()
        self.check_02_probe_routing()
        self.check_03_explanation_probe_gating()
        self.check_04_monotonic_reveals()
        self.check_05_cell_field_completeness()
        self.check_06_wrestling_gates_vocab()
        self.check_07_turn_reference_validation()
        self.check_08_assumes_familiar_resolution()
        self.check_09_counterfactual_citations()
        self.check_10_cue_cover_rule()
        self.check_11_intervention_cue_rule()
        self.check_12_discussion_cue_minimum()
        self.check_13_literal_scan()
        self.check_14_episode_opening_presence()
        return len(self.errors) == 0

    def _get_valid_turns(self):
        """Get all valid turn IDs from ground truth passages."""
        turns = set()
        for p in self.gt.get("passages", []):
            for t in p.get("turn_range", []):
                turns.add(t)
        return turns

    def _get_analyst_facets_for_turn(self, turn_id):
        """Get facets the analyst signaled on a specific turn."""
        facets = {}
        for p in self.gt.get("passages", []):
            for ann in p.get("turn_annotations", []):
                if ann.get("turn_id") == turn_id:
                    for sig in ann.get("facet_signals", []):
                        facets[sig["facet_ref"]] = "present"
            # Also check facets_absent_but_tempting
            for fat in p.get("facets_absent_but_tempting", []):
                facets.setdefault(fat["facet_ref"], "tempting_absent")
        return facets

    def _build_facet_to_lens(self):
        """Map facet ids to their primary lens from reference data."""
        facet_inventory = self.refs.get("facet_inventory", {})
        return {
            facet["id"]: facet.get("primary_lens")
            for facet in facet_inventory.get("facets", [])
            if facet.get("id")
        }

    def _get_passage_for_turn(self, turn_id):
        """Return the ground-truth passage containing turn_id, else None."""
        for passage in self.gt.get("passages", []):
            if turn_id in set(passage.get("turn_range", [])):
                return passage
        return None

    def _iter_all_cues(self):
        """Yield discussion cues with their anchoring context."""
        discussion_cues = self.disc.get("discussion_cues", {})
        for tid, cues in discussion_cues.get("by_turn", {}).items():
            for cue in cues:
                yield {
                    "anchor_turn": tid,
                    "cue": cue,
                }
        for cue in discussion_cues.get("episode_scope", []):
            cont = cue.get("continuation_of") or {}
            yield {
                "anchor_turn": cont.get("turn"),
                "cue": cue,
            }

    def check_01_role_matching(self):
        """Every intervention cell's role matches one of the three source lists."""
        by_turn = self.diag.get("interventions", {}).get("by_turn", {})
        for tid, turn_data in by_turn.items():
            passage = self._get_passage_for_turn(tid)
            analyst_facets = self._get_analyst_facets_for_turn(tid)
            affordable_lenses = set()
            if passage:
                for lens_name, lens_data in (passage.get("lens_visibility") or {}).items():
                    if lens_data.get("affordance") in ("moderate", "rich"):
                        affordable_lenses.add(lens_name)
            for fref, cell in turn_data.get("by_facet", {}).items():
                role = cell.get("role")
                if role not in ("present", "afforded_missing", "tempting_absent"):
                    self.errors.append(
                        f"Check 1: {tid}/{fref} has invalid role '{role}'"
                    )
                    continue
                expected_role = analyst_facets.get(fref)
                if role in ("present", "tempting_absent"):
                    if expected_role != role:
                        self.errors.append(
                            f"Check 1: {tid}/{fref} labeled '{role}' but source lists resolve "
                            f"to {expected_role or 'no matching source role'}"
                        )
                elif role == "afforded_missing":
                    facet_lens = self.facet_to_lens.get(fref)
                    if facet_lens not in affordable_lenses:
                        self.errors.append(
                            f"Check 1: {tid}/{fref} labeled 'afforded_missing' but its lens "
                            f"'{facet_lens}' is not affordance-moderate/rich for that passage"
                        )
                    elif expected_role in ("present", "tempting_absent"):
                        self.errors.append(
                            f"Check 1: {tid}/{fref} labeled 'afforded_missing' but source lists "
                            f"already classify it as '{expected_role}'"
                        )

    def check_02_probe_routing(self):
        """Every probe option routes_to resolves to an existing intervention cell."""
        by_turn_probes = self.diag.get("probes", {}).get("facet", {}).get("by_turn", {})
        by_turn_interv = self.diag.get("interventions", {}).get("by_turn", {})
        for tid, probe in by_turn_probes.items():
            for opt in probe.get("options", []):
                rt = opt.get("routes_to", {})
                if rt.get("blank_page"):
                    # Check blank_page exists
                    if tid not in by_turn_interv or "blank_page" not in by_turn_interv.get(tid, {}):
                        self.errors.append(
                            f"Check 2: {tid} probe routes to blank_page but no blank_page cell exists"
                        )
                elif "facet" in rt:
                    facet = rt["facet"]
                    if tid not in by_turn_interv:
                        self.errors.append(
                            f"Check 2: {tid} probe routes to {facet} but no interventions for {tid}"
                        )
                    elif facet not in by_turn_interv[tid].get("by_facet", {}):
                        self.errors.append(
                            f"Check 2: {tid} probe routes to {facet} but no intervention cell at {tid}/{facet}"
                        )

    def check_03_explanation_probe_gating(self):
        """Explanation probe exists iff has_explanation_depth: true."""
        by_turn_facet = self.diag.get("probes", {}).get("explanation", {}).get("by_turn_facet", {})
        by_turn_interv = self.diag.get("interventions", {}).get("by_turn", {})
        # Check: every explanation probe has a matching cell with has_explanation_depth: true
        for composite, probe in by_turn_facet.items():
            parts = composite.split(".", 1)
            if len(parts) != 2:
                self.errors.append(f"Check 3: malformed explanation probe key '{composite}'")
                continue
            tid, fref = parts
            cell = by_turn_interv.get(tid, {}).get("by_facet", {}).get(fref, {})
            if not cell.get("has_explanation_depth"):
                self.errors.append(
                    f"Check 3: explanation probe {composite} exists but cell has_explanation_depth is not true"
                )
        # Check: every cell with has_explanation_depth: true has an explanation probe
        for tid, turn_data in by_turn_interv.items():
            for fref, cell in turn_data.get("by_facet", {}).items():
                if cell.get("has_explanation_depth"):
                    composite = f"{tid}.{fref}"
                    if composite not in by_turn_facet:
                        self.errors.append(
                            f"Check 3: {composite} has has_explanation_depth: true but no explanation probe"
                        )

    def check_04_monotonic_reveals(self):
        """Every ladder is monotonic in reveals."""
        by_turn = self.diag.get("interventions", {}).get("by_turn", {})
        for tid, turn_data in by_turn.items():
            # Check blank_page ladder
            bp = turn_data.get("blank_page", {})
            self._check_ladder_monotonic(bp.get("ladder", []), f"{tid}/blank_page")
            # Check by_facet ladders
            for fref, cell in turn_data.get("by_facet", {}).items():
                self._check_ladder_monotonic(cell.get("ladder", []), f"{tid}/{fref}")
                # Check explanation sub-ladders
                expl = cell.get("explanation", {})
                if isinstance(expl, dict):
                    bev = expl.get("by_explanatory_variable", {})
                    if isinstance(bev, dict):
                        for ev_key, ev_data in bev.items():
                            if isinstance(ev_data, dict):
                                self._check_ladder_monotonic(
                                    ev_data.get("ladder", []),
                                    f"{tid}/{fref}/explanation/{ev_key}"
                                )

    def _check_ladder_monotonic(self, ladder, path):
        if not isinstance(ladder, list) or len(ladder) == 0:
            return
        prev = 0
        for i, rung in enumerate(ladder):
            reveals = rung.get("reveals")
            if not isinstance(reveals, (int, float)):
                self.errors.append(f"Check 4: {path}[{i}] reveals is not numeric: {reveals}")
                continue
            if reveals < prev:
                self.errors.append(
                    f"Check 4: {path}[{i}] reveals={reveals} < previous={prev} (not monotonic)"
                )
            prev = reveals

    def check_05_cell_field_completeness(self):
        """Every intervention cell has role, opening, non-empty ladder, has_explanation_depth."""
        by_turn = self.diag.get("interventions", {}).get("by_turn", {})
        for tid, turn_data in by_turn.items():
            for fref, cell in turn_data.get("by_facet", {}).items():
                for field in ["role", "opening", "ladder", "has_explanation_depth"]:
                    if field not in cell:
                        self.errors.append(f"Check 5: {tid}/{fref} missing field '{field}'")
                    elif field == "ladder" and not cell.get("ladder"):
                        self.errors.append(f"Check 5: {tid}/{fref} ladder is empty")

    def check_06_wrestling_gates_vocab(self):
        """Every minimum_wrestling entry is in wrestling_gates.yaml."""
        wg = self.refs.get("wrestling_gates", {})
        valid_ids = {g["id"] for g in wg.get("wrestling_gates", [])}
        sc = self.diag.get("struggle_calibration", {}).get("by_passage", {})
        for pid, passage_cal in sc.items():
            for entry in passage_cal.get("minimum_wrestling", []):
                if entry not in valid_ids:
                    self.errors.append(
                        f"Check 6: {pid} minimum_wrestling entry '{entry}' not in wrestling_gates.yaml"
                    )

    def check_07_turn_reference_validation(self):
        """Every turn reference in any block is a valid turn in the transcript."""
        valid_turns = self._get_valid_turns()
        # Check ground truth turn annotations
        for p in self.gt.get("passages", []):
            for ann in p.get("turn_annotations", []):
                tid = ann.get("turn_id")
                if tid and tid not in valid_turns:
                    self.errors.append(f"Check 7: turn_annotation references invalid turn '{tid}'")
            # Check evidence_turns in facets_present
            for fp in p.get("facets_present", []):
                for et in fp.get("evidence_turns", []):
                    if et not in valid_turns:
                        self.errors.append(
                            f"Check 7: facets_present/{fp.get('facet_ref')} references invalid turn '{et}'"
                        )
        # Check diagnostic probe turns
        by_turn_probes = self.diag.get("probes", {}).get("facet", {}).get("by_turn", {})
        for tid in by_turn_probes:
            if tid not in valid_turns:
                self.errors.append(f"Check 7: probe references invalid turn '{tid}'")

    def check_08_assumes_familiar_resolution(self):
        """Every assumes_familiar_with reference resolves to a known ID."""
        fi = self.refs.get("facet_inventory", {})
        ev = self.refs.get("explanatory_variables", {})
        valid_ids = set()
        for f in fi.get("facets", []):
            valid_ids.add(f.get("id", ""))
        for p in ev.get("cognitive_patterns", []):
            valid_ids.add(p.get("id", ""))
        for d in ev.get("social_dynamics", []):
            valid_ids.add(d.get("id", ""))
        for entry in self.diag.get("assumes_familiar_with", []):
            if entry not in valid_ids:
                self.errors.append(
                    f"Check 8: assumes_familiar_with entry '{entry}' not a valid facet/pattern/dynamic ID"
                )

    def check_09_counterfactual_citations(self):
        """Every counterfactuals entry cites at least one evidence_turn inside the passage's turn_range."""
        for p in self.gt.get("passages", []):
            turn_range = set(p.get("turn_range", []))
            for cf in p.get("counterfactuals", []):
                et = cf.get("evidence_turn")
                if et and et not in turn_range:
                    self.errors.append(
                        f"Check 9: counterfactual for {cf.get('facet_ref')} cites turn '{et}' "
                        f"outside passage turn_range"
                    )

    def check_10_cue_cover_rule(self):
        """Per-passage: for every lens with affordance >= moderate, at least one
        discussion_cues entry with continuation_of: null whose lens matches."""
        for p in self.gt.get("passages", []):
            turn_range = set(p.get("turn_range", []))
            lv = p.get("lens_visibility", {})
            for lens_name, lens_data in lv.items():
                aff = lens_data.get("affordance", "none")
                if aff in ("moderate", "rich"):
                    # Check for a null-continuation cue with this lens
                    found = False
                    by_turn = self.disc.get("discussion_cues", {}).get("by_turn", {})
                    for tid, cues in by_turn.items():
                        if tid not in turn_range:
                            continue
                        for cue in cues:
                            if cue.get("continuation_of") is None and cue.get("lens") == lens_name:
                                found = True
                                break
                        if found:
                            break
                    if not found:
                        self.errors.append(
                            f"Check 10: passage {p.get('passage_id')} lens '{lens_name}' has "
                            f"affordance '{aff}' but no in-passage continuation_of: null cue "
                            f"with that lens (empty-history guarantee)"
                        )

    def check_11_intervention_cue_rule(self):
        """For every (turn, facet) intervention cell with role present or afforded_missing,
        there is at least one discussion cue whose angle equals that facet."""
        by_turn_interv = self.diag.get("interventions", {}).get("by_turn", {})
        for tid, turn_data in by_turn_interv.items():
            for fref, cell in turn_data.get("by_facet", {}).items():
                role = cell.get("role")
                if role in ("present", "afforded_missing"):
                    found = False
                    for entry in self._iter_all_cues():
                        cue = entry["cue"]
                        cont = cue.get("continuation_of") or {}
                        anchor_turn = entry["anchor_turn"]
                        if cue.get("angle") != fref:
                            continue
                        if anchor_turn == tid:
                            found = True
                            break
                        if cont.get("turn") == tid and cont.get("facet") == fref:
                            found = True
                            break
                    if not found:
                        self.errors.append(
                            f"Check 11: intervention {tid}/{fref} (role={role}) has no matching "
                            f"discussion cue anchored to that turn/facet"
                        )

    def check_12_discussion_cue_minimum(self):
        """Discussion cue count per turn meets minimum (at least 1 per load-bearing turn)."""
        by_turn_cues = self.disc.get("discussion_cues", {}).get("by_turn", {})
        by_turn_interv = self.diag.get("interventions", {}).get("by_turn", {})
        for tid in by_turn_interv:
            if tid not in by_turn_cues or len(by_turn_cues[tid]) == 0:
                self.warnings.append(
                    f"Check 12: turn {tid} has interventions but no discussion cues"
                )

    def check_13_literal_scan(self):
        """No reserved framework IDs leak into student-facing text."""
        fi = self.refs.get("facet_inventory", {})
        ev = self.refs.get("explanatory_variables", {})
        reserved = set()
        for f in fi.get("facets", []):
            reserved.add(f.get("id", ""))
        for p in ev.get("cognitive_patterns", []):
            reserved.add(p.get("id", ""))
        for d in ev.get("social_dynamics", []):
            reserved.add(d.get("id", ""))
        reserved.discard("")

        # Collect student-facing text
        student_texts = []
        # Prose
        student_texts.append(("prose.episode_opening", self.prose.get("episode_opening", "")))
        for ep in self.prose.get("entry_prompts", []):
            student_texts.append(("prose.entry_prompt", ep.get("stem", "")))
        for item in self.prose.get("attention_targets", []):
            student_texts.append(("prose.attention_target", item.get("text", "")))
        for item in self.prose.get("sentence_frame_seeds", []):
            student_texts.append(("prose.sentence_frame_seed.frame", item.get("frame", "")))
            student_texts.append(("prose.sentence_frame_seed.seed", item.get("seed", "")))
        for item in self.prose.get("modeled_episode_examples", []):
            student_texts.append(("prose.modeled_episode_example.model_text", item.get("model_text", "")))
            student_texts.append(("prose.modeled_episode_example.why_this_counts", item.get("why_this_counts", "")))
            student_texts.append(("prose.modeled_episode_example.handoff_prompt", item.get("handoff_prompt", "")))
        for item in self.prose.get("transfer_examples", []):
            student_texts.append(("prose.transfer_example.example_text", item.get("example_text", "")))
            student_texts.append(("prose.transfer_example.why_this_counts", item.get("why_this_counts", "")))
            student_texts.append(("prose.transfer_example.handoff_prompt", item.get("handoff_prompt", "")))
        for cc in self.prose.get("consensus_check", []):
            student_texts.append(("prose.consensus_check", cc))
        # Discussion cue text
        for tid, cues in self.disc.get("discussion_cues", {}).get("by_turn", {}).items():
            for cue in cues:
                student_texts.append((f"discussion.{cue.get('id')}", cue.get("text", "")))
        for cue in self.disc.get("discussion_cues", {}).get("episode_scope", []):
            student_texts.append((f"discussion.{cue.get('id')}", cue.get("text", "")))
        # Talk moves
        for i, tm in enumerate(self.disc.get("talk_moves", [])):
            student_texts.append((f"discussion.talk_move_{i}", tm))
        # Probe text and intervention text
        for tid, probe in self.diag.get("probes", {}).get("facet", {}).get("by_turn", {}).items():
            student_texts.append((f"probe.{tid}.question", probe.get("question", "")))
            for opt in probe.get("options", []):
                student_texts.append((f"probe.{tid}.option", opt.get("text", "")))
        # Intervention opening and ladder text
        for tid, td in self.diag.get("interventions", {}).get("by_turn", {}).items():
            bp = td.get("blank_page", {})
            student_texts.append((f"interv.{tid}.blank_page.opening", bp.get("opening", "")))
            for rung in bp.get("ladder", []):
                student_texts.append((f"interv.{tid}.blank_page.rung", rung.get("text", "")))
            for fref, cell in td.get("by_facet", {}).items():
                student_texts.append((f"interv.{tid}.{fref}.opening", cell.get("opening", "")))
                for rung in cell.get("ladder", []):
                    student_texts.append((f"interv.{tid}.{fref}.rung", rung.get("text", "")))

        # Only flag multi-word snake_case IDs (source_credibility, etc.)
        # and pattern/dynamic IDs. Single common English words like
        # "relevance" or "sufficiency" are not actionable leaks.
        snake_case_reserved = {t for t in reserved if "_" in t}
        for location, text in student_texts:
            if not isinstance(text, str):
                continue
            for term in snake_case_reserved:
                if re.search(r"\b" + re.escape(term) + r"\b", text):
                    self.errors.append(
                        f"Check 13: reserved term '{term}' found in student-facing text at {location}"
                    )

    def check_14_episode_opening_presence(self):
        """episode_opening exists and has no reserved framework terms."""
        opening = self.prose.get("episode_opening")
        if not opening or not isinstance(opening, str) or not opening.strip():
            self.errors.append("Check 14: episode_opening is missing or empty")


# ──────────────────────────────────────────────
# Deterministic derivations (§2.6)
# ──────────────────────────────────────────────

def derive_prior_exposure(gt, story_id, episode_number, artifacts_dir):
    """Derive prior_exposure from prior episodes' ground truth files."""
    exposure = []
    if episode_number <= 1:
        return exposure
    for ep_num in range(1, episode_number):
        ep_dir = os.path.join(artifacts_dir, f"episode_{ep_num:02d}")
        gt_path = os.path.join(ep_dir, "ground_truth.yaml")
        gen_path = os.path.join(ep_dir, "ground_truth_generated.yaml")
        path = gen_path if os.path.exists(gen_path) else gt_path
        if not os.path.exists(path):
            continue
        with open(path) as f:
            prior_gt = yaml.safe_load(f)
        for p in prior_gt.get("passages", []):
            for fp in p.get("facets_present", []):
                ref = fp.get("facet_ref")
                if ref and not any(e["ref"] == ref for e in exposure):
                    exposure.append({"ref": ref, "first_seen": f"episode_{ep_num:02d}"})
            cl = p.get("causal_layer", {})
            for fe in cl.get("facets_explained", []):
                for c in fe.get("cognitive", []):
                    ref = c.get("pattern_ref")
                    if ref and not any(e["ref"] == ref for e in exposure):
                        exposure.append({"ref": ref, "first_seen": f"episode_{ep_num:02d}"})
                for s in fe.get("social", []):
                    ref = s.get("dynamic_ref")
                    if ref and not any(e["ref"] == ref for e in exposure):
                        exposure.append({"ref": ref, "first_seen": f"episode_{ep_num:02d}"})
    return exposure


def derive_calibration_warnings(story_fm, story_doc_path):
    """Lift calibration warnings from story design doc if declared."""
    if not story_fm.get("declares_calibration_warnings"):
        return None
    warnings = extract_calibration_warnings(story_doc_path)
    if not warnings:
        raise SystemExit(
            "story declares calibration warnings but the ### Calibration Warnings "
            "section is empty or missing"
        )
    return warnings


def main():
    parser = argparse.ArgumentParser(description="Merge agent outputs into assistive_package.yaml")
    parser.add_argument("episode_dir", help="Path to episode artifact directory")
    parser.add_argument("--schema-version", default="0.2.0", help="Schema version string")
    args = parser.parse_args()

    episode_dir = args.episode_dir

    # Load the four agent outputs
    gt, gt_path = load_file(episode_dir, "ground_truth.yaml", "ground_truth_generated.yaml")
    diag, diag_path = load_file(episode_dir, "diagnostic.yaml", "diagnostic_generated.yaml")
    prose, prose_path = load_file(episode_dir, "prose.yaml", "prose_generated.yaml")
    disc, disc_path = load_file(episode_dir, "discussion.yaml", "discussion_generated.yaml")

    print(f"Merge: {episode_dir}")
    print(f"  ground_truth: {gt_path}")
    print(f"  diagnostic:   {diag_path}")
    print(f"  prose:         {prose_path}")
    print(f"  discussion:    {disc_path}")

    # Load references
    refs = load_reference()
    migration_rules = load_migration_rules(refs)
    story_id = gt.get("story_id", "")
    episode_number = gt.get("episode_number", 1)
    story_fm = load_story_design(story_id)

    # Run integrity checks
    checker = IntegrityChecker(gt, diag, prose, disc, refs, story_fm)
    passed = checker.run_all()
    checks_total = 14
    checks_passed = checks_total - len(checker.errors)

    print(f"\n  Integrity checks: {checks_passed}/{checks_total} passed")
    if checker.warnings:
        for w in checker.warnings:
            print(f"  WARNING: {w}")
    if checker.errors:
        for e in checker.errors:
            print(f"  ERROR: {e}")
        print(f"\n  FAIL: {len(checker.errors)} integrity check(s) failed")
        sys.exit(1)

    # Compute derivations
    artifacts_base = os.path.dirname(episode_dir)
    prior_exposure = derive_prior_exposure(gt, story_id, episode_number, artifacts_base)
    story_doc_path = os.path.join("framework", "stories", f"{story_id}.md")
    calibration_warnings = derive_calibration_warnings(story_fm, story_doc_path)
    front_door_support = project_front_door_support(prose, migration_rules)
    discussion_support = project_discussion_support(disc, prose)
    analytic_passages = [build_target_focus(p) for p in gt.get("passages", [])]

    if not any(front_door_support.values()):
        print("\n  FAIL: no front-door support could be projected from prose output")
        sys.exit(1)

    # Build the runtime-first package
    package = {
        "package_meta": {
            "story_id": story_id,
            "episode_number": episode_number,
            "scenario_id": gt.get("scenario_id"),
            "schema_version": args.schema_version,
            "integrity": {
                "checks_passed": checks_passed,
                "checks_total": checks_total,
                "timestamp": datetime.datetime.now().isoformat(),
            },
        },
        "analytic_core": {
            "passages": analytic_passages,
            "prior_exposure": prior_exposure,
        },
        "front_door_support": front_door_support,
        "diagnostic_support": {
            "probes": diag.get("probes"),
            "interventions": diag.get("interventions"),
            "struggle_calibration": diag.get("struggle_calibration"),
        },
        "discussion_support": discussion_support,
        "teacher_support": {
            "calibration_warnings": calibration_warnings or [],
        },
    }

    # Write
    out_path = os.path.join(episode_dir, "assistive_package.yaml")
    with open(out_path, "w") as f:
        f.write("# Assistive Package — merged view\n")
        f.write(f"# Generated by merge_assistive_package.py at {datetime.datetime.now().isoformat()}\n\n")
        yaml.dump(package, f, default_flow_style=False, allow_unicode=True, width=100, sort_keys=False)

    print(f"\n  PASS: assistive_package.yaml written to {out_path}")


if __name__ == "__main__":
    main()
