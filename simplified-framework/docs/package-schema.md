# Simplified Assistive Package Schema

This document describes the app-facing package shape for the simplified Lens framework.

It is not the full research or upstream analytic schema.

It is the runtime teaching schema.

## 1. Purpose

The simplified package should let the app run a complete learning experience without reconstructing teaching objects from diffuse metadata.

The package should directly provide:

- episode setup copy
- warm-up teaching examples
- challenge turns
- questions and answer options
- correct answers
- feedback
- hints
- transfer takeaway

Because the downstream app is non-LLM, the package must map unambiguously to the student experience.

At runtime, the app should not have to infer:

- which turn is the intended warm-up
- which option is best
- what feedback belongs to which answer
- what hint to show next
- what takeaway to display

## 2. Design Principle

The unit of runtime content should be a teachable turn.

For each teachable turn, the package should already specify:

- what critical-thinking move is being taught
- what question the student sees
- what answers the student can choose
- which answer is best
- why that answer is best
- what feedback to show for weaker answers

The app should not need to infer all of that from analytic fields.

This is the most important contract of the simplified package.

## 3. Recommended Top-Level Structure

```yaml
package_meta:
  story_id: string
  episode_number: number
  schema_version: simplified_v1

episode:
  title: string
  student_intro: string
  flaws:
    - string
  final_takeaway: string

warmups:
  modeled: {...}
  guided: {...}

levels:
  - {...}
  - {...}
```

## 4. Episode Section

The `episode` section should include:

- `title`
- `student_intro`
- `flaws`
- `final_takeaway`

These fields should be written for students, not analysts.

## 5. Warm-Up Shape

The simplified model needs warm-ups that explicitly teach the task.

Each warm-up should include:

- `warmup_id`
- `turn_id` or `turn_ids`
- `title`
- `focus_move`
- `prompt`
- `answer_options` optional for modeled, required for guided
- `best_answer_id`
- `best_answer_text`
- `worked_explanation`
- `takeaway`

These should be explicit, not derived indirectly from hidden metadata.

### 5.1 Modeled Warm-Up

The modeled warm-up should explicitly contain the answer.

It should not require the app to guess the answer from hidden metadata.

### 5.2 Guided Warm-Up

The guided warm-up should include:

- multiple-choice answers
- the best answer
- explanation of why it is best
- optional hint

## 6. Level Shape

Each level should be directly playable.

Each level should include:

- `level_id`
- `sequence_index`
- `turn_id` or `turn_ids`
- `title`
- `focus_move`
- `prompt`
- `answer_options`
- `best_answer_id`
- `hint`
- `feedback`
- `badge_label` optional

The app should be able to render a full level from these fields alone.

## 7. Answer Option Shape

Each answer option should include:

- `option_id`
- `text`
- `kind`

Recommended `kind` values:

- `best_fit`
- `partial`
- `off_target`
- `uncertain`

This lets the app and analytics distinguish strong, partial, and weak choices without string matching.

## 8. Feedback Shape

Each level should provide feedback keyed by option.

For example:

```yaml
feedback:
  correct:
    option_ids: [o1]
    text: The strongest issue here is that the speaker jumps from one reason to a bigger conclusion without checking the missing step.
  by_option:
    o2: That answer notices a real concern, but it is not the main reasoning problem in this turn.
    o3: This choice points away from the main issue in the turn.
    o4: If you are unsure, look again at the gap between the claim and the support offered.
```
```

This is better than a generic support ladder for every case.

It is also much safer for a deterministic non-LLM runtime.

## 9. Hidden Mapping Section

The simplified app-facing package may optionally include a hidden mapping section for analytics and future teacher use.

For example:

```yaml
hidden_mapping:
  lens: logic
  facet: inferential_validity
  pattern_type: cognitive_bias
  pattern_ref: confirmation_bias
```

This keeps the richer framework available without forcing it into the student UI.

## 10. Minimal Example

```yaml
levels:
  - level_id: level_01
    sequence_index: 1
    turn_id: t01
    title: Spot the leap
    focus_move: jumping to a conclusion
    prompt: What is the biggest problem with this reasoning?
    answer_options:
      - option_id: o1
        text: The speaker jumps from one idea to a much bigger conclusion without checking the missing step.
        kind: best_fit
      - option_id: o2
        text: The speaker sounds confident, but confidence is not always bad.
        kind: partial
      - option_id: o3
        text: The speaker is mainly talking too fast.
        kind: off_target
      - option_id: o4
        text: I'm not sure yet.
        kind: uncertain
    best_answer_id: o1
    hint: Look at how the speaker moves from a reason to a conclusion.
    feedback:
      correct:
        option_ids: [o1]
        text: Yes. The reasoning jumps too quickly from one supporting detail to a bigger conclusion.
      by_option:
        o2: That may be true, but it is not the main reasoning issue here.
        o3: That does not address the reasoning problem in the turn.
        o4: Try asking whether the reason really proves the conclusion.
    badge_label: Spot the leap
```

## 11. Package Quality Criteria

The package is good if:

- each prompt is short and understandable
- each level teaches one clear move
- the best answer is actually teachable
- the distractors are plausible
- feedback is short and specific
- warm-ups explicitly show the answer
- the episode takeaway reinforces the main flaw
- the app can render the learning experience without guessing what the author meant

## 12. Next Step

After this document, the next likely artifacts should be:

- a concrete schema file under `simplified-framework/schemas/`
- a mapping doc from current Lens facets to simplified moves
- one example episode package written in this schema
