# Running the Shared Pipeline Stages

Stages 1–3 (`/create_episode` → `/create_transcript` → `/analyze_transcript`) are shared upstream between Lens and Reasoning Lab. This document is the single source of truth for what those stages do, how they fail, and how to recover. The Lens and Reasoning Lab `RUNNING.md` files reference this document for stages 1–3 and then layer their own app-specific stages (4–5 for Lens; 4a–5a for Reasoning Lab) on top.

This guide is for **operators running the pipeline**. For the prose-first authoring loop that produces the per-episode drafts these stages consume, see `framework/docs/operator-manual.md`. The per-episode draft template is Appendix B of `framework/docs/story-pipeline-revision.md`.

---

## Operating principles

**Each command is self-contained.** The pipeline was designed so that artifacts on disk are the source of truth between commands. You can run each command in a fresh Claude Code conversation; you don't need to keep previous commands' context loaded.

**One conversation per command.** Token cost is lower, failure isolation is cleaner, and the autonomous reviewer loops within each command don't need conversational context to do their job.

| Conversation | Command |
|---|---|
| 1 | `/create_episode <story_id> <episode_number>` |
| 2 | `/create_transcript <story_id> <episode_number>` |
| 3 | `/analyze_transcript <story_id> <episode_number>` |

When you start each conversation, give Claude one line of context like *"Continue the pipeline for `{your-story-id}` episode 2."* — that's enough orientation. The slash command reads what it needs from `framework/stories/{story_id}/` and `artifacts/{story_id}/episodes/episode_{NN}/`.

**The reviewer loops are autonomous.** Once you invoke a command, do not interrupt mid-flow. Each command has bounded retry budgets (typically 1 revise pass for the reviewer; 3 attempts for the dialog writer in `/create_transcript`). If the budget is exhausted, the command halts with a structured failure surface.

**Telemetry is automatic.** Each command writes events to `artifacts/{story_id}/episodes/episode_{NN}/pipeline_log.yaml` as it runs (append-only YAML stream — one document per event). The log is **forensic**, not operational — commands don't read it to make decisions; it exists for post-hoc tuning, debugging, and pilot-data analysis.

**Mixed-valence is doctrinal.** Every per-episode draft must contain at least one entry in `strengths:`. `validate_story.py` (run automatically by `/create_episode`) will fail the story if the draft is missing this.

---

## Pre-flight

Before running the pipeline for a new episode:

### 1. Confirm the per-episode draft exists

The draft lives at `framework/stories/{story_id}/episode_{NN}.md`. It is authored as prose with YAML frontmatter (Appendix B of `framework/docs/story-pipeline-revision.md`). If it does not exist, you are not ready to run the pipeline; return to prose authoring.

### 2. Run validate_story.py

```bash
python3 framework/pipeline/scripts/validate_story.py --story <story_id>
```

Walks the story design doc and every per-episode draft in the story directory and runs all the cross-episode rules (lens distribution, mixed-valence rotation, strength/weakness rotation, coverage closure). Halt and return to prose authoring if it reports any FAIL.

### 3. (Recommended) Run story_consistency_reviewer

If the draft was authored or revised since the last consistency review, run `story_consistency_reviewer` over the story directory to catch character drift, unearned growth beats, and rubric items 1–8. See `framework/docs/operator-manual.md` for how.

---

## Shared stages

Run these commands in order. Each stage produces artifacts in `artifacts/{story_id}/episodes/episode_{NN}/`. Each command is autonomous between operator touchpoints — once you invoke it, let it run to completion or halt.

### Stage 1: Create Episode

```
/create_episode <story_id> <episode_number>
```

**The command:**
- Step 0 confirms the per-episode draft and the story design doc exist, then runs `validate_story.py` over the story.
- Step 1 invokes `planning_agent` to read the per-episode draft frontmatter and the story design doc and draft `episode.yaml` plus `episode_writer_input.yaml` (the barrier-safe projection).
- Step 2 invokes `validation_agent` (fresh subagent) which returns `ACCEPT` / `REVISE` / `REJECT`. One retry budget on `REVISE`; `REJECT` halts.
- Step 3 runs the quality checklist.
- Step 4 saves both files and runs `validate_schema.py` against `framework/schemas/episode_plan.yaml` and `framework/schemas/episode_writer_input.yaml` (hard gate — halts on non-zero exit). The `episode_writer_input.yaml` validation includes the literal scan that enforces the information barrier.

**Operator inputs:** none — the per-episode draft IS the operator prompt, authored ahead of time.

**Output:**
- `artifacts/{story_id}/episodes/episode_{NN}/episode.yaml` — the approved plan
- `artifacts/{story_id}/episodes/episode_{NN}/intermediates/episode_writer_input.yaml` — barrier-safe projection
- `artifacts/{story_id}/episodes/episode_{NN}/pipeline_log.yaml` — start of the telemetry trace

### Stage 2: Create Transcript

```
/create_transcript <story_id> <episode_number>
```

**The command:**
- Step 1 reads the barrier-safe projection and re-validates it against its schema.
- Step 1b invokes `projection_reviewer` to check the projection for paraphrased leakage (LEAK / RISK / OK).
- Step 2 invokes `dialog_writer` as a fresh subagent **with no Read tool** — the structural information barrier. The agent receives `episode_writer_input.yaml` contents inline only; no file paths.
- Step 3 runs `review_transcript.py` for structural compliance (turn count, word count, speaker names). On failure, returns to Step 2; up to 3 dialog-writer attempts.
- Step 4 invokes `transcript_id` (which sees the full plan) to sharpen signal moments — both weakness signals and designed strength signals.
- Step 5 invokes `transcript_reviewer` which returns `ACCEPT` / `REVISE` / `REGENERATE`. One revise budget; regenerate counts toward the dialog-writer attempt limit.
- Step 7 enumerates turns and sentences, then validates against the `transcript.yaml` schema (hard gate).

### Stage 3: Analyze Transcript

```
/analyze_transcript <story_id> <episode_number>
```

**The command:**
- Step 1 invokes `evaluator` to segment passages, produce facet annotations (three passes: targeted weaknesses, targeted strengths, emergent), the unified AI perspective, and the facilitation guide. Validates both outputs against their schemas, then runs `check_analysis_invariants.py` to enforce cross-field invariants.
- Step 2 invokes `analysis_reviewer` which returns `ACCEPT` / `REVISE`. One revise budget.

---

## When a command halts

Each command has bounded retry budgets. When they're exhausted, the command halts with a structured failure surface:

- **The latest version of the artifact(s)** in their final state on disk
- **The latest reviewer report** in conversation context
- **The intermediates directory** with stage-by-stage working files
- **The telemetry log** showing the trace up to the halt

When this happens, the operator decides:

- **Edit and resume** — manually adjust the failing artifact and re-invoke the command (or its successor).
- **Accept as-is** — save the latest version and proceed despite reviewer concerns.
- **Restart upstream** — if the failure indicates a structural problem, return to `/create_episode`. If the same signal fails to land across two episodes, return to prose authoring and revise the per-episode draft (or, for character-level drift, the story design doc).

For the underlying design intent, see *Failure-mode escape hatch* in `framework/docs/system-architecture.md` and the re-planning loop in Part 6 of `framework/docs/story-pipeline-revision.md`.

---

## Diagnostic scripts

| Script | Purpose |
|---|---|
| `framework/pipeline/scripts/validate_story.py --story <id>` | Validate a story (design doc + per-episode drafts) against cross-episode rules. |
| `framework/pipeline/scripts/validate_schema.py <artifact> <schema>` | Validate any artifact against its descriptive YAML schema. |
| `framework/pipeline/scripts/check_analysis_invariants.py <analysis> [<episode>]` | Enforce cross-field invariants on `analysis.yaml`. |
| `framework/pipeline/scripts/log_pipeline_event.py` | Append a telemetry event. Used internally by commands. |
