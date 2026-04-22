---
name: design_story
description: Interactive multi-phase co-design of a full story with all per-episode commitments. Handled by the main orchestrator in conversation with the operator.
---

# /design_story

`/design_story` produces `stories/{story_id}/story.yaml` and `stories/{story_id}/story-design-review.md` through an extended multi-turn conversation with the operator. You (the main Claude Code orchestrator) hold the taxonomy and the authoring doctrine; the operator holds the creative authority. There is no subagent.

## Authoritative doctrine

All authoring doctrine — persuasive-thread discipline, awareness-not-checklist, lens coverage, audience fit, reading-time heuristic, narrator convention, restraint on structural invention, Phase A–D commit goals, conversation-shape guidance, and the `story-design-review.md` template — lives in **`v5/docs/story-design-doctrine.md`**. Load that document at session start and treat it as the source of truth. This file only describes Claude-Code-specific orchestration around it.

## Reads

Required, at session start:

- `v5/docs/story-design-doctrine.md` — authoring doctrine (**primary**).
- `v5/reference/reasoning-taxonomy.yaml` — full taxonomy, for awareness only.
- `v5/schemas/story.yaml` — output contract.

Optional, on request:

- `v5/docs/instructional-design.md` — pedagogical context.
- `v5/stories/` — to see prior stories if the operator wants to reference or extend one.

## Writes

- `v5/stories/{story_id}/story.yaml` — the serialized story artifact.
- `v5/stories/{story_id}/story-design-review.md` — Phase D approval artifact.

Nothing else is written by this command. Artifacts under `v5/artifacts/{story_id}/` are produced by downstream commands.

## Rerun behavior (Claude-Code-specific)

On invocation, if `v5/stories/{story_id}/story.yaml` already exists:

1. Report that it exists.
2. If the existing `story-design-review.md` has `Status: approved`, refuse to overwrite and direct the operator to use the approved-story rerun flow (explicit intent to redesign). Approved upstream artifacts are not silently re-run.
3. Otherwise, ask the operator to confirm a fresh run. A fresh run clears `story.yaml` and `story-design-review.md` in that story directory.
4. Warn that downstream artifacts under `v5/artifacts/{story_id}/` may become stale.

## Phase execution

Run the conversation per `story-design-doctrine.md` §3. Each phase's commit goal is defined there. Name phases aloud ("Let's move to Phase C — per-episode co-design") so the operator stays oriented.

At Phase D serialize time (after the five checks in `story-design-doctrine.md` §3.4):

1. Compute each episode's `word_count_range` from `reading_time_minutes` per the heuristic in `story-design-doctrine.md` §2.5.
2. Write `v5/stories/{story_id}/story.yaml`.
3. Run `python3 v5/pipeline/scripts/validate_story.py <path>`.
4. If validation fails, report and loop back — do not write the review artifact on an invalid story.
5. If validation passes, write `v5/stories/{story_id}/story-design-review.md` per the template in `story-design-doctrine.md` §4.

`Status: approved` in the review file is the load-bearing signal `/create_transcript` checks before allowing transcript drafting.

## Conversation-shape reminder

See `story-design-doctrine.md` §5. In Claude Code specifically: lean on the doctrine for framing, not form-filling. If the operator types a one-line seed, respond with a Phase A draft (premise + character sketches) plus short meta-commentary on authorial choices — do not jump ahead to Phase C synopses.
