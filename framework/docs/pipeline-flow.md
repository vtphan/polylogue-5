# Pipeline Flow

**Status.** Describes **v1 (currently live)**. v2 redesign in flight — see `pipeline-v1-to-v2-migration.md`.

The Polylogue pipeline runs in two phases: **shared upstream** (stages 1–3) and **application-specific downstream** (stages 4–5). This document is the canonical stage-by-stage reference. For architectural rationale and directory structure, see `system-architecture.md`. For operator runbooks, see `RUNNING-shared-stages.md` and each app's `RUNNING.md`.

Every command takes `<story_id> <episode_number>` as its arguments.

## Shared Upstream Pipeline (Framework)

All applications share these stages. Run once per episode.

```
/create_episode  →  /create_transcript  →  /analyze_transcript
       ↓                     ↓                      ↓
  episode.yaml         transcript.yaml         analysis.yaml
                                               facilitation.yaml
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 1. Create Episode | `/create_episode` | Planning agent, validation agent | `episode.yaml`, `episode_writer_input.yaml` |
| 2. Create Transcript | `/create_transcript` | Projection reviewer, dialog writer, transcript ID, transcript reviewer | `transcript.yaml` |
| 3. Analyze Transcript | `/analyze_transcript` | Evaluator, analysis reviewer | `analysis.yaml`, `facilitation.yaml` |

## Application-Specific Downstream Pipeline

Run once per episode per application. Consumes the shared artifacts and produces app-specific artifacts.

### Lens (stages 4–5)

```
/design_scaffolding  →  /configure_session
        ↓                       ↓
  scaffolding.yaml         session.yaml
  facilitation.yaml (enriched)
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 4. Design Scaffolding | `/design_scaffolding` | Scaffolding ID, scaffolding reviewer | `scaffolding.yaml`, enriched `facilitation.yaml` |
| 5. Configure Session | `/configure_session` | (script) | `session.yaml` |

### Reasoning Lab (stages 4a–5a)

```
/design_scoring_rubric  →  /configure_competition
        ↓                          ↓
  scoring.yaml                session.yaml
  competition-facilitation.yaml
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 4a. Design Scoring Rubric | `/design_scoring_rubric` | Scoring rubric agent | `scoring.yaml`, `competition-facilitation.yaml` |
| 5a. Configure Competition | `/configure_competition` | (script) | `session.yaml` |

## Artifact Flow

The shared artifacts (`episode.yaml`, `transcript.yaml`, `analysis.yaml`, `facilitation.yaml`) are reusable across applications. Both `lens/` and `reasoning-lab/` subdirectories coexist under the same episode directory — running Reasoning Lab after Lens (or vice versa) on the same episode only requires re-initializing and running the app-specific stages.
