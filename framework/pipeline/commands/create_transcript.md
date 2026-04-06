---
description: Generate the scripted discussion transcript from an approved scenario plan (enforces information barrier)
argument-hint: <scenario_id>
---

# Create Transcript

Generate the scripted group discussion from a scenario plan. This command enforces the information barrier and includes quality review before enumeration.

## Input

`artifacts/$1/scenario.yaml` — the approved scenario plan from `/create_scenario`.

## Telemetry

Throughout this command, log meaningful events to `artifacts/$1/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --scenario $1 --command create_transcript \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

Required log points are called out in each step. Verdicts use the standardized vocabulary (ACCEPT / REVISE / REGENERATE / REJECT) for reviewer outcomes; structural-review and save use PASS / FAIL / SAVE / HALT.

**Log immediately on entry:** `--stage start --verdict START`.

## Steps

### Step 1: Enforce the Information Barrier — Strip Barrier Fields

Create the dialog writer's input by removing `target_facets`, `target_strengths`, and `discussion_dynamic` from the scenario plan.

Run `framework/pipeline/scripts/strip_scenario.py`:
```bash
python3 framework/pipeline/scripts/strip_scenario.py \
  artifacts/$1/scenario.yaml \
  artifacts/$1/intermediates/dialog_writer_input.yaml
```

If `strip_scenario.py` is not available, strip manually:
1. Read `artifacts/$1/scenario.yaml`
2. Remove `target_facets`, `target_strengths`, and `discussion_dynamic` (the three barrier-side keys) and their contents
3. Save as `artifacts/$1/intermediates/dialog_writer_input.yaml`
4. **Verify** the output contains NO `target_facets`, NO `target_strengths`, NO `discussion_dynamic`, NO facet IDs, NO lens names, NO cognitive pattern names, NO social dynamic names — only check the `weaknesses`, `strengths`, and `accomplishes` fields (they should already be clean from the planning stage)

Validate the stripped file explicitly — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  artifacts/$1/intermediates/dialog_writer_input.yaml \
  framework/schemas/dialog_writer_input.yaml
```

### Step 2: Dialog Writer — Generate the Discussion

**Use the Task tool with `subagent_type: dialog_writer`.** This MUST run as a fresh subagent. The dialog_writer subagent has NO Read tool — that is the structural information barrier.

**How to pass input:**
1. Read `artifacts/$1/intermediates/dialog_writer_input.yaml` yourself.
2. Inline its full contents into the task description as a YAML code block.
3. Instruct the agent to write its output transcript to `artifacts/$1/intermediates/transcript_raw.yaml` using the Write tool (its only available tool).

**Do not** pass any file path that could lead the agent to `scenario.yaml` or any artifact containing `target_facets` / `target_strengths`. The agent cannot read files anyway, but the prompt should not mention such paths.

The dialog writer produces a pre-enumeration transcript following `framework/schemas/transcript_pre.yaml`.

**Log:** `--stage dialog_writer --agent dialog_writer --attempt <n>`.

### Step 3: Structural Review

Run `framework/pipeline/scripts/review_transcript.py`:
```bash
python3 framework/pipeline/scripts/review_transcript.py \
  artifacts/$1/intermediates/transcript_raw.yaml \
  artifacts/$1/intermediates/dialog_writer_input.yaml
```

If `review_transcript.py` is not available, verify manually:
- [ ] Turn count: 10-14 turns
- [ ] Sentences per turn: 1-3
- [ ] Total word count: under 400
- [ ] Speaker names match persona names in the plan
- [ ] Turn order follows the turn outline
- [ ] All turns from the outline are present

**If structural issues are found:** Discard the transcript and return to Step 2. Clean retry — do not pass feedback from the failed attempt to the dialog writer. Maximum 3 attempts. If the plan consistently produces structural failures, the plan is the problem — return to `/create_scenario`.

**Log:** `--stage structural_review --verdict <PASS|FAIL> --attempt <n>`. On 3-attempt exhaustion, also log `--stage halt --verdict HALT --notes "structural review exhausted"`.

### Step 4: Transcript Instructional Designer — Polish

**Use the Task tool with `subagent_type: transcript_id`.**

Pass the agent the paths to:
- `artifacts/$1/intermediates/transcript_raw.yaml` (the raw transcript)
- `artifacts/$1/scenario.yaml` (the full scenario plan, including `target_facets` and `target_strengths`)

The transcript_id operates **outside** the information barrier — it has Read access and needs to see targets to sharpen signals. Instruct it to write the polished output to `artifacts/$1/intermediates/transcript_polished.yaml`.

The ID refines the transcript:
- Sharpens signal moments so designed weaknesses AND designed strengths are perceptible
- Enforces 6th-grade language
- Preserves naturalness and distinct voices
- Does NOT add or remove turns or content

Save the polished transcript to `artifacts/$1/intermediates/transcript_polished.yaml`.

**Log:** `--stage transcript_id --agent transcript_id --attempt <n>`.

### Step 5: Transcript Reviewer — Quality Gate

**Use the Task tool with `subagent_type: transcript_reviewer`.** Independent fresh-context review.

Pass the agent the paths to:
- `artifacts/$1/intermediates/transcript_polished.yaml`
- `artifacts/$1/scenario.yaml`

The reviewer checks:
1. Naturalness — sounds like real 6th graders
2. Distinct voices — personas sound different
3. Genuine disagreement — real pushback present
4. Discussion arc — tension, pivot, resolution
5. Facet signal quality (weaknesses AND designed strengths) — detectable but not cartoonish
6. Information barrier integrity — no framework language, not too "designed"
7. Structural compliance — counts and constraints

The reviewer reports PASS/ISSUE/SUGGESTION per criterion and gives an overall assessment: ACCEPT, REVISE, or REGENERATE.

### Step 6: Reviewer-Driven Flow

The transcript_reviewer returns one of: **ACCEPT**, **REVISE**, **REGENERATE** (the transcript_reviewer's allowed subset of the standardized ACCEPT / REVISE / REGENERATE / REJECT vocabulary — REJECT is not applicable here because transcript-level problems are recoverable upstream).

- **ACCEPT** → proceed to enumeration (Step 7).
- **REVISE** → re-invoke transcript_id (Step 4) with the reviewer's specific issues as feedback, then re-run the reviewer (Step 5). **Retry budget: 1 revise pass.** If a second review still returns REVISE, treat as REGENERATE.
- **REGENERATE** → discard the polished transcript and return to Step 2 (counts toward the 3-attempt dialog_writer limit). After 3 total attempts, halt and surface the latest reviewer report and intermediate transcripts to the operator. (See *Failure-mode escape hatch* in `framework/docs/system-architecture.md`.)

The pipeline is autonomous through these loops. Do not pause for operator review unless the retry budget is exhausted.

**Log on each verdict:** `--stage transcript_review --agent transcript_reviewer --attempt <n> --verdict <ACCEPT|REVISE|REGENERATE> --retries-remaining <n>`. On exhaustion, log `--stage halt --verdict HALT`.

### Step 7: Enumerate

Assign sequential IDs to turns and sentences.

Run `framework/pipeline/scripts/enumerate_transcript.py`:
```bash
python3 framework/pipeline/scripts/enumerate_transcript.py \
  artifacts/$1/intermediates/transcript_polished.yaml \
  artifacts/$1/transcript.yaml
```

If `enumerate_transcript.py` is not available, enumerate manually:
- Turn IDs: `turn_01`, `turn_02`, ... (zero-padded two digits)
- Sentence IDs: `turn_01.s01`, `turn_01.s02`, ... (zero-padded within turn)

Validate the enumerated transcript explicitly with the schema script — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  artifacts/$1/transcript.yaml \
  framework/schemas/transcript.yaml
```

If the validator reports issues, do not proceed to Step 8 — surface them to the operator.

**Log:** `--stage save --verdict SAVE` on success, or `--stage save --verdict FAIL --notes "schema validation failed"` on failure.

### Step 8: Save

The final enumerated transcript is at:
```
artifacts/$1/transcript.yaml
```

Intermediate artifacts preserved for debugging:
```
artifacts/$1/intermediates/dialog_writer_input.yaml
artifacts/$1/intermediates/transcript_raw.yaml
artifacts/$1/intermediates/transcript_polished.yaml
```

## Output

`artifacts/$1/transcript.yaml`

## Next Step

Run `/analyze_transcript` with this scenario — it segments the transcript into passages and produces the expert analysis (facet annotations, AI perspectives) and the facilitation guide for the teacher.
