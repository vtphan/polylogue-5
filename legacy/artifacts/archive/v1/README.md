# v1 Artifacts Archive

This directory contains pipeline artifacts (`episode.yaml`, `transcript.yaml`, `analysis.yaml`, `facilitation.yaml`, intermediates, and app-specific outputs) produced by the **v1 pipeline** before the runtime-package restructure.

## Contents

- `saving-the-maker-space/episodes/episode_{01..05}/` — the five episodes of the v1 pilot story, generated end-to-end and shipped as the first validation of the story-based pipeline.

(No artifacts exist for `the-overton-park-sightings` — that story was authored as drafts but never run through Phase 7.)

## Policy

- **The v2 pipeline does not read from this directory.** Live pipeline scripts exclude archive paths.
- **Do not regenerate or modify these artifacts.** They are historical reference only. Even if you re-run a v1 draft through the v2 pipeline, write the new output under `artifacts/{new_story_id}/episodes/...` — never overwrite an archived v1 artifact.
- **File formats differ in subtle ways from v2.** V1 artifacts include the now-retired `assistive_package.yaml`; v2 produces `runtime_package.yaml` + `authoring_trace.yaml`. Do not assume schemas are interchangeable.

## Where to look instead

- **Current artifacts:** `artifacts/{story_id}/episodes/...` (excluding this archive).
- **The restructure rationale:** `framework/docs/runtime-package-restructure.md`.
- **The v1→v2 migration narrative:** `framework/docs/pipeline-v1-to-v2-migration.md`.
