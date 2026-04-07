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

For the prose-first authoring loop (Phase 6 — story design doc plus per-episode drafts) see `framework/docs/operator-manual.md`. The pipeline below is Phase 7 — mechanical execution of those authored drafts.

## Pipeline Stages

Stages 1–3 are shared with Lens. If you've already run them for an episode, skip to Stage 4a. Every command takes `<story_id> <episode_number>` as its arguments.

### Stage 1: Create Episode (shared)

```
/create_episode <story_id> <episode_number>
```

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/episode.yaml`

### Stage 2: Create Transcript (shared)

```
/create_transcript <story_id> <episode_number>
```

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/transcript.yaml`

### Stage 3: Analyze Transcript (shared)

```
/analyze_transcript <story_id> <episode_number>
```

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/analysis.yaml`, `artifacts/{story_id}/episodes/episode_{NN}/facilitation.yaml`

### Stage 4a: Design Scoring Rubric (Reasoning Lab-specific)

```
/design_scoring_rubric <story_id> <episode_number>
```

The scoring rubric agent produces observation buckets (with match phrases, rarity predictions, differentiation levels), explanation buckets, senior analyst reports, and the competition facilitation guide.

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/scoring.yaml`, `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/competition-facilitation.yaml`

### Stage 5a: Configure Competition (Reasoning Lab-specific)

```
/configure_competition <story_id> <episode_number>
```

Assembles the session configuration — scanner assignments, timer defaults, leaderboard settings, lab resource pool.

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/session.yaml`

## Final Artifact Layout

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                          # Shared — stage 1
├── transcript.yaml                       # Shared — stage 2
├── analysis.yaml                         # Shared — stage 3
├── facilitation.yaml                     # Shared — stage 3
├── intermediates/                        # Pipeline working files
└── reasoning-lab/
    ├── scoring.yaml                      # Reasoning Lab — stage 4a
    ├── competition-facilitation.yaml     # Reasoning Lab — stage 4a
    └── session.yaml                      # Reasoning Lab — stage 5a
```

## Running Both Applications on the Same Episode

If shared stages (1–3) have already been run for an episode (e.g., for Lens), you only need to:

1. Initialize: `python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py`
2. Run Stage 4a: `/design_scoring_rubric <story_id> <episode_number>`
3. Run Stage 5a: `/configure_competition <story_id> <episode_number>`

The shared artifacts (`episode.yaml`, `transcript.yaml`, `analysis.yaml`) are reused. Both `lens/` and `reasoning-lab/` subdirectories coexist under the same episode directory.
