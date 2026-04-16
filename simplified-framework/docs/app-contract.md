# Simplified App Contract

This document defines what the downstream student app reads at runtime and the shape guarantees the pipeline must provide.

## 1. Runtime Assumption

The app is non-LLM and deterministic.

It renders the student experience from artifacts alone. It does not infer structure or generate content at runtime.

## 2. Artifacts The App Reads

Per session, the app reads:

- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

Optionally, for character display and intro context:

- `simplified-framework/stories/{story_id}/story.yaml`

No other pipeline artifact is read at runtime.

## 3. lesson_package.yaml — App-Facing Fields

The app consumes:

- `package_meta.story_id`
- `package_meta.episode_number`
- `package_meta.schema_version`
- `episode.title`
- `episode.student_intro`
- `episode.final_takeaway`
- `warmups.modeled` (see warm-up shape)
- `warmups.guided` (see warm-up shape)
- `levels[]` (see level shape)

### Warm-Up Shape

Required per warm-up: `warmup_id`, `turn_id`, `title`, `focus_move`, `prompt`, `best_answer_id`, `best_answer_text`, `worked_explanation`, `takeaway`.

Required additionally for `guided`: `answer_options`. Optional for `guided`: `hint`.

### Level Shape

Required per level: `level_id`, `sequence_index`, `turn_id`, `title`, `focus_move`, `prompt`, `answer_options`, `best_answer_id`, `hint`, `feedback`.

Answer options: `option_id`, `text`, `kind`.

Feedback: `correct.option_ids`, `correct.text`, and `by_option.{option_id}` for each non-correct option.

## 4. transcript.yaml — App-Facing Fields

The app consumes:

- `title`
- `characters`
- `turns[].turn_id`
- `turns[].speaker`
- `turns[].text`

Every `turn_id` referenced from the lesson package must exist in the transcript.

## 5. Fields The App Must Not Read

The `hidden_mapping` section of `lesson_package.yaml` is analytics-only.

The app must not render it, expose it, or use it to compute any part of the student experience.

## 6. Canonical Shape Reference

The canonical field rules are enforced by:

- `pipeline/scripts/validate_lesson_package.py`
- `pipeline/scripts/validate_transcript.py`
- `pipeline/scripts/validate_story.py`

If a new field is added to an artifact, update the validator first and this contract second.
