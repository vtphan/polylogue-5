# App Contract

This document defines the intended artifact contract for the dedicated simplified-framework app.

## Canonical Runtime Inputs

Per session, the dedicated app should read:

- `artifacts/{story_id}/{episode_id}/lesson_package.yaml`
- `artifacts/{story_id}/{episode_id}/transcript.yaml`

Optional supporting source:

- `stories/{story_id}/story.yaml`

No other pipeline artifact should be required at runtime.

## Transcript Fields

The app-facing transcript contract is:

- `title`
- `characters`
- `turns[].turn_id`
- `turns[].speaker`
- `turns[].text`

## Lesson Package Fields

The app-facing package contract is:

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

## Current Prototype Status

The local prototype in `simplified-framework/app/` does not fully implement this contract yet. It still reflects legacy runtime assumptions in parts of the loader and content model.

Treat this document as the canonical contract for the next dedicated app, not as a description of the current prototype internals.

