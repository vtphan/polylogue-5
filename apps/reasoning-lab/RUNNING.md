# Running the Reasoning Lab Pipeline

**Status.** Describes **v1 (currently live)**. v2 redesign in flight — see `framework/docs/pipeline-v1-to-v2-migration.md`.

The Reasoning Lab pipeline turns one per-episode draft into scoring and competition artifacts. Stages 1–3 are shared upstream with Lens; stages 4a–5a are Reasoning Lab-specific. Every command takes `<story_id> <episode_number>` as its arguments.

This guide covers initialization and the Reasoning Lab-specific stages. For operating principles, pre-flight checks, and shared stages 1–3, see **`framework/docs/RUNNING-shared-stages.md`**. For the prose-first authoring loop that produces the per-episode drafts, see `framework/docs/operator-manual.md`.

---

## Initialize

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and Reasoning Lab commands/agents from `apps/reasoning-lab/pipeline/`.

Run this:
- Before the first session
- After editing any file in `framework/pipeline/commands/`, `framework/pipeline/agents/`, `apps/reasoning-lab/pipeline/commands/`, or `apps/reasoning-lab/pipeline/agents/`
- When switching from another application (e.g., Lens) to Reasoning Lab

---

## Shared stages 1–3

Run `/create_episode` → `/create_transcript` → `/analyze_transcript` per `framework/docs/RUNNING-shared-stages.md`. Those stages produce `episode.yaml`, `transcript.yaml`, `analysis.yaml`, and `facilitation.yaml` under `artifacts/{story_id}/episodes/episode_{NN}/`. If shared stages have already been run for this episode (e.g., for Lens), they are reusable — skip to stage 4a below.

---

## Reasoning Lab-specific stages

### Stage 4a: Design Scoring Rubric

```
/design_scoring_rubric <story_id> <episode_number>
```

The scoring rubric agent produces observation buckets (with match phrases, rarity predictions, differentiation levels), explanation buckets, senior analyst reports, and the competition facilitation guide.

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/scoring.yaml`, `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/competition-facilitation.yaml`

### Stage 5a: Configure Competition

```
/configure_competition <story_id> <episode_number>
```

Assembles the session configuration — scanner assignments, timer defaults, leaderboard settings, lab resource pool.

**Output:** `artifacts/{story_id}/episodes/episode_{NN}/reasoning-lab/session.yaml`

---

## Final artifact layout

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                          # Shared — stage 1
├── transcript.yaml                       # Shared — stage 2
├── analysis.yaml                         # Shared — stage 3
├── facilitation.yaml                     # Shared — stage 3
├── intermediates/                        # Pipeline working files
└── reasoning-lab/
    ├── scoring.yaml                      # Stage 4a
    ├── competition-facilitation.yaml     # Stage 4a
    └── session.yaml                      # Stage 5a
```

The shared artifacts (`episode.yaml`, `transcript.yaml`, `analysis.yaml`) are reusable by Lens. Both `lens/` and `reasoning-lab/` subdirectories coexist under the same episode directory.
