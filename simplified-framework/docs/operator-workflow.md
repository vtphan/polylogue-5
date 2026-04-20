# Operator Workflow

This document defines the current human-in-the-loop workflow for the simplified pipeline.

> **Current direction.** `simplified-framework/todo-v4.md` is the active implementation plan. Where checked-in docs lag, treat `todo-v4.md`, the Python validators, and the checked-in `pipeline/commands/` + `pipeline/agents/` specs as the forward contract.

## Workflow

1. Create or revise `story.yaml`.
2. Create the episode-plan set.
3. Generate one transcript at a time.
4. Review `transcript.raw.yaml` as a story draft and iterate until approval.
5. Review `flaw-proposals.yaml` and approve the proposal set plus `approved_anchors`.
6. Spot-check `transcript.post-doctor.yaml` after approved proposal application.
7. Build `lesson_package.yaml` only after `transcript.yaml` is accepted and `flaw-proposals.yaml` is approved.

## Review Standard

The operator is checking whether the episode is good enough for the app, not whether it is analytically exhaustive.

For the current scope, "good enough for the app" means good enough for the present deterministic lesson flow, not fully expressive of the broader classroom model described in `instructional-design.md`.

Core review questions:

1. Does the raw draft sound like a believable story?
2. Are the proposed teaching anchors genuinely teachable for the learner context?
3. Were the approved `script_doctor` changes applied faithfully before structuring?
4. Can the package be built from the approved anchors without guesswork and with short direct prompts?

## Guideline Counts

Use these as targets, not hard gates:

- 3+ scenes in the final reader-facing transcript
- enough approved teaching anchors for the intended lesson scope, which may be zero, few, or many

## Packaging Rule

Do not generate the lesson package until the transcript has been accepted and `flaw-proposals.yaml` carries the approved anchor set.
