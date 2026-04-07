---
description: Produce Lens scaffolding materials (hints, rubrics) and enrich the facilitation guide
argument-hint: <story_id> <episode_number>
---

# Design Scaffolding

Produce the scaffolding materials and enrich the facilitation guide for one episode of a story.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Input

- `${EPISODE_DIR}/analysis.yaml` — the expert analysis
- `${EPISODE_DIR}/facilitation.yaml` — the facilitation guide (initial version from `/analyze_transcript`)
- `${EPISODE_DIR}/transcript.yaml` — the enumerated transcript
- `${EPISODE_DIR}/episode.yaml` — the full episode plan
- `framework/docs/stories/${STORY_ID}.md` — the story design doc. The scaffolding ID reads this so that hint phrasing and deepening probes can reference the recurring cast consistently across episodes (a hint for episode 4 can assume students already know who Mira is).

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command design_scaffolding \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

Required log points are called out in each step.

**Log immediately on entry:** `--stage start --verdict START`.

## Steps

### Step 1: Save Pre-Enrichment Facilitation Guide

Before any modifications, copy the current facilitation guide:
```bash
cp ${EPISODE_DIR}/facilitation.yaml \
   ${EPISODE_DIR}/intermediates/facilitation_pre_enrichment.yaml
```

This preserves the evaluator's original output for debugging.

### Step 2: Scaffolding Instructional Designer — Produce Scaffolding and Enrich Facilitation

**Use the Task tool with `subagent_type: scaffolding_id`.**

Pass the agent the paths to:
- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/facilitation.yaml`
- `${EPISODE_DIR}/transcript.yaml`
- `${EPISODE_DIR}/episode.yaml`
- `framework/docs/stories/${STORY_ID}.md`

Instruct it to propagate `story_id` and `episode_number` from `episode.yaml` into the output `scaffolding.yaml`, and to write outputs to `${EPISODE_DIR}/lens/scaffolding.yaml` and the enriched `${EPISODE_DIR}/lens/facilitation.yaml`.

The agent produces two outputs:

**`scaffolding.yaml`** — Student-facing materials for each evaluable passage:
- Difficulty rating
- Unified scaffold sequence (graduated hints → AI perspective as final entry)
- Deepening probes (per-lens, shown after diagnosis)
- AI reflection prompt
- Common misreadings with redirects
- Observation rubric (per-lens, three levels)
- Explanation rubric (per-category, with levels)

**Enriched `facilitation.yaml`** — The existing facilitation guide with passage-specific discussion starter questions added to:
- `discuss.productive_questions`

**Enrichment rules:**
- All existing content must be preserved — no deletions, no modifications to other fields
- New questions must not duplicate existing content
- New questions must not contradict the evaluator's `likely_disagreements` or `watch_for`

**Before proceeding, verify both files are valid YAML** — parse each with `yaml.safe_load()`. If parsing fails (commonly from unescaped quotes or apostrophes in natural language text), fix the quoting before continuing. Use block scalars (`>`) for any string containing `"`, `'`, `:`, or `#`.

Then validate both artifacts explicitly with the schema script — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/lens/scaffolding.yaml \
  apps/lens/schemas/scaffolding.yaml

python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/lens/facilitation.yaml \
  framework/schemas/facilitation.yaml
```

If either validator reports issues, do not proceed to the reviewer — surface them to the operator.

**Log:** `--stage scaffolding_id --agent scaffolding_id --attempt <n>` after each invocation, then `--stage schema_validation --verdict <PASS|FAIL>`.

### Step 3: Scaffolding Reviewer — Quality Gate

**Use the Task tool with `subagent_type: scaffolding_reviewer`.** Independent fresh-context review.

Pass the agent the paths to:
- `${EPISODE_DIR}/lens/scaffolding.yaml`
- `${EPISODE_DIR}/lens/facilitation.yaml`
- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/transcript.yaml`

The reviewer checks:
1. Scaffold sequence structure and hint calibration (min 2 entries, AI last, where to look not what to see)
2. Common misreading quality (plausible patterns, calibrated redirects)
3. Observation rubric differentiation (three genuinely distinct levels)
4. Explanation rubric differentiation (interaction category depth)
5. Deepening probe quality (pushes toward explanation, per-lens, passage-specific)
6. AI reflection prompt quality (references specific AI content)
7. (Reserved)
8. Language appropriateness (6th-grade, no framework terminology)
9. Facilitation guide enrichment (preserved content, no duplicates)
10. Scaffolding field completeness (all required fields present)
11. Cross-artifact coherence (hints align with but don't duplicate evaluator observations)

The reviewer reports PASS/ISSUE/SUGGESTION per criterion and an overall verdict: **ACCEPT** or **REVISE** (the scaffolding_reviewer's allowed subset of the standardized ACCEPT / REVISE / REGENERATE / REJECT vocabulary — REGENERATE and REJECT are not applicable here).

### Step 4: Reviewer-Driven Flow

- **ACCEPT** → proceed to save (Step 5).
- **REVISE** → re-invoke scaffolding_id (Step 2) with the reviewer's specific issues as feedback, then re-run the reviewer. **Retry budget: 1 revise pass.** If a second review still returns REVISE, halt and surface the latest scaffolding artifacts and the reviewer report to the operator. (See *Failure-mode escape hatch* in `framework/docs/system-architecture.md`.)

The pipeline is autonomous through this loop.

**Log on each verdict:** `--stage scaffolding_review --agent scaffolding_reviewer --attempt <n> --verdict <ACCEPT|REVISE> --retries-remaining <n>`. On exhaustion, log `--stage halt --verdict HALT`.

### Step 5: Save

```
${EPISODE_DIR}/lens/scaffolding.yaml
${EPISODE_DIR}/lens/facilitation.yaml   (enriched version)
```

**Log:** `--stage save --verdict SAVE`.

Intermediates preserved:
```
${EPISODE_DIR}/intermediates/facilitation_pre_enrichment.yaml
```

## Output

- `${EPISODE_DIR}/lens/scaffolding.yaml`
- `${EPISODE_DIR}/lens/facilitation.yaml` (enriched)

## Next Step

Run `/configure_session $1 $2` for this episode — it assembles the final session configuration from all preceding artifacts, including passage ordering, onboarding content, and app settings.
