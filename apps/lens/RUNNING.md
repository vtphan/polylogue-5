# Running the Lens Pipeline

The Lens pipeline turns one operator prompt into a complete student- and teacher-facing artifact set for one scenario. Five commands across five stages, plus an optional `/brainstorm` co-design phase upstream and `/check_coverage` as a diagnostic. Each command runs autonomously between operator touchpoints — the operator's job is at the start (authoring the prompt) and the end (authoring session-level content), not in the middle.

This guide is for **operators running the pipeline**. For the design rationale behind each artifact, see `framework/docs/conceptual-framework.md`. For the stage-by-stage agent specifications, see `framework/docs/system-architecture.md` and `apps/lens/docs/pipeline-spec.md`.

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

## Operating principles

A few things to know before your first run.

**Each command is self-contained.** The pipeline was designed so that artifacts on disk are the source of truth between commands. You can run each command in a fresh Claude Code conversation; you don't need to keep previous commands' context loaded.

**One conversation per command.** Run each slash command in a fresh conversation. The exception is `/brainstorm` → `/create_scenario`, which should share a conversation because the operator prompt is the handoff. From `/create_transcript` onward, fresh conversations are recommended — token cost is lower, failure isolation is cleaner, and the autonomous reviewer loops within each command don't need conversational context to do their job.

| Conversation | Commands |
|---|---|
| 1 | `/brainstorm` → `/create_scenario` |
| 2 | `/create_transcript` |
| 3 | `/analyze_transcript` |
| 4 | `/design_scaffolding` |
| 5 | `/configure_session` |

When you start conversations 2–5, give Claude one line of context like *"Continue the pipeline for scenario `ocean-vs-deforestation`."* — that's enough orientation. The slash command itself reads what it needs from `artifacts/{scenario_id}/`.

**The reviewer loops are autonomous.** Once you invoke a command, do not interrupt mid-flow. Each command has bounded retry budgets (typically 1 revise pass for the reviewer; 3 attempts for the dialog writer in `/create_transcript`). If the budget is exhausted, the command halts with a structured failure surface — see *When a command halts* below.

**Telemetry is automatic.** Each command writes events to `artifacts/{scenario_id}/pipeline_log.yaml` as it runs (append-only YAML stream — one document per event). You don't need to do anything to opt in. The log is **forensic**, not operational — commands don't read it to make decisions; it exists for post-hoc tuning, debugging, and pilot-data analysis.

To inspect the log:
```bash
cat artifacts/{scenario_id}/pipeline_log.yaml
```
or programmatically:
```python
import yaml
events = list(yaml.safe_load_all(open("artifacts/{scenario_id}/pipeline_log.yaml")))
```

**Mixed-valence is doctrinal.** Every scenario must have at least one `Target strengths:` entry in its operator prompt. `/create_scenario` will halt at Step 0 if you supply a prompt without one.

---

## Pre-flight

Before running the pipeline for a new scenario:

### 1. Check coverage

Run the diagnostic command to see which planned scenarios are present, missing, or drifting:

```
/check_coverage
```

This reads `framework/reference/scenario_sequence.yaml` and compares it against the generated scenarios in `artifacts/`. It reports per-scenario status (`OK` / `DRIFT` / `MISSING`) and aggregate coverage of the planned facets, cognitive patterns, and social dynamics. Exit code 0 only when the plan is fully covered.

Use it to decide which scenario to run next, and to confirm a previous run didn't leave any drift.

### 2. Find the operator prompt

The 5 planned scenarios each have a complete operator-prompt code block in `framework/docs/scenario-sequence.md`. Find the block for your target scenario — it's designed to paste directly into `/create_scenario`.

### 3. Verify the prompt is mixed-valence

The prompt block should have both `Target facets:` (weaknesses) and `Target strengths:` sections. If the strength section is missing, **do not run the pipeline** — fix the prose doc first, then re-paste. Mixed-valence is doctrinal and `/create_scenario` will halt at Step 0 without it.

---

## Pipeline stages

Run these commands in order. Each stage produces artifacts in `artifacts/{scenario_id}/`. Each command is autonomous between operator touchpoints — once you invoke it, let it run to completion or halt.

### Stage 0 (optional): Brainstorm

```
/brainstorm
```

Conversational co-design of the 6-field operator prompt. Use this if you don't already have a prompt for the scenario; skip it if you're working from a pre-written prompt in `scenario-sequence.md`. Brainstorm produces no artifacts and emits no telemetry — its output is the prompt itself, which you immediately pass to `/create_scenario` in the same conversation.

### Stage 1: Create Scenario

```
/create_scenario
```

Paste the validated 6-field operator prompt when invoked.

**The command:**
- Step 0 validates the prompt has all 6 fields, including ≥1 target strength.
- Step 1 invokes `planning_agent` to draft `scenario.yaml`. The scenario_id is generated here. Telemetry events before this point log under a per-run `_pending_<timestamp>` id; the pending log is merged into the real scenario directory once the id is known.
- Step 2 invokes `validation_agent` (fresh subagent) which returns `ACCEPT` / `REVISE` / `REJECT`. One retry budget on `REVISE`; `REJECT` halts.
- Step 3 runs the quality checklist.
- Step 4 saves the plan and runs `validate_schema.py` against `framework/schemas/scenario_plan.yaml` (hard gate — halts on non-zero exit).

**Operator inputs:** the 6-field prompt (paste once when invoked).

**Output:**
- `artifacts/{scenario_id}/scenario.yaml` — the approved plan
- `artifacts/{scenario_id}/operator-prompt.txt` — the normalized prompt
- `artifacts/{scenario_id}/intermediates/` — empty, used by /create_transcript
- `artifacts/{scenario_id}/pipeline_log.yaml` — start of the telemetry trace

### Stage 2: Create Transcript

```
/create_transcript {scenario_id}
```

**The command:**
- Step 1 runs `strip_scenario.py` to remove `target_facets`, `target_strengths`, and `discussion_dynamic` (the information barrier), then validates the stripped file against `dialog_writer_input.yaml`.
- Step 2 invokes `dialog_writer` as a fresh subagent **with no Read tool** — that is the structural information barrier. The agent only sees the stripped input.
- Step 3 runs `review_transcript.py` for structural compliance (turn count, word count, speaker names). On failure, returns to Step 2; up to 3 dialog-writer attempts.
- Step 4 invokes `transcript_id` (which sees the full plan) to sharpen signal moments — both weakness signals and designed strength signals.
- Step 5 invokes `transcript_reviewer` which returns `ACCEPT` / `REVISE` / `REGENERATE`. One revise budget; regenerate counts toward the dialog-writer attempt limit.
- Step 7 enumerates turns and sentences, then validates against `transcript.yaml` schema (hard gate).

**Operator inputs:** none (autonomous).

**Output:**
- `artifacts/{scenario_id}/transcript.yaml`
- `artifacts/{scenario_id}/intermediates/dialog_writer_input.yaml`
- `artifacts/{scenario_id}/intermediates/transcript_raw.yaml`
- `artifacts/{scenario_id}/intermediates/transcript_polished.yaml`

### Stage 3: Analyze Transcript

```
/analyze_transcript {scenario_id}
```

**The command:**
- Step 1 invokes `evaluator` to segment passages, produce facet annotations (three passes: targeted weaknesses, targeted strengths, emergent), the unified AI perspective, and the facilitation guide. Validates both outputs against their schemas, then runs `check_analysis_invariants.py` to enforce cross-field invariants the descriptive schema can't express:
  - every `quality_level: strong` annotation has a non-empty `contrastive_explanation`
  - strong annotations have null `cognitive_pattern` and `social_dynamic` under `explanatory_variables`
  - every entry in the scenario plan's `target_strengths` appears as ≥1 strong+was_targeted annotation
- Step 2 invokes `analysis_reviewer` which returns `ACCEPT` / `REVISE`. One revise budget.

**Operator inputs:** none (autonomous).

**Output:**
- `artifacts/{scenario_id}/analysis.yaml`
- `artifacts/{scenario_id}/facilitation.yaml` (initial version)

### Stage 4: Design Scaffolding (Lens-specific)

```
/design_scaffolding {scenario_id}
```

**The command:**
- Step 1 copies the current facilitation guide to `intermediates/facilitation_pre_enrichment.yaml` for debugging.
- Step 2 invokes `scaffolding_id` to produce `scaffolding.yaml` (graduated hints, common misreadings, observation/explanation rubrics, AI reflection prompts) and enrich `facilitation.yaml` with passage-specific discussion starters. Validates both outputs.
- Step 3 invokes `scaffolding_reviewer` which returns `ACCEPT` / `REVISE`. One revise budget.

**Operator inputs:** none (autonomous).

**Output:**
- `artifacts/{scenario_id}/lens/scaffolding.yaml`
- `artifacts/{scenario_id}/lens/facilitation.yaml` (enriched)

### Stage 5: Configure Session (Lens-specific)

```
/configure_session {scenario_id}
```

**The command:**
- Steps 1–3 assemble `session.yaml` from the upstream artifacts.
- The standard student-facing strings (instructions for diagnose / discuss / ai_perspective / submit_assessment) are loaded verbatim from `apps/lens/reference/default_instructions.yaml`. **The operator does not author these per scenario.** If a per-session deviation is needed, override the relevant field and emit an `instruction_override` telemetry event; for permanent changes, edit `default_instructions.yaml` directly.
- Lifeline pool size and vocabulary toggles are derived from `framework/reference/scenario_sequence.yaml`'s `lens:` block for this scenario_id. If the operator needs to override a toggle, log a `toggle_override` event.
- Step 4 saves the file.
- Step 5 runs `validate_schema.py` against `apps/lens/schemas/session.yaml` (hard gate).

**Operator inputs:** only the genuinely scenario-specific student-facing strings — `onboarding.topic_summary` and `onboarding.reading_instruction`. Everything else is derived or defaulted.

**Output:**
- `artifacts/{scenario_id}/lens/session.yaml`

---

## Post-flight

After the pipeline completes for a scenario:

### 1. Re-run `/check_coverage`

```
/check_coverage
```

Confirm the new scenario is now `OK` (not `DRIFT` or `MISSING`) and that aggregate coverage moved in the right direction.

### 2. Capture operator notes

Write a short markdown file at `artifacts/{scenario_id}/_operator_notes.md` capturing what happened from your perspective: what halted, what surprised you, where the agents struggled, where you had to intervene. **This is the only place qualitative pilot data lives.** The artifacts and telemetry capture *what* the pipeline produced; the operator notes capture *what it felt like to run*. Both are needed for any meaningful post-pilot review.

### 3. Inspect the telemetry log

```bash
cat artifacts/{scenario_id}/pipeline_log.yaml
```

A clean run looks roughly like: `start` → producer events → reviewer events with `ACCEPT` verdicts → `schema_validation PASS` → `save SAVE` for each command. Anything unusual — `REVISE` retries, `REGENERATE` events, `HALT` verdicts, `FAIL` saves — is worth understanding before moving on.

### 4. (Recommended) Review in a fresh conversation

Once the pipeline has completed, start a fresh Claude Code conversation and ask for a review of the run. A useful opening prompt:

> Review the pipeline run for scenario `{scenario_id}`. Artifacts are in `artifacts/{scenario_id}/`, telemetry in `artifacts/{scenario_id}/pipeline_log.yaml`, my operator notes in `artifacts/{scenario_id}/_operator_notes.md`. Check (1) schema and invariant conformance via `validate_schema.py` and `check_analysis_invariants.py`, (2) cross-artifact doctrinal conformance for `target_strengths` and `contrastive_explanation`, (3) telemetry coherence, (4) Logic-lens mitigation in `diversity_potential.expected_lens_split`, and (5) anything else that suggests a gap in the contracts.

A fresh conversation gives the reviewer a clean context window and avoids the bias of justifying choices made earlier.

---

## When a command halts

Each command has bounded retry budgets. When they're exhausted, the command halts with a structured failure surface:

- **The latest version of the artifact(s)** in their final state on disk
- **The latest reviewer report** in conversation context
- **The intermediates directory** (`artifacts/{scenario_id}/intermediates/`) with stage-by-stage working files
- **The telemetry log** showing the trace up to the halt

When this happens, the operator decides:

- **Edit and resume** — manually adjust the failing artifact and re-invoke the command (or its successor). The artifacts on disk are the resume protocol; if a downstream artifact already exists, the command may need to re-run the failing stage only.
- **Accept as-is** — save the latest version and proceed despite reviewer concerns. Useful when the reviewer is being conservative on an edge case the operator judges acceptable.
- **Restart upstream** — return to an earlier stage (e.g., `/create_scenario`) if the failure indicates a structural problem with an upstream input.

When you're resuming after a halt, *that's* the moment to reference the telemetry log explicitly. On normal runs, the log is write-only. On recovery runs, give Claude a one-line orientation:

> Resuming the pipeline for `{scenario_id}` after `/create_transcript` halted on the dialog writer's third attempt. See `artifacts/{scenario_id}/pipeline_log.yaml` and `artifacts/{scenario_id}/intermediates/transcript_raw.yaml` for context.

For the underlying design intent, see *Failure-mode escape hatch* in `framework/docs/system-architecture.md`.

---

## Final artifact layout

After a complete pipeline run:

```
artifacts/{scenario_id}/
├── scenario.yaml                          # Stage 1 — the approved plan
├── operator-prompt.txt                    # Stage 1 — the normalized 6-field prompt
├── transcript.yaml                        # Stage 2 — enumerated transcript
├── analysis.yaml                          # Stage 3 — facet annotations + AI perspective
├── facilitation.yaml                      # Stage 3 (initial) → Stage 4 (enriched)
├── pipeline_log.yaml                      # Telemetry trace across all stages
├── _operator_notes.md                     # Operator-authored pilot notes (optional)
├── intermediates/                         # Stage-by-stage working files
│   ├── dialog_writer_input.yaml
│   ├── transcript_raw.yaml
│   ├── transcript_polished.yaml
│   └── facilitation_pre_enrichment.yaml
└── lens/
    ├── scaffolding.yaml                   # Stage 4 — student scaffolding
    ├── facilitation.yaml                  # Stage 4 — enriched (overrides Stage 3 version above)
    └── session.yaml                       # Stage 5 — final session config
```

The shared artifacts (`scenario.yaml`, `transcript.yaml`, `analysis.yaml`) are reusable by other applications. Reasoning Lab can run on the same scenario by initializing for that app and running its own Stage 4a/5a — the `lens/` and `reasoning-lab/` subdirectories coexist under the same scenario directory.

---

## Diagnostic commands

| Command | Purpose |
|---|---|
| `/check_coverage` | Compare generated scenarios against the planned sequence in `framework/reference/scenario_sequence.yaml`. Reports per-scenario drift and aggregate coverage. No artifacts written. |

Underlying scripts (callable directly when debugging):

| Script | Purpose |
|---|---|
| `framework/pipeline/scripts/validate_schema.py <artifact> <schema>` | Validate any artifact against its descriptive YAML schema. |
| `framework/pipeline/scripts/check_analysis_invariants.py <analysis> [<scenario>]` | Enforce cross-field invariants on `analysis.yaml` (contrastive_explanation required for strong annotations, target_strengths coverage). |
| `framework/pipeline/scripts/strip_scenario.py <scenario> <output>` | Strip barrier-side fields from a scenario plan to produce dialog writer input. |
| `framework/pipeline/scripts/check_coverage.py` | Underlying script for `/check_coverage`. Accepts `--sequence` and `--artifacts` overrides. |
| `framework/pipeline/scripts/log_pipeline_event.py` | Append a telemetry event. Used internally by commands; the operator rarely calls it directly. Supports `--rename-pending` for merging the per-run pending log into a real scenario directory. |

---

## Troubleshooting

**`/create_scenario` halts at Step 0 saying "target strengths missing."** The operator prompt is missing a `Target strengths:` section. Fix: open `framework/docs/scenario-sequence.md`, find the operator prompt block for your scenario, copy the `Target strengths:` block, paste it into your prompt below the `Target facets:` block. Re-invoke `/create_scenario`.

**`validate_schema.py` reports issues after a save step.** The agent's output drifted from the schema. Open the artifact, fix the structural issue (missing required field, wrong enum value, etc.), re-run `validate_schema.py` manually to confirm, then continue.

**`check_analysis_invariants.py` reports a missing `contrastive_explanation`.** A strong-quality facet annotation in `analysis.yaml` doesn't have a contrastive explanation. The evaluator missed it. Fix: re-invoke `/analyze_transcript` and the analysis_reviewer should catch it on the second pass; if not, edit `analysis.yaml` directly to add the contrastive explanation per the deficit-vocabulary-as-baseline pattern (see `framework/schemas/analysis.yaml` field description and suggestion E in `framework/docs/system-evaluation-20260406.md`).

**`/create_transcript` halts after 3 dialog-writer attempts.** The structural review keeps failing. The most common cause is the operator prompt asking for a discussion shape the dialog writer can't naturally produce in 10–14 turns. Fix: inspect `intermediates/transcript_raw.yaml` for what the dialog writer kept producing, then return to `/create_scenario` and revise the operator prompt's discussion dynamic field.

**`/configure_session` warns "scenario not in sequence."** The scenario_id isn't listed in `framework/reference/scenario_sequence.yaml`. The command falls back to default toggles (`lifeline_pool: 5`, `show_cognitive_patterns: false`, `show_social_dynamics: false`). If this is intentional (an experimental scenario), proceed. If not, add the scenario to the sequence YAML and the prose doc, then re-run.

**The pipeline log has `_pending_<timestamp>` directories left behind.** This means `/create_scenario` started but never reached the rename-pending step (i.e., the planning agent never returned a scenario_id). The pending events are still readable for forensics. Clean up after diagnosis with `rm -rf artifacts/_pending_*` once you're sure you don't need the trace.
