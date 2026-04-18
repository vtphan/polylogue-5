# Operator Workflow

This document defines the current human-in-the-loop workflow for the simplified pipeline.

> **In-flight revisions.** `simplified-framework/todo.md` scopes a planned revision that tightens the review standard (gates check only app-required minimums — ≥ 2 warm-up-suitable primary-flaw moments plus 1 `unmistakable` + 1 `showcased` + 1 `heightened` for 3 levels; no arbitrary "5–7 moments" rules), adds a linguistic guide for dialog and scaffolding, and retargets the pipeline at a new 3-episode story `the-white-squirrel`. Consult `todo.md` before reviewing or building new content.

## Workflow

1. Create or revise `story.yaml`.
2. Create the episode-plan set.
3. Generate one transcript at a time.
4. Save and review `flaw-review.md`.
5. Accept, revise, or regenerate the transcript.
6. Build `lesson_package.yaml` only after transcript acceptance.

## Review Standard

The operator is checking whether the episode is good enough for the app, not whether it is analytically exhaustive.

For the current scope, "good enough for the app" means good enough for the present deterministic lesson flow, not fully expressive of the broader classroom model described in `instructional-design.md`.

Core review questions:

1. Does the transcript sound natural?
2. Are the flaw moments clear enough for the intended difficulty?
3. Are there enough warm-up and level candidates?
4. Is the main flaw clear across the episode?
5. Can the package be built without guesswork?

## Guideline Counts

Use these as targets, not hard gates:

- about 2 warm-up candidates
- about 3 to 5 level candidates

## Packaging Rule

Do not generate the lesson package until the transcript has been accepted.
