# Analyze Transcript

Produce the expert analysis and facilitation guide from the enumerated transcript.

## Input

- `registry/{scenario_id}/transcript.yaml` — the enumerated transcript
- `registry/{scenario_id}/scenario.yaml` — the full scenario plan (including `target_facets`)

## Steps

### Step 1: Passage Segmentation

Segment the transcript into evaluable passages. A passage is 1-3 consecutive turns that contain a coherent segment of the discussion.

**Segmentation guidelines:**
- Place boundaries where the discussion shifts topic, introduces a new claim, or changes direction
- Target 3-5 passages total, of which 2-3 contain targeted facets
- Remaining passages provide context or show strong reasoning (not every passage needs a weakness)
- Each passage gets a sequential ID: `passage_01`, `passage_02`, ...

If `segment_passages.py` is available, run it. Otherwise, segment manually:

1. Read the transcript
2. Identify natural break points (topic shifts, new claims, direction changes)
3. Group 1-3 consecutive turns per passage
4. Record: passage_id, turn IDs, sentence IDs for each passage

Present the segmentation to the operator for approval before proceeding.

### Step 2: Evaluator Agent — Produce Analysis and Facilitation Guide

Read the evaluator prompt at `framework/pipeline/agents/evaluator.md`.

Pass the enumerated transcript, the full scenario plan, and the approved passage segmentation to the evaluator.

The evaluator produces two artifacts:

**`analysis.yaml`** with per-passage:
- Hidden layer: facet annotations (targeted and emergent)
- Visible layer: unified AI perspective (per-lens observations + integrated explanation via `why_it_happened`)
- Diversity metadata (expected lens split, likely student observations)

**`facilitation.yaml`** with:
- Overview (topic, targeted facets summary, timing, what to expect)
- Per-passage guides (whats_here, state-based scaffolding: diagnose/discuss/ai_perspective, likely observations)
- Debrief (key takeaways, cross-group prompts, connection to next)

**Before proceeding, verify both files are valid YAML** — parse each with `yaml.safe_load()`. If parsing fails (commonly from unescaped quotes or apostrophes in natural language text), fix the quoting before continuing. Use block scalars (`>`) for any string containing `"`, `'`, `:`, or `#`.

Then validate both artifacts against their schemas:
- `framework/schemas/analysis.yaml`
- `framework/schemas/facilitation.yaml`

### Step 3: Analysis Reviewer — Quality Gate

Read the analysis reviewer prompt at `framework/pipeline/agents/analysis_reviewer.md`.

Pass both artifacts, the transcript, and the scenario plan to the reviewer. The reviewer checks:
1. Facet annotation accuracy
2. Unified AI perspective — per-lens observations (perspective, not verdict; mixed-valence)
3. Unified AI perspective — explanation (`why_it_happened` as perspective, not verdict)
4. AI perspective flow and tone (natural voice, thought-provoking `what_to_notice`)
5. Diversity metadata realism
6. Facilitation guide quality
7. Debrief quality
8. Cross-reference integrity (all sentence IDs valid)

The reviewer reports PASS/ISSUE/SUGGESTION per criterion.

### Step 4: Operator Gate

Present the reviewer's report to the operator. The operator decides:
- **Accept** — save artifacts and proceed
- **Revise** — address specific issues with the evaluator and re-review

### Step 5: Save

```
registry/{scenario_id}/analysis.yaml
registry/{scenario_id}/facilitation.yaml
```

## Output

- `registry/{scenario_id}/analysis.yaml`
- `registry/{scenario_id}/facilitation.yaml` (initial version — enriched in `/design_scaffolding`)

## Next Step

Run `/design_scaffolding` with this scenario — it produces student-facing scaffolding materials (hints, rubrics, misreading redirects) and enriches the facilitation guide with discussion starter questions.
