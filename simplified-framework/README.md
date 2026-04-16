# Simplified Lens Framework

`simplified-framework/` is the current home for the simplified reasoning-flaws framework, its artifact pipeline, sample artifacts, and the local prototype app.

## Current Source Of Truth

For current framework behavior and structure, use:

- `docs/technical-spec.md`
  Primary technical source of truth for artifacts, pipeline, validators, and runtime contract.
- `docs/framework-model.md`
  Conceptual framework, pedagogical assumptions, and intended student learning.
- `docs/operator-workflow.md`
  Human-in-the-loop review cadence.

`docs/app-design.md` exists for the future dedicated app design, but it is not yet a complete or current design source of truth.

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

The framework and artifact model are largely in place. The local app under `app/` is still a prototype and is not yet the canonical dedicated app for this framework.

