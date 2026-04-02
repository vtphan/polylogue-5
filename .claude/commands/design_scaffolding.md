# Design Scaffolding

Produce the scaffolding materials and enrich the facilitation guide with passage-specific discussion starters.

## Input

- `registry/{scenario_id}/analysis.yaml` — the expert analysis
- `registry/{scenario_id}/facilitation.yaml` — the facilitation guide (initial version from `/analyze_transcript`)
- `registry/{scenario_id}/transcript.yaml` — the enumerated transcript
- `registry/{scenario_id}/scenario.yaml` — the full scenario plan

## Steps

### Step 1: Save Pre-Enrichment Facilitation Guide

Before any modifications, copy the current facilitation guide:
```bash
cp registry/{scenario_id}/facilitation.yaml \
   registry/{scenario_id}/intermediates/facilitation_pre_enrichment.yaml
```

This preserves the evaluator's original output for debugging.

### Step 2: Scaffolding Instructional Designer — Produce Scaffolding and Enrich Facilitation

Read the scaffolding ID prompt at `configs/scaffolding/agents/scaffolding_id.md`.

Pass the analysis, facilitation guide, transcript, and scenario plan to the scaffolding ID.

The agent produces two outputs:

**`scaffolding.yaml`** — Student-facing materials for each evaluable passage:
- Evaluate phase: difficulty, partial hints, lens entry prompts, AI reflection prompts
- Explain phase: passage sentence starters, bridge prompts, AI reflection prompt
- Common misreadings with redirects
- Observation rubric (per-lens, three levels)
- Explanation rubric (per-category, with levels)

**Enriched `facilitation.yaml`** — The existing facilitation guide with passage-specific discussion starter questions added to:
- `evaluate.peer.productive_questions`
- `explain.peer.productive_questions`

**Enrichment rules:**
- All existing content must be preserved — no deletions, no modifications to other fields
- New questions must not duplicate existing content
- New questions must not contradict the evaluator's `likely_disagreements` or `watch_for`

**Before proceeding, verify both files are valid YAML** — parse each with `yaml.safe_load()`. If parsing fails (commonly from unescaped quotes or apostrophes in natural language text), fix the quoting before continuing. Use block scalars (`>`) for any string containing `"`, `'`, `:`, or `#`.

Then validate both artifacts:
- `scaffolding.yaml` against `configs/scaffolding/schemas/scaffolding.yaml`
- `facilitation.yaml` against `configs/analysis/schemas/facilitation.yaml`

### Step 3: Scaffolding Reviewer — Quality Gate

Read the scaffolding reviewer prompt at `configs/scaffolding/agents/scaffolding_reviewer.md`.

Pass the scaffolding materials, enriched facilitation guide, analysis, and transcript to the reviewer. The reviewer checks:
1. Partial hint calibration (where to look, not what to see)
2. Common misreading quality (plausible patterns, calibrated redirects)
3. Observation rubric differentiation (three genuinely distinct levels)
4. Explanation rubric differentiation (interaction category depth)
5. Bridge prompt quality (passage-specific, per-lens)
6. AI reflection prompt quality (references specific AI content)
7. Lens entry prompt quality (adds value beyond generic)
8. Language appropriateness (6th-grade, no framework terminology)
9. Facilitation guide enrichment (preserved content, no duplicates)
10. Scaffolding field completeness (all required fields present)
11. Cross-artifact coherence (hints align with but don't duplicate evaluator observations)

The reviewer reports PASS/ISSUE/SUGGESTION per criterion.

### Step 4: Operator Gate

Present the reviewer's report to the operator. The operator decides:
- **Accept** — save artifacts and proceed
- **Revise** — address specific issues with the scaffolding ID and re-review

### Step 5: Save

```
registry/{scenario_id}/scaffolding.yaml
registry/{scenario_id}/facilitation.yaml      (enriched version — overwrites initial)
```

Intermediates preserved:
```
registry/{scenario_id}/intermediates/facilitation_pre_enrichment.yaml
```

## Output

- `registry/{scenario_id}/scaffolding.yaml`
- `registry/{scenario_id}/facilitation.yaml` (enriched)

## Next Step

Run `/configure_session` with this scenario — it assembles the final session configuration from all preceding artifacts, including passage ordering, onboarding content, and app settings.
