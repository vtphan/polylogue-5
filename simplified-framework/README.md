# Simplified Lens Framework

`simplified-framework/` is the current home for the simplified reasoning-flaws framework, its artifact pipeline, sample artifacts, and the local prototype app.

## Current Source Of Truth

For current framework behavior and structure, use:

- `docs/instructional-design.md`
  Conceptual framework, student journey, pedagogical mechanics, and the authoring surface.
- `docs/tech-reference.md`
  Stack, directory map, Prisma data model, artifact → runtime contract, phase state machine, change recipes.
- `docs/operator-workflow.md`
  Human-in-the-loop review cadence.

Build-time design records (`app-design.md`, `technical-spec.md`, `framework-model.md`) now live in `docs/archived/` and should be treated as historical context only.

## Canonical Framework Material

- `stories/{story_id}/story.yaml`
  Authored story source.
- `artifacts/{story_id}/{episode_id}/`
  Generated episode artifacts such as `episode-plan.yaml`, `transcript.yaml`, `flaw-review.md`, and `lesson_package.yaml`.
- `reference/flaw-taxonomy.yaml`
  Canonical flaw set and amplification guidance.
- `schemas/`
  Human-readable schema sketches. Structural truth lives in the validators.
- `pipeline/`
  Command specs, agent specs, and validators for the simplified workflow.
- `docs/archived/`
  Historical and superseded docs. Do not treat archived docs as current framework truth.

## Current Status

The framework, artifact model, and dedicated app under `app/` are implemented end to end: read → warmup → level → complete, with persisted run state, restrained badges, bounded level retry, and a lifeline-gated bonus. See `docs/tech-reference.md` for the runtime contract and `docs/instructional-design.md` for the pedagogy.

