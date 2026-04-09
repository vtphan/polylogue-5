# Running the Lens Pipeline

The Lens pipeline turns one per-episode draft into a complete student- and teacher-facing artifact set for one episode of one story. Five commands across five stages. Stages 1–3 are shared upstream between Lens and Reasoning Lab; stages 4–5 are Lens-specific.

This guide covers initialization and the Lens-specific stages. For operating principles, pre-flight checks, and shared stages 1–3 (`/create_episode` → `/create_transcript` → `/analyze_transcript`), see **`framework/docs/RUNNING-shared-stages.md`**. For the prose-first authoring loop that produces the per-episode drafts these stages consume, see `framework/docs/operator-manual.md`.

---

## Initialize

Before running any slash commands, bootstrap the environment. This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and Lens-specific commands/agents from `apps/lens/pipeline/`.

```bash
python3 apps/lens/pipeline/initialize_lens.py
```

The init script also verifies that all required reference data and schema files exist (`framework/reference/`, `framework/schemas/`, `apps/lens/reference/`, `apps/lens/schemas/`) and that the `artifacts/` directory exists. It will report any missing files.

Run initialize:
- Before the first session
- After editing any file in `framework/pipeline/commands/`, `framework/pipeline/agents/`, `apps/lens/pipeline/commands/`, or `apps/lens/pipeline/agents/`
- When switching from another application (e.g., Reasoning Lab) to Lens

---

## Shared stages 1–3

Run `/create_episode` → `/create_transcript` → `/analyze_transcript` per `framework/docs/RUNNING-shared-stages.md`. Those stages produce `episode.yaml`, `transcript.yaml`, `analysis.yaml`, and `facilitation.yaml` under `artifacts/{story_id}/episodes/episode_{NN}/`. When they pass, continue with the Lens-specific stages below.

---

## Lens-specific stages

### Stage 4: Design Scaffolding

```
/design_scaffolding <story_id> <episode_number>
```

**The command:**
- Step 1 copies the current facilitation guide to `intermediates/facilitation_pre_enrichment.yaml` for debugging.
- Step 2 invokes `scaffolding_id` to produce `lens/scaffolding.yaml` and enrich `lens/facilitation.yaml` with passage-specific discussion starters. Validates both outputs.
- Step 3 invokes `scaffolding_reviewer` which returns `ACCEPT` / `REVISE`. One revise budget.

### Stage 5: Configure Session

```
/configure_session <story_id> <episode_number>
```

**The command:**
- Steps 1–3 assemble `lens/session.yaml` from the upstream artifacts.
- The standard student-facing strings are loaded verbatim from `apps/lens/reference/default_instructions.yaml`.
- Lifeline pool size and vocabulary toggles default to `lifeline_pool: 5`, `show_cognitive_patterns: false`, `show_social_dynamics: false`. The operator overrides per session if needed and emits a `toggle_override` telemetry event.
- Step 4 saves the file.
- Step 5 runs `validate_schema.py` against `apps/lens/schemas/session.yaml` (hard gate).

**Operator inputs:** only the genuinely episode-specific student-facing strings — `onboarding.topic_summary` and `onboarding.reading_instruction`.

---

## Final artifact layout

After a complete pipeline run for one episode:

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                          # Shared — stage 1
├── transcript.yaml                       # Shared — stage 2
├── analysis.yaml                         # Shared — stage 3
├── facilitation.yaml                     # Shared — stage 3 (initial) → Stage 4 (enriched in lens/)
├── pipeline_log.yaml                     # Telemetry trace across all stages
├── intermediates/                        # Stage-by-stage working files
│   ├── episode_writer_input.yaml
│   ├── transcript_raw.yaml
│   ├── transcript_polished.yaml
│   └── facilitation_pre_enrichment.yaml
└── lens/
    ├── scaffolding.yaml                  # Stage 4 — student scaffolding
    ├── facilitation.yaml                 # Stage 4 — enriched
    └── session.yaml                      # Stage 5 — final session config
```

The shared artifacts (`episode.yaml`, `transcript.yaml`, `analysis.yaml`) are reusable by Reasoning Lab. Initialize for that app and run its own stages — the `lens/` and `reasoning-lab/` subdirectories coexist under the same episode directory.
