---
description: Convert an accepted transcript into a v2 app-facing lesson package for the simplified Lens runtime
---

# Create Lesson Package

Create the app-facing lesson package for one accepted transcript.

This command should run only after:

- the transcript has been accepted by the operator
- the flaw review has been saved

Its job is to turn the accepted episode materials into a deterministic package that the non-LLM app can render without guesswork.

Scope: the package gates what the app needs at runtime — `episode.summary`, `episode.previously` (on ep 2+), and **exactly 3 inline quizzes** (`levels[]`) bound to distinct scenes. Warm-ups do not exist in v2. Practice lives in its own shared package outside the story artifact.

## Output Target

The default artifact is:

- `artifacts/{story_id}/{episode_id}/lesson_package.yaml`

This output should follow:

- `docs/instructional-design.md`
- `schemas/lesson_package.yaml`

Validation script:

- `python3 pipeline/scripts/validate_lesson_package.py artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Required Inputs

- `stories/{story_id}/story.yaml`
- `artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `artifacts/{story_id}/{episode_id}/transcript.yaml`
- `artifacts/{story_id}/{episode_id}/flaw-review.md`
- `reference/flaw-taxonomy.yaml`

## Subagent Role

This command should use:

### `lesson_package_builder`

Responsibilities:

- author `episode.summary` (≤ 60 words) and, on episode 2+, `episode.previously` (≤ 40 words)
- select exactly 3 quiz turns for `levels[]`
- ensure the 3 selected quiz turns live in distinct scenes
- order the 3 levels as `unmistakable` → `showcased` → `heightened` by default
- emit canonical `focus_flaw` on every level
- write short direct prompts that do **not** quote or paraphrase the highlighted turn
- write answer options
- write hints, per-option feedback, and per-level takeaways
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

The app should not need to infer any of these at runtime.

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

## Downstream App Fit

The downstream app is an inline-quiz reader, not a worksheet surface.

That means this command must build quizzes that fit the actual UI:

- prompts are short and direct because the highlighted turn is already visible
- wrong-option explanations should say why this is **not the best answer**
- correct explanations should say why this **is the best answer**
- the student's selected option will sit visually adjacent to its explanation, so the explanation should respond to that exact choice
- avoid overlong scaffolds that force the student to read a mini-essay inside the scene

## Expected Operator Report

After the package is built, Claude Code should report:

- where the saved package file is
- which 3 turns were chosen for levels
- which scene each chosen turn belongs to
- whether any planned flaw moments were dropped
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
- rely on hidden analytic interpretation at runtime
- repeat the highlighted turn in the prompt
- leave answer quality ambiguous

The package is successful only if the app can render it directly.
