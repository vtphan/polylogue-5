# Simplified `episode-plan.yaml` Spec

This document defines the simplified episode-level planning artifact.

It should contain only the information needed to help generate:

- one natural transcript
- one later lesson package

If a field does not materially help those outputs, it should not be in `episode-plan.yaml`.

## 1. Purpose

`episode-plan.yaml` is a bridge artifact.

It should define:

- what this episode is about
- which flaws the episode should use
- what kind of scene should be written
- what the student should learn by the end

It should not define the final app interaction directly.

## 2. Minimum Required Information

At minimum, `episode-plan.yaml` should include:

- `story_id`
- `episode_id`
- `title`
- `episode_goal`
- `flaws`
- `student_takeaway`

That is the minimum needed to guide transcript writing and later package generation.

Each entry in `flaws` is an object with these fields:

- `id` — one of the flaws defined in `simplified-framework/reference/flaw-taxonomy.yaml`
- `amplification` — one of `unmistakable`, `showcased`, `heightened`
- `scene_note` *(optional)* — one short line about where in the scene the flaw should land

The `amplification` field tells the dialog writer how loudly the flaw should appear and tells the reviewer what level to calibrate against. See the `amplification_guidance` block for each flaw in the taxonomy.

**One entry per intended flaw moment.** If the same flaw is intended to appear at the same amplification level in 4 different turns of the episode, write 4 separate entries — same `id` and `amplification`, different `scene_note`. The total entry count should equal the total intended flaw moments per episode (target: 5–7 per `episode-composition.md` §2). Do not collapse multiple instances into one entry with a merged `scene_note`; the per-instance granularity is what later allows the package builder to enumerate candidate teachable moments. `flaw_embedding_guidance.must_include` is supplementary scene direction, not an inventory of flaw entries.

## 3. Recommended Shape

```yaml
story_id: strangers-in-the-old-forest
episode_id: episode_01
title: The First Sighting

episode_goal: >
  The group tries to make sense of a strange squirrel sighting and starts
  over-interpreting what they saw.

flaws:
  - id: jumping_to_a_conclusion
    amplification: unmistakable
    scene_note: Jules opens with a stacked "so→so→so" chain from red eyes to a hidden cause.
  - id: jumping_to_a_conclusion
    amplification: unmistakable
    scene_note: Jules doubles down after Priya's observation.
  - id: jumping_to_a_conclusion
    amplification: unmistakable
    scene_note: Cam leaps from "a TikTok exists" to "stuff is happening in the park."
  - id: jumping_to_a_conclusion
    amplification: unmistakable
    scene_note: The group consensus jumps to "something is happening here."
  - id: not_enough_evidence
    amplification: showcased
    scene_note: A single sighting gets treated like a pattern.
  - id: not_enough_evidence
    amplification: showcased
    scene_note: One online comment is treated as a second confirmed site.

student_takeaway: Check whether the reason really supports the conclusion.

scene_design:
  opening: Students regroup after seeing something unusual in the park.
  turn: One student starts linking the sighting to a larger hidden cause.
  close: The group decides to keep meeting about it.

flaw_embedding_guidance:
  must_include:
    - one obvious leap from observation to conclusion
    - one moment where thin evidence is treated like enough
  avoid:
    - subtle flaws that require expert interpretation
    - every turn sounding instructional
```

## 4. Recommended Fields

Beyond the minimum required set, the most useful additional fields are:

- `scene_design`
- `flaw_embedding_guidance`

These three fields usually do the most work.

## 5. Optional Fields

Optional fields may include:

- `target_teachable_moments`
- `warmup_candidate_goal`
- `level_candidate_goal`
- `character_beats`

These should be treated as conveniences, not requirements.

If they are not helping package generation, leave them out.

## 6. Most Important Planning Section

The most important sections are `flaws` and `flaw_embedding_guidance`.

Together they should tell the transcript writer and later reviewer:

- what flaws should appear in the episode
- what kinds of obvious flaw moments the episode should contain
- what kinds of mistakes to avoid

This is more important than carrying lots of planning metadata.

## 7. What `episode-plan.yaml` Should Not Contain

Do not include:

- a scripted transcript
- a flaw assignment for every turn
- multiple-choice answers
- feedback text
- package-ready warm-up definitions
- any heavy analytic structure the simplified package does not need

## 8. Quality Criteria

`episode-plan.yaml` is good if:

- the episode goal is clear
- the intended flaws are clear
- the student takeaway is clear
- the scene shape is clear enough to write
- the flaw guidance is clear enough to review later
- the document stays short

That is enough.
