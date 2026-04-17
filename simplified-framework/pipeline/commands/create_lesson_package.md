---
description: Convert an accepted transcript into an app-facing lesson package for the simplified Lens runtime
---

# Create Lesson Package

Create the app-facing lesson package for one accepted transcript.

This command should run only after:

- the transcript has been accepted by the operator
- the flaw review has been saved

Its job is to turn the accepted episode materials into a deterministic package that the non-LLM app can render without guesswork.

## Output Target

The default artifact is:

- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

This output should follow:

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/schemas/lesson_package.yaml`

Validation script:

- `python3 simplified-framework/pipeline/scripts/validate_lesson_package.py simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Required Inputs

- `simplified-framework/stories/{story_id}/story.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`
- `simplified-framework/reference/flaw-taxonomy.yaml`

## Subagent Role

This command should use:

### `lesson_package_builder`

Responsibilities:

- select the warm-up turns
- select the level turns
- write student-facing prompts
- write answer options
- identify best answers
- write hints and feedback
- produce an unambiguous app-facing package

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Important Constraint

The downstream app is deterministic and non-LLM.

So this package must already specify:

- which turns are used
- which prompts are shown
- which options are shown
- which option is best
- what hint to show
- what feedback to show
- what takeaway to reinforce

The app should not need to infer any of these at runtime.

## Expected Operator Report

After the package is built, Claude Code should report:

- where the saved package file is
- which turns were chosen for warm-ups
- which turns were chosen for levels
- whether any planned flaw moments were dropped
- whether the package appears unambiguous enough for the app

## Required Validation Step

After saving the lesson package, run:

```bash
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml
```

If validation fails:

- revise the package
- save it again
- rerun validation
- do not treat the package as complete until it passes

## What This Command Must Not Do

Do not:

- regenerate the transcript silently
- rely on hidden analytic interpretation at runtime
- leave answer quality ambiguous

The package is successful only if the app can render it directly.
