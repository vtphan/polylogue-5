# Runtime Package Refactor Roadmap

This document breaks the runtime-package refactor into phases.

Use it alongside:

- `framework/docs/runtime-package-refactor.md`
- `framework/docs/runtime-package-refactor-implementation-plan.md`

This roadmap exists so another agent can understand not only what Phase 1 is,
but also what comes after it and why.

This is a high-level sequencing document. The detailed source of truth for the
runtime contract is:

- `framework/docs/runtime-package-refactor.md`
- `framework/docs/runtime-package-refactor-implementation-plan.md`

When this roadmap and those documents differ, follow the detailed design and
implementation documents.

## Roadmap Summary

The runtime-package refactor should proceed in four phases:

1. `Phase 1` — establish first-class front-door support and begin the
   runtime-first package reshape for no-LLM downstream apps
2. `Phase 2` — complete the deterministic runtime package around the full
   instructional journey sections that a no-LLM app can actually use
3. `Phase 3` — integrate Lens against the new package and validate the student
   experience
4. `Phase 4` — generalize and harden the package for additional downstream apps

## Phase 1

### Goal

Fix the highest-leverage product gap first: startup support.

Establish a deterministic retrieval contract for a no-LLM downstream app.

### Why this comes first

The biggest current risk is that students cannot get traction:

- they do not know where to look
- they do not know how to say what they notice
- they do not know what a flaw looks like in the actual episode
- they may be overloaded by episode complexity before they begin

### Deliver

1. First-class `front_door_support`
2. New runtime package sections at minimum:
   - `package_meta`
   - `analytic_core`
   - `front_door_support`
   - `diagnostic_support`
   - `discussion_support`
3. The four approved startup support types:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`
4. Prose authoring updates for these supports
5. Merge-script projection into the new top-level runtime shape
6. Reviewer criteria for front-door support
7. Shared app-check model and trigger vocabulary for no-LLM retrieval
8. Deterministic retrieval rules for matching, specificity, and fallback

### Preserve

As much as possible, keep these stable in Phase 1:

- diagnostic probes
- intervention ladders
- struggle calibration
- discussion cues
- talk moves

Defer from Phase 1:

- `review_support`

Reason:
- the current refactor assumes no LLM at runtime, so review support should not
  ship until there is a deterministic non-LLM review flow

### Primary files

- `framework/reference/app_check_model.yaml`
- `framework/schemas/assistive_package.yaml`
- `framework/schemas/prose.yaml`
- `framework/pipeline/scripts/merge_assistive_package.py`
- `framework/pipeline/agents/prose_agent.md`
- `framework/pipeline/agents/package_reviewer.md`
- `.claude/commands/build_assistive_package.md`

### Pilot validation

Use:

- `the-field-trip` episode 1
- `the-field-trip` episode 2
- `the-field-trip` episode 3

### Exit criteria

Phase 1 is complete when:

1. `front_door_support` is first-class in the package
2. the four support types exist in schema and outputs
3. startup support is no longer limited to generic `entry_prompts`
4. trigger labels and thresholds are defined in shared reference data
5. the package reviewer checks front-door support quality and deterministic
   retrievability
6. the pilot episodes regenerate successfully

## Phase 2

### Goal

Complete the deterministic runtime package so it reflects the full
instructional journey sections a no-LLM downstream app can actually use.

### Why this comes second

Phase 1 makes the package startable.
Phase 2 makes the package instructionally broader without breaking the
deterministic no-LLM contract.

Lens needs more than startup help. It also needs strong support for:

- teacher debrief and facilitation
- cleaner hidden runtime truth
- clearer separation between student-facing and teacher-facing runtime support
- deterministic discussion and diagnostic retrieval beyond startup

### Deliver

1. Add or fully define:
   - `teacher_support`
   - concrete trigger vocabularies for `diagnostic_support` and
     `discussion_support`
2. Refine `analytic_core` so it contains app-useful hidden structure rather
   than oversized authoring trace
3. Move package fields into their final runtime sections
4. Update reviewer criteria to cover the fuller runtime package
5. Update live docs so they describe the runtime-first package clearly
6. Decide whether `review_support` remains deferred or gains a deterministic
   non-LLM review flow

### Likely package targets

- `teacher_support`
  - calibration warnings
  - likely sticking points
  - debrief hooks
  - facilitation-facing notes

- `diagnostic_support`
  - explicit trigger enums tied to checks, retries, or missing selections

- `discussion_support`
  - explicit phase-based retrieval with optional focus selectors

- `analytic_core`
  - keep:
    - passage truth
    - turn references
    - prior exposure
    - lens and facet indexing
  - prune:
    - anything useful only for authoring audit and not for runtime consumption

### Files likely involved

- `framework/schemas/assistive_package.yaml`
- `framework/pipeline/scripts/merge_assistive_package.py`
- `framework/pipeline/agents/package_reviewer.md`
- `framework/docs/artifacts-generation.md`
- `apps/lens/docs/instructional-design-v1.md`

Potentially:
- future shared facilitation or review-support schemas if needed

### Exit criteria

Phase 2 is complete when:

1. the package cleanly supports startup, diagnosis, discussion, and
   teacher-facing use under deterministic no-LLM retrieval
2. `teacher_support` is first-class and usable
3. `analytic_core` is meaningfully cleaner than the old merged analytical trace
4. the runtime package no longer feels like a lightly reshuffled authoring dump
5. the team has made an explicit decision about whether `review_support`
   remains deferred or moves into a later deterministic review phase

## Phase 3

### Goal

Make Lens consume the new runtime package and validate whether the new package
actually improves student entry and discussion.

### Why this comes third

The package should stabilize before Lens hardens around it. But after the
package is coherent, product learning has to come from the app, not from more
schema theorizing.

### Deliver

1. Lens runtime integration for:
   - `front_door_support`
   - `diagnostic_support`
   - `discussion_support`
   - `teacher_support` where relevant
   - `review_support` only if a deterministic non-LLM review flow was defined
2. App sequencing policies for startup scaffolds
3. UI states for:
   - cannot start
   - low articulation
   - wrong focus
   - after check fail
4. Early design validation on whether students:
   - get traction faster
   - articulate flaws more clearly
   - discuss more productively

### Lens-specific policy work

Phase 3 should decide runtime sequencing such as:

1. `attention_target`
2. `sentence_frame_seed`
3. `modeled_episode_example`
4. `transfer_example`

This policy may remain configurable, but Lens should pick a default and test
it. In a no-LLM app, this is better treated as a state-machine projection than
as a strict linear staircase.

### Files likely involved

Primarily under `lens-app/`, depending on how scenarios and session state are
currently wired.

Also likely:
- any importer or artifact-loading code that reads `assistive_package.yaml`

### Exit criteria

Phase 3 is complete when:

1. Lens reads the new runtime package cleanly
2. Lens no longer depends on the old merged structure
3. startup scaffolds appear in the right runtime moments
4. the team has concrete evidence about whether the new front-door support
   improves the intended student experience

## Phase 4

### Goal

Generalize the refactored runtime package for additional downstream apps
without re-Lens-ifying the shared contract.

### Why this comes last

Lens should teach the team which abstractions are real before the shared
package is generalized aggressively.

### Deliver

1. Validate the package against at least one additional downstream-app concept
2. Identify which runtime sections are truly shared
3. Separate Lens-specific assumptions from framework-level contract where
   needed
4. Harden the package and docs for broader downstream adoption

### Questions to answer

1. Which front-door support assumptions are truly general?
2. Which sections are useful to non-Lens apps as-is?
3. Does another app want the same `diagnostic_support` shape?
4. Are some runtime sections better exposed through narrower projections?
5. Which app-check-model assumptions belong in shared reference data versus
   app-specific adapters?

### Exit criteria

Phase 4 is complete when:

1. the runtime package is credible as a shared downstream contract
2. Lens is well-supported without the shared package becoming Lens-only
3. another downstream app can consume the package without reverse-engineering
   Lens assumptions

## Immediate Recommendation

Do not start Phase 3 before Phase 1 is stable.

Do not try to fully solve Phase 4 before Lens has taught you where the real
shared abstractions are.

The correct near-term path is:

1. execute Phase 1
2. complete Phase 2 if the package still has obvious runtime gaps
3. then begin serious Lens integration work

## Short Handoff

If another agent wants the shortest roadmap summary:

1. `Phase 1`: add front-door support and begin runtime-first restructure
2. `Phase 2`: complete the package across review, teacher, and analytic-core
   sections
3. `Phase 3`: integrate Lens and validate the student experience
4. `Phase 4`: generalize for additional downstream apps
