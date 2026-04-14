---
description: Generate an episode plan for one episode of a story (planning + validation agents) and produce the barrier-safe projection
argument-hint: <story_id> <episode_number>
---

# Create Episode

Generate an episode plan — the blueprint for one episode's scripted group discussion — by reading the per-episode draft the operator authored at `framework/stories/{story_id}/episode_{NN}.md`. Also produces `episode_writer_input.yaml`, the barrier-safe projection that `dialog_writer` will consume in `/create_transcript`.

The interactive operator-prompt phase that the legacy `/create_scenario` had is gone. The episode draft IS the operator prompt, authored ahead of time as part of Phase 6 and committed to the repo as a versionable artifact.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
DRAFT_FILE="framework/stories/${STORY_ID}/episode_${EP_NN}.md"
DESIGN_DOC="framework/stories/${STORY_ID}.md"
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Inputs

- `${DRAFT_FILE}` — the per-episode draft authored during story authoring (Markdown with YAML frontmatter; see `framework/docs/story-authoring.md`).
- `${DESIGN_DOC}` — the parent story design doc (Markdown with YAML frontmatter for story metadata, prose body for premise/setting/cast/arc/stakes).

The operator does NOT provide any additional inline prompt. Everything `planning_agent` needs is in the two files above.

## Steps

### Step 0: Validate Inputs

Confirm both files exist:

```bash
test -f "${DRAFT_FILE}" || { echo "Missing ${DRAFT_FILE} — author the episode draft in Phase 6 first"; exit 1; }
test -f "${DESIGN_DOC}" || { echo "Missing ${DESIGN_DOC} — author the story design doc in Phase 6 first"; exit 1; }
```

Run `validate_story.py` over the story directory. This walks the design doc frontmatter and every per-episode draft frontmatter and runs all the cross-episode rules (lens distribution, mixed-valence rotation, strength/weakness rotation, coverage closure):

```bash
python3 framework/pipeline/scripts/validate_story.py \
  --story "${STORY_ID}"
```

If `validate_story.py` reports any FAIL, halt and surface the report — the draft (or another draft in the story) is broken and must be revised before the episode can be planned. Phase 6 should have caught this; if Phase 7 surfaces it, return to Phase 6.

### Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command create_episode \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

`${EPISODE_DIR}` may not yet exist before Step 1 succeeds. The logger creates it on first write.

**Log immediately on entry:** `--stage start --verdict START`.

### Step 1: Planning Agent — Draft the Episode Plan and the Projection

**Use the Task tool with `subagent_type: planning_agent`.**

Pass the agent:
- `story_id` and `episode_number`
- The path to `${DRAFT_FILE}` (the agent reads the per-episode draft frontmatter directly)
- The path to `${DESIGN_DOC}` (the agent reads the story design doc — both frontmatter and prose body — for character context and the previously recap)
- A pointer to the schemas at `framework/schemas/episode_plan.yaml` and `framework/schemas/episode_writer_input.yaml`, and the reference data under `framework/reference/`

The agent produces TWO artifacts and writes them via its Write tool:

1. `${EPISODE_DIR}/episode.yaml` — the full episode plan, with `story_id`, `episode_number`, all `target_facets[].designed_explanation.cognitive_signal` and `social_signal` fields populated verbatim from the draft frontmatter, and a `turn_outline` whose `accomplishes` entries encode the move/response pair for every non-null `social_signal`.
2. `${EPISODE_DIR}/intermediates/episode_writer_input.yaml` — the barrier-safe projection (Part 5.5). This is the only artifact that crosses the information barrier into `dialog_writer`. It contains exactly the fields in `framework/schemas/episode_writer_input.yaml` and no others.

If the draft frontmatter is malformed (missing required field; signal missing where its pattern/dynamic is non-null; carrier not in `lead_characters` or not described in the story design doc cast section), `planning_agent` returns a validation error rather than silently producing an inconsistent `episode.yaml`. Surface any such error to the operator and stop — the operator must revise the per-episode draft (and re-run `/create_episode`).

**Log:** `--stage planning --agent planning_agent --attempt 1 --verdict draft_returned`.

**Key requirements:**
- `weaknesses`, `strengths`, `accomplishes`, and every barrier-sensitive field in the projection use natural language only — no framework terminology
- Personas must genuinely disagree
- Turn outline has 10-14 turns with a narrative arc; every non-null `social_signal` has its move/response pair encoded in adjacent (or near-adjacent) `accomplishes` entries
- `target_facets` references valid IDs from `framework/reference/facet_inventory.yaml`
- `designed_explanation.cognitive_pattern` / `social_dynamic` reference valid IDs from `framework/reference/explanatory_variables.yaml`
- `personas[].name` matches the draft's `lead_characters` exactly, and each name is described in the story design doc's cast section

Proceed directly to validation — do not pause for operator review.

### Step 2: Validation Agent — Review the Plan

**Use the Task tool with `subagent_type: validation_agent`.** Fresh subagent — independent of the drafting context.

Pass the agent:
- The drafted `episode.yaml` from Step 1 (inline as YAML text)
- The path to `${DRAFT_FILE}` and `${DESIGN_DOC}` (so the validator can re-check that the plan faithfully realizes the draft)
- A pointer to `framework/reference/facet_inventory.yaml` and `framework/reference/explanatory_variables.yaml`
- The schema at `framework/schemas/validation_output.yaml` for the validator's own report shape

Expect back a PASS/ISSUE/SUGGESTION report against the validation criteria, including (in addition to the existing checks):

- **Cognitive signal fidelity** — for each non-null `cognitive_signal`, the `episode.yaml` value matches the draft frontmatter verbatim.
- **Social signal fidelity** — for each non-null `social_signal`, (a) the `episode.yaml` value matches the draft frontmatter verbatim, and (b) the `turn_outline` encodes the move/response pair as two adjacent (or near-adjacent) `accomplishes` entries that realize the described turn-pair shape without naming the dynamic.

Verdicts: **ACCEPT**, **REVISE**, **REJECT**.

The validation agent's structured output must conform to
`framework/schemas/validation_output.yaml`.

- **ACCEPT** → proceed to the quality checklist (Step 3).
- **REVISE** → re-invoke `planning_agent` (Step 1) with the validation report as feedback. **Retry budget: 1 revise pass.** If the second validation also returns REVISE, treat as REJECT.
- **REJECT** → halt. Surface the latest plan and the validation report to the operator. The operator decides whether to revise the per-episode draft and re-run `/create_episode`, or to revise the story design doc (which will require re-running `/validate_story` across the story in Phase 6 before re-running `/create_episode`).

**Log on each verdict:** `--stage validation --agent validation_agent --attempt <n> --verdict <ACCEPT|REVISE|REJECT> --retries-remaining <n>`. On REJECT after exhaustion, also log `--stage halt --verdict HALT --notes "validation rejected after retries"`.

### Step 3: Quality Checklist

Before saving, verify:
- [ ] `story_id` and `episode_number` set on `episode.yaml` and match the command arguments
- [ ] `scenario_id` is kebab-case (e.g., `${STORY_ID}-ep-${EP_NN}`)
- [ ] All `facet_id` values exist in the facet inventory
- [ ] All `cognitive_pattern` and `social_dynamic` values exist in the explanatory variables
- [ ] Every target facet whose `cognitive_pattern` is non-null has a non-empty `cognitive_signal` matching the draft frontmatter
- [ ] Every target facet whose `social_dynamic` is non-null has a non-empty `social_signal` matching the draft frontmatter
- [ ] Every non-null `social_signal` has its move/response pair encoded in adjacent (or near-adjacent) `turn_outline.accomplishes` entries
- [ ] `weaknesses`, `strengths`, `accomplishes` contain NO framework terminology
- [ ] `target_strengths` is present with at least one entry per draft
- [ ] Personas genuinely disagree
- [ ] Turn outline has 10-14 turns and no 4+ consecutive turns of unchecked agreement
- [ ] `personas[].name` matches the draft's `lead_characters` and each name is in the story design doc's cast section
- [ ] `episode_writer_input.yaml` exists at `${EPISODE_DIR}/intermediates/episode_writer_input.yaml` and contains NO facet_ids, lens names, cognitive_pattern_ids, social_dynamic_ids, or any of the other excluded fields listed in `framework/schemas/episode_writer_input.yaml`

### Step 4: Save and Validate Both Files

Both files were already written by `planning_agent` in Step 1. Now run schema validation explicitly on each — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/episode.yaml" \
  framework/schemas/episode_plan.yaml

python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/intermediates/episode_writer_input.yaml" \
  framework/schemas/episode_writer_input.yaml
```

The second validator runs the literal scan for reserved framework terms over `episode_writer_input.yaml`. If any reserved term appears, the projection has leaked — return to Step 1 with the validator output as feedback.

```
${EPISODE_DIR}/episode.yaml                               # the approved plan
${EPISODE_DIR}/intermediates/episode_writer_input.yaml    # barrier-safe projection
```

If either validator reports issues, do not proceed — surface them to the operator.

**Log:** `--stage schema_validation --verdict <PASS|FAIL>` immediately after each validator run, then `--stage save --verdict SAVE` on success or `--stage save --verdict FAIL --notes "<reason>"` on failure.

## Output

- `${EPISODE_DIR}/episode.yaml`
- `${EPISODE_DIR}/intermediates/episode_writer_input.yaml`

## Next Step

Run `/create_transcript $1 $2` for this episode. It will re-validate `episode_writer_input.yaml` against the schema, run `projection_reviewer` on it, and then drive the dialog writer / polish / review loop.
