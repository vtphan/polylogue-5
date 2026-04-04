#!/usr/bin/env python3
"""Validate a YAML artifact against its descriptive YAML schema.

Checks field presence (required/optional), types, enum constraints,
list length constraints, and regex patterns.

Usage:
    python3 validate_schema.py <artifact_path> <schema_path> [--mode strict|warn]

Modes:
    strict (default): exit 1 on any issue
    warn: log issues, exit 0

Example:
    python3 validate_schema.py \
        registry/ocean-vs-deforestation/transcript.yaml \
        framework/schemas/transcript.yaml
"""

import re
import sys
import argparse
import yaml


class SchemaValidator:
    def __init__(self, mode="strict"):
        self.mode = mode
        self.issues = []
        self.warnings = []

    def validate(self, artifact_path, schema_path):
        with open(artifact_path) as f:
            artifact = yaml.safe_load(f)
        with open(schema_path) as f:
            schema_doc = yaml.safe_load(f)

        root_def = schema_doc.get("schema", {}).get("root", {})
        self._validate_node(artifact, root_def, "root")

        self._report(artifact_path, schema_path)
        if self.mode == "strict" and self.issues:
            return False
        return True

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
