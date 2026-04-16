# Simplified `story.yaml` Spec

This document defines the simplified story-level artifact.

It should contain only the information needed to help generate:

- episode plans
- natural transcripts
- lesson packages

If a field does not materially help those outputs, it should not be in `story.yaml`.

## 1. Purpose

`story.yaml` should define only:

- the story world in one compact form
- the recurring characters
- the episode list
- the intended flaw progression across episodes

It is not a full story bible.

## 2. Minimum Required Information

At minimum, `story.yaml` should include:

- `story_id`
- `title`
- `premise`
- `characters`
- `episodes`

Each episode entry should minimally include:

- `episode_id`
- `title`
- `flaws`

That is the minimum structure needed to plan episodes coherently.

## 3. Recommended Shape

```yaml
story_id: strangers-in-the-old-forest
title: Strangers in the Old Forest
premise: >
  A group of middle-school students keeps meeting after school to make sense of
  something unusual they think they saw in the park.

characters:
  - id: jules
    name: Jules
    voice_notes: jumps quickly from observation to meaning
  - id: maya
    name: Maya
    voice_notes: tries to slow the group down and clarify the question
  - id: cam
    name: Cam
    voice_notes: brings in outside information with a lot of confidence

episodes:
  - episode_id: episode_01
    title: The First Sighting
    flaws:
      - jumping_to_a_conclusion
      - not_enough_evidence
    final_takeaway: Check whether the reason really supports the conclusion.

  - episode_id: episode_02
    title: The Second Meeting
    flaws:
      - trusting_a_source_too_quickly
      - jumping_to_a_conclusion
    final_takeaway: A source is not trustworthy just because it sounds impressive.
```

## 4. Character Guidance

Each character only needs enough definition to support natural transcript writing.

The recommended minimum per character is:

- `id`
- `name`
- `voice_notes`

You may add one short `role` field if it clearly helps, but it is not required.

## 5. Episode Guidance

The `episodes` list should capture the intended learning progression across the story.

It should answer:

- what each episode is mainly about
- which flaws the episode is intended to use
- what the intended takeaway is

It should not try to define teachable turns, exact warm-ups, or exact levels.

## 6. Optional Fields

Optional fields should be used sparingly.

Useful optional fields include:

- `setting`
- `audience`
- `final_takeaway`

Do not add optional fields unless they materially improve transcript or package generation.

## 7. What `story.yaml` Should Not Contain

Do not include:

- turn-level planning
- exact warm-up selection
- exact level selection
- app-facing questions
- answer options
- feedback text
- hidden analytic structures that the simplified package does not need

## 8. Quality Criteria

`story.yaml` is good if:

- the premise is clear
- the characters are distinct enough to write
- the episode sequence has a clear flaw progression
- the document stays compact

That is enough.
