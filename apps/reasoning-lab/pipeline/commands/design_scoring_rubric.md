---
description: Produce Reasoning Lab scoring rubric and competition facilitation guide
argument-hint: <story_id> <episode_number>
---

# Design Scoring Rubric

Produce the scoring rubric and competition facilitation guide for one episode of a Reasoning Lab story.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Prerequisites

The shared upstream pipeline must have completed for this episode:
- `${EPISODE_DIR}/episode.yaml` — the episode plan
- `${EPISODE_DIR}/transcript.yaml` — the enumerated transcript
- `${EPISODE_DIR}/analysis.yaml` — the expert analysis
- `framework/stories/${STORY_ID}.md` — the story design doc (cast prose, arc, recurring tendencies)

These are produced by Phase 6 authoring (story design doc + per-episode draft) plus `/create_episode`, `/create_transcript`, and `/analyze_transcript`.

## Input

- `${EPISODE_DIR}/analysis.yaml` — the expert analysis (facet annotations, AI perspectives, diversity metadata)
- `${EPISODE_DIR}/transcript.yaml` — the enumerated transcript
- `${EPISODE_DIR}/episode.yaml` — the full episode plan
- `framework/stories/${STORY_ID}.md` — the story design doc. The scoring agent reads this so that recurring cast members carry consistent scoring archetypes across episodes (a student team that learns "Mira tends to anchor on a single source" should be able to apply that pattern in every episode where Mira is a lead).

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command design_scoring_rubric \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] [--notes "<text>"]
```

Required log points are called out in each step.

**Log immediately on entry:** `--stage start --verdict START`.

## Steps

### Step 1: Scoring Rubric Agent — Produce Scoring Rubric and Competition Facilitation

**Use the Task tool with `subagent_type: scoring_rubric_agent`.**

Pass the agent the paths to:
- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/transcript.yaml`
- `${EPISODE_DIR}/episode.yaml`
- `framework/stories/${STORY_ID}.md`

Instruct it to write outputs to `${EPISODE_DIR}/reasoning-lab/scoring.yaml` and `${EPISODE_DIR}/reasoning-lab/competition-facilitation.yaml`. Both outputs must propagate `story_id` and `episode_number` from `episode.yaml`.

The agent produces two outputs:

**`scoring.yaml`** — Cross-group scoring materials for each evaluable passage:
- Scoring parameters (point values, observation cap)
- Difficulty rating
- Observation buckets (bucket ID, facet ID, lens, differentiation level, match phrases, predicted rarity)
- Explanation buckets (explanation ID, type, variable IDs, match phrases, applicable observation buckets)
- Senior analyst report (adapted AI perspective for competitive context)

**`competition-facilitation.yaml`** — Teacher's game-master companion:
- Case briefing (title, teacher context, student context)
- Per-passage facilitation (pacing, predicted scoreboard, transition language)
- Debrief materials (takeaways, why-questions, cross-passage connections)
- Energy management guidance

**Before proceeding, verify both files are valid YAML** — parse each with `yaml.safe_load()`. If parsing fails (commonly from unescaped quotes or apostrophes in natural language text), fix the quoting before continuing. Use block scalars (`>`) for any string containing `"`, `'`, `:`, or `#`.

### Step 2: Schema Validation

Run schema validation explicitly — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/reasoning-lab/scoring.yaml \
  apps/reasoning-lab/schemas/scoring.yaml

python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/reasoning-lab/competition-facilitation.yaml \
  apps/reasoning-lab/schemas/competition_facilitation.yaml
```

If either validator reports issues, do not proceed — fix and re-run.

**Log:** `--stage scoring_rubric --agent scoring_rubric_agent --attempt <n>` after each invocation, then `--stage schema_validation --verdict <PASS|FAIL>`.

Check:
- Every passage in `analysis.yaml` has a corresponding entry in both output files
- Every facet annotation has at least one observation bucket
- Every explanatory variable has at least one explanation bucket
- Bucket IDs are sequential and unique (obs_01, obs_02, ... and exp_01, exp_02, ...)
- Match phrases are non-empty for every bucket
- Predicted rarity values are valid (common, uncommon, rare)

### Step 3: Cross-Artifact Coherence Check

Verify coherence between scoring.yaml and competition-facilitation.yaml:
- Every bucket ID referenced in `likely_common`, `likely_rare`, and `likely_missed` exists in scoring.yaml
- `class_missed` bucket IDs in the senior analyst section match `likely_missed` bucket IDs in facilitation
- Difficulty ratings match between the two files
- Passage IDs match between the two files

### Step 4: Save Outputs

Save both files to `${EPISODE_DIR}/reasoning-lab/`:
```
${EPISODE_DIR}/reasoning-lab/scoring.yaml
${EPISODE_DIR}/reasoning-lab/competition-facilitation.yaml
```

Report the number of observation buckets and explanation buckets per passage, along with the rarity distribution (how many common/uncommon/rare per passage).

**Log:** `--stage save --verdict SAVE`.
