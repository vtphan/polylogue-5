# Simplified Validation Rules

Validation in the simplified framework has two layers.

## Auto-validated (scripts)

| Concern | Enforcing script |
|---|---|
| `story.yaml` has the required story-level shape and a recognized flaw palette | `pipeline/scripts/validate_story.py` |
| `episode-plan.yaml` has the required planning shape | `pipeline/scripts/validate_episode_plan.py` |
| `transcript.yaml` has only allowed keys, sequential turn IDs, and no framework flaw-id leakage | `pipeline/scripts/validate_transcript.py` |
| `lesson_package.yaml` has all required app-facing fields with consistent option and feedback ids | `pipeline/scripts/validate_lesson_package.py` |

Run each script on the relevant artifact after it is written. A non-zero exit means the artifact must be revised before the pipeline continues.

## Judgment-only (operator review)

These concerns depend on reading the artifact and are not auto-checked:

- each episode has one clear primary reasoning flaw
- each level teaches one clear flaw
- warm-ups explicitly show the answer
- answer choices are concise and plausible
- distractors feel like real student mistakes
- feedback is short and specific
- the transcript sounds like natural middle-school dialogue
- the flaw moments are obvious enough for beginner instruction

See `docs/operator-workflow.md` for the human-review cadence.
