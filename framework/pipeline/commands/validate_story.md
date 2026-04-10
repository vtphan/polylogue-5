---
description: Run mechanical validation and prose-on-prose consistency review on a story's design doc and per-episode drafts
argument-hint: <story_id>
---

# Validate Story

Run both validation layers — the mechanical `validate_story.py` script and the `story_consistency_reviewer` agent — on a story's design doc and all its per-episode drafts. Presents a unified report. This is the recommended final pass after Phase 6 authoring and before Phase 7 (`/create_episode`).

## Arguments

```bash
STORY_ID="$1"
DESIGN_DOC="framework/stories/${STORY_ID}.md"
DRAFTS_DIR="framework/stories/${STORY_ID}"
```

## Inputs

- `${DESIGN_DOC}` — the story design doc (Markdown with YAML frontmatter).
- `${DRAFTS_DIR}/episode_*.md` — all per-episode drafts authored so far.

## Preconditions

- The story design doc must exist at `${DESIGN_DOC}`.
- At least one per-episode draft must exist in `${DRAFTS_DIR}`.

Check both before proceeding. If either is missing, report clearly and stop.

## Steps

### Step 1 — Mechanical validation

Run the validator script:

```bash
python3 framework/pipeline/scripts/validate_story.py "$STORY_ID"
```

Read the generated validation report from `framework/stories/validation/` (the most recent file matching `${STORY_ID}-validation-report-*.yaml`). Summarize all FAIL results for the operator. If there are no FAILs, note that the mechanical checks passed.

### Step 2 — Prose-on-prose consistency review

Launch the `story_consistency_reviewer` agent:

```
Agent(
  subagent_type: "story_consistency_reviewer",
  prompt: "Review the story '${STORY_ID}'. Read the story design doc at framework/stories/${STORY_ID}.md and all per-episode drafts at framework/stories/${STORY_ID}/episode_*.md. Run both passes (character consistency and the eight-item rubric) and return your structured YAML report."
)
```

### Step 3 — Unified report

Present the operator with a single summary that combines both layers:

1. **Mechanical validation** — List any FAILs from `validate_story.py` (coverage closure, lens distribution, shape rotation, strength/weakness rotation). If all passed, say so in one line.
2. **Consistency review** — Report the `story_consistency_reviewer` verdict (ACCEPT or REVISE). If REVISE, list each ISSUE with the specific quotes and revision guidance from the agent's report. List SUGGESTIONs separately.
3. **Overall verdict** — READY if both layers pass (mechanical: no FAILs; consistency: ACCEPT). NOT READY if either layer has failures, with a short summary of what needs revision.
4. **Item 9 reminder** — Always end with: "Item 9 (moment of surprise) is human-only. Verify before shipping to classrooms."

Do not modify any file. This command is read-only.
