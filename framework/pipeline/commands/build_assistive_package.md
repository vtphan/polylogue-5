---
description: Build the v2 assistive package from episode plan and transcript (analyst → diagnostic → prose → discussion → reviewer → merge)
argument-hint: <story_id> <episode_number>
---

# Build Assistive Package

Build the v2 assistive package for one episode. Runs four authoring agents in dependency order, a package reviewer, and a deterministic merge script.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Prerequisites

The episode must have already passed `/create_episode` and `/create_transcript`:
- `${EPISODE_DIR}/episode.yaml` — episode plan
- `${EPISODE_DIR}/transcript.yaml` — enumerated transcript

## Pipeline: 6 Steps

### Step 1: Analyst Agent → `ground_truth_generated.yaml`

Spawn the **analyst_agent** (or a general-purpose agent with the analyst prompt from `framework/pipeline/agents/analyst_agent.md`).

**Inputs:** episode.yaml, transcript.yaml, story design doc, per-episode draft, reference files, ground_truth schema.

**Output:** `${EPISODE_DIR}/ground_truth_generated.yaml`

**Gate:** Run `validate_schema.py` on the output against `framework/schemas/ground_truth.yaml`. Must PASS.

### Step 2: Diagnostic Agent → `diagnostic_generated.yaml`

Spawn the **diagnostic_agent**.

**Inputs:** episode.yaml, transcript.yaml, **ground_truth_generated.yaml** (from Step 1), story design doc, reference files (including wrestling_gates.yaml), diagnostic schema.

**Output:** `${EPISODE_DIR}/diagnostic_generated.yaml`

**Gate:** Run `validate_schema.py`. Must PASS.

### Step 3: Prose Agent → `prose_generated.yaml`

Spawn the **prose_agent**.

**Inputs:** episode.yaml, transcript.yaml, ground_truth_generated.yaml, diagnostic_generated.yaml, story design doc, prose schema.

**Output:** `${EPISODE_DIR}/prose_generated.yaml`

**Gate:** Run `validate_schema.py`. Must PASS.

### Step 4: Discussion Agent → `discussion_generated.yaml`

Spawn the **discussion_agent**.

**Inputs:** episode.yaml, transcript.yaml, ground_truth_generated.yaml, diagnostic_generated.yaml, prose_generated.yaml, story design doc, discussion schema.

**Output:** `${EPISODE_DIR}/discussion_generated.yaml`

**Gate:** Run `validate_schema.py`. Must PASS.

### Step 5: Package Reviewer

Spawn the **package_reviewer** agent.

**Inputs:** All four generated files, episode.yaml, transcript.yaml, and story frontmatter.

**Gate:** Must return ACCEPT.

If REVISE: read the findings, fix the identified agent output, and re-run from the affected step.

### Step 6: Merge Script → `assistive_package.yaml`

Run the deterministic merge script:

```bash
python3 framework/pipeline/scripts/merge_assistive_package.py "${EPISODE_DIR}"
```

**Gate:** Must exit 0 (all integrity checks pass).

Then validate the merged package explicitly:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/assistive_package.yaml" \
  framework/schemas/assistive_package.yaml
```

**Final gate:** merged package schema validation must PASS.

## Success Criteria

All gates pass:
1. Four schema validations PASS
2. Package reviewer returns ACCEPT
3. Merge script exits 0 (14/14 integrity checks)

The final `assistive_package.yaml` is the episode's terminal pipeline artifact.

## Telemetry

Log events to `${EPISODE_DIR}/pipeline_log.yaml`:
- Step start/end timestamps
- Schema validation results
- Merge script check counts
- Reviewer verdict
