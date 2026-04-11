#!/usr/bin/env python3
"""Validate a YAML artifact against its descriptive YAML schema.

Checks field presence (required/optional), types, enum constraints,
list length constraints, and regex patterns. Also runs four conditional
content rules from the story design and information barrier specs
(see framework/docs/story-design.md):

  1. episode.yaml: if target_facets[i].designed_explanation.cognitive_pattern
     is non-null, cognitive_signal is required and non-empty.
  2. episode.yaml: if target_facets[i].designed_explanation.social_dynamic
     is non-null, social_signal is required and non-empty.
  3. analysis.yaml: every facet_annotations[i] has a non-empty evidence_basis.
  4. episode_writer_input.yaml: literal scan for any reserved framework
     term (facet_id, lens name as classification, cognitive_pattern_id,
     social_dynamic_id). If any appears, fail the file. This is the
     structural enforcement of the information barrier at the file level
     (the runtime enforcement is fresh-context + tool-restriction on
     dialog_writer).

The conditional rules dispatch based on the schema filename. Adding a
new rule means adding a new dispatch entry, not editing the generic
type checker.

Usage:
    python3 validate_schema.py <artifact_path> <schema_path> [--mode strict|warn]

Modes:
    strict (default): exit 1 on any issue
    warn: log issues, exit 0

Example:
    python3 validate_schema.py \
        artifacts/{story_id}/episodes/episode_01/episode.yaml \
        framework/schemas/episode_plan.yaml
"""

import os
import re
import sys
import argparse
import yaml


def _load_reference_terms(reference_dir="framework/reference"):
    """Return (facet_ids, cog_pattern_ids, social_dynamic_ids) sets for
    use by the literal-scan rule. Returns empty sets if reference files
    are unavailable — better to skip the scan than crash."""
    facet_ids, cog_ids, soc_ids = set(), set(), set()
    try:
        with open(os.path.join(reference_dir, "facet_inventory.yaml")) as f:
            data = yaml.safe_load(f) or {}
            facet_ids = {f["id"] for f in (data.get("facets") or []) if f.get("id")}
    except (FileNotFoundError, KeyError):
        pass
    try:
        with open(os.path.join(reference_dir, "explanatory_variables.yaml")) as f:
            data = yaml.safe_load(f) or {}
            cog_ids = {p["id"] for p in (data.get("cognitive_patterns") or []) if p.get("id")}
            soc_ids = {d["id"] for d in (data.get("social_dynamics") or []) if d.get("id")}
    except (FileNotFoundError, KeyError):
        pass
    return facet_ids, cog_ids, soc_ids


_QUOTED_LIST_ITEM_RE = re.compile(r'^(\s*)-\s+"[^"]*"\s*\S')


def _find_quoted_list_item_lines(text):
    """Return [(0-indexed line number, raw line)] of likely-broken list items."""
    return [
        (i, ln)
        for i, ln in enumerate(text.splitlines())
        if _QUOTED_LIST_ITEM_RE.match(ln)
    ]


def _autofix_quoted_list_items(text):
    """Wrap offending list items in single quotes (doubling interior ').

    Returns (new_text, list of (1-indexed lineno, original, replacement)).
    Conservative: only rewrites lines matching _QUOTED_LIST_ITEM_RE.
    """
    lines = text.splitlines(keepends=True)
    fixes = []
    for idx, raw in enumerate(lines):
        stripped = raw.rstrip("\n")
        if not _QUOTED_LIST_ITEM_RE.match(stripped):
            continue
        m = re.match(r"^(\s*-\s+)(.*)$", stripped)
        if not m:
            continue
        prefix, body = m.group(1), m.group(2)
        body_escaped = body.replace("'", "''")
        new_line = f"{prefix}'{body_escaped}'\n" if raw.endswith("\n") else f"{prefix}'{body_escaped}'"
        lines[idx] = new_line
        fixes.append((idx + 1, stripped, new_line.rstrip("\n")))
    return "".join(lines), fixes


class SchemaValidator:
    def __init__(self, mode="strict"):
        self.mode = mode
        self.issues = []
        self.warnings = []

    def validate(self, artifact_path, schema_path):
        with open(artifact_path) as f:
            text = f.read()
        try:
            artifact = yaml.safe_load(text)
        except yaml.YAMLError as exc:
            schema_basename = os.path.basename(schema_path)
            # Never auto-fix the barrier-safe projection — security-sensitive.
            allow_autofix = schema_basename != "episode_writer_input.yaml"
            fixed_artifact = None
            applied = []
            if allow_autofix and _find_quoted_list_item_lines(text):
                new_text, applied = _autofix_quoted_list_items(text)
                if applied:
                    try:
                        fixed_artifact = yaml.safe_load(new_text)
                    except yaml.YAMLError:
                        fixed_artifact = None
                    if fixed_artifact is not None:
                        with open(artifact_path, "w") as f:
                            f.write(new_text)
            if fixed_artifact is None:
                print(f"Validating: {artifact_path}")
                print(f"  Schema: {schema_path}")
                print(f"  FAIL: YAML parse error")
                print(f"    {exc}")
                hits = _find_quoted_list_item_lines(text)
                if hits:
                    lineno, raw = hits[0]
                    print(
                        f"  HINT: line {lineno + 1} looks like a list item starting with a "
                        f"double-quoted phrase followed by unquoted text. Wrap the whole item "
                        f"in single quotes or use a `>-` block scalar."
                    )
                    print(f"    offending: {raw.strip()}")
                return False
            print(f"Validating: {artifact_path}")
            print(f"  AUTO-FIXED: rewrote {len(applied)} quoted-list-item line(s) to single-quoted form")
            for lineno, before, after in applied:
                print(f"    line {lineno}: {before.strip()}")
                print(f"             -> {after.strip()}")
            artifact = fixed_artifact
        with open(schema_path) as f:
            schema_doc = yaml.safe_load(f)

        root_def = schema_doc.get("schema", {}).get("root", {})
        self._validate_node(artifact, root_def, "root")

        # Conditional content rules dispatched by schema filename.
        schema_basename = os.path.basename(schema_path)
        if schema_basename == "episode_plan.yaml":
            self._check_episode_signal_rules(artifact)
        elif schema_basename == "analysis.yaml":
            self._check_analysis_evidence_basis(artifact)
        elif schema_basename == "episode_writer_input.yaml":
            self._check_projection_literal_scan(artifact_path)

        self._report(artifact_path, schema_path)
        if self.mode == "strict" and self.issues:
            return False
        return True

    # ---- Conditional rules from Part 4D and Part 5.5 ----

    def _check_episode_signal_rules(self, artifact):
        """Rules 1 and 2: cognitive_signal / social_signal required iff
        cognitive_pattern / social_dynamic is non-null."""
        if not isinstance(artifact, dict):
            return
        for i, tf in enumerate(artifact.get("target_facets") or []):
            de = (tf or {}).get("designed_explanation") or {}
            cp = de.get("cognitive_pattern")
            sd = de.get("social_dynamic")
            cs = de.get("cognitive_signal")
            ss = de.get("social_signal")
            path = f"target_facets[{i}].designed_explanation"
            if cp and not (isinstance(cs, str) and cs.strip()):
                self.issues.append(
                    f"{path}: cognitive_pattern '{cp}' set but cognitive_signal "
                    f"is missing or empty (Part 4D rule 1)"
                )
            if sd and not (isinstance(ss, str) and ss.strip()):
                self.issues.append(
                    f"{path}: social_dynamic '{sd}' set but social_signal "
                    f"is missing or empty (Part 4D rule 2)"
                )

    def _check_analysis_evidence_basis(self, artifact):
        """Rule 3: every facet_annotations entry has non-empty evidence_basis."""
        if not isinstance(artifact, dict):
            return
        for pi, passage in enumerate(artifact.get("passage_analyses") or []):
            for ai, ann in enumerate((passage or {}).get("facet_annotations") or []):
                eb = (ann or {}).get("evidence_basis")
                if not (isinstance(eb, str) and eb.strip()):
                    self.issues.append(
                        f"passage_analyses[{pi}].facet_annotations[{ai}]: "
                        f"evidence_basis is missing or empty (Part 4D rule 3)"
                    )

    def _check_projection_literal_scan(self, artifact_path):
        """Rule 4: scan episode_writer_input.yaml for any reserved framework
        term — facet_id, cognitive_pattern_id, social_dynamic_id, or a lens
        name used as classification. Lens names ('logic', 'evidence',
        'scope') appear in narrative English so freely that scanning for
        them as bare words produces too many false positives; instead, we
        scan only for the IDs (which use snake_case unique to framework
        vocabulary, e.g. 'confirmation_bias', 'source_credibility') and
        for the lens names appearing as YAML values (lens_disposition:
        logic, primary_lens: scope, etc.) — those are the leakage shapes
        that matter."""
        facet_ids, cog_ids, soc_ids = _load_reference_terms()
        reserved = facet_ids | cog_ids | soc_ids
        if not reserved:
            self.warnings.append(
                "projection literal-scan skipped: no reference terms loaded"
            )
            return
        try:
            with open(artifact_path) as f:
                raw = f.read()
        except OSError as e:
            self.issues.append(f"projection literal-scan: cannot read file: {e}")
            return
        # Word-boundary scan for each reserved ID.
        for term in sorted(reserved):
            if re.search(r"\b" + re.escape(term) + r"\b", raw):
                self.issues.append(
                    f"projection literal-scan: reserved framework term "
                    f"'{term}' appears in episode_writer_input.yaml — the "
                    f"information barrier requires this file to contain no "
                    f"facet, cognitive_pattern, or social_dynamic IDs "
                    f"(Part 5.5)"
                )
        # Lens names as YAML values (e.g. "lens_disposition: logic").
        for lens in ("logic", "evidence", "scope"):
            if re.search(rf":\s*{lens}\b", raw):
                self.issues.append(
                    f"projection literal-scan: lens name '{lens}' appears as "
                    f"a YAML value (classification use) in "
                    f"episode_writer_input.yaml (Part 5.5)"
                )

    def _validate_node(self, data, definition, path):
        expected_type = definition.get("type")

        if expected_type == "object":
            self._validate_object(data, definition, path)
        elif expected_type == "list":
            self._validate_list(data, definition, path)
        elif expected_type == "string":
            self._validate_string(data, definition, path)
        elif expected_type == "integer":
            self._validate_integer(data, definition, path)
        elif expected_type == "boolean":
            self._validate_boolean(data, definition, path)
        elif expected_type == "string_or_list":
            self._validate_string_or_list(data, definition, path)
        elif expected_type == "datetime":
            pass  # Accept any value for datetime
        elif expected_type is None:
            pass  # No type constraint
        else:
            self.warnings.append(f"{path}: unknown type '{expected_type}'")

    def _validate_object(self, data, definition, path):
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required object is null")
            return

        if not isinstance(data, dict):
            self.issues.append(f"{path}: expected object, got {type(data).__name__}")
            return

        fields = definition.get("fields", {})
        for field_name, field_def in fields.items():
            field_path = f"{path}.{field_name}"
            if field_name in data:
                value = data[field_name]
                if value is None and not field_def.get("required", False):
                    continue  # Optional field explicitly set to null
                if value is None and field_def.get("required", False):
                    self.issues.append(f"{field_path}: required field is null")
                    continue
                self._validate_node(value, field_def, field_path)
            elif field_def.get("required", False):
                self.issues.append(f"{field_path}: required field missing")

    def _validate_list(self, data, definition, path):
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required list is null")
            return

        if not isinstance(data, list):
            self.issues.append(f"{path}: expected list, got {type(data).__name__}")
            return

        constraints = definition.get("constraints", {})
        min_len = constraints.get("min_length")
        max_len = constraints.get("max_length")
        if min_len is not None and len(data) < min_len:
            self.issues.append(
                f"{path}: list length {len(data)} < minimum {min_len}"
            )
        if max_len is not None and len(data) > max_len:
            self.issues.append(
                f"{path}: list length {len(data)} > maximum {max_len}"
            )

        items_def = definition.get("items", {})
        if items_def:
            for i, item in enumerate(data):
                self._validate_node(item, items_def, f"{path}[{i}]")

    def _validate_string(self, data, definition, path):
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required string is null")
            return

        if not isinstance(data, str):
            self.issues.append(f"{path}: expected string, got {type(data).__name__}")
            return

        constraints = definition.get("constraints", {})
        enum = constraints.get("enum")
        if enum and data not in enum:
            self.issues.append(f"{path}: '{data}' not in enum {enum}")

        pattern = constraints.get("pattern")
        if pattern and not re.match(pattern, data):
            self.issues.append(
                f"{path}: '{data}' doesn't match pattern '{pattern}'"
            )

    def _validate_integer(self, data, definition, path):
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required integer is null")
            return

        if not isinstance(data, int) or isinstance(data, bool):
            self.issues.append(
                f"{path}: expected integer, got {type(data).__name__}"
            )

    def _validate_string_or_list(self, data, definition, path):
        """Used by analysis.yaml's hedged-vs-confident explanatory variables.
        A string is single-label (confident); a list of strings is hedged.
        Both are valid; null is valid for optional fields."""
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required string_or_list is null")
            return
        if isinstance(data, str):
            return
        if isinstance(data, list):
            for i, item in enumerate(data):
                if not isinstance(item, str):
                    self.issues.append(
                        f"{path}[{i}]: expected string in hedged list, "
                        f"got {type(item).__name__}"
                    )
            return
        self.issues.append(
            f"{path}: expected string or list of strings, got {type(data).__name__}"
        )

    def _validate_boolean(self, data, definition, path):
        if data is None:
            if definition.get("required", False):
                self.issues.append(f"{path}: required boolean is null")
            return

        if not isinstance(data, bool):
            self.issues.append(
                f"{path}: expected boolean, got {type(data).__name__}"
            )

    def _report(self, artifact_path, schema_path):
        print(f"Validating: {artifact_path}")
        print(f"  Schema: {schema_path}")

        if self.warnings:
            for w in self.warnings:
                print(f"  WARNING: {w}")

        if self.issues:
            print(f"\n  ISSUES ({len(self.issues)}):")
            for issue in self.issues:
                print(f"    - {issue}")
        else:
            print("  PASS: All checks passed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Validate a YAML artifact against its schema"
    )
    parser.add_argument("artifact_path", help="Path to the YAML artifact")
    parser.add_argument("schema_path", help="Path to the schema definition")
    parser.add_argument(
        "--mode", choices=["strict", "warn"], default="strict",
        help="strict (default): exit 1 on issues. warn: log and continue."
    )
    args = parser.parse_args()

    validator = SchemaValidator(mode=args.mode)
    ok = validator.validate(args.artifact_path, args.schema_path)
    sys.exit(0 if ok else 1)
