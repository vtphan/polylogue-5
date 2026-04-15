# Lens Pipeline Specification

**Document status:** current  
**Pipeline family:** Lens runtime pipeline v2  
**Runtime package schema:** `assistive_package.yaml` schema `0.2.0`  
**Last reviewed against repo artifacts:** 2026-04-15  
**Reviewed examples:** `artifacts/strangers-in-the-old-forest/episodes/episode_01/` and `episode_02/`

This document describes the **current** pipeline contract that feeds the Lens app. It replaces the older Lens pipeline description that centered on `analysis.yaml`, `facilitation.yaml`, `scaffolding.yaml`, and `session.yaml`.

That older design is now historical. The checked-in pipeline currently produces a merged **runtime-first assistive package**:

- `assistive_package.yaml`

The goal of this document is to describe what the repository actually does now.

---

## 1. Scope

Lens is a non-LLM runtime application. All model-dependent instructional support must be generated ahead of time by the pipeline and saved as artifacts.

The current pipeline for one episode is:

```text
create_episode
  -> create_transcript
  -> build_assistive_package
```

The terminal artifact consumed by the app should be treated as:

```text
assistive_package.yaml
```

with supporting authored and generated artifacts kept for traceability, review, and debugging.

---

## 2. Versioning

There are two version layers that matter.

### Pipeline family version

The current command stack is the **v2 assistive-package pipeline**. This naming appears directly in the `build_assistive_package` command description:

- `.claude/commands/build_assistive_package.md`
- `framework/pipeline/commands/build_assistive_package.md`

In this v2 pipeline, four authoring agents produce component artifacts which are then merged deterministically into a single runtime package.

### Runtime package schema version

The merged runtime artifact carries its own schema version in:

```yaml
package_meta:
  schema_version: 0.2.0
```

This is not hypothetical. It is present in both reviewed examples:

- `artifacts/strangers-in-the-old-forest/episodes/episode_01/assistive_package.yaml`
- `artifacts/strangers-in-the-old-forest/episodes/episode_02/assistive_package.yaml`

As of this document revision, the current Lens runtime contract is:

- pipeline family: **v2**
- runtime package schema: **0.2.0**

Any future pipeline revision should update both the command docs and this document explicitly.

---

## 3. Historical Note

The previous `pipeline-spec.md` described a pipeline organized around:

- `analysis.yaml`
- `facilitation.yaml`
- `scaffolding.yaml`
- `session.yaml`

That is not the checked-in runtime contract now.

The repo still contains Lens-specific command docs such as:

- `apps/lens/pipeline/commands/design_scaffolding.md`
- `apps/lens/pipeline/commands/configure_session.md`

Those should currently be treated as **older or incomplete downstream design material**, not the authoritative runtime pipeline for Lens.

The authoritative commands for the current pipeline are:

- `framework/pipeline/commands/create_episode.md`
- `framework/pipeline/commands/create_transcript.md`
- `framework/pipeline/commands/build_assistive_package.md`

and their mirrored `.claude/commands/` versions.

---

## 4. Command Flow

## 4.1 `create_episode`

`create_episode` reads:

- `framework/stories/{story_id}.md`
- `framework/stories/{story_id}/episode_{NN}.md`

It produces:

- `artifacts/{story_id}/episodes/episode_{NN}/episode.yaml`
- `artifacts/{story_id}/episodes/episode_{NN}/intermediates/episode_writer_input.yaml`

This command does two important things:

- it creates the full episode plan
- it creates the barrier-safe projection consumed by the dialog writer

The projection is part of the pipeline's information-barrier design. The dialog writer does not receive the full plan.

Observed in reviewed logs:

- episode 01 passed planning and validation on first pass
- episode 02 required a projection review fix before final acceptance

That episode 02 correction is important evidence that the projection barrier is an active part of the current pipeline, not a theoretical note.

## 4.2 `create_transcript`

`create_transcript` consumes:

- `episode.yaml`
- `intermediates/episode_writer_input.yaml`

It runs:

- projection schema validation
- `projection_reviewer`
- `dialog_writer`
- structural review
- `transcript_id`
- `transcript_reviewer`
- transcript enumeration

It produces:

- `transcript.yaml`

plus preserved intermediates such as:

- `intermediates/transcript_raw.yaml`
- `intermediates/transcript_polished.yaml`

This command is still part of the information-barrier architecture:

- `dialog_writer` only receives the barrier-safe projection
- reviewer and instructional-design stages operate outside the barrier

## 4.3 `build_assistive_package`

`build_assistive_package` is the current artifact-building command that matters most for Lens runtime.

It requires:

- `episode.yaml`
- `transcript.yaml`

It then runs the current v2 package build:

1. analyst agent -> `ground_truth_generated.yaml`
2. diagnostic agent -> `diagnostic_generated.yaml`
3. prose agent -> `prose_generated.yaml`
4. discussion agent -> `discussion_generated.yaml`
5. deterministic merge script -> `assistive_package.yaml`
6. package reviewer -> accept or revise

The merge step uses:

```bash
python3 framework/pipeline/scripts/merge_assistive_package.py "${EPISODE_DIR}"
```

The command documentation states that the merge script now defaults to runtime-package schema version `0.2.0` unless another schema version is explicitly requested.

---

## 5. Current Artifact Set

For a fully built episode in the current pipeline, the reviewed examples show this artifact family:

- `episode.yaml`
- `transcript.yaml`
- `ground_truth_generated.yaml`
- `diagnostic_generated.yaml`
- `prose_generated.yaml`
- `discussion_generated.yaml`
- `assistive_package.yaml`
- `pipeline_log.yaml`

There may also be intermediate artifacts under `intermediates/` created during `create_episode` and `create_transcript`.

The important distinction is:

- the four `*_generated.yaml` files are component artifacts from specific authoring stages
- `assistive_package.yaml` is the merged runtime-facing artifact

---

## 6. What the Merged Assistive Package Contains

The runtime schema at `framework/schemas/assistive_package.yaml` defines six top-level sections:

- `package_meta`
- `analytic_core`
- `front_door_support`
- `diagnostic_support`
- `discussion_support`
- `teacher_support`

This is the current runtime contract Lens should be designed around.

### 6.1 `package_meta`

Contains:

- `story_id`
- `episode_number`
- optional `scenario_id`
- `schema_version`
- integrity metadata

In both reviewed examples:

- `schema_version` is `0.2.0`
- integrity checks passed `14/14`

### 6.2 `analytic_core`

This is the hidden analytic layer for the episode.

It includes:

- passage list
- target turn IDs
- target character IDs
- lens visibility
- facets present
- prior exposure

In the reviewed examples, both episode 01 and episode 02 currently contain a single merged passage:

- `p1`

Episode 02 also demonstrates the intended continuity behavior through `prior_exposure`, which records concepts first seen in episode 01.

### 6.3 `front_door_support`

This section contains explicit student-facing supports for getting started and regaining traction.

It includes:

- `attention_targets`
- `sentence_frame_seeds`
- `modeled_episode_examples`
- `transfer_examples`

This matches the product direction that Lens needs support at different cognitive loads without runtime LLM use.

### 6.4 `diagnostic_support`

This section contains the reactive support structure for individual analysis.

It includes:

- probes
- interventions
- struggle calibration

The corresponding source artifact is `diagnostic_generated.yaml`.

### 6.5 `discussion_support`

This section contains group-phase support.

It includes:

- discussion cues
- talk moves
- consensus checks

The corresponding source artifact is `discussion_generated.yaml`.

### 6.6 `teacher_support`

This section is teacher-facing runtime support folded into the merged package.

This is another major difference from the old pipeline spec: teacher support is no longer documented primarily as a separate `facilitation.yaml` runtime contract.

---

## 7. Source Artifact Roles Before Merge

The current package architecture is layered. Each generated file has a distinct job before merge.

### `ground_truth_generated.yaml`

Purpose:

- hidden analytical description of the episode
- facet presence
- lens visibility
- turn annotations
- causal layer

This is the base interpretive layer for the rest of the package.

### `diagnostic_generated.yaml`

Purpose:

- routing probes
- interventions by turn and facet
- struggle calibration

This provides the logic for how the app can respond to different student states without model calls.

### `prose_generated.yaml`

Purpose:

- voiced student-facing text
- opening language
- attention targets
- sentence frames
- modeled examples
- transfer examples
- consensus-check text

This is where much of the readable support language comes from.

### `discussion_generated.yaml`

Purpose:

- group-phase cues
- talk moves
- discussion distribution primitives

This supports the peer-discussion phase of Lens.

### `assistive_package.yaml`

Purpose:

- deterministic merged runtime artifact
- single package for app consumption
- integrity-checked and schema-validated

This should be treated as the primary package contract for Lens runtime design.

---

## 8. Validation and Quality Gates

The current pipeline is heavily gated. That should be preserved in any future revision.

## 8.1 Schema validation

The command docs require schema validation for:

- `episode.yaml`
- `episode_writer_input.yaml`
- `transcript.yaml`
- `ground_truth_generated.yaml`
- `diagnostic_generated.yaml`
- `prose_generated.yaml`
- `discussion_generated.yaml`
- `assistive_package.yaml`

## 8.2 Merge integrity

The merge step is not just concatenation. It performs integrity checks and records the result into package metadata.

Observed in both reviewed examples:

- `checks_passed: 14`
- `checks_total: 14`

## 8.3 Reviewer gates

The current pipeline also depends on reviewer agents:

- `projection_reviewer`
- `transcript_reviewer`
- `package_reviewer`

This matters because the current pipeline is not merely schema-driven. It combines deterministic validation with qualitative review.

---

## 9. Evidence From Reviewed Example Episodes

The following observations come directly from the first two built episodes under:

- `artifacts/strangers-in-the-old-forest/episodes/episode_01/`
- `artifacts/strangers-in-the-old-forest/episodes/episode_02/`

### Episode 01

- completed `create_episode`, `create_transcript`, and `build_assistive_package`
- final package reviewer verdict: `ACCEPT`
- merged package integrity: `14/14`
- runtime schema version: `0.2.0`
- `prior_exposure` is empty, which makes sense for the first episode

### Episode 02

- `create_episode` hit a projection-review failure and was revised before acceptance
- `create_transcript` then passed with the accepted projection
- `build_assistive_package` completed with package reviewer `ACCEPT`
- merged package integrity: `14/14`
- runtime schema version: `0.2.0`
- `prior_exposure` records concepts first seen in episode 01

These examples confirm that the current pipeline is:

- sequential across commands
- versioned in practice
- traceable through `pipeline_log.yaml`
- continuity-aware across episodes
- centered on `assistive_package.yaml` as the merged runtime output

---

## 10. Implications For Lens App Design

The Lens app should currently be designed to consume the merged assistive package, not the older artifact family.

In practical terms, the app/runtime contract should assume:

- episode content comes from `transcript.yaml`
- structured runtime support comes from `assistive_package.yaml`
- support is precomputed and deterministic
- the package already contains student-facing, discussion-phase, and teacher-facing support layers

If the app is still modeled around:

- `analysis.yaml`
- `facilitation.yaml`
- `scaffolding.yaml`
- `session.yaml`

then the app contract is out of date relative to the pipeline.

---

## 11. Recommended Documentation Rule Going Forward

This document should be updated whenever any of the following changes:

- the command sequence changes
- the merge inputs change
- the merged package top-level structure changes
- `assistive_package.yaml` schema version changes
- Lens begins consuming a different runtime artifact

At minimum, every revision should update:

- document status date
- pipeline family version
- runtime package schema version
- reviewed example artifacts

That keeps the specification tied to the actual pipeline rather than to an aspirational design.
