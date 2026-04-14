# Runtime Package Refactor Implementation Plan

This document is the execution plan for the runtime-package refactor described
in `framework/docs/runtime-package-refactor.md`.

It is written for another agent to implement directly.

## Objective

Refactor the final `assistive_package.yaml` from an authoring-shaped merged file
into a runtime-first package optimized for Lens and future downstream apps.

Preserve the current authoring split:

- `ground_truth_generated.yaml`
- `diagnostic_generated.yaml`
- `prose_generated.yaml`
- `discussion_generated.yaml`

Do not collapse authoring artifacts. Refactor the merged package and the
projection logic.

## Success Criteria

The refactor is complete when all of the following are true:

1. `assistive_package.yaml` is organized around runtime instructional function,
   not around authoring-agent boundaries.
2. The package includes first-class `front_door_support` with exactly these
   four support types:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`
3. The merge script deterministically projects the authored inputs into the new
   runtime package shape.
4. Reviewer criteria explicitly evaluate the new front-door support.
5. `the-field-trip` episodes 1-3 can be regenerated successfully against the
   new package structure.
6. Lens can consume the runtime package without needing to inspect raw
   authoring files or reverse-engineer diagnostic ladders for startup support.

## Constraints

1. Preserve the information barrier.
2. Preserve the four-agent authoring split.
3. Preserve productive struggle and reactive diagnostic ladders.
4. Do not optimize heavily for backward compatibility unless active consumers
   require it.
5. Keep the runtime package easy to consume for apps.

## Implementation Strategy

The implementation should proceed in this order:

1. Audit current runtime fields and decide what belongs in the new package.
2. Rewrite the assistive-package schema around runtime sections.
3. Align the prose schema with the new front-door support model.
4. Update the merge script to project authored data into the new runtime shape.
5. Update package review criteria.
6. Update the relevant Claude command and agent prompts.
7. Regenerate pilot episodes and inspect the outputs.
8. Only after that, begin Lens consumption changes.

## Workstreams

### Workstream A: Field Audit And Mapping

Goal:
- define exactly how current package fields map into the new runtime package

Primary output:
- a field inventory and migration map

Tasks:

1. Audit current top-level sections in `assistive_package.yaml`:
   - `ground_truth`
   - `diagnostic`
   - `prose`
   - `discussion`
   - `derived`
   - `integrity`

2. For each field, assign one disposition:
   - keep and move
   - keep and rename
   - derive elsewhere
   - remove from final runtime package

3. Produce the target mapping:
   - `ground_truth` -> `analytic_core`
   - `diagnostic` -> `diagnostic_support`
   - `prose.entry_prompts` -> `front_door_support.sentence_frame_seeds`
   - `prose.consensus_check` -> `discussion_support.consensus_checks`
   - `discussion` -> `discussion_support`
   - `derived.prior_exposure` -> `analytic_core.prior_exposure`
   - `derived.calibration_warnings` -> `teacher_support.calibration_warnings`
   - `integrity` -> `package_meta.integrity`

4. Decide how much raw analytical structure remains in the final package.

Default recommendation:
- keep app-useful hidden truth in `analytic_core`
- remove or shrink analytical trace that exists only for authoring audit

Deliverable:
- update `framework/docs/runtime-package-refactor.md` if the mapping decisions
  materially differ from the current proposal

### Workstream B: Schema Refactor

Goal:
- rewrite shared schemas to reflect the new runtime-first package

#### B1. `framework/schemas/assistive_package.yaml`

Required changes:

1. Replace the current top-level structure with:
   - `package_meta`
   - `analytic_core`
   - `front_door_support`
   - `diagnostic_support`
   - `discussion_support`
   - `review_support`
   - `teacher_support`

2. Define `package_meta` fields:
   - `story_id`
   - `episode_number`
   - `scenario_id`
   - `schema_version`
   - optional `integrity`

3. Define `front_door_support` fields:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`

4. Define enough structure for each front-door block to support Lens directly.

Recommended fields:

- Common:
  - `passage_id`
  - `support_id`
  - `use_when`
  - optional `lens`
  - optional `source_turns`

- `attention_targets`
  - `text`

- `sentence_frame_seeds`
  - `frame`
  - `seed`

- `modeled_episode_examples`
  - `model_text`
  - `why_this_counts`
  - `handoff_prompt`

- `transfer_examples`
  - `example_text`
  - `why_this_counts`
  - `handoff_prompt`

5. Define `diagnostic_support` around current app-usable diagnostic content:
   - probes
   - interventions
   - struggle calibration

6. Define `discussion_support`:
   - discussion cues
   - talk moves
   - consensus checks

7. Define `review_support` as a reserved or partial section if current authored
   inputs do not yet populate it fully.

8. Define `teacher_support`:
   - calibration warnings at minimum
   - leave room for later facilitation-facing fields

9. Define `analytic_core`:
   - passage truth
   - lens visibility
   - prior exposure
   - other hidden app-usable indexing data

#### B2. `framework/schemas/prose.yaml`

Required changes:

1. Refactor the prose schema so it authors front-door support raw material in a
   way that maps cleanly into the runtime package.

2. Replace or supersede the earlier `explicit_scaffolds` concept with the full
   four-part front-door model:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`

3. Decide whether `entry_prompts` remains:
   - as a legacy field temporarily
   - or is fully absorbed into `sentence_frame_seeds`

Default recommendation:
- absorb `entry_prompts` into `sentence_frame_seeds`

4. Keep `episode_opening`.

5. Keep `consensus_check` only if it remains authored here before projection
   into `discussion_support.consensus_checks`.

#### B3. `framework/schemas/diagnostic.yaml`

Required changes:

1. Keep the core structure intact:
   - probes
   - interventions
   - struggle calibration

2. Add clarifying comments only if needed:
   - `worked_example` content may be reused or lifted into runtime
     `front_door_support`, but diagnostic remains the owner of reactive support

3. Do not move startup-scaffold ownership into diagnostic.

#### B4. `framework/schemas/discussion.yaml`

Required changes:

1. Minimal or no structural change.
2. Keep discussion cues and talk moves as the authored source for
   `discussion_support`.

### Workstream C: Merge Script Refactor

Goal:
- turn the merge script into a runtime projection layer

Primary file:
- `framework/pipeline/scripts/merge_assistive_package.py`

Required changes:

1. Change the output shape to the new runtime-first package.

2. Stop treating the authored files as top-level runtime sections.

3. Project authored content into:
   - `package_meta`
   - `analytic_core`
   - `front_door_support`
   - `diagnostic_support`
   - `discussion_support`
   - `review_support`
   - `teacher_support`

4. Preserve and adapt integrity checks as needed.

5. Ensure student-facing runtime fields remain free of hidden IDs and internal
   terminology.

6. Add deterministic lifting or reshaping logic where useful.

Examples:
- prose-authored sentence frames -> `front_door_support.sentence_frame_seeds`
- prose-authored modeled examples -> `front_door_support.modeled_episode_examples`
- prose-authored transfer examples -> `front_door_support.transfer_examples`
- `diagnostic.worked_example` may inform or validate front-door items, but the
  runtime package should not require the app to mine diagnostic ladders for
  startup help

7. Preserve derivations such as `prior_exposure`, but move them into the new
   runtime section.

8. Move `calibration_warnings` into a teacher-facing section.

9. Keep the script deterministic.

Recommended implementation note:
- Do not attempt a giant clever abstraction pass first. Rewrite the output
  assembly clearly and explicitly.

### Workstream D: Reviewer Update

Goal:
- ensure quality checks reflect the new runtime package and front-door support

Primary file:
- `framework/pipeline/agents/package_reviewer.md`

Required changes:

1. Add explicit front-door support review criteria.

2. Evaluate whether front-door support:
   - exists where needed
   - is passage-specific
   - is student-sounding
   - avoids hidden IDs and framework leakage
   - hands students back to the episode
   - does not collapse into answer-key behavior

3. Continue checking:
   - register consistency
   - barrier integrity
   - creative non-convergence where relevant
   - boundary purity

4. Update references to the old top-level merged package shape.

Recommended new review criterion:
- `front-door usefulness`: sampled front-door supports should clearly reduce
  startup difficulty for a novice without replacing the task

### Workstream E: Claude Command Update

Goal:
- update operator-facing command expectations to match the new runtime package

Primary file:
- `.claude/commands/build_assistive_package.md`

Required changes:

1. Update the command description so the final artifact is described as a
   runtime-first package.

2. Update step descriptions if they imply the merge is a simple concatenation.

3. Update final success criteria to mention:
   - runtime-first package output
   - front-door support as part of the package

4. Update any docs or references in command text that still describe the old
   merged structure.

Secondary files to inspect:
- `.claude/commands/create_transcript.md`
- any other command docs that describe the final assistive package shape

Only change these if they contain stale assumptions.

### Workstream F: Claude Agent Prompt Update

Goal:
- align authoring prompts with the new package contract

#### F1. `prose_agent`

Primary file:
- `framework/pipeline/agents/prose_agent.md`

Required changes:

1. Make front-door support a first-class prose responsibility.

2. Author these blocks explicitly:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`

3. Preserve `episode_opening`.

4. Preserve consensus-check writing if still authored here.

5. Clarify that prose may reuse or lift strong material from:
   - analyst output
   - diagnostic `worked_example` content

6. Re-emphasize that all student-facing text must:
   - be 6th-grade readable
   - avoid hidden IDs and internal jargon
   - hand students back to the episode

#### F2. `diagnostic_agent`

Primary file:
- `framework/pipeline/agents/diagnostic_agent.md`

Required changes:

1. Keep ownership of:
   - orientation probes
   - explanation probes
   - intervention ladders
   - struggle calibration

2. Clarify boundary:
   - diagnostic owns reactive support
   - it does not own front-door support

3. Preserve `worked_example` rung quality because those remain valuable source
   material and may still be exposed inside reactive ladders.

#### F3. `discussion_agent`

Primary file:
- `framework/pipeline/agents/discussion_agent.md`

Required changes:

1. Minimal or no role change.
2. Update wording only where it refers to the old merged package shape.

### Workstream G: Documentation Update

Goal:
- align live documentation with the new refactor

Primary files:

- `framework/docs/artifacts-generation.md`
- `framework/docs/architecture.md` if needed
- `apps/lens/docs/instructional-design.md` if it needs alignment to the new
  runtime-first framing

Required changes:

1. Update descriptions of `assistive_package.yaml` so it is described as a
   runtime-first package.

2. Update prose-layer descriptions to reflect the full front-door support
   system.

3. Avoid leaving live docs that describe the merged package as a simple
   `ground_truth + diagnostic + prose + discussion` container.

### Workstream H: Pilot Regeneration And Verification

Goal:
- validate the refactor on a controlled set of episodes

Pilot set:
- `artifacts/the-field-trip/episodes/episode_01`
- `artifacts/the-field-trip/episodes/episode_02`
- `artifacts/the-field-trip/episodes/episode_03`

Tasks:

1. Regenerate the authored files if needed.
2. Build the new runtime package.
3. Validate against the updated schema.
4. Review front-door support quality manually.

What to inspect specifically:

- Does each episode include useful `attention_targets`?
- Do `sentence_frame_seeds` help articulation rather than repeat generic stems?
- Do `modeled_episode_examples` point to real moments and explain them clearly?
- Do `transfer_examples` simplify the pattern without drifting away from the
  episode?
- Do all front-door supports end by returning students to the episode?

## Task Checklist By File

### Required file edits

- `framework/schemas/assistive_package.yaml`
- `framework/schemas/prose.yaml`
- `framework/pipeline/scripts/merge_assistive_package.py`
- `framework/pipeline/agents/package_reviewer.md`
- `framework/pipeline/agents/prose_agent.md`
- `.claude/commands/build_assistive_package.md`
- `framework/docs/artifacts-generation.md`

### Likely file edits

- `framework/pipeline/agents/diagnostic_agent.md`
- `framework/pipeline/agents/discussion_agent.md`
- `apps/lens/docs/instructional-design.md`

### Possible file edits

- `.claude/commands/create_transcript.md`
- any helper scripts or docs that assume the old merged package structure

## Recommended Execution Sequence

Use this exact order unless a dependency forces a change.

1. Read:
   - `framework/docs/runtime-package-refactor.md`
   - this implementation plan

2. Update `framework/schemas/assistive_package.yaml`

3. Update `framework/schemas/prose.yaml`

4. Refactor `merge_assistive_package.py`

5. Update `package_reviewer.md`

6. Update `prose_agent.md`

7. Update `diagnostic_agent.md` and `discussion_agent.md` only as needed

8. Update `.claude/commands/build_assistive_package.md`

9. Update supporting docs

10. Regenerate `the-field-trip` pilot episodes

11. Validate and review outputs

12. Only after the package is stable, hand off to Lens implementation work

## Verification Checklist

Before calling the refactor done, verify:

1. Schema validation passes for the new `assistive_package.yaml`.
2. The merge script runs successfully.
3. Student-facing fields do not leak internal IDs.
4. Front-door support appears in all pilot episodes.
5. Front-door support is clearly different from reactive ladders.
6. The package remains deterministic and app-consumable.

## Risks

1. Overloading prose with too much responsibility.
   Mitigation:
   keep prose responsible only for short pre-authored startup language, not
   reactive routing logic.

2. Duplicating content between front-door support and diagnostic ladders.
   Mitigation:
   allow controlled reuse, but make the runtime contract explicit so apps do not
   depend on duplication.

3. Carrying too much analytical trace into the runtime package.
   Mitigation:
   keep `analytic_core` narrow and app-useful.

4. Leaving stale docs or prompts that describe the old merged package.
   Mitigation:
   explicitly inspect command docs, prompts, and live framework docs.

## Default Decisions

Unless implementation reveals a serious blocker, use these defaults:

1. Clean schema-version cut rather than long compatibility layering.
2. Absorb `entry_prompts` into `sentence_frame_seeds`.
3. Move `consensus_check` into `discussion_support.consensus_checks`.
4. Keep diagnostic ladders as reactive support only.
5. Keep front-door support owned by prose.

## Final Handoff

If another agent wants the shortest possible summary:

1. Keep the current four generated authoring files.
2. Refactor the merged package into runtime sections.
3. Add first-class `front_door_support` with four support types:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`
4. Update the prose schema and prose agent to author those materials.
5. Update the merge script to project everything into the new runtime shape.
6. Update reviewer criteria and the build command docs.
7. Pilot the refactor on `the-field-trip` episodes 1-3.
