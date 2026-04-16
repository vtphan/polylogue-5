# `lesson_package.yaml` Schema

`lesson_package.yaml` is the intended runtime teaching artifact for the simplified framework.

## Required Top-Level Sections

- `package_meta`
- `episode`
- `warmups`
- `levels`

## Episode Section

Required fields:

- `title`
- `student_intro`
- `flaws`
- `final_takeaway`

## Warm-Ups

The package should include:

- one modeled warm-up
- one guided warm-up

Each warm-up must include:

- `warmup_id`
- `turn_id`
- `title`
- `focus_move`
- `prompt`
- `best_answer_id`
- `best_answer_text`
- `worked_explanation`
- `takeaway`

Guided warm-ups also require:

- `answer_options`

Optional for guided warm-ups:

- `hint`

## Levels

Each level must include:

- `level_id`
- `sequence_index`
- `turn_id`
- `title`
- `focus_move`
- `prompt`
- `answer_options`
- `best_answer_id`
- `hint`
- `feedback`

Answer options use:

- `option_id`
- `text`
- `kind`

Feedback uses:

- `correct.option_ids`
- `correct.text`
- `by_option.{option_id}` for each non-correct option

## Runtime Rule

The package must be directly playable by a deterministic app. The app should not need to reconstruct warm-ups, levels, answer keys, or feedback from hidden analytics.

## Optional Analytics Section

`hidden_mapping` is optional and analytics-only. It must not be required by the runtime.

## Source Of Truth

The validator in `pipeline/scripts/validate_lesson_package.py` is the structural source of truth. `schemas/lesson_package.yaml` is a human-readable sketch.

