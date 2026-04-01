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
- `explain_phase.reference_lists` — from `configs/reference/explanatory_variables.yaml`

**Static configuration:**
- `lens_scope: evaluate_only`
- `evaluate_phase.sequence: [individual, peer, ai]`
- `explain_phase.sequence: [individual, peer, ai]`
- `evaluate_phase.individual.rating_options: [strong, weak]`
- `evaluate_phase.ai.source: ai_perspective_evaluate`
- `explain_phase.ai.source: ai_perspective_explain`
- `evaluate_phase.ai.response_required: true`
- `explain_phase.ai.response_required: true`

**Operator-authored content:**
- `onboarding.topic_summary` and `onboarding.reading_instruction` (from Step 2)
- `evaluate_phase.individual.instructions` — E.g., "Read this passage and rate the reasoning as strong or weak through your assigned lens. Then explain what you noticed."
- `evaluate_phase.individual.articulation_prompt` — E.g., "What do you see? Why did you rate it this way?"
- `evaluate_phase.peer.instructions` — E.g., "See how your group members evaluated this passage. What did they notice that you didn't?"
- `evaluate_phase.ai.instructions` — E.g., "Here's what an expert noticed when looking through each lens."
- `evaluate_phase.ai.response_prompt` — E.g., "After reading the AI's observations, what stands out to you?"
- `explain_phase.individual.instructions` — E.g., "Now think about *why* the group reasoned the way they did."
- `explain_phase.individual.explanation_prompt` — E.g., "Why do you think they reasoned this way? What was going on in the group?"
- `explain_phase.peer.instructions` — E.g., "See how your group members explained what happened. Did anyone think about it differently?"
- `explain_phase.ai.instructions` — E.g., "Here's how a cognitive scientist and social psychologist might think about what happened."
- `explain_phase.ai.response_prompt` — E.g., "Does the AI's explanation match what you were thinking, or do you see it differently?"

**Session-level sentence starters:**
```yaml
sentence_starters:
  - category: cognitive
    starter: "I think they reasoned this way because they were focused on..."
  - category: social
    starter: "I think the group..."
  - category: interaction
    starter: "The group made it easier/harder for this kind of thinking because..."
```

**Completion thresholds:**
- `evaluate_phase.completion_threshold` — suggest 2 (minimum passages before peer step)
- `explain_phase.completion_threshold` — suggest 1 (minimum passages before peer step)

The operator may adjust these values.

**Reference list toggles:**
- `explain_phase.reference_lists.show_cognitive_patterns` — operator decides (suggest `true` for later sessions, `false` for early sessions)
- `explain_phase.reference_lists.show_social_dynamics` — operator decides

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
