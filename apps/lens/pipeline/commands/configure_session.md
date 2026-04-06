---
description: Assemble the final Lens session configuration from all preceding artifacts
argument-hint: <scenario_id>
---

# Configure Session

Assemble the session configuration from the transcript, analysis, and scaffolding artifacts. This is largely mechanical — all inputs have already been reviewed.

## Input

- `artifacts/$1/transcript.yaml`
- `artifacts/$1/analysis.yaml`
- `artifacts/$1/lens/scaffolding.yaml`
- `framework/reference/lenses.yaml`
- `framework/reference/explanatory_variables.yaml`
- `framework/reference/scenario_sequence.yaml` — planned sequence with per-position Lens toggles (lifeline pool, vocabulary visibility)
- `apps/lens/reference/default_instructions.yaml` — standard student-facing strings (diagnose / discuss / ai_perspective / submit_assessment)

## Telemetry

Throughout this command, log meaningful events to `artifacts/$1/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --scenario $1 --command configure_session \
  --stage <stage> [--verdict <V>] [--notes "<text>"]
```

This is the final command in the Lens pipeline; the most useful entries are `--stage start`, `--stage save --verdict SAVE` (or `FAIL`), and any operator override of toggles derived from `scenario_sequence.yaml` (`--stage toggle_override --notes "..."`).

## Steps

### Step 1: Gather Passage Information

From `analysis.yaml`, collect:
- Passage IDs and their turn ranges
- Which passages are evaluable

From `lens/scaffolding.yaml`, collect:
- Difficulty signal per passage (for `suggested_order`)

Order passages by difficulty: accessible passages first (order 1), then moderate, then challenging.

### Step 2: Author Onboarding Content

The operator writes two fields — these are not auto-derived:
- **`topic_summary`** — Brief context for students. E.g., "A group of 6th graders is discussing whether to focus their environmental project on ocean pollution or deforestation."
- **`reading_instruction`** — E.g., "Read the discussion carefully. Then we'll look at it together through different lenses."

### Step 3: Assemble Session Configuration

Build `session.yaml` following the schema at `apps/lens/schemas/session.yaml`:

**From transcript and analysis:**
- `scenario_id`
- `transcript_file`, `analysis_file`, `scaffolding_file` — relative paths
- `passages` — passage IDs, turn ranges, evaluable flag, suggested order

**From reference data:**
- `lens_definitions` — from `framework/reference/lenses.yaml`
- `reference_lists` — from `framework/reference/explanatory_variables.yaml`

**Static configuration:**
- `diagnose.rating_options: [strong, weak]`
- `ai_perspective.source: ai_perspective`
- `ai_perspective.response_required: true`

**Operator-authored content:**
- `onboarding.topic_summary` and `onboarding.reading_instruction` (from Step 2). These are the only student-facing strings the operator authors per scenario.

**Default student-facing strings (loaded from `apps/lens/reference/default_instructions.yaml`):**

Read the defaults file and copy each entry verbatim into the matching field on `session.yaml`:

| Default key | session.yaml field |
|---|---|
| `defaults.diagnose.instructions` | `diagnose.instructions` |
| `defaults.diagnose.articulation_prompt` | `diagnose.articulation_prompt` |
| `defaults.discuss.instructions` | `discuss.instructions` |
| `defaults.ai_perspective.instructions` | `ai_perspective.instructions` |
| `defaults.ai_perspective.response_prompt` | `ai_perspective.response_prompt` |
| `defaults.submit_assessment.instructions` | `submit_assessment.instructions` |
| `defaults.submit_assessment.assessment_prompt` | `submit_assessment.assessment_prompt` |

Do not modify the defaults file from this command. If the operator has explicitly asked to deviate for this session (e.g., a softer prompt for an early-pilot class), apply the override to the relevant field only and emit a `--stage instruction_override --notes "<field>: <reason>"` telemetry event so the divergence is visible. If a deviation should become permanent, edit `apps/lens/reference/default_instructions.yaml` directly — that's the single source of truth.

**Lifeline and vocabulary toggles (derived from scenario sequence):**

Look up `$1` in `framework/reference/scenario_sequence.yaml` under `sequence[*].scenario_id`. If found, use the matching entry's `lens` block to set:
- `lifelines.pool_size` ← `lens.lifeline_pool`
- `reference_lists.show_cognitive_patterns` ← `lens.show_cognitive_patterns`
- `reference_lists.show_social_dynamics` ← `lens.show_social_dynamics`

`lifelines.hint_cost` is always `1`.

If the operator has explicitly asked to override any of these for this session, honor the override and note it (one line) in your final report so the divergence from the planned sequence is visible.

If `$1` is **not** in `scenario_sequence.yaml` (an experimental scenario outside the plan), fall back to: `lifeline_pool: 5`, `show_cognitive_patterns: false`, `show_social_dynamics: false`, and warn the operator that this scenario is not part of the planned sequence — they may want to add it to `framework/reference/scenario_sequence.yaml` (and `framework/docs/scenario-sequence.md`) before pilot.

### Step 4: Save

Write the assembled `session.yaml` to disk so the validator can read it:

```
artifacts/$1/lens/session.yaml
```

### Step 5: Validate

Run schema validation explicitly — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  artifacts/$1/lens/session.yaml \
  apps/lens/schemas/session.yaml
```

If the validator reports issues, the saved file is invalid — surface the issues to the operator, fix the assembly, and re-save before proceeding.

**Log:** `--stage save --verdict SAVE` on success, or `--stage save --verdict FAIL --notes "schema validation failed"` on failure.

Check cross-references:
- [ ] All `passage_id` values exist in `analysis.yaml`
- [ ] All turn IDs in passages exist in `transcript.yaml`
- [ ] `lens_definitions` lens IDs match reference data
- [ ] Reference list IDs match `framework/reference/explanatory_variables.yaml`

## Output

`artifacts/$1/lens/session.yaml`

## Pipeline Complete

All artifacts for this scenario are now in `artifacts/$1/`:

Shared (stages 1–3):
- `scenario.yaml` — scenario plan (pipeline-internal)
- `transcript.yaml` — discussion transcript (student-facing)
- `analysis.yaml` — expert analysis (AI perspective)
- `facilitation.yaml` — facilitation guide (teacher-facing, initial version)

Lens-specific (stages 4–5, in `lens/` subdirectory):
- `lens/scaffolding.yaml` — scaffolding materials (app scaffolding)
- `lens/facilitation.yaml` — facilitation guide (enriched with discussion starters)
- `lens/session.yaml` — session configuration (app setup)
