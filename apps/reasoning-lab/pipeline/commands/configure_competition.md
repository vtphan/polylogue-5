# Configure Competition

Assemble the Reasoning Lab session configuration from the scoring rubric, analysis, and transcript.

## Prerequisites

- `registry/{scenario_id}/transcript.yaml` — the enumerated transcript
- `registry/{scenario_id}/analysis.yaml` — the expert analysis
- `registry/{scenario_id}/scoring.yaml` — the scoring rubric (from `/design_scoring_rubric`)
- `registry/{scenario_id}/competition-facilitation.yaml` — the competition facilitation guide

## Steps

### Step 1: Assemble Session Configuration

Build `session.yaml` for this scenario by assembling from the existing artifacts:

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

**`scanner_assignment`**: Determine based on the scenario's targeted facets:
- `team_of_2`: Pick the two scanners whose lenses have the highest cross-lens visibility for this scenario's targeted facets. Check `analysis.yaml` → `facet_annotations[].primary_lens` and `also_visible_through` to determine which two lenses are most productive.
- `team_of_3`: All three scanners, one per student.
- `team_of_4`: Double the scanner whose lens has the highest cross-lens visibility for the targeted facets. Include `rationale` explaining why.

**`timer_defaults`**: Use pacing from `competition-facilitation.yaml` → `passage_facilitation[0].pacing` for the first passage as defaults. Standard: briefing 3, scan 4, brief 5, file 3, scoreboard 5, debrief 10.

**`lab_resources`**: Default `pool_size` of 3 and `consult_cost` of 1.

**`leaderboard`**: Default to `show_leaderboard: true`, `anonymous_teams: false`, `show_running_total: true`.

**`reference_lists`**: Include cognitive patterns and social dynamics from the framework reference data (`framework/reference/explanatory_variables.yaml`). Default both `show_cognitive_patterns` and `show_social_dynamics` to `false` (teacher toggles on when ready to introduce vocabulary).

### Step 2: Validate

Validate `session.yaml` against `apps/reasoning-lab/schemas/session.yaml`.

Check:
- Passage IDs match across all referenced files
- Scanner assignment covers all team sizes
- File references point to existing files

### Step 3: Save

Save to `registry/{scenario_id}/session.yaml`.

Note: If a Lens `session.yaml` already exists for this scenario, save the Reasoning Lab version as `session_reasoning_lab.yaml` to avoid overwriting. Report which filename was used.
