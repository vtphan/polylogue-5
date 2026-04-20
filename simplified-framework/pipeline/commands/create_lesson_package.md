---
description: Convert an accepted transcript plus approved turn anchors into a v4 app-facing lesson package for the simplified Lens runtime
---

# Create Lesson Package

Create the app-facing lesson package for one accepted transcript.

This command should run only after:

- the transcript has been accepted by the operator
- `flaw-proposals.yaml` has been approved and carries the operator-approved `approved_anchors`

Its job is to turn the accepted episode materials into a deterministic package that the non-LLM app can render without guesswork.

Scope: the package gates what the app needs at runtime — `episode.summary`, `episode.previously` (on ep 2+), variable-length inline quizzes (`levels[]`), and `episode.final_takeaway`. Warm-ups do not exist. Practice lives in its own shared package outside the story artifact.

## Output Target

The default artifact is:

- `artifacts/{story_id}/{episode_id}/lesson_package.yaml`

This output should follow:

- `schemas/lesson_package.yaml`

Validation script:

- `python3 pipeline/scripts/validate_lesson_package.py artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Required Inputs

- `stories/{story_id}/story.yaml`
- `artifacts/{story_id}/{episode_id}/transcript.yaml`
- `artifacts/{story_id}/{episode_id}/flaw-proposals.yaml`
- `reference/flaw-taxonomy.yaml`

`transcript.yaml` is the sole transcript-text source of truth for package generation.

`flaw-proposals.yaml` `approved_anchors` is the sole persisted source of truth for which turns become lesson levels.

## Subagent Role

This command should use:

### `lesson_package_builder`

Responsibilities:

- author `episode.summary` (<= 60 words) and, on episode 2+, `episode.previously` (<= 40 words)
- build `levels[]` from the approved anchors in `flaw-proposals.yaml`
- allow `levels: []` when the operator approved zero anchors
- order levels by the approved anchors' appearance in `transcript.yaml`
- emit canonical `focus_flaw` on every level
- write short direct prompts that do **not** quote or paraphrase the highlighted turn
- write answer options
- write hints, per-option feedback, and per-level takeaways
- carry `episode.final_takeaway` through from `story.yaml`
- produce an unambiguous app-facing package

Required file output:

- `artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Important Constraint

The downstream app is deterministic and non-LLM.

So this package must already specify:

- which turns are used
- which flaw each quiz teaches
- which prompt is shown
- which options are shown
- what hint to show
- what feedback to show for each wrong option
- what takeaway to reinforce

When `levels.length === 0`, the package is still complete for runtime ingestion. The app treats transcript completion as the completion condition and omits star UI.

`feedback` must use the canonical YAML shape:

```yaml
feedback:
  correct:
    option_ids: [opt_a]
    text: <plain string>
  by_option:
    opt_b: <plain string>
    opt_c: <plain string>
    opt_d: <plain string>
```

`feedback.by_option` values are plain strings keyed by wrong `option_id`, not nested `{text: ...}` objects.

## Expected Operator Report

After the package is built, Claude Code should report:

- where the saved package file is
- which approved anchor turns became levels
- how many levels were emitted
- whether the package is a zero-level episode
- whether the package appears unambiguous enough for the app

## Required Validation Step

After saving the lesson package, run:

```bash
python3 pipeline/scripts/validate_lesson_package.py artifacts/{story_id}/{episode_id}/lesson_package.yaml
```

If validation fails:

- revise the package
- save it again
- rerun validation
- do not treat the package as complete until it passes

## What This Command Must Not Do

Do not:

- regenerate the transcript silently
- emit warm-ups or any v1-only fields
- infer lesson levels from anything other than `approved_anchors`
- backfill `episode.flaws`
- rely on hidden analytic interpretation at runtime
- repeat the highlighted turn in the prompt
- leave answer quality ambiguous

The package is successful only if the app can render it directly.
