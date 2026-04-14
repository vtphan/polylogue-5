---
description: Generate the scripted discussion transcript from an approved episode plan and its barrier-safe projection (enforces information barrier)
argument-hint: <story_id> <episode_number>
---

# Create Transcript

Generate the scripted group discussion for one episode of a story. This command consumes the barrier-safe `episode_writer_input.yaml` produced by `planning_agent` during `/create_episode`, runs `projection_reviewer` against it, and then drives the dialog writer / polish / review loop.

Note: this command does not read the per-episode draft or the story design doc. Those are inputs to `planning_agent` (during `/create_episode`), not to `dialog_writer`. The information barrier requires that `dialog_writer` see only the projection.

## Arguments

```bash
STORY_ID="$1"
EP_NUM="$2"
EP_NN=$(printf "%02d" "$EP_NUM")
EPISODE_DIR="artifacts/${STORY_ID}/episodes/episode_${EP_NN}"
```

## Inputs

- `${EPISODE_DIR}/episode.yaml` — the approved episode plan (read by `transcript_id` and `transcript_reviewer`, never by `dialog_writer`).
- `${EPISODE_DIR}/intermediates/episode_writer_input.yaml` — the barrier-safe projection produced by `planning_agent` during `/create_episode`. This is the only artifact that crosses the information barrier into `dialog_writer`.
- `framework/stories/${STORY_ID}.md` and `framework/stories/${STORY_ID}/episode_${EP_NN}.md` — read by `projection_reviewer` (it needs the full story design and per-episode draft to detect paraphrased leakage); never by `dialog_writer`.

## Telemetry

Throughout this command, log meaningful events to `${EPISODE_DIR}/pipeline_log.yaml`:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --story "$STORY_ID" --episode "$EP_NUM" --command create_transcript \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

Verdicts use the standardized vocabulary (ACCEPT / REVISE / REGENERATE / REJECT) for reviewer outcomes; structural-review and save use PASS / FAIL / SAVE / HALT.

**Log immediately on entry:** `--stage start --verdict START`.

## Steps

### Step 1: Verify the Barrier-Safe Projection Exists and Validates

`planning_agent` already produced `episode_writer_input.yaml` during `/create_episode`. Confirm the file exists and validates against its schema — **halt on non-zero exit**:

```bash
test -f "${EPISODE_DIR}/intermediates/episode_writer_input.yaml" || {
  echo "Missing episode_writer_input.yaml — re-run /create_episode"; exit 1; }

python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/intermediates/episode_writer_input.yaml" \
  framework/schemas/episode_writer_input.yaml
```

The schema validator runs the literal scan for reserved framework terms (facet IDs, lens names used as classification, cognitive_pattern_ids, social_dynamic_ids). If any reserved term appears in the projection, the validator fails the file and you must return to `/create_episode` to have `planning_agent` rewrite the projection.

**Log:** `--stage projection_schema --verdict <PASS|FAIL>`.

### Step 1b: projection_reviewer — Paraphrase-Leakage Review

**Use the Task tool with `subagent_type: projection_reviewer`.** This is the human-judgment counterpart to the literal scan in Step 1. The literal scan catches reserved terms; `projection_reviewer` catches *paraphrased* leakage that the regex would miss (e.g., `previously: "Mira kept citing the same source she liked"` is `confirmation_bias` in plain English and must be flagged).

Pass the agent the paths to:

- `framework/stories/${STORY_ID}.md`
- `framework/stories/${STORY_ID}/episode_${EP_NN}.md`
- `${EPISODE_DIR}/episode.yaml`
- `${EPISODE_DIR}/intermediates/episode_writer_input.yaml`

`projection_reviewer` reads all three and reports per barrier-sensitive field. It returns one of:

- **OK** → proceed to Step 2.
- **LEAK** (blocking) → at least one barrier-sensitive field paraphrases a framework label. Surface the report to the operator and re-invoke `planning_agent` (via `/create_episode` for this episode) with the LEAK report as feedback so it can rewrite the offending fields. **Retry budget: 1 leak-fix pass.** If the second projection also returns LEAK, halt and surface to the operator.
- **RISK** (advisory) → projection is acceptable but at least one field is borderline. Log the RISK notes and proceed.

`projection_reviewer` runs *between* the planner's projection and `dialog_writer`'s consumption. It must run on every projection — the operator may have hand-edited `episode_writer_input.yaml` between commands, and this is the only place that re-checks it.

**Log:** `--stage projection_review --agent projection_reviewer --attempt <n> --verdict <OK|LEAK|RISK>`.

### Step 2: Dialog Writer — Generate the Discussion

**Use the Task tool with `subagent_type: dialog_writer`.** This MUST run as a fresh subagent. The `dialog_writer` subagent has NO Read tool — that is the structural information barrier.

**How to pass input:**

1. Read `${EPISODE_DIR}/intermediates/episode_writer_input.yaml` yourself.
2. Inline its full contents into the task description as a YAML code block.
3. Instruct the agent to write its output transcript to `${EPISODE_DIR}/intermediates/transcript_raw.yaml` using the Write tool (its only available tool).

**Do not** pass any file path that could lead the agent to `episode.yaml`, the per-episode draft, the story design doc, or any artifact containing framework terminology. The agent cannot read files anyway, but the prompt MUST NOT mention such paths.

The dialog writer produces a pre-enumeration transcript following `framework/schemas/transcript_pre.yaml`.

**Log:** `--stage dialog_writer --agent dialog_writer --attempt <n>`.

Validate the raw transcript explicitly before structural review:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/intermediates/transcript_raw.yaml" \
  framework/schemas/transcript_pre.yaml
```

If the validator reports issues, discard the raw transcript and return to Step 2.

### Step 3: Structural Review

Run `framework/pipeline/scripts/review_transcript.py`:

```bash
python3 framework/pipeline/scripts/review_transcript.py \
  "${EPISODE_DIR}/intermediates/transcript_raw.yaml" \
  "${EPISODE_DIR}/intermediates/episode_writer_input.yaml"
```

If `review_transcript.py` is not available, verify manually:
- [ ] Turn count: 10-14 turns
- [ ] Sentences per turn: 1-3
- [ ] Total word count: under 400
- [ ] Speaker names match persona names in `episode_writer_input.yaml`
- [ ] Turn order follows the `turn_outline`
- [ ] All turns from the outline are present

**If structural issues are found:** Discard the transcript and return to Step 2. Clean retry — do not pass feedback from the failed attempt to the dialog writer. Maximum 3 attempts. If the projection consistently produces structural failures, the projection is the problem — return to `/create_episode`.

**Log:** `--stage structural_review --verdict <PASS|FAIL> --attempt <n>`. On 3-attempt exhaustion, also log `--stage halt --verdict HALT --notes "structural review exhausted"`.

### Step 4: Transcript Instructional Designer — Polish

**Use the Task tool with `subagent_type: transcript_id`.**

Pass the agent the paths to:

- `${EPISODE_DIR}/intermediates/transcript_raw.yaml` (the raw transcript)
- `${EPISODE_DIR}/episode.yaml` (the full episode plan, including `target_facets`, `target_strengths`, `cognitive_signal`, `social_signal`)

The `transcript_id` operates **outside** the information barrier — it has Read access and needs to see targets to sharpen signals. Instruct it to write the polished output to `${EPISODE_DIR}/intermediates/transcript_polished.yaml`.

The ID refines the transcript:
- Sharpens signal moments so designed weaknesses, strengths, cognitive signals, and social-signal move/response pairs are perceptible
- Enforces 6th-grade language
- Preserves naturalness and distinct voices
- Does NOT add or remove turns or content

**Log:** `--stage transcript_id --agent transcript_id --attempt <n>`.

### Step 5: Transcript Reviewer — Quality Gate

**Use the Task tool with `subagent_type: transcript_reviewer`.** Independent fresh-context review.

Pass the agent the paths to:

- `${EPISODE_DIR}/intermediates/transcript_polished.yaml`
- `${EPISODE_DIR}/episode.yaml`
- `framework/stories/${STORY_ID}.md`
- `framework/stories/${STORY_ID}/episode_${EP_NN}.md`

The reviewer checks the seven criteria in `transcript_reviewer.md`, including the split criterion 5a–5d (facet, cognitive, social, strength signal landing). Criterion 5c will quote both halves of every social signal move/response pair and ISSUE if either half is missing.

The reviewer returns **ACCEPT**, **REVISE**, or **REGENERATE**.

### Step 6: Reviewer-Driven Flow

- **ACCEPT** → proceed to enumeration (Step 7).
- **REVISE** → re-invoke `transcript_id` (Step 4) with the reviewer's specific issues as feedback, then re-run the reviewer (Step 5). **Retry budget: 1 revise pass.** If a second review still returns REVISE, treat as REGENERATE.
- **REGENERATE** → discard the polished transcript and return to Step 2 (counts toward the 3-attempt dialog_writer limit). After 3 total attempts, halt and surface the latest reviewer report and intermediate transcripts to the operator. (See `framework/docs/architecture.md` and `framework/docs/operator-guide.md`.)

If REGENERATE persists after 3 attempts and the transcript_reviewer is consistently failing on 5b (cognitive signal) or 5c (social signal move/response pair), the failure is structural — the projection is not encoding the beats correctly, or the draft's `cognitive_signal` / `social_signal` is unrealizable. Halt and return to `/create_episode`. If the same signal fails to land across two episodes in the story, escalate to the story-level re-planning loop documented in `framework/docs/story-authoring.md` and `framework/docs/operator-guide.md` (revise the relevant per-episode draft, or the story design doc if the drift is character-level).

**Log on each verdict:** `--stage transcript_review --agent transcript_reviewer --attempt <n> --verdict <ACCEPT|REVISE|REGENERATE> --retries-remaining <n>`. On exhaustion, log `--stage halt --verdict HALT`.

### Step 7: Enumerate

Assign sequential IDs to turns and sentences.

```bash
python3 framework/pipeline/scripts/enumerate_transcript.py \
  "${EPISODE_DIR}/intermediates/transcript_polished.yaml" \
  "${EPISODE_DIR}/transcript.yaml"
```

If `enumerate_transcript.py` is not available, enumerate manually:
- Turn IDs: `turn_01`, `turn_02`, ... (zero-padded two digits)
- Sentence IDs: `turn_01.s01`, `turn_01.s02`, ... (zero-padded within turn)

Validate the enumerated transcript explicitly with the schema script — **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  "${EPISODE_DIR}/transcript.yaml" \
  framework/schemas/transcript.yaml
```

If the validator reports issues, do not proceed to Step 8 — surface them to the operator.

**Log:** `--stage save --verdict SAVE` on success, or `--stage save --verdict FAIL --notes "schema validation failed"` on failure.

### Step 8: Save

The final enumerated transcript is at:

```
${EPISODE_DIR}/transcript.yaml
```

Intermediate artifacts preserved for debugging:

```
${EPISODE_DIR}/intermediates/episode_writer_input.yaml
${EPISODE_DIR}/intermediates/transcript_raw.yaml
${EPISODE_DIR}/intermediates/transcript_polished.yaml
```

## Output

`${EPISODE_DIR}/transcript.yaml`

## Next Step

Run `/build_assistive_package $1 $2` for this episode — it runs the four v2 authoring agents (analyst → diagnostic → prose → discussion), the package reviewer, and the deterministic merge script to produce `assistive_package.yaml`.
