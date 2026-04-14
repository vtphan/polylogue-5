description: Run the full iterative story review pass: mechanical validation, prose consistency review, and pipeline-readiness calibration
argument-hint: <story_id>
---

# Validate Story

Run the full story-level review pass on a story's design doc and all its per-episode drafts. This command is iterative: run it, revise the story, then run it again until the story is ready for Phase 7. It combines three layers in one place: mechanical validation, prose-on-prose consistency review, and pipeline-readiness calibration.

## Arguments

```bash
STORY_ID="$1"
DESIGN_DOC="framework/stories/${STORY_ID}.md"
DRAFTS_DIR="framework/stories/${STORY_ID}"
CALIBRATION_DIR="framework/stories/calibration"
REPORT_PATH="${CALIBRATION_DIR}/${STORY_ID}-validation-report.md"
```

## Inputs

- `${DESIGN_DOC}` — the story design doc (Markdown with YAML frontmatter).
- `${DRAFTS_DIR}/episode_*.md` — all per-episode drafts authored so far.

## Preconditions

- The story design doc must exist at `${DESIGN_DOC}`.
- At least one per-episode draft must exist in `${DRAFTS_DIR}`.
- `${CALIBRATION_DIR}` should exist; create it if missing before writing the report.

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

Treat this agent as the authoritative prose-consistency layer. Do not duplicate its role with a second independent consistency review.

### Step 3 — Pipeline-readiness calibration

Using the design doc, episode drafts, mechanical results, and the `story_consistency_reviewer` report, assess:

1. **Story-level pedagogical coherence** — whether the declared facets, patterns, and dynamics form a real arc rather than paper coverage.
2. **Episode load realism** — whether each episode is asking a 10–14 turn transcript to carry too many targets, carriers, or moves.
3. **Signal stageability** — whether `cognitive_signal` and `social_signal` are concrete enough to survive `/create_episode` and `/create_transcript`.
4. **Likely downstream failure modes** — where `/create_episode`, `/create_transcript`, or `/build_assistive_package` are most likely to churn.
5. **Revision priority** — which changes are blockers before Phase 7 versus optional improvements.

### Step 4 — Persistent validation report

Write `${REPORT_PATH}` in Markdown. Overwrite the previous report for this story.

Use this structure:

```md
# Story Validation Report: <story_id>

- Verdict: READY | REVISE
- Generated: <ISO timestamp>

## Mechanical Validation
...

## Consistency Review
...

## Pipeline Readiness
...

## Priority Revisions
1. ...

## Likely Downstream Failure Modes
- `/create_episode`: ...
- `/create_transcript`: ...
- `/build_assistive_package`: ...

## Item 9 Reminder
Item 9 ("moment of surprise") is human-only. Verify before shipping to classrooms.
```

### Step 5 — Unified terminal summary

Present the operator with a single summary that combines all three layers:

1. **Mechanical validation** — List any FAILs from `validate_story.py` (coverage closure, lens distribution, shape rotation, strength/weakness rotation). If all passed, say so in one line.
2. **Consistency review** — Report the `story_consistency_reviewer` verdict (ACCEPT or REVISE). If REVISE, list each ISSUE with the specific quotes and revision guidance from the agent's report. List SUGGESTIONs separately.
3. **Pipeline readiness** — Summarize episode-load risks, stageability problems, and likely downstream churn.
4. **Overall verdict** — READY if there are no mechanical FAILs, the consistency review returns ACCEPT, and no blocking pipeline-readiness risks remain. REVISE otherwise, with a short summary of what needs revision.
5. **Item 9 reminder** — Always end with: "Item 9 (moment of surprise) is human-only. Verify before shipping to classrooms."

Do not modify the design doc or episode drafts. Writing `${REPORT_PATH}` is required.
