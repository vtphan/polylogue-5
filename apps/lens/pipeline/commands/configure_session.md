# Configure Session

Assemble the session configuration from the transcript, analysis, and scaffolding artifacts. This is largely mechanical — all inputs have already been reviewed.

## Input

- `registry/{scenario_id}/transcript.yaml`
- `registry/{scenario_id}/analysis.yaml`
- `registry/{scenario_id}/scaffolding.yaml`
- `configs/reference/lenses.yaml`
- `configs/reference/explanatory_variables.yaml`

## Steps

### Step 1: Gather Passage Information

From `analysis.yaml`, collect:
- Passage IDs and their turn ranges
- Which passages are evaluable

From `scaffolding.yaml`, collect:
- Difficulty signal per passage (for `suggested_order`)

Order passages by difficulty: accessible passages first (order 1), then moderate, then challenging.

### Step 2: Author Onboarding Content

The operator writes two fields — these are not auto-derived:
- **`topic_summary`** — Brief context for students. E.g., "A group of 6th graders is discussing whether to focus their environmental project on ocean pollution or deforestation."
- **`reading_instruction`** — E.g., "Read the discussion carefully. Then we'll look at it together through different lenses."

### Step 3: Assemble Session Configuration

Build `session.yaml` following the schema at `configs/session/schemas/session.yaml`:

**From transcript and analysis:**
- `scenario_id`
- `transcript_file`, `analysis_file`, `scaffolding_file` — relative paths
- `passages` — passage IDs, turn ranges, evaluable flag, suggested order

**From reference data:**
- `lens_definitions` — from `configs/reference/lenses.yaml`
- `reference_lists` — from `configs/reference/explanatory_variables.yaml`

**Static configuration:**
- `diagnose.rating_options: [strong, weak]`
- `ai_perspective.source: ai_perspective`
- `ai_perspective.response_required: true`

**Operator-authored content (per-state):**
- `onboarding.topic_summary` and `onboarding.reading_instruction` (from Step 2)
- `diagnose.instructions` — E.g., "Read this passage and choose one or more lenses. Rate the reasoning as strong or weak through each lens, then explain what you noticed."
- `diagnose.articulation_prompt` — E.g., "What do you see? Why did you rate it this way?"
- `discuss.instructions` — E.g., "See how your group members diagnosed this passage. What did they notice that you didn't? Discuss and decide what your group thinks."
- `ai_perspective.instructions` — E.g., "Here's one more perspective on what's happening in this passage."
- `ai_perspective.response_prompt` — E.g., "After reading the AI's perspective, what stands out to you? Does it match what your group was thinking?"
- `submit_assessment.instructions` — E.g., "As a group, write your assessment of the reasoning in this passage."
- `submit_assessment.assessment_prompt` — E.g., "What did you notice about the reasoning? Why do you think they reasoned this way?"

**Lifeline configuration:**
- `lifelines.pool_size` — operator decides (suggest 5 per group)
- `lifelines.hint_cost` — typically 1

**Reference list toggles:**
- `reference_lists.show_cognitive_patterns` — operator decides (suggest `true` for later sessions, `false` for early sessions)
- `reference_lists.show_social_dynamics` — operator decides

### Step 4: Validate

Validate `session.yaml` against `configs/session/schemas/session.yaml`.

Check cross-references:
- [ ] All `passage_id` values exist in `analysis.yaml`
- [ ] All turn IDs in passages exist in `transcript.yaml`
- [ ] `lens_definitions` lens IDs match reference data
- [ ] Reference list IDs match `configs/reference/explanatory_variables.yaml`

### Step 5: Save

```
registry/{scenario_id}/session.yaml
```

## Output

`registry/{scenario_id}/session.yaml`

## Pipeline Complete

All six artifacts for this scenario are now in `registry/{scenario_id}/`:
- `scenario.yaml` — scenario plan (pipeline-internal)
- `transcript.yaml` — discussion transcript (student-facing)
- `analysis.yaml` — expert analysis (AI perspective)
- `facilitation.yaml` — facilitation guide (teacher-facing)
- `scaffolding.yaml` — scaffolding materials (app scaffolding)
- `session.yaml` — session configuration (app setup)
