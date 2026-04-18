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

## Downstream Runtime Assumption

This refactor should assume the downstream app has no LLM and no semantic free
text interpretation.

The runtime package should therefore optimize for:

- deterministic retrieval
- simple app-observable triggers
- exact-match or threshold-based routing
- authored support that can be selected without model inference

The package should not depend on:

- semantic interpretation of student writing
- semantic interpretation of group discussion
- AI-generated runtime explanations

## App Check Model

The no-LLM downstream app should expose a small deterministic check model. The
runtime package is authored against this model.

Required app events:

- `response_started`
- `response_submitted`
- `selection_made`
- `check_run`
- `check_failed`
- `check_passed`
- `group_started`
- `group_message_sent`
- `group_ended`

Required app state:

- `phase`: `entry | individual | discussion | teacher_dashboard`
- `response_length_chars`
- `response_length_words`
- `retry_count`
- `selected_passage_id`
- `selected_turn_ids`
- `selected_character_ids`
- `selected_lens`
- `selected_facet`
- `selected_cognitive_pattern`
- `selected_social_dynamic`
- `last_check_result`: `pass | fail | none`
- `group_turn_count`
- `group_member_turn_counts`
- `supports_shown`

Derived front-door states:

- `cannot_start`:
  - no submission yet and dwell time exceeds app threshold
  - or repeated empty submissions
- `low_articulation`:
  - submission exists but is below shared minimum length threshold
- `wrong_focus`:
  - selected passage/turn/character does not intersect the authored target
    focus for the current support
- `after_check_fail`:
  - the app has run a deterministic check and the most recent result is fail

Default thresholds:

- `low_articulation_max_words`: 8
- `cannot_start_dwell_seconds`: 45
- `cannot_start_empty_submissions`: 2

These defaults should live in shared reference data alongside trigger enums so
authors and downstream apps calibrate against the same thresholds.

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

### 4. `teacher_support`

Purpose:
- give the teacher high-value live-use support

Proposed contents:

- calibration warnings
- likely sticking points
- debrief hooks
- facilitation-facing notes

This may require future alignment with facilitation outputs if they remain
outside the shared package.

### 5. `analytic_core`

Purpose:
- hold hidden analytical truth the app may need for matching, routing, and
  sequencing

Proposed contents:

- passage metadata
- turn references
- facet and lens truth
- prior exposure
- any hidden runtime indexing needed by apps

### 6. `package_meta`

Purpose:
- store package-level operational metadata

Proposed contents:

- `story_id`
- `episode_number`
- `scenario_id`
- `schema_version`
- integrity-check info if still kept in the package

Deferred from this refactor:

- `review_support`

Reason:
- a review section is not useful to a no-LLM downstream app unless the runtime
  also has deterministic review checkpoints and authored revision prompts tied
  to those checkpoints
- reserve it for a later refactor once a non-LLM review flow is specified

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

This progression is advisory metadata for authors and app logic, not a
structural requirement that every app must follow in order.

In a no-LLM app, students do not necessarily move linearly through this
staircase. The app may route directly to the matching support based on current
observable state such as `wrong_focus` or `after_check_fail`.

### Required design rule

Every front-door support item must end by handing the student back to the
episode.

The point is not to replace the activity. The point is to make the activity
startable.

### Shared support metadata contract

Every front-door support item should use the same metadata contract.

Required common fields:

- `passage_id`
- `support_id`
- `use_when`

Optional common fields:

- `lens`
- `source_turns`

Contract notes:

- `support_id` should follow `p{passage_number}_{type}_{nn}` such as
  `p1_at_01`, `p1_sf_01`, `p1_me_01`, `p1_te_01`
- `use_when` is a shared runtime enum, not prose-local vocabulary:
  - `cannot_start`
  - `low_articulation`
  - `wrong_focus`
  - `after_check_fail`
- `use_when` should live in shared reference data under `framework/reference/`
  or another single-source contract, and both `prose.yaml` and the new
  `assistive_package.yaml` should bind to that source
- `source_turns` are authored highlight hints and UI scoping hints, not a
  primary retrieval key; the app may use them to focus the current view once a
  support item has already matched

### Runtime Retrieval Contract

The downstream app should retrieve support deterministically from observable
state, not inferred student intent.

Each runtime section should use a simple trigger style that matches what the
app can actually measure:

- `front_door_support`: `use_when` plus optional selectors such as `lens` and
  `source_turns`
- `diagnostic_support`: small `trigger` enums tied to explicit app events such
  as failed checks, retries, or missing selections
- `discussion_support`: `phase` plus optional focus selectors such as
  `lens_focus`, `facet_focus`, `cognitive_pattern_focus`,
  `social_dynamic_focus`
- `teacher_support`: dashboard-style trigger enums derived from aggregate
  counts or rates

Matching rule:

1. The app filters by the current section and phase.
2. The app exact-matches trigger fields against current observable state.
3. If multiple supports match, prefer the most specific item.
4. If nothing matches, fall back to the lowest-risk generic support for that
   section.

Do not introduce a universal condition DSL unless a real app need justifies the
extra complexity.

Specificity rule:

- count the number of matched non-null selector fields beyond the base trigger
  field
- more matched selector fields wins
- if tied, use authored order within the section

Generic fallback rule:

- a support item is generic when it has the base trigger field only and no
  additional selectors such as `lens`, `source_turns`, `lens_focus`,
  `facet_focus`, or similar scoping fields

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
    use_when: low_articulation
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
    use_when: after_check_fail
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
    use_when: after_check_fail
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

Decision:
- use author-time ownership, not projection-time composition
- `prose` authors all four front-door blocks end-to-end
- the merge script may reshape, rename, and validate these fields, but it
  should not compose new student-facing front-door content from diagnostic
  ladders

The prose agent may reuse material from:

- `ground_truth`
- `diagnostic`, especially strong `worked_example` rungs

That reuse happens during prose authoring. The runtime projector should remain
deterministic and non-creative.

Operational trigger note:
- every `use_when` value should be defined in terms of app-observable signals
  such as empty response, low response length, wrong selected passage/turn, or
  failed deterministic check
- avoid trigger labels that require semantic interpretation of free text

Coverage invariant:
- every passage should provide at least one `attention_target` and one
  `sentence_frame_seed`
- `modeled_episode_examples` and `transfer_examples` may be authored more
  selectively at passage or episode scope
- this ensures the app always has a low-risk fallback when a front-door trigger
  fires

## Mapping Current Content To The New Runtime Structure

This section defines the intended migration map.

### From `ground_truth_generated.yaml`

Map into `analytic_core`:

- passages
- turn references
- facet truth
- lens visibility
- prior-exposure inputs
- target-focus fields for deterministic retrieval such as preferred passage,
  turn, and character targets

Do not expose unnecessary analytical trace directly if it does not serve app
consumption.

Potential rule:
- for the pilot, keep `analytic_core` close to the current `ground_truth`
  structure unless a field is clearly authoring-only
- tighten and shrink it only after Lens consumption makes the app-useful subset
  concrete

### From `diagnostic_generated.yaml`

Map into `diagnostic_support`:

- facet probes
- explanation probes
- intervention ladders
- struggle calibration
- misread redirects

Authoring dependency:
- diagnostic `worked_example` rungs may inform prose authoring
- diagnostic remains the owner of reactive ladders, not front-door runtime
  blocks

Runtime constraint:
- only keep diagnostic items that can be triggered by explicit app events or
  structured checkpoints
- do not require downstream apps to infer subtle misunderstanding from free
  text

### From `prose_generated.yaml`

Map into:

- `front_door_support`
- `discussion_support`

Specific mapping:

- `entry_prompts` -> likely `sentence_frame_seeds` or adjacent startup support
- `consensus_check` -> `discussion_support.consensus_checks`
- `explicit_scaffolds.type: modeled_episode_example` ->
  `front_door_support.modeled_episode_examples`
- `explicit_scaffolds.type: transfer_example` ->
  `front_door_support.transfer_examples`

### From `discussion_generated.yaml`

Map into `discussion_support`:

- discussion cues
- talk moves

Runtime constraint:
- discussion items should be retrievable from explicit phase and focus fields
- avoid triggers that require semantic reading of the live group discussion

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
  lens_visibility: [...]

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

teacher_support:
  calibration_warnings: [...]
  debrief_hooks: [...]
  likely_sticking_points: [...]
```

### Worked mapping example

One passage should project roughly like this:

```yaml
prose_generated:
  sentence_frame_seeds:
    - passage_id: p1
      support_id: p1_sf_01
      use_when: low_articulation
      lens: evidence
      frame: "This sounds convincing at first, but it doesn't actually show ___ because ___."
      seed: "Jordan keeps repeating that the zoo is 'certified.'"

assistive_package:
  front_door_support:
    sentence_frame_seeds:
      - passage_id: p1
        support_id: p1_sf_01
        use_when: low_articulation
        lens: evidence
        frame: "This sounds convincing at first, but it doesn't actually show ___ because ___."
        seed: "Jordan keeps repeating that the zoo is 'certified.'"
```

The merge step may rename or relocate fields, but it should not invent the
student-facing wording above.

A reshape case should look like this:

```yaml
prose_generated:
  entry_prompts:
    - passage_id: p1
      lens: evidence
      stem: "This sounds convincing at first, but it doesn't actually show ___ because ___."

assistive_package:
  front_door_support:
    sentence_frame_seeds:
      - passage_id: p1
        support_id: p1_sf_01
        use_when: low_articulation
        lens: evidence
        frame: "This sounds convincing at first, but it doesn't actually show ___ because ___."
        seed: ""
```

This is a reshape and normalization step, not new semantic authorship.

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

The audit should produce a field-by-field mapping table, not just prose notes.

### Step 3: Refactor the merge script

`framework/pipeline/scripts/merge_assistive_package.py` should be refactored
from a merger into a projector.

New responsibilities:

- map authored inputs into runtime sections
- project prose-authored front-door content into `front_door_support`
- preserve integrity checks
- avoid leaking hidden terminology into student-facing fields

Non-responsibilities:

- do not compose new student-facing front-door items from diagnostic ladders
- do not make semantic authorship decisions that belong in `prose`

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

Validation note:
- `validate_schema.py` should gain field-scoped checks for student-facing
  front-door text fields rather than a file-wide scan, because authored files
  may legitimately contain hidden metadata such as `lens` and `use_when`
- the field-scoped scan should cover student-facing fields such as `text`,
  `frame`, `seed`, `model_text`, `example_text`, `handoff_prompt`, and the
  equivalent prose-authored source fields

Retrieval note:
- reviewer logic should also verify that every retained runtime-facing support
  item has a deterministic retrieval path for a no-LLM app

For pilot scope, the reviewer should use these concrete trigger vocabularies:

- `front_door_support.use_when`:
  - `cannot_start`
  - `low_articulation`
  - `wrong_focus`
  - `after_check_fail`
- `diagnostic_support.trigger`:
  - `after_check_fail`
  - `after_repeat_fail`
  - `missing_selection`
  - `low_confidence`
- `discussion_support.phase`:
  - `group_start`
  - `mid_discussion`
  - `group_wrap_up`
- `teacher_support.trigger`:
  - `many_students_cannot_start`
  - `many_students_wrong_focus`
  - `high_retry_rate`
  - `low_discussion_participation`

If any section needs additional trigger vocabulary beyond this pilot set, it
should be explicitly added to the schema or explicitly deferred rather than
left implicit.

Migration note:
- legacy prose artifacts that use `vague_guess` should map to
  `low_articulation`
- legacy prose artifacts that use `after_misread` should map to
  `after_check_fail`
- this rename should happen once in migration/update tooling rather than as an
  indefinite runtime compatibility layer

### Step 6: Regenerate a pilot set

Use `the-field-trip` episodes 1-3 as the first regeneration and review set.

Reason:
- these episodes already contain strong candidate content
- they demonstrate the current gap clearly
- they are sufficient to evaluate the new front-door section

Schema-cut note:
- if the refactor ships as a clean schema-version cut, episodes 4-10 of
  `the-field-trip` must either be regenerated to the new package shape or
  explicitly marked as legacy/orphaned artifacts until revisited

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

1. Should `consensus_check` live under `discussion_support` only, or also be
   exposed in a teacher-facing section?
2. After the pilot, which parts of near-verbatim `ground_truth` should remain
   in `analytic_core` versus being tightened into smaller hidden runtime tables?
3. Should the refactor ship as a clean cut to a new schema version, or should
   the merge script temporarily emit a compatibility format?

Default recommendation:
- move `consensus_check` into `discussion_support`
- keep `analytic_core` close to current `ground_truth` for the pilot, then
  narrow it once Lens consumption is concrete
- use a clean schema-version cut unless an active consumer blocks it

## Exit Criteria

The refactor is complete when all of the following are true:

1. `assistive_package.yaml` is runtime-first and no longer mirrors the
   authoring-agent split as its top-level structure.
2. The package includes the four front-door support approaches as first-class
   sections.
3. The merge script builds the new package shape deterministically.
4. Reviewer criteria explicitly evaluate front-door support quality and
   deterministic retrievability for a no-LLM app.
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
4. Keep front-door authorship in `prose`; keep reactive ladders in
   `diagnostic_support`.
5. Make `use_when` and `support_id` explicit shared runtime contract fields,
   with `use_when` defined in app-observable no-LLM terms.
6. Defer `review_support` until a non-LLM review flow is specified.
7. Refactor the merge script accordingly.
8. Regenerate and review `the-field-trip` episodes 1-3 as the pilot, then
   decide how to handle episodes 4-10 under the schema cut.
