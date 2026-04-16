# Simplified `transcript.yaml` Spec

This document defines the simplified transcript artifact.

The transcript should do one job:

- provide the actual dialogue that later review and package generation work from

It should not carry heavy analytic annotations.

## 1. Purpose

`transcript.yaml` should represent the episode conversation in a stable, simple format.

The transcript is the source text for:

- flaw review
- warm-up selection
- level selection
- simplified assistive-package generation

## 2. Minimum Required Information

At minimum, `transcript.yaml` should include:

- `story_id`
- `episode_id`
- `title`
- `characters`
- `turns`

Each turn should include:

- `turn_id`
- `speaker`
- `text`

That is enough for the simplified pipeline.

## 3. Recommended Shape

```yaml
story_id: strangers-in-the-old-forest
episode_id: episode_01
title: The First Sighting

characters:
  - jules
  - maya
  - cam

turns:
  - turn_id: t01
    speaker: Jules
    text: Okay, so Cam saw it first, and then I looked, and its eyes were actually red.

  - turn_id: t02
    speaker: Jules
    text: If its eyes looked that wrong, then something had to happen to it.

  - turn_id: t03
    speaker: Cam
    text: I saw a video this weekend that said weird squirrel stuff has been happening for months.
```

## 4. Why This Shape Is Simpler

The simplified framework does not need:

- sentence-level IDs
- per-turn metadata
- hidden analytic annotations inside the transcript

Those can be added later if a real need appears.

For now, one text field per turn is enough.

## 5. Optional Fields

Optional fields may include:

- `setting_note`
- `previously`

These should only be used if they materially help transcript writing or package generation.

## 6. What `transcript.yaml` Should Not Contain

Do not include:

- flaw labels per turn
- hidden answer keys
- warm-up or level definitions
- package-ready questions
- feedback text

Those belong in the simplified assistive package, not the transcript.

## 7. Quality Criteria

`transcript.yaml` is good if:

- the dialogue is readable
- speakers are clear
- turn IDs are stable
- the transcript is simple enough for later review and package generation

That is enough.
