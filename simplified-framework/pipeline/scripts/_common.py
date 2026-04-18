#!/usr/bin/env python3
"""Shared helpers for simplified-framework validation scripts."""

from __future__ import annotations

import re
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


_MARKDOWN_PATTERNS = [
    re.compile(r"!\[[^\]]*\]\([^)]*\)"),       # images
    re.compile(r"\[([^\]]*)\]\([^)]*\)"),      # links → keep label
    re.compile(r"`[^`]*`"),                    # inline code
    re.compile(r"[*_~]{1,3}"),                 # emphasis markers
]


def _strip_markdown(text: str) -> str:
    stripped = text
    # Replace link markdown with the label text.
    stripped = _MARKDOWN_PATTERNS[1].sub(lambda m: m.group(1), stripped)
    # Drop image markdown entirely.
    stripped = _MARKDOWN_PATTERNS[0].sub(" ", stripped)
    # Drop inline code spans entirely (counts of backtick-fenced tokens
    # would distort readability metrics).
    stripped = _MARKDOWN_PATTERNS[2].sub(" ", stripped)
    # Strip emphasis markers but keep the wrapped words.
    stripped = _MARKDOWN_PATTERNS[3].sub("", stripped)
    return stripped


_WORD_RE = re.compile(r"[A-Za-z][A-Za-z'\-]*")


def word_count(text: str) -> int:
    """Count words after stripping simple markdown.

    Splits on whitespace/punctuation and counts alphabetic tokens only — numbers
    and standalone punctuation do not count, matching how a reader paces prose.
    """
    if not isinstance(text, str):
        return 0
    clean = _strip_markdown(text)
    return len(_WORD_RE.findall(clean))


def warn_word_cap(label: str, text: str, cap: int) -> None:
    """Emit a warning if `text` exceeds `cap` words. No-op on empty strings."""
    if not isinstance(text, str) or not text.strip():
        return
    count = word_count(text)
    if count > cap:
        print(
            f"WARNING: {label} is {count} words (cap {cap}). Tighten the copy.",
            file=sys.stderr,
        )


_SENTENCE_END_RE = re.compile(r"[.!?]+")


def _count_sentences(text: str) -> int:
    clean = _strip_markdown(text).strip()
    if not clean:
        return 0
    # Treat a final fragment without terminal punctuation as one sentence.
    pieces = [p for p in _SENTENCE_END_RE.split(clean) if p.strip()]
    return max(1, len(pieces))


_VOWEL_GROUP_RE = re.compile(r"[aeiouy]+", re.IGNORECASE)


def _count_syllables_word(word: str) -> int:
    """Heuristic vowel-group syllable count. Roughly 85% accurate on English."""
    lowered = word.lower()
    # Strip common silent-e; 'the' stays at 1.
    base = lowered
    groups = _VOWEL_GROUP_RE.findall(base)
    count = len(groups)
    if count == 0:
        return 1
    # Silent trailing 'e' (e.g., "make" → 1, not 2).
    if base.endswith("e") and count > 1 and not base.endswith(("le", "ee", "ie")):
        count -= 1
    return max(1, count)


def flesch_kincaid_grade(text: str) -> float | None:
    """Return FK grade level, or None if the sample is too small to score.

    Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59.
    Uses a vowel-group syllable heuristic so no external dependency is needed.

    The 30-word minimum sample was calibrated against ep 1 of
    `the-white-squirrel` in Phase 2: below that, one long word or a single
    comma-spliced sentence tips the score past grade 7 on text that reads
    perfectly well in context. Tuning narrows false warns on short feedback
    strings and hints; it does not change the grade-7 threshold itself.
    """
    if not isinstance(text, str) or not text.strip():
        return None
    clean = _strip_markdown(text)
    words = _WORD_RE.findall(clean)
    if len(words) < 30:
        return None
    sentences = _count_sentences(clean)
    if sentences == 0:
        return None
    syllables = sum(_count_syllables_word(word) for word in words)
    if syllables == 0:
        return None
    return 0.39 * (len(words) / sentences) + 11.8 * (syllables / len(words)) - 15.59


def warn_readability(label: str, text: str, threshold: float = 7.0) -> None:
    """Warn when FK grade exceeds threshold. Silent on samples too small to score."""
    grade = flesch_kincaid_grade(text)
    if grade is None:
        return
    if grade > threshold:
        print(
            f"WARNING: {label} reads at grade {grade:.1f} (cap {threshold:.0f}). "
            f"Prefer plainer wording.",
            file=sys.stderr,
        )


def print_result(errors: list[str]) -> int:
    if errors:
      # keep output compact and deterministic
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("OK")
    return 0
