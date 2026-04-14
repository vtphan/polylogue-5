# Runtime Package Refactor

This document specifies a refactor of the assistive-package architecture.

The core decision is:

- keep the current multi-agent authoring split
- refactor the merged `assistive_package.yaml` into a runtime-first contract

This is an implementation-facing document. Another agent should be able to use
it as the primary handoff spec for the refactor.

## Why This Refactor Exists

The current pipeline is strong at authoring specialized downstream materials,
but the final merged package is still shaped too much by authoring boundaries:

- `ground_truth`
- `diagnostic`
- `prose`
- `discussion`

That split is useful for generation quality, but it is not the best structure
for Lens or future downstream apps to consume.

The main product problem is at the front door:

- the package already supports students who have some traction
- the package is weaker at getting novice students into the task in the first place

Lens needs startup scaffolds that reduce initial cognitive load without
collapsing the activity into answer-key behavior. That support should be a
first-class part of the runtime package, not buried deep inside diagnostic
ladders.

## Goals

1. Make `assistive_package.yaml` reflect the student journey rather than the
   authoring-agent split.
2. Add strong first-class front-door support for novice students.
3. Preserve the current authoring pipeline's modularity and quality controls.
4. Make the final package easier for Lens to consume directly.
5. Make the final package more portable to future downstream apps that may not
   share Lens's exact flow.

## Non-Goals

1. Do not collapse the four downstream authoring artifacts into one file.
2. Do not make apps read raw authoring files directly.
3. Do not weaken the information barrier.
4. Do not remove reactive diagnostics, struggle calibration, or discussion
   supports.
5. Do not optimize for backward compatibility if it slows the refactor
   significantly. Lens is still early.

## Current State

### Current authoring artifacts

These files are authoring-shaped artifacts and should remain so:

- `ground_truth_generated.yaml`
- `diagnostic_generated.yaml`
- `prose_generated.yaml`
- `discussion_generated.yaml`

Each exists because one agent owns one cognitive job.

### Current merged runtime artifact

The final artifact is:

- `assistive_package.yaml`

Today this file is a hybrid. Some sections are runtime-friendly, but the
overall shape still mirrors authoring outputs.

Roughly:

- `ground_truth` is mostly analytical trace
- `diagnostic` is partially runtime-ready
- `prose` is runtime-ready
- `discussion` is runtime-ready
- `derived` mixes runtime support and hidden metadata
- `integrity` is pipeline metadata, not pedagogy

## Refactor Principle

Keep the authoring split.

Refactor only the merged package.

The merge step should stop acting like a concatenation layer and start acting
like a runtime projection layer. The final package should answer:

- what support the app can give a student now
- what support the teacher can use now
- what hidden truth and indexing the app needs

It should not primarily answer:

- which authoring agent originally wrote this material

## Target Runtime Structure

The new `assistive_package.yaml` should be organized around instructional
function.

### 1. `front_door_support`

Purpose:
- help students get started before they have strong traction
- reduce search-space and language-production load
- preserve productive struggle by handing students back to the episode

This is the major new runtime section.

Proposed sub-blocks:

- `attention_targets`
- `sentence_frame_seeds`
- `modeled_episode_examples`
- `transfer_examples`

### 2. `diagnostic_support`

Purpose:
- support student-state-reactive help after initial engagement
- preserve the existing productive-struggle architecture

Proposed contents:

- orientation probes
- explanation probes
- intervention ladders
- misread redirects
- struggle calibration

### 3. `discussion_support`

Purpose:
- support group-phase work once students have individual footholds

Proposed contents:

- discussion cues
- talk moves
- consensus checks

### 4. `review_support`

Purpose:
- support the AI-review and revision phase

Proposed contents:

- AI perspective
- AI reflection prompts
- revision prompts if present later

Note:
- the current package may not yet expose this as a fully separate authored
  block. It is still useful to reserve the section in the runtime design.

### 5. `teacher_support`

Purpose:
- give the teacher high-value live-use support

Proposed contents:

- calibration warnings
- likely sticking points
- debrief hooks
- facilitation-facing notes

This may require future alignment with facilitation outputs if they remain
outside the shared package.

### 6. `analytic_core`

Purpose:
- hold hidden analytical truth the app may need for matching, routing, and
  sequencing

Proposed contents:

- passage metadata
- turn references
- facet and lens truth
- prior exposure
- any hidden runtime indexing needed by apps

### 7. `package_meta`

Purpose:
- store package-level operational metadata

Proposed contents:

- `story_id`
- `episode_number`
- `scenario_id`
- `schema_version`
- integrity-check info if still kept in the package

## Front-Door Support

This section is the main pedagogical addition.

### Rationale

The current package already has strong reactive help, especially inside
diagnostic ladders and `worked_example` rungs. But that material is too buried
to function as clean startup support.

Front-door support should be:

- available before a student has produced a good diagnosis
- simple for Lens to sequence
- lightweight enough not to collapse the task
- explicit enough to help a novice begin

### Chosen approaches

The front-door runtime section should support exactly these four approaches:

1. `attention_target`
2. `sentence_frame_seed`
3. `modeled_episode_example`
4. `transfer_example`

No other front-door approach is required in this refactor.

### Why these four

They cover distinct startup failure modes:

- `attention_target`: the student does not know where to look
- `sentence_frame_seed`: the student has a vague intuition but cannot say it
- `modeled_episode_example`: the student needs to see what a real episode flaw
  looks like
- `transfer_example`: the episode itself is too cognitively loaded, so the
  pattern needs to be simplified outside the episode first

Together they form a coherent progression from least revealing to most
supportive.

### Runtime sequencing expectation

The package should support this intended progression:

1. attention target
2. sentence frame + seed
3. modeled episode example
4. transfer example

Apps may choose a different sequencing policy, but the package should be
authored with this escalation path in mind.

### Required design rule

Every front-door support item must end by handing the student back to the
episode.

The point is not to replace the activity. The point is to make the activity
startable.

### `attention_targets`

Purpose:
- narrow attention to one turn, phrase, comparison, or missing question

Shape:
- very short
- usually one sentence
- not a diagnosis

Example shape:

```yaml
attention_targets:
  - passage_id: p1
    support_id: p1_at_01
    use_when: cannot_start
    source_turns: [t02]
    text: "Look closely at what Sam means when she asks, 'Certified for what?'"
```

### `sentence_frame_seeds`

Purpose:
- help students articulate a thought they partly have but cannot phrase

Shape:
- one sentence frame
- one short content seed tied to the episode

Example shape:

```yaml
sentence_frame_seeds:
  - passage_id: p1
    support_id: p1_sf_01
    use_when: vague_guess
    lens: evidence
    frame: "This sounds convincing at first, but it doesn't actually show ___ because ___."
    seed: "Jordan keeps repeating that the zoo is 'certified.'"
```

### `modeled_episode_examples`

Purpose:
- explicitly model one flaw in one real episode moment

Shape:
- name the move in plain language
- explain why it is weak or incomplete
- hand the student back to the passage

Example shape:

```yaml
modeled_episode_examples:
  - passage_id: p1
    support_id: p1_me_01
    use_when: cannot_start
    lens: logic
    source_turns: [t01]
    model_text: >
      Maya acts like "roller coasters involve physics" automatically proves
      the park would teach physics.
    why_this_counts: >
      That is weak because something can involve a subject without actually
      teaching it. She never explains what students would study or do there.
    handoff_prompt: >
      Find the part of Maya's turn where she jumps from "this has physics in
      it" to "this would be the best field trip."
```

### `transfer_examples`

Purpose:
- simplify the pattern outside the episode when the episode itself is the
  barrier

Shape:
- parallel example
- plain-language explanation
- return-to-episode handoff

Example shape:

```yaml
transfer_examples:
  - passage_id: p1
    support_id: p1_te_01
    use_when: after_misread
    lens: evidence
    example_text: >
      A student says, "This camp must be the best because its own website says
      it wins awards."
    why_this_counts: >
      That is weak because the camp's website is trying to make itself look
      good. It may have useful information, but it does not settle the choice.
    handoff_prompt: >
      In this episode, who treats an official-looking source as if it settles
      the whole question?
```

### Authoring ownership

The default authoring owner for front-door support should be `prose`.

Reason:
- these supports are short
- they are student-facing
- they are pre-authored
- they are not primarily reactive ladders

However, the prose agent should be allowed to reuse or lift material from:

- `ground_truth`
- `diagnostic`, especially strong `worked_example` rungs

This is a projection problem, not a purity ritual. The package should not force
excellent modeled content to remain trapped in the wrong section.

## Mapping Current Content To The New Runtime Structure

This section defines the intended migration map.

### From `ground_truth_generated.yaml`

Map into `analytic_core`:

- passages
- turn references
- facet truth
- lens visibility
- prior-exposure inputs

Do not expose unnecessary analytical trace directly if it does not serve app
consumption.

Potential rule:
- keep what apps need for routing, matching, and hidden truth
- drop or demote what is only useful for authoring audit

### From `diagnostic_generated.yaml`

Map into `diagnostic_support`:

- facet probes
- explanation probes
- intervention ladders
- struggle calibration
- misread redirects

Potential front-door lifts:
- selected `worked_example` rungs may be copied or transformed into
  `modeled_episode_examples`
- selected ladder openings may inform `attention_targets`

### From `prose_generated.yaml`

Map into:

- `front_door_support`
- `discussion_support`

Specific mapping:

- `entry_prompts` -> likely `sentence_frame_seeds` or adjacent startup support
- `consensus_check` -> `discussion_support.consensus_checks`
- current or future `explicit_scaffolds` -> `front_door_support`

### From `discussion_generated.yaml`

Map into `discussion_support`:

- discussion cues
- talk moves

### From `derived`

Map into:

- `analytic_core.prior_exposure`
- `teacher_support.calibration_warnings` when teacher-facing

### From `integrity`

Map into:

- `package_meta.integrity`

If downstream apps do not need integrity metadata, it may remain in the file
for pipeline visibility but should not be treated as pedagogical runtime
content.

## Proposed Runtime Schema Sketch

This is intentionally schematic, not final validator syntax.

```yaml
package_meta:
  story_id: the-field-trip
  episode_number: 1
  scenario_id: the-field-trip-ep-01
  schema_version: 0.2.0
  integrity:
    checks_passed: 14
    checks_total: 14
    timestamp: "..."

analytic_core:
  passages: [...]
  prior_exposure: [...]
  calibration_warnings: [...]

front_door_support:
  attention_targets: [...]
  sentence_frame_seeds: [...]
  modeled_episode_examples: [...]
  transfer_examples: [...]

diagnostic_support:
  probes:
    facet: ...
    explanation: ...
  interventions: ...
  struggle_calibration: ...

discussion_support:
  discussion_cues: ...
  talk_moves: [...]
  consensus_checks: [...]

review_support:
  ai_perspective: ...
  reflection_prompts: [...]

teacher_support:
  debrief_hooks: [...]
  likely_sticking_points: [...]
```

## Migration Strategy

### Step 1: Write the new live schema

Create or revise the shared assistive-package schema so the final package is
runtime-first.

Required outputs:

- updated `framework/schemas/assistive_package.yaml`
- explicit definition of the four front-door blocks

### Step 2: Decide what remains in the final package

Produce a field inventory table with four decisions per field:

- keep and move
- keep and rename
- derive from another field
- remove from runtime package

This audit should be done before editing prompts or the merge script.

### Step 3: Refactor the merge script

`framework/pipeline/scripts/merge_assistive_package.py` should be refactored
from a merger into a projector.

New responsibilities:

- map authored inputs into runtime sections
- lift selected content into `front_door_support`
- preserve integrity checks
- avoid leaking hidden terminology into student-facing fields

### Step 4: Align authoring prompts

Update prompts only after the target runtime structure is settled.

Expected changes:

- `prose_agent`: explicitly author the front-door blocks or the raw material
  for them
- `diagnostic_agent`: continue writing reactive ladders; do not become the
  owner of startup scaffolds
- `package_reviewer`: add front-door support quality checks

### Step 5: Update reviewer logic

The package reviewer should explicitly check:

- front-door support exists when needed
- the four chosen support types are passage-specific
- startup supports are student-sounding
- they do not leak hidden IDs
- they hand students back to the episode rather than closing the task

### Step 6: Regenerate a pilot set

Use `the-field-trip` episodes 1-3 as the first regeneration and review set.

Reason:
- these episodes already contain strong candidate content
- they demonstrate the current gap clearly
- they are sufficient to evaluate the new front-door section

## Implementation Order

Recommended order:

1. Audit current fields
2. Write new runtime schema
3. Write a short migration map
4. Refactor merge script
5. Update reviewer
6. Update prompts
7. Regenerate `the-field-trip` episodes 1-3
8. Review outputs before touching Lens runtime code

Do not let Lens start depending on the old merged structure if this refactor is
already approved.

## Open Questions

These questions should be resolved during implementation:

1. Should `entry_prompts` remain a separate runtime block, or be fully absorbed
   into `sentence_frame_seeds`?
2. Should `consensus_check` live under `discussion_support` only, or also be
   exposed in a teacher-facing section?
3. How much of `ground_truth` should remain verbatim in the final package versus
   being reprojected into smaller hidden runtime tables?
4. Should the refactor ship as a clean cut to a new schema version, or should
   the merge script temporarily emit a compatibility format?

Default recommendation:
- absorb `entry_prompts` into `sentence_frame_seeds`
- move `consensus_check` into `discussion_support`
- keep only app-useful analytics in `analytic_core`
- use a clean schema-version cut unless an active consumer blocks it

## Exit Criteria

The refactor is complete when all of the following are true:

1. `assistive_package.yaml` is runtime-first and no longer mirrors the
   authoring-agent split as its top-level structure.
2. The package includes the four front-door support approaches as first-class
   sections.
3. The merge script builds the new package shape deterministically.
4. Reviewer criteria explicitly evaluate front-door support quality.
5. `the-field-trip` episodes 1-3 regenerate successfully and demonstrate useful
   startup supports.
6. Another agent can implement Lens consumption without reading raw authoring
   files or reverse-engineering diagnostic ladders for startup help.

## Short Handoff Summary

If another agent reads only this section, the assignment is:

1. Keep the current four authoring artifacts.
2. Refactor `assistive_package.yaml` into a runtime-first structure.
3. Add first-class `front_door_support` with:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`
4. Keep reactive ladders under `diagnostic_support`.
5. Refactor the merge script accordingly.
6. Regenerate and review `the-field-trip` episodes 1-3 as the pilot.
