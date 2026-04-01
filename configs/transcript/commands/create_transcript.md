# Create Transcript

Generate the scripted group discussion from a scenario plan. This command enforces the information barrier and includes quality review before enumeration.

## Input

`registry/{scenario_id}/scenario.yaml` — the approved scenario plan from `/create_scenario`.

## Steps

### Step 1: Enforce the Information Barrier — Strip Target Facets

Create the dialog writer's input by removing `target_facets` from the scenario plan.

Run `configs/transcript/scripts/strip_scenario.py`:
```bash
python3 configs/transcript/scripts/strip_scenario.py \
  registry/{scenario_id}/scenario.yaml \
  registry/{scenario_id}/intermediates/dialog_writer_input.yaml
```

If `strip_scenario.py` is not available, strip manually:
1. Read `registry/{scenario_id}/scenario.yaml`
2. Remove the entire `target_facets` key and its contents
3. Save as `registry/{scenario_id}/intermediates/dialog_writer_input.yaml`
4. **Verify** the output contains NO `target_facets`, NO facet IDs, NO lens names, NO cognitive pattern names, NO social dynamic names — only check the `weaknesses` and `accomplishes` fields (they should already be clean from the planning stage)

Validate the stripped file against `configs/transcript/schemas/dialog_writer_input.yaml`.

### Step 2: Dialog Writer — Generate the Discussion

Read the dialog writer prompt at `configs/transcript/agents/dialog_writer.md`.

Pass ONLY the stripped input (`dialog_writer_input.yaml`) to the dialog writer. **Do not pass the full scenario plan.** The dialog writer must never see `target_facets`.

The dialog writer produces a pre-enumeration transcript following `configs/transcript/schemas/transcript_pre.yaml`.

### Step 3: Structural Review

Run `configs/transcript/scripts/review_transcript.py`:
```bash
python3 configs/transcript/scripts/review_transcript.py \
  registry/{scenario_id}/intermediates/transcript_raw.yaml \
  registry/{scenario_id}/intermediates/dialog_writer_input.yaml
```

If `review_transcript.py` is not available, verify manually:
- [ ] Turn count: 10-14 turns
- [ ] Sentences per turn: 1-3
- [ ] Total word count: under 400
- [ ] Speaker names match persona names in the plan
- [ ] Turn order follows the turn outline
- [ ] All turns from the outline are present

**If structural issues are found:** Discard the transcript and return to Step 2. Clean retry — do not pass feedback from the failed attempt to the dialog writer. Maximum 3 attempts. If the plan consistently produces structural failures, the plan is the problem — return to `/create_scenario`.

### Step 4: Transcript Instructional Designer — Polish

Read the transcript ID prompt at `configs/transcript/agents/transcript_id.md`.

Pass the raw transcript AND the full scenario plan (including `target_facets`) to the instructional designer. The ID operates outside the information barrier — they need to see targets to sharpen signals.

The ID refines the transcript:
- Sharpens signal moments so designed weaknesses are perceptible
- Enforces 6th-grade language
- Preserves naturalness and distinct voices
- Does NOT add or remove turns or content

Save the polished transcript to `registry/{scenario_id}/intermediates/transcript_polished.yaml`.

### Step 5: Transcript Reviewer — Quality Gate

Read the transcript reviewer prompt at `configs/transcript/agents/transcript_reviewer.md`.

Pass the polished transcript and the full scenario plan to the reviewer. The reviewer checks:
1. Naturalness — sounds like real 6th graders
2. Distinct voices — personas sound different
3. Genuine disagreement — real pushback present
4. Discussion arc — tension, pivot, resolution
5. Facet signal quality — detectable but not cartoonish
6. Information barrier integrity — no framework language, not too "designed"
7. Structural compliance — counts and constraints

The reviewer reports PASS/ISSUE/SUGGESTION per criterion and gives an overall assessment: ACCEPT, REVISE, or REGENERATE.

### Step 6: Operator Gate

Present the reviewer's report to the operator. The operator decides:
- **Accept** — proceed to enumeration
- **Revise** — send specific issues back to the transcript ID for another polish pass, then re-review
- **Regenerate** — discard and return to Step 2 (counts toward the 3-attempt limit)

### Step 7: Enumerate

Assign sequential IDs to turns and sentences.

Run `configs/transcript/scripts/enumerate_transcript.py`:
```bash
python3 configs/transcript/scripts/enumerate_transcript.py \
  registry/{scenario_id}/intermediates/transcript_polished.yaml \
  registry/{scenario_id}/transcript.yaml
```

If `enumerate_transcript.py` is not available, enumerate manually:
- Turn IDs: `turn_01`, `turn_02`, ... (zero-padded two digits)
- Sentence IDs: `turn_01.s01`, `turn_01.s02`, ... (zero-padded within turn)

Validate the enumerated transcript against `configs/transcript/schemas/transcript.yaml`.

### Step 8: Save

The final enumerated transcript is at:
```
registry/{scenario_id}/transcript.yaml
```

Intermediate artifacts preserved for debugging:
```
registry/{scenario_id}/intermediates/dialog_writer_input.yaml
registry/{scenario_id}/intermediates/transcript_raw.yaml
registry/{scenario_id}/intermediates/transcript_polished.yaml
```

## Output

`registry/{scenario_id}/transcript.yaml`

## Next Step

Run `/analyze_transcript` with this scenario.
