# Simplified Framework Technical Spec (archived)

> **Archived — historical reference only.** Superseded by `simplified-framework/docs/tech-reference.md` (code layout, Prisma data model, runtime contract, change recipes) and `simplified-framework/docs/instructional-design.md` (authoring surface and transcript composition targets).

This document is the primary technical specification for the current simplified framework.

It covers the system from authored story source through generated artifacts to the intended dedicated app contract.

It does not try to encode the full long-term classroom model described in `framework-model.md`. This document defines the current app-facing contract needed to run the present scope well.

## 1. Scope And Current Status

The simplified framework is organized around one student-facing conceptual layer: reasoning flaws.

Current framework state:

- story, episode-plan, transcript, and lesson-package artifacts are defined and in use
- validators exist in `simplified-framework/pipeline/scripts/`
- the flaw taxonomy lives in `simplified-framework/reference/flaw-taxonomy.yaml`
- sample artifacts live under `simplified-framework/artifacts/`
- the local app under `simplified-framework/app/` is still a prototype, not the canonical dedicated app

## 2. Canonical Directories

Current framework materials live in these locations:

- `simplified-framework/stories/{story_id}/story.yaml`
  Authored story source.
- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
  Episode planning artifact.
- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`
  Source dialogue artifact.
- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`
  Review artifact used before package generation.
- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`
  App-facing teaching artifact.
- `simplified-framework/reference/flaw-taxonomy.yaml`
  Canonical flaw set and amplification guidance.
- `simplified-framework/schemas/*.yaml`
  Human-readable schema sketches.
- `simplified-framework/pipeline/scripts/validate_*.py`
  Canonical structural validators.
- `simplified-framework/pipeline/commands/*.md`
  Workflow contracts.
- `simplified-framework/pipeline/agents/*.md`
  Specialized prompt specs.

## 3. Source Of Truth Rules

Use the following precedence:

1. validators in `pipeline/scripts/`
2. artifact files under `stories/` and `artifacts/`
3. `reference/flaw-taxonomy.yaml`
4. this document
5. schema sketches in `schemas/`

If prose in a doc drifts from the validators, the validators win and the doc should be updated.

## 4. Framework Alignment

This technical spec assumes the framework model defined in:

- `simplified-framework/docs/framework-model.md`

That document defines:

- the student-facing flaw set
- pedagogical principles
- what students are expected to notice, understand, and transfer

This document focuses on system structure, artifacts, validation, and runtime contract.

Important boundary:

- `framework-model.md` may describe the intended classroom setting and longer-term instructional ambitions
- this technical spec defines only the fields and behaviors that the current deterministic app runtime requires

As a result, some framework ambitions are intentionally not yet represented in the canonical artifact contract. In particular, the current contract does not require explicit support for small-group orchestration, verbal peer discussion flows, project-based learning transfer, or upstream time estimates.

## 5. Story Artifact

Canonical location:

- `simplified-framework/stories/{story_id}/story.yaml`

Purpose:

- define the story world
- define recurring characters
- define episode sequence
- define episode-level flaw progression

Required fields:

- `story_id`
- `title`
- `premise`
- `characters`
- `episodes`

Required character fields:

- `id`
- `name`
- `voice_notes`

Required episode fields:

- `episode_id`
- `title`
- `flaws`

Useful optional story fields:

- `setting`
- `audience`

Useful optional episode fields:

- `final_takeaway`

Scope constraints:

- keep the artifact compact
- do not include turn-level planning
- do not include app questions or answer options
- do not include feedback text

Validator:

- `python3 simplified-framework/pipeline/scripts/validate_story.py simplified-framework/stories/{story_id}/story.yaml`

## 6. Episode-Plan Artifact

Canonical location:

- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`

Purpose:

- bridge story design and transcript writing
- define intended flaw moments
- define scene direction for transcript generation
- define the episode’s main student takeaway

Required fields:

- `story_id`
- `episode_id`
- `title`
- `episode_goal`
- `flaws`
- `student_takeaway`

Each `flaws[]` entry must include:

- `id`
- `amplification`

Optional per-flaw field:

- `scene_note`

Allowed amplification values:

- `unmistakable`
- `showcased`
- `heightened`

Important planning rule:

- write one `flaws[]` entry per intended flaw moment, not one per flaw type

If the same flaw should appear in four turns, write four entries.

Useful optional fields:

- `scene_design`
- `flaw_embedding_guidance`
- `target_teachable_moments`
- `warmup_candidate_goal`
- `level_candidate_goal`
- `character_beats`

Scope constraints:

- do not script the transcript
- do not define answer choices
- do not define warm-ups or levels directly

Runtime note:

- the dedicated app may read `episode_goal` from `episode-plan.yaml` as concise episode-entry framing

Validator:

- `python3 simplified-framework/pipeline/scripts/validate_episode_plan.py simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`

## 7. Transcript Artifact And Composition Rules

Canonical location:

- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

Purpose:

- store the actual episode dialogue
- provide the source text for flaw review and lesson-package generation

Required top-level fields:

- `story_id`
- `episode_id`
- `title`
- `characters`
- `turns`

Optional top-level fields:

- `setting_note`
- `previously`

Each turn must include:

- `turn_id`
- `speaker`
- `text`

Composition rules:

- write a plausible scene first, not a disguised worksheet
- not every turn needs a flaw
- most teachable turns in an episode should express the primary flaw
- secondary flaws should be used sparingly
- keep enough connective dialogue for the conversation to feel natural

Current working targets:

- roughly 5 to 7 candidate teachable moments per episode
- about 2 warm-up candidates
- about 3 to 5 level candidates
- preferred turn range: 10 to 16
- hard cap: 20 unless there is a strong reason

Scope constraints:

- do not include flaw labels per turn
- do not include answer keys
- do not include package-ready questions or feedback
- do not include hidden analytic annotations

Validator:

- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

## 8. Review Artifact

Canonical location:

- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

Purpose:

- judge whether the drafted transcript is app-ready
- identify warm-up and level candidates
- explain whether the flaw moments are visible enough for beginner instruction

Current workflow rule:

- do not generate `lesson_package.yaml` until the transcript has been accepted

## 9. Lesson Package Artifact

Canonical location:

- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

Purpose:

- provide the deterministic, app-facing teaching artifact

Current scope note:

- the package should contain what the current app needs to teach the episode clearly
- the package should not be expanded yet to encode speculative classroom orchestration or downstream pacing logic

Required top-level sections:

- `package_meta`
- `episode`
- `warmups`
- `levels`

Required package metadata:

- `package_meta.story_id`
- `package_meta.episode_number`
- `package_meta.schema_version`

Required `episode` fields:

- `title`
- `student_intro`
- `flaws`
- `final_takeaway`

Warm-up rules:

- include one modeled warm-up
- include one guided warm-up

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

Guided warm-ups may also include:

- `hint`

Level rules:

- include 3 to 5 challenge levels

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

Level ordering rule:

- `levels[]` should be ordered by ascending `sequence_index`
- the runtime should treat the lowest `sequence_index` as the first level if array order and index order ever diverge

Answer options use:

- `option_id`
- `text`
- `kind`

Feedback uses:

- `correct.option_ids`
- `correct.text`
- `by_option.{option_id}` for each non-correct option

Runtime rules:

- package content must be directly playable by a deterministic app
- the runtime must not have to reconstruct warm-ups, levels, answer keys, or feedback from hidden analytics
- every package `turn_id` must exist in the transcript

Current non-goals for the package contract:

- estimating how many minutes each activity will take
- encoding small-group discussion orchestration
- encoding teacher facilitation routines
- encoding explicit project-based learning transfer activities

Optional analytics section:

- `hidden_mapping`

`hidden_mapping` is analytics-only and must not be required by the runtime.

Validator:

- `python3 simplified-framework/pipeline/scripts/validate_lesson_package.py simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## 10. Artifact-Generation Pipeline

The simplified workflow is defined by the checked-in command specs and agent specs.

Primary workflow files:

- `simplified-framework/pipeline/commands/create_story.md`
- `simplified-framework/pipeline/commands/create_episodes.md`
- `simplified-framework/pipeline/commands/create_transcript.md`
- `simplified-framework/pipeline/commands/create_lesson_package.md`

Primary agent specs:

- `simplified-framework/pipeline/agents/story-designer.md`
- `simplified-framework/pipeline/agents/episode-planner.md`
- `simplified-framework/pipeline/agents/dialog-writer.md`
- `simplified-framework/pipeline/agents/flaw-reviewer.md`
- `simplified-framework/pipeline/agents/lesson-package-builder.md`

Current generation sequence:

1. create or revise `story.yaml`
2. generate the episode-plan set
3. generate one transcript at a time
4. save and review `flaw-review.md`
5. accept, revise, or regenerate the transcript
6. generate `lesson_package.yaml` only after transcript acceptance

Pipeline initialization:

- `python3 simplified-framework/pipeline/scripts/initialize_polylogue.py`

That initializer syncs the simplified command and agent specs into `.claude/` and verifies the core framework docs, schemas, and reference files.

## 11. Validation Layer

Current validators:

- `validate_story.py`
- `validate_episode_plan.py`
- `validate_transcript.py`
- `validate_lesson_package.py`

These validators enforce structural rules.

The remaining quality gate is operator judgment:

- whether the dialogue sounds natural
- whether the flaw moments are visible enough
- whether the package can teach from the transcript without guesswork

Additional review guidance is documented in:

- `simplified-framework/docs/operator-workflow.md`
- `simplified-framework/validation/rules.md`

## 12. Dedicated App Contract

The intended dedicated app should read, per session:

- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/lesson_package.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

Optional supporting source:

- `simplified-framework/stories/{story_id}/story.yaml`

No other pipeline artifact should be required at runtime.

App-facing transcript contract:

- `title`
- `setting_note` when present
- `characters`
- `turns[].turn_id`
- `turns[].speaker`
- `turns[].text`

App-facing episode-plan contract:

- `episode_goal`

App-facing package contract:

- `package_meta.story_id`
- `package_meta.episode_number`
- `package_meta.schema_version`
- `episode.title`
- `episode.student_intro`
- `episode.final_takeaway`
- `warmups.modeled`
- `warmups.guided`
- `levels[]`

Every package `turn_id` must exist in the transcript.

This contract is intentionally minimal for the current scope. If the app later needs structured discussion supports, pacing controls, or project-transfer fields, those should be added as downstream product requirements after the dedicated app design is further specified.

The dedicated app should eventually implement the product and interaction design described in:

- `simplified-framework/docs/app-design.md`

## 13. Current Prototype Status

The local prototype in `simplified-framework/app/` is not yet aligned to the full dedicated-app contract above.

Treat it as implementation scaffolding rather than as a source of truth for framework or product behavior.
