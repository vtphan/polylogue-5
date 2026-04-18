# Running The Lens App-Specific Pipeline

This document covers Lens-specific steps that run **after** the shared framework pipeline. The shared upstream stages produce `assistive_package.yaml`; the Lens-specific stages consume it.

For the short runbook, see `framework/docs/operator-guide.md`. For story-level authoring and validation, see `framework/docs/story-authoring.md`. For the shared episode pipeline, see `framework/docs/artifacts-generation.md`.

---

## Initialize

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
```

Clears `.claude/commands/` and `.claude/agents/`, then syncs the full shared framework pipeline from `framework/pipeline/` and layers Lens-specific commands/agents from `apps/lens/pipeline/` on top. Re-run after editing pipeline files or when switching from another application.

---

## Shared Stages

Run `/create_episode` → `/create_transcript` → `/build_assistive_package` per `framework/docs/artifacts-generation.md`. These produce `episode.yaml`, `transcript.yaml`, and `assistive_package.yaml` (plus the four individual agent outputs) under `artifacts/{story_id}/episodes/episode_{NN}/`. When they pass, continue with Lens-specific stages below.

---

## Lens-Specific Stages

### Design Scaffolding

```
/design_scaffolding <story_id> <episode_number>
```

Invokes `scaffolding_id` to produce `lens/scaffolding.yaml` and enriches `lens/facilitation.yaml` with passage-specific discussion starters. `scaffolding_reviewer` returns ACCEPT / REVISE (one revise budget).

### Configure Session

```
/configure_session <story_id> <episode_number>
```

Assembles `lens/session.yaml` from upstream artifacts. Standard strings loaded from `apps/lens/reference/default_instructions.yaml`. Operator provides only the episode-specific student-facing strings (`onboarding.topic_summary`, `onboarding.reading_instruction`).

---

## Final artifact layout

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                          # Shared — /create_episode
├── transcript.yaml                       # Shared — /create_transcript
├── ground_truth_generated.yaml           # Shared — /build_assistive_package
├── diagnostic_generated.yaml
├── prose_generated.yaml
├── discussion_generated.yaml
├── assistive_package.yaml                # Shared — merged runtime artifact
├── pipeline_log.yaml
├── intermediates/
│   └── episode_writer_input.yaml
└── lens/
    ├── scaffolding.yaml                  # /design_scaffolding
    ├── facilitation.yaml                 # /design_scaffolding (enriched)
    └── session.yaml                      # /configure_session
```
