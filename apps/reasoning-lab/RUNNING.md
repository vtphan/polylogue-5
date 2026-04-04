# Running the Reasoning Lab Pipeline

## Initialize

Before running any slash commands, bootstrap the environment. This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and Reasoning Lab commands/agents from `apps/reasoning-lab/pipeline/`.

```bash
python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py
```

Run this:
- Before the first session
- After editing any file in `framework/pipeline/commands/`, `framework/pipeline/agents/`, `apps/reasoning-lab/pipeline/commands/`, or `apps/reasoning-lab/pipeline/agents/`
- When switching from another application (e.g., Lens) to Reasoning Lab

## Pipeline Stages

Stages 1–3 are shared with Lens. If you've already run them for a scenario, skip to Stage 4a.

### Stage 1: Create Scenario (shared)

```
/create_scenario
```

**Output:** `registry/{scenario_id}/scenario.yaml`

### Stage 2: Create Transcript (shared)

```
/create_transcript
```

**Output:** `registry/{scenario_id}/transcript.yaml`

### Stage 3: Analyze Transcript (shared)

```
/analyze_transcript
```

**Output:** `registry/{scenario_id}/analysis.yaml`, `registry/{scenario_id}/facilitation.yaml`

### Stage 4a: Design Scoring Rubric (Reasoning Lab-specific)

```
/design_scoring_rubric
```

The scoring rubric agent produces observation buckets (with match phrases, rarity predictions, differentiation levels), explanation buckets, senior analyst reports, and the competition facilitation guide.

**Output:** `registry/{scenario_id}/reasoning-lab/scoring.yaml`, `registry/{scenario_id}/reasoning-lab/competition-facilitation.yaml`

### Stage 5a: Configure Competition (Reasoning Lab-specific)

```
/configure_competition
```

Assembles the session configuration — scanner assignments, timer defaults, leaderboard settings, lab resource pool.

**Output:** `registry/{scenario_id}/reasoning-lab/session.yaml`

## Final Artifact Layout

```
registry/{scenario_id}/
├── scenario.yaml                          # Shared — stage 1
├── transcript.yaml                        # Shared — stage 2
├── analysis.yaml                          # Shared — stage 3
├── facilitation.yaml                      # Shared — stage 3
├── intermediates/                         # Pipeline working files
└── reasoning-lab/
    ├── scoring.yaml                       # Reasoning Lab — stage 4a
    ├── competition-facilitation.yaml      # Reasoning Lab — stage 4a
    └── session.yaml                       # Reasoning Lab — stage 5a
```

## Running Both Applications on the Same Scenario

If shared stages (1–3) have already been run for a scenario (e.g., for Lens), you only need to:

1. Initialize: `python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py`
2. Run Stage 4a: `/design_scoring_rubric`
3. Run Stage 5a: `/configure_competition`

The shared artifacts (`scenario.yaml`, `transcript.yaml`, `analysis.yaml`) are reused. Both `lens/` and `reasoning-lab/` subdirectories coexist under the same scenario.
