# Lens v1.1 Assistive Package Design

This document defines how the assistive package should be designed for the current `apps/lens-v1_1/` runtime.

It is an app-facing package contract, not the full upstream analytic package used by the broader framework.

If the framework continues to produce a richer or more research-oriented package, that is acceptable. In that case, Lens v1.1 should consume either:

- a transformed app-facing package derived from the richer source package, or
- a richer package whose relevant fields already conform to the app-facing requirements in this document

When this document conflicts with older Lens assumptions about discussion, writing, or round-robin coordination, this document wins for the `v1_1` student runtime.

## 1. Design Goal

The assistive package should be designed to power this student flow:

1. read the episode
2. see one modeled warm-up
3. try one guided warm-up
4. complete a sequence of challenge levels
5. use support when needed
6. finish with locally recorded progress

The package should therefore optimize for:

- single-student use
- no writing
- no discussion
- turn-based challenge design
- explicit warm-up support
- multiple-choice and similar constrained interactions
- progressive support ladders
- level difficulty progression

The package should not assume:

- peer coordination
- consensus stages
- typed student responses
- student lens selection as the entry move

## 2. Product Requirements the Package Must Serve

For `v1_1`, the package must let the app do the following without inventing too much runtime logic:

- choose focal turns for warm-ups and levels
- present one clean question per level
- present 3-5 student-ready answer options
- include one low-friction uncertainty option when appropriate
- provide support in a progressive ladder
- provide at least one worked explanation for teaching
- expose enough metadata to order levels from easier to harder
- expose concise badge or completion labels
- keep analytic truth available for scoring, analytics, and future teacher views

The app should not have to infer all of this indirectly from broad analytic metadata.

## 3. Recommended Package Layers

The package should be thought of as two layers:

### 3.1 Analytic Layer

This is mostly hidden from students.

It exists to preserve:

- lens
- facet
- severity
- evidence turns
- cognitive bias or social-dynamics explanation patterns
- any richer analytic or research metadata

This layer is the hidden answer key.

### 3.2 Runtime Layer

This is the app-facing layer.

It exists to provide:

- warm-up definitions
- level definitions
- student-facing prompts
- student-facing answer options
- support ladders
- badge labels
- difficulty and sequencing metadata

This layer should be authored for the actual Lens runtime, not reverse-engineered at render time from the analytic layer.

## 4. Recommended Top-Level Shape

For Lens `v1_1`, the app-facing package should contain at least these sections:

- `package_meta`
- `episode_overview`
- `warmups`
- `levels`
- `analytics`

A reasonable shape is:

```yaml
package_meta:
  story_id: the-field-trip
  episode_number: 1
  schema_version: "lens_v1_1"

episode_overview:
  title: The Field Trip
  student_intro: Read the discussion first. Then work through the reasoning challenges.
  suggested_level_arc:
    - notice
    - identify
    - evaluate
    - explain

warmups:
  modeled:
    ...
  guided:
    ...

levels:
  - ...
  - ...

analytics:
  by_level:
    ...
```

The exact field names can change, but the responsibilities should stay stable.

## 5. Section-by-Section Requirements

## 5.1 `package_meta`

Purpose:

- identify the package
- support validation
- support compatibility checks

Should include:

- `story_id`
- `episode_number`
- `schema_version`
- `generated_at`
- `source_episode_path`

Optional:

- generator info
- checksum or integrity info

## 5.2 `episode_overview`

Purpose:

- support the read screen without additional authoring logic

Should include:

- `title`
- `student_intro`
- `teacher_note` optional
- `suggested_level_arc`

Should be short. This is orientation copy, not a lesson plan.

## 5.3 `warmups`

Purpose:

- teach the task before the student enters the scored or regular levels

The package should define two warm-up slots:

- `modeled`
- `guided`

Each warm-up should specify:

- `warmup_id`
- `turn_id` or `turn_ids`
- `title`
- `prompt`
- `answer_options` for guided warm-up
- `worked_explanation`
- `takeaway`
- `badge_label` optional

The modeled warm-up should not require student writing.

The guided warm-up should let the student choose an answer first, then reveal the explanation.

## 5.4 `levels`

Purpose:

- define the core episode gameplay / challenge sequence

Each level should be directly playable by the app with minimal inference.

Each level should include:

- `level_id`
- `sequence_index`
- `turn_id` or `turn_ids`
- `title`
- `difficulty_band`
- `challenge_type`
- `prompt`
- `answer_options`
- `correct_targets`
- `support`
- `badge_label`
- `completion_copy` optional

### 5.4.1 `difficulty_band`

Should use a small stable vocabulary such as:

- `notice`
- `identify`
- `evaluate`
- `explain`
- `extend`

This should be explicit. The app should not need to infer difficulty from raw taxonomy fields.

### 5.4.2 `challenge_type`

Should describe the interaction pattern, for example:

- `single_select`
- `two_step_select`
- `confidence_check`

For current `v1_1`, `single_select` should be the default.

### 5.4.3 `answer_options`

Each level should provide student-facing answer options that are already polished for the UI.

Each option should include:

- `option_id`
- `text`
- `kind`

Recommended `kind` values:

- `best_fit`
- `plausible_but_incomplete`
- `off_target`
- `uncertain`

This is useful for analytics, support routing, and future teacher views.

Do not require the app to infer option roles by comparing strings.

### 5.4.4 `correct_targets`

This should identify which option or option set counts as the intended answer.

It may reference:

- `option_id`
- analytic facet
- explanation pattern

This keeps scoring and student wording separate.

### 5.4.5 `support`

Each level should provide an explicit support object with:

- `opening`
- `ladder`

The ladder should contain ordered steps such as:

- `nudge`
- `question`
- `hint`
- `worked_example`
- `redirect`

Each step should include:

- `step_id`
- `type`
- `text`

Optional:

- `reveals`
- `cost`
- `routes_to`

The support text should be student-ready.

### 5.4.6 `badge_label`

Each level should include a short badge or completion label such as:

- `Logic Spotter`
- `Reasoning Check 1`
- `Pattern Finder`

Do not make the app derive badge names from level IDs.

## 5.5 `analytics`

Purpose:

- preserve analytic truth and future reporting value without exposing too much to students

Each level should map to hidden analytic metadata such as:

- `lens`
- `facet`
- `severity`
- `evidence_turn_ids`
- `pattern_type`
- `pattern_ref`

This can stay separate from the student-facing level content.

## 6. Authoring Rules for Student-Facing Content

The package should be written for students, not analysts.

Student-facing fields should follow these rules:

- use plain language
- keep prompts short
- avoid taxonomy jargon unless intentionally teaching it
- avoid long multi-clause options
- avoid answer options that differ only subtly in wording
- include one useful uncertainty option when appropriate
- make the distractors plausible, not random

A bad option set feels like a quiz.

A good option set feels like:

- one strongest reading
- one or two tempting but partial readings
- one clearly weaker or off-target reading
- one uncertainty escape hatch when needed

## 7. What the LLM Should Optimize For

If an LLM generates this package, it should be prompted to optimize for:

- student usability
- clean level progression
- concise student-facing language
- clear distractor design
- faithful alignment to the transcript
- faithful alignment to the hidden analytic target
- useful support text that escalates in specificity

The LLM should not optimize for:

- displaying all taxonomy richness directly to the student
- exhaustive pedagogical explanation in every prompt
- academic prose
- feature ideas the runtime does not support

## 8. What Can Still Be Upstream Only

The broader framework can continue to maintain richer fields such as:

- passage-level decomposition
- prior exposure
- teacher calibration warnings
- discussion cues
- talk moves
- consensus checks
- research-only metadata

Those fields do not need to be removed from the framework.

They just should not be required for the `v1_1` student runtime.

## 9. Example Level Shape

```yaml
levels:
  - level_id: level_01
    sequence_index: 1
    turn_id: t01
    title: Spot the jump
    difficulty_band: notice
    challenge_type: single_select
    prompt: What is the biggest problem in how Maya makes this case?
    answer_options:
      - option_id: o1
        text: She jumps from one detail to a much bigger conclusion without checking the missing step.
        kind: best_fit
      - option_id: o2
        text: She sounds confident, but never explains what would need to happen for the trip to work.
        kind: plausible_but_incomplete
      - option_id: o3
        text: She is mainly making a problem about whether people like roller coasters.
        kind: off_target
      - option_id: o4
        text: I'm not sure yet.
        kind: uncertain
    correct_targets:
      option_ids: [o1]
      facet: inferential_validity
    support:
      opening: Read Maya's reasoning one step at a time.
      ladder:
        - step_id: s1
          type: nudge
          text: Try listing each step Maya uses to get to her conclusion.
        - step_id: s2
          type: hint
          text: Does she ever check whether the class is actually studying physics?
        - step_id: s3
          type: worked_example
          text: Maya moves from "roller coasters use physics" to "this is the perfect field trip" without checking whether that conclusion actually follows.
    badge_label: Logic Spotter
```

## 10. Recommended Workflow

The best long-term workflow is:

1. generate a rich framework package
2. transform or regenerate an app-facing Lens package
3. validate that app-facing package against the `v1_1` schema
4. let the app consume the app-facing package directly

That is a better fit than making the app keep reconstructing its runtime from a package designed for a different pedagogy.

## 11. Governance

This document should be read alongside:

- `v1-redesign-spec.md`
- `technical-specs-v1.md`
- `wireframes-v1.md`

If the Lens runtime changes materially, this document should be updated before or alongside schema and prompt changes.
