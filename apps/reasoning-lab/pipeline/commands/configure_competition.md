---
description: Assemble the final Reasoning Lab session configuration from all preceding artifacts
argument-hint: <story_id> <episode_number>
---

# Configure Competition

Assemble the Reasoning Lab session configuration for one episode of a story.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Prerequisites

- `${EPISODE_DIR}/transcript.yaml` — the enumerated transcript
- `${EPISODE_DIR}/analysis.yaml` — the expert analysis
- `${EPISODE_DIR}/reasoning-lab/scoring.yaml` — the scoring rubric (from `/design_scoring_rubric`)
- `${EPISODE_DIR}/reasoning-lab/competition-facilitation.yaml` — the competition facilitation guide
- `framework/docs/stories/${STORY_ID}.md` — the story design doc (read for cast metadata used in onboarding/case_briefing)

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command configure_competition \
  --stage <stage> [--verdict <V>] [--notes "<text>"]
```

This is the final command in the Reasoning Lab pipeline; the most useful entries are `--stage start` and `--stage save --verdict <SAVE|FAIL>`.

## Steps

### Step 1: Assemble Session Configuration

Build `session.yaml` for this episode by assembling from the existing artifacts:

**`story_id`** and **`episode_number`**: Copy from `${EPISODE_DIR}/episode.yaml`.

**`application`**: Set to `reasoning_lab`.

**`transcript_file`, `analysis_file`, `scoring_file`, `facilitation_file`**: Relative paths to the four source files.

**`onboarding`**:
- `case_title`: From `competition-facilitation.yaml` → `case_briefing.case_title`
- `topic_summary`: From `competition-facilitation.yaml` → `case_briefing.context_for_students`
- `instructions`: Standard Reasoning Lab instructions — "Your team is a forensic analysis unit. Use your scanner tools to investigate this discussion. Find what others miss."

**`passages`**: From `analysis.yaml` → `passage_analyses`. Mark all passages as evaluable. Set `suggested_order` based on difficulty from `scoring.yaml` (accessible = 1, moderate = 2, challenging = 3).

**`scanner_definitions`**: The three scanner tools with their display names and questions:
- Evidence Scanner → "Is the claim supported?"
- Logic Probe → "Does the reasoning hold?"
- Scope Detector → "Is the analysis thorough?"

**`scanner_assignment`**: Determine based on the episode's targeted facets:
- `team_of_2`: Pick the two scanners whose lenses have the highest cross-lens visibility for this episode's targeted facets. Check `analysis.yaml` → `facet_annotations[].primary_lens` and `also_visible_through` to determine which two lenses are most productive.
- `team_of_3`: All three scanners, one per student.
- `team_of_4`: Double the scanner whose lens has the highest cross-lens visibility for the targeted facets. Include `rationale` explaining why.

**`timer_defaults`**: Use pacing from `competition-facilitation.yaml` → `passage_facilitation[0].pacing` for the first passage as defaults. Standard: briefing 3, scan 4, brief 5, file 3, scoreboard 5, debrief 10.

**`lab_resources`**: Default `pool_size` of 3 and `consult_cost` of 1.

**`leaderboard`**: Default to `show_leaderboard: true`, `anonymous_teams: false`, `show_running_total: true`.

**`reference_lists`**: Include cognitive patterns and social dynamics from the framework reference data (`framework/reference/explanatory_variables.yaml`). Default both `show_cognitive_patterns` and `show_social_dynamics` to `false` (teacher toggles on when ready to introduce vocabulary).

### Step 2: Save

Write the assembled `session.yaml` to disk so the validator can read it:

```
${EPISODE_DIR}/reasoning-lab/session.yaml
```

### Step 3: Validate

Run schema validation explicitly — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  ${EPISODE_DIR}/reasoning-lab/session.yaml \
  apps/reasoning-lab/schemas/session.yaml
```

If the validator reports issues, the saved file is invalid — surface the issues to the operator, fix the assembly, and re-save before proceeding.

Check:
- Passage IDs match across all referenced files
- Scanner assignment covers all team sizes
- File references point to existing files
