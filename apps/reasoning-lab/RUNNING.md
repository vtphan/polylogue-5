# Running the Reasoning Lab Pipeline

The Reasoning Lab pipeline turns one per-episode draft into scoring and competition artifacts. The shared upstream stages produce `assistive_package.yaml`; the Reasoning Lab stages consume it.

For the short runbook, see `framework/docs/operator-guide.md`. For story-level authoring and validation, see `framework/docs/story-authoring.md`. For the shared episode pipeline, see `framework/docs/artifacts-generation.md`.

---

## Initialize

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

Clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and Reasoning Lab commands/agents from `apps/reasoning-lab/pipeline/`. Re-run after editing pipeline files or when switching applications.

---

## Shared stages

Run `/create_episode` → `/create_transcript` → `/build_assistive_package` per `framework/docs/artifacts-generation.md`. If shared stages have already been run for this episode (e.g., for Lens), they are reusable — skip to the Reasoning Lab stages below.

---

## Reasoning Lab-specific stages

### Design Scoring Rubric

```
/design_scoring_rubric <story_id> <episode_number>
```

Produces observation buckets (with match phrases, rarity predictions, differentiation levels), explanation buckets, senior analyst reports, and the competition facilitation guide.

**Output:** `reasoning-lab/scoring.yaml`, `reasoning-lab/competition-facilitation.yaml`

### Configure Competition

```
/configure_competition <story_id> <episode_number>
```

Assembles the session configuration — scanner assignments, timer defaults, leaderboard settings, lab resource pool.

**Output:** `reasoning-lab/session.yaml`

---

## Final artifact layout

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                          # Shared — /create_episode
├── transcript.yaml                       # Shared — /create_transcript
├── assistive_package.yaml                # Shared — /build_assistive_package
├── pipeline_log.yaml
├── intermediates/
└── reasoning-lab/
    ├── scoring.yaml                      # /design_scoring_rubric
    ├── competition-facilitation.yaml     # /design_scoring_rubric
    └── session.yaml                      # /configure_competition
```

The shared artifacts are reusable by Lens. Both `lens/` and `reasoning-lab/` subdirectories coexist under the same episode directory.
