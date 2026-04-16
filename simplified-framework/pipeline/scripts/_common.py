#!/usr/bin/env python3
"""Shared helpers for simplified-framework validation scripts."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml


def load_yaml(path: str) -> Any:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    with file_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def require_mapping(value: Any, label: str, errors: list[str]) -> dict[str, Any]:
    if not isinstance(value, dict):
        errors.append(f"{label} must be a mapping/object")
        return {}
    return value


def require_list(value: Any, label: str, errors: list[str]) -> list[Any]:
    if not isinstance(value, list):
        errors.append(f"{label} must be a list")
        return []
    return value


def require_nonempty_string(value: Any, label: str, errors: list[str]) -> str:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")
        return ""
    return value.strip()


def require_int(value: Any, label: str, errors: list[str]) -> int | None:
    if not isinstance(value, int):
        errors.append(f"{label} must be an integer")
        return None
    return value


def print_result(errors: list[str]) -> int:
    if errors:
      # keep output compact and deterministic
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("OK")
    return 0
