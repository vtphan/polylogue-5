# Operator Workflow

This document defines the current human-in-the-loop workflow for the simplified pipeline.

> **Current direction.** `simplified-framework/todo-v4.md` is the active implementation plan. Where checked-in docs lag, treat `todo-v4.md`, the Python validators, and the checked-in `pipeline/commands/` + `pipeline/agents/` specs as the forward contract.

## Workflow

1. Create or revise `story.yaml`.
2. Create the episode-plan set.
3. Generate one transcript at a time.
4. Review the transcript result and decide whether to accept, revise, or regenerate it.
5. Build `lesson_package.yaml` only after transcript acceptance.

## Review Standard

The operator is checking whether the episode is good enough for the app, not whether it is analytically exhaustive.

For the current scope, "good enough for the app" means good enough for the present deterministic lesson flow, not fully expressive of the broader classroom model described in `instructional-design.md`.

Core review questions:

1. Does the transcript sound natural?
2. Are the flaw moments clear enough for the intended difficulty?
3. Is the main flaw clear across the episode?
4. Can the package be built without guesswork and with short direct prompts?

## Guideline Counts

Use these as targets, not hard gates:

- 3+ scenes in the final reader-facing transcript
- enough strong teaching-anchor candidates for the lesson package to be built cleanly

## Packaging Rule

Do not generate the lesson package until the transcript has been accepted.
