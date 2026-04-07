---
description: Produce expert analysis and facilitation guide from an enumerated transcript
argument-hint: <story_id> <episode_number>
---

# Analyze Transcript

Produce the expert analysis and facilitation guide from the enumerated transcript.

## Arguments

- `$1` = `story_id`
- `$2` = `episode_number` (1-indexed)

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Input

- `${EPISODE_DIR}/transcript.yaml` — the enumerated transcript
- `${EPISODE_DIR}/episode.yaml` — the full episode plan (including `target_facets` and `target_strengths`)
- `framework/docs/stories/${STORY_ID}.md` — the story design doc (read by the evaluator for character context)
- `framework/docs/stories/${STORY_ID}/episode_${EP_NN}.md` — the per-episode draft

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command analyze_transcript \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

Required log points are called out in each step.

**Log immediately on entry:** `--stage start --verdict START`.

## Steps

### Step 1: Evaluator Agent — Segment, Annotate, and Write Both Artifacts

**Use the Task tool with `subagent_type: evaluator`.**

The evaluator handles **passage segmentation as part of its task** — this is no longer a separate operator-approved step. The operator does not pre-approve boundaries; the evaluator records them in `analysis.yaml` and the operator can edit and re-run downstream commands if the boundaries turn out to be wrong.

Pass the agent:
- Path to `${EPISODE_DIR}/transcript.yaml` (enumerated)
- Path to `${EPISODE_DIR}/episode.yaml` (full plan, including `target_facets` and `target_strengths`)
- Path to `framework/docs/stories/${STORY_ID}.md` (the story design doc)
- Path to `framework/docs/stories/${STORY_ID}/episode_${EP_NN}.md` (the per-episode draft)

Instruct it to write outputs to `${EPISODE_DIR}/analysis.yaml` and `${EPISODE_DIR}/facilitation.yaml`.

The evaluator produces two artifacts:

**`analysis.yaml`** with per-passage:
- Hidden layer: facet annotations (targeted weaknesses, targeted strengths, and emergent)
- Visible layer: unified AI perspective (per-lens observations + integrated explanation via `why_it_happened`)
- Diversity metadata (expected lens split, likely student observations)

**`facilitation.yaml`** with:
- Overview (topic, targeted facets summary, timing, what to expect)
- Per-passage guides (whats_here, state-based scaffolding: diagnose/discuss/ai_perspective, likely observations)
- Debrief (key takeaways, cross-group prompts, connection to next)

**Before proceeding, verify both files are valid YAML** — parse each with `yaml.safe_load()`. If parsing fails (commonly from unescaped quotes or apostrophes in natural language text), fix the quoting before continuing. Use block scalars (`>`) for any string containing `"`, `'`, `:`, or `#`.

Then validate both artifacts explicitly with the schema script — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/analysis.yaml" \
  framework/schemas/analysis.yaml

python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/facilitation.yaml" \
  framework/schemas/facilitation.yaml
```

If either validator reports issues, do not proceed to the reviewer — surface them to the operator (or feed back into a re-invocation of the evaluator if the issues are minor).

Then run the analysis-specific cross-field invariant check — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/check_analysis_invariants.py \
  "${EPISODE_DIR}/analysis.yaml" \
  "${EPISODE_DIR}/episode.yaml"
```

This enforces the invariants the descriptive schema cannot express: every `quality_level: strong` annotation must have a non-empty `contrastive_explanation` and null `explanatory_variables.cognitive_pattern` / `social_dynamic`; every entry in the episode plan's `target_strengths` must appear as at least one strong, was_targeted=true annotation. (See suggestion E in `framework/docs/system-evaluation-20260406.md`.) If the invariant check reports issues, treat them the same as a schema-validation failure: do not proceed to the reviewer; either fix the assembly or feed the issues back into a re-invocation of the evaluator.

**Log:** `--stage evaluator --agent evaluator --attempt <n>` after each evaluator invocation, then `--stage schema_validation --verdict <PASS|FAIL>` (covers both the schema-validate and the invariant-check pass — they are folded into one logical "validation" stage from the operator's perspective; surface a `--notes "<failure>"` on FAIL identifying which check failed).

### Step 2: Analysis Reviewer — Quality Gate

**Use the Task tool with `subagent_type: analysis_reviewer`.** Independent fresh-context review.

Pass the agent the paths to all four artifacts:
- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/facilitation.yaml`
- `${EPISODE_DIR}/transcript.yaml`
- `${EPISODE_DIR}/episode.yaml`

The reviewer checks:
1. Facet annotation accuracy
2. Unified AI perspective — per-lens observations (perspective, not verdict; mixed-valence)
3. Unified AI perspective — explanation (`why_it_happened` as perspective, not verdict)
4. AI perspective flow and tone (natural voice, thought-provoking `what_to_notice`)
5. Diversity metadata realism
6. Facilitation guide quality
7. Debrief quality
8. Cross-reference integrity (all sentence IDs valid)

The reviewer reports PASS/ISSUE/SUGGESTION per criterion and an overall verdict: **ACCEPT** or **REVISE** (the analysis_reviewer's allowed subset of the standardized ACCEPT / REVISE / REGENERATE / REJECT vocabulary — REGENERATE and REJECT are not applicable here).

### Step 3: Reviewer-Driven Flow

- **ACCEPT** → proceed to save (Step 4).
- **REVISE** → re-invoke the evaluator (Step 1) with the reviewer's specific issues as feedback, then re-run the reviewer. **Retry budget: 1 revise pass.** If a second review still returns REVISE, halt and surface the latest analysis/facilitation and the reviewer report to the operator. (See *Failure-mode escape hatch* in `framework/docs/system-architecture.md`.)

The pipeline is autonomous through this loop.

**Log on each verdict:** `--stage analysis_review --agent analysis_reviewer --attempt <n> --verdict <ACCEPT|REVISE> --retries-remaining <n>`. On exhaustion, log `--stage halt --verdict HALT`.

### Step 4: Save

```
${EPISODE_DIR}/analysis.yaml
${EPISODE_DIR}/facilitation.yaml
```

**Log:** `--stage save --verdict SAVE`.

## Output

- `${EPISODE_DIR}/analysis.yaml`
- `${EPISODE_DIR}/facilitation.yaml` (initial version — enriched in `/design_scaffolding`)

## Next Step

Run `/design_scaffolding $1 $2` for this episode — it produces student-facing scaffolding materials (hints, rubrics, misreading redirects) and enriches the facilitation guide with discussion starter questions.
