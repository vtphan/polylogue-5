---
description: Assemble the final Lens session configuration from all preceding artifacts
argument-hint: <story_id> <episode_number>
---

# Configure Session

Assemble the session configuration for one episode of a story. This is largely mechanical — all inputs have already been reviewed.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Input

- `${EPISODE_DIR}/transcript.yaml`
- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/episode.yaml` — the episode plan (read for `story_id`, `episode_number`)
- `${EPISODE_DIR}/lens/scaffolding.yaml`
- `framework/docs/stories/${STORY_ID}.md` — the story design doc (cast, arc; used to populate onboarding strings that reference recurring characters)
- `framework/reference/lenses.yaml`
- `framework/reference/explanatory_variables.yaml`
- `apps/lens/reference/default_instructions.yaml` — standard student-facing strings (diagnose / discuss / ai_perspective / submit_assessment)

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command configure_session \
  --stage <stage> [--verdict <V>] [--notes "<text>"]
```

This is the final command in the Lens pipeline; the most useful entries are `--stage start`, `--stage save --verdict SAVE` (or `FAIL`), and any operator override of session toggles (`--stage toggle_override --notes "..."`).

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

**From transcript, episode plan, and analysis:**
- `scenario_id`, `story_id`, `episode_number` — copied from `${EPISODE_DIR}/episode.yaml`
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
- `onboarding.topic_summary` and `onboarding.reading_instruction` (from Step 2). These are the only student-facing strings the operator authors per episode.

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

**Lifeline and vocabulary toggles (operator-set per session):**

Under the story model the operator sets these explicitly at session-configuration time. The defaults are:
- `lifelines.pool_size` = 5
- `reference_lists.show_cognitive_patterns` = false
- `reference_lists.show_social_dynamics` = false
- `lifelines.hint_cost` = 1

If the operator overrides any of these for this session, honor the override and emit a `--stage toggle_override --notes "<field>: <reason>"` telemetry event so the divergence from the defaults is visible.

### Step 4: Save

Write the assembled `session.yaml` to disk so the validator can read it:

```
${EPISODE_DIR}/lens/session.yaml
```

### Step 5: Validate

Run schema validation explicitly — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/lens/session.yaml \
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

`${EPISODE_DIR}/lens/session.yaml`

## Pipeline Complete

All artifacts for this episode are now in `${EPISODE_DIR}/`:

Shared (stages 1–3):
- `episode.yaml` — episode plan (pipeline-internal)
- `transcript.yaml` — discussion transcript (student-facing)
- `analysis.yaml` — expert analysis (AI perspective)
- `facilitation.yaml` — facilitation guide (teacher-facing, initial version)

Lens-specific (stages 4–5, in `lens/` subdirectory):
- `lens/scaffolding.yaml` — scaffolding materials (app scaffolding)
- `lens/facilitation.yaml` — facilitation guide (enriched with discussion starters)
- `lens/session.yaml` — session configuration (app setup)
