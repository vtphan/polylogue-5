# Design Scoring Rubric

Produce the scoring rubric and competition facilitation guide for a Reasoning Lab session.

## Prerequisites

The shared upstream pipeline must have completed for this scenario:
- `registry/{scenario_id}/scenario.yaml` — the scenario plan
- `registry/{scenario_id}/transcript.yaml` — the enumerated transcript
- `registry/{scenario_id}/analysis.yaml` — the expert analysis

These are produced by the shared pipeline commands (`/create_scenario`, `/create_transcript`, `/analyze_transcript`).

## Input

- `registry/{scenario_id}/analysis.yaml` — the expert analysis (facet annotations, AI perspectives, diversity metadata)
- `registry/{scenario_id}/transcript.yaml` — the enumerated transcript
- `registry/{scenario_id}/scenario.yaml` — the full scenario plan

## Steps

### Step 1: Scoring Rubric Agent — Produce Scoring Rubric and Competition Facilitation

Read the scoring rubric agent prompt at `apps/reasoning-lab/pipeline/agents/scoring_rubric_agent.md`.

Pass the analysis, transcript, and scenario plan to the agent.

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

Validate `scoring.yaml` against `apps/reasoning-lab/schemas/scoring.yaml`.
Validate `competition-facilitation.yaml` against `apps/reasoning-lab/schemas/competition_facilitation.yaml`.

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

Save both files to `registry/{scenario_id}/reasoning-lab/`:
```
registry/{scenario_id}/reasoning-lab/scoring.yaml
registry/{scenario_id}/reasoning-lab/competition-facilitation.yaml
```

Report the number of observation buckets and explanation buckets per passage, along with the rarity distribution (how many common/uncommon/rare per passage).
