# Pipeline Revision Implementation Plan

**Status:** Frozen 2026-04-10 — v2 pipeline is live. This runbook is archived for reference.
**Implements:** `pipeline-revision-plan.md` (spec) and `pipeline-architecture.md` (rationale).
**Context.** The diff between the currently-running pipeline and the target design is documented in `pipeline-v1-to-v2-migration.md`.

This plan is a disposable runbook. Once Stage F completes, it is archived. The live design reference is the plan + architecture pair, not this file.

---

## Part I — Framing

### I.1 Relationship to the design docs

- `pipeline-architecture.md` carries the **why** (four-agent cognitive-job boundaries, L1/L2/L3 layer model, capability-flag rationale).
- `pipeline-revision-plan.md` carries the **what** (field schemas at §2.3, merge-script checks at §2.6, capability flags at §4, end-to-end sequence at §5).
- This doc carries the **how** (stage sequence, gates, rollback, commit discipline). It cites the other two freely and never duplicates their schemas.

If the spec changes mid-execution, consult III.4 (spec-cascade rules) before continuing.

### I.2 Gate taxonomy

Every gate is one of three types. The type dictates the judgment burden and the sign-off authority.

- **Mechanical** — binary pass/fail via script, grep, or schema validator. No judgment. Operator fixes the code and re-runs.
- **Agent review** — a subagent reads a bounded criterion set and returns ACCEPT / REVISE / REJECT. Reproducible but requires language judgment.
- **Architecture checkpoint** — operator reads artifacts against a named section of `pipeline-architecture.md` or `pipeline-revision-plan.md` and answers a small set of structural questions. Requires an audit-trail comment citing the section.

There are **three** architecture checkpoints in this plan (C.G3, D.2.G2, E.3.G3). Use them sparingly; they are the plan's insurance policy and should not multiply.

### I.3 Non-goals

- No turn-annotation spike. Granularity is already resolved.
- No scenario_sequence references. That concept is not part of the target design.
- No new story authored for this revision. The baseline is an existing episode from the currently-running pipeline.

### I.4 Rollback posture

Stages A–B edit only this plan and the inventory appendix — rollback is free. Stages C–F land live-tree code and schemas; rollback is `git revert` of the stage's landing commit. Every stage names one landing commit. Do not split a stage across two commits without updating Part III.1.

---

## Part II — Execution stages

### Stage A — Baseline confirmation

**Goal.** Verify the starting state is what this plan assumes.

**Prerequisite (Stage Pre-A — v2 pilot story authoring).** Before Stage A runs, the operator authors a fresh **v2 pilot story** in Phase 6: a story design doc at `framework/stories/{v2_pilot_story_id}.md` plus per-episode drafts at `framework/stories/{v2_pilot_story_id}/episode_{NN}.md`. This is required because (a) all v1 artifacts were archived during the runtime-package restructure, so there is no live-tree episode for Stage C to use as a baseline, and (b) migration doc §0 + runtime-package-restructure.md §9 explicitly reject validating v2 against v1 stories — v1 stories were authored against a narrower affordance surface and would under-exercise v2.

The v2 pilot is authored to **exploit the v2 assistive package**, not just to satisfy it. Two documents together are the design lens:

- **`framework/docs/story-design.md`** — the shared upstream foundation. Cast bounds, coverage contract, rotation rules, information barrier, per-episode draft template, reviewer role. Applies to both v1 and v2. Read first.
- **`framework/docs/story-design-v2.md`** — the downstream addendum specific to the v2 assistive package. Derived from `pipeline-revision-plan.md` §2 field by field: what the analyst, diagnostic, prose, and discussion agents each need from a story to produce non-vacuous output. Read second.

Key v2-specific constraints to keep in mind (see story-design-v2.md for the full list, each cited to a §2 subsection):
- Load-bearing turns must be multi-interpretable (support 2–3 plausible facet readings per turn) so the orientation probe has real options.
- Most diagnostic ladder rungs are *lifted* from ground_truth, not authored — rich analyst output → rich ladders for free. Starve the analyst and downstream is thin irrecoverably.
- `causal_layer.interaction` is a hard schema requirement for 8 of 10 facets (`cognitive_only` is legal only for `relevance` and `inferential_validity`).
- Every passage must afford at least one `perspective_transitions[]` entry (feeds `lens_switch` rungs).
- Every `counterfactuals[]` entry must be turn-specific and behavior-specific (feeds `worked_example` rungs).
- The cross-file intervention↔cue rule: every present or afforded_missing facet must have at least one matching discussion cue (merge script enforces).

The pilot should also aim higher than the v1 stories on student engagement — investigative, speculative, or otherwise genre-forward rather than civic-realism — since authoring from scratch is the cheap moment to raise the ceiling. Note that genre choice is a general quality decision, not a v2 requirement; the `pedagogical_register` capability flag is a narrower binary between `unfinished_not_wrong` and `neutral`, not a genre lever.

**Do not use `/brainstorm`** for the v2 pilot. That skill was built against v1's authoring surface and elicits signals in v1's vocabulary. Use a free-form authoring conversation instead, with the two story-design documents as the design lens. After v2 ships and the pilot is in the books, extract what worked into a v2 brainstorm skill — and revise `story-design-v2.md` based on what the pilot session taught you. The doc is explicitly a pre-implementation draft expecting such a revision; its appendix is the placeholder for pilot-derived corrections.

Once the pilot drafts exist and pass `validate_story.py` + `story_consistency_reviewer`, run stages 1–2 of the currently-live upstream (`/create_episode` + `/create_transcript`) on one episode of the pilot. Upstream is unchanged in v2, so these commands produce valid `episode.yaml` + `transcript.yaml` under `artifacts/{v2_pilot_story_id}/episodes/episode_{NN}/`. That episode is the Stage A baseline and the Stage F contrast story is a **different episode of the same pilot story** (or, if the pilot's capability-flag coverage is too narrow, a second short pilot authored to differ on ≥2 flags).

**Tasks.**
1. Confirm the live design docs (`pipeline-architecture.md`, `pipeline-revision-plan.md`, `pipeline-v1-to-v2-migration.md`) exist and are internally consistent.
2. Confirm the currently-running pipeline docs (`operator-manual.md`, `RUNNING-shared-stages.md`, `pipeline-flow.md`, `system-architecture.md`) are live and describe the current system — these are the baseline this plan works against.
3. Confirm Stage Pre-A produced a v2 pilot story and at least one episode has been run through `/create_episode` + `/create_transcript`. Record the baseline here: **TBD (operator to fill — `{v2_pilot_story_id}/episodes/episode_{NN}`)**.

**Gate A.G1 (mechanical).** Tasks 1–2 pass; v2 pilot baseline episode exists in `artifacts/` and is named here.

**Exit criterion.** Baseline episode is named; both doc sets (current + target) are in place; v2 pilot story is committed under `framework/stories/`.

---

### Stage B — Inventory and dependency graph

**Goal.** Produce a flat work-item list covering everything plan §5 and §2 require, with an acyclic dependency graph.

**Tasks.**
1. Extract work items from plan §2.1–2.8 (one per agent output type + merge-script checks + probe-record contract + capability flags).
2. Extract work items from plan §5 (end-to-end sequence).
3. Add reference-file prerequisites: `framework/reference/wrestling_gates.yaml` (new, enumerated in plan §2.3.3) and any other reference files the schemas depend on.
4. ~~Resolve the contrast-case story decision (plan §7 open question).~~ **Resolved.** V1 stories are archived; the v2 pilot (authored in Stage Pre-A) is the baseline. Contrast-case for Stage F is either a second episode of the same pilot (if its capability-flag coverage spans ≥2 flags) or a second short pilot authored to differ on ≥2 flags. Decide which during Stage B based on the pilot's actual flag matrix. See `framework/docs/runtime-package-restructure.md` §9 and `framework/docs/pipeline-v1-to-v2-migration.md` §0.
5. Build the adjacency-list dependency graph. Validate acyclic by topological sort. The sort order determines the sequence Stages C–F follow.
6. Write the inventory as an appendix to this file (see Appendix A stub).

**Gate B.G1 (mechanical).** Topological sort succeeds; every work item cites a plan or architecture section.

**Gate B.G2 (agent review).** One agent reads the inventory against plan §5 and reports any missing items. ACCEPT required.

**Exit criterion.** Inventory is committed; contrast-case decision is recorded; `wrestling_gates.yaml` is named as a Stage C prerequisite.

---

### Stage C — Schema freeze and gold hand-authoring

**Goal.** Freeze the five YAML schemas and hand-author one gold instance of each for the baseline episode, **before** any agent prompt is written.

**Tasks.**
1. Author `framework/reference/wrestling_gates.yaml` with the closed vocabulary from plan §2.3.3:228 (`selected_a_facet`, `viewed_turn_for_15s`, `attempted_one_sentence`, `viewed_second_lens`, plus any additions ratified here).
2. Write the five schema files (descriptive YAML, per project convention): `ground_truth.schema.yaml`, `diagnostic.schema.yaml`, `prose.schema.yaml`, `discussion.schema.yaml`, `assistive_package.schema.yaml`. Each schema cites its plan §2.x section.
3. Hand-author the four gold files (`ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`) for the baseline episode. **Author these in a single sitting, without reference to any agent prompt.** This is the authorship-discipline constraint.
4. Run `validate_schema.py` on each gold file against its schema.
5. Forcing function: confirm that every field in the gold files could be rendered by a non-AI app at runtime via dictionary lookup. If a field requires runtime NLP or inference, the schema is wrong — fix it.

**Gate C.G1 (mechanical).** All five schemas exist; all four gold files validate.

**Gate C.G2 (mechanical).** Grep the gold files for any field not present in the corresponding schema. Must return empty.

**Gate C.G3 (architecture checkpoint).** Operator reads the four gold files against architecture §1 (three-layer model) and §3 (four-agent boundaries) and answers:
- Does each file contain only what its agent's cognitive job produces?
- Do the intervention cells in `diagnostic.yaml` show the `blank_page` + `by_facet[F]` shape from plan §2.3.2, and do present/afforded_missing/tempting_absent roles all appear at least once?
- Does `struggle_calibration` stay to the three lean fields and not attempt to be a detection schedule?

Operator records answers and the sections consulted as a commit-message audit trail.

**Rollback.** If C.G3 fails, edit schemas and re-author affected gold files in place. Do not proceed to Stage D until C.G3 passes — downstream work depends on the gold files being oracle-quality.

**Exit criterion.** Gold files and schemas are committed in a single landing commit. `wrestling_gates.yaml` is live.

---

### Stage D — Four-agent chain

**Goal.** Author the four agent prompts in dependency order. Each substage writes a prompt, runs it on the baseline episode, and checks the generated output against the gold file.

**Authorship rule.** Agents may read the schemas and their own prior-stage inputs. Agents must **not** read the gold files (this would collapse authorship discipline). Operator checks outputs against gold; agent never sees gold.

**Substage D.1 — analyst_agent.**
- **Inputs.** `episode.yaml`, `transcript.yaml`, canonical reference files.
- **Outputs.** `ground_truth.yaml`.
- **Gate D.1.G1 (mechanical).** Generated file validates against schema.
- **Gate D.1.G2 (agent review).** A reviewer subagent compares generated output to the gold file on: turn_annotations coverage, `lens_visibility` engagement/affordance matrix shape, `facets_absent_but_tempting[]` entries. ACCEPT or REVISE.

**Substage D.2 — diagnostic_agent.** (Densest new structure; architecture checkpoint.)
- **Inputs.** `episode.yaml`, `transcript.yaml`, **generated** `ground_truth.yaml` from D.1 (not the gold version), reference files, story position object.
- **Outputs.** `diagnostic.yaml`.
- **Gate D.2.G1 (mechanical).** Schema validates. Every load-bearing turn has `blank_page` + `by_facet[F]` cells. `minimum_wrestling[]` entries are all in `wrestling_gates.yaml`.
- **Gate D.2.G2 (architecture checkpoint).** Operator reads the generated `diagnostic.yaml` against architecture §3.2 and plan §2.3.2 and answers:
  - Are all three roles (present / afforded_missing / tempting_absent) represented somewhere in the dictionary?
  - Do `(engagement: none, affordance: rich)` cells from the analyst's matrix become afforded_missing cells at maximum urgency?
  - Is `struggle_calibration` lean (three fields only) and not attempting to be a detection schedule?
  - Are ladder rungs passage-specific, or generic?
- **Hard stop.** If D.2.G2 fails for structural reasons (not prompt-level tuning), stop. Redo Stage C if the schemas themselves are at fault. Two successive prompt revisions with <5% improvement on passage-specificity = escalate; the problem is structural.

**Substage D.3 — prose_agent.** (First end-to-end integration; if this fails, hard-stop rule applies.)
- **Inputs.** Generated `ground_truth.yaml` and `diagnostic.yaml`.
- **Outputs.** `prose.yaml`.
- **Gate D.3.G1 (mechanical).** Schema validates. `episode_opening` is barrier-safe (no framework terminology).
- **Gate D.3.G2 (agent review).** Reviewer compares against gold on voice, register-match, and barrier-safety. ACCEPT or REVISE.
- **Hard stop.** If D.3 reveals that the gold files were authored against a wrong-shaped schema (i.e., the real agents cannot produce the gold shape), redo Stage C from scratch in a fresh context. This is severe but the price of a C.G3 miss.

**Substage D.4 — discussion_agent.**
- **Inputs.** Generated `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`.
- **Outputs.** `discussion.yaml`.
- **Gate D.4.G1 (mechanical).** Schema validates.
- **Gate D.4.G2 (agent review).** Reviewer compares against gold. ACCEPT or REVISE.

**Exit criterion.** All four agent prompts committed; all four generate passing outputs for the baseline episode.

---

### Stage E — Merge script, reviewer, and first full pass

**Goal.** Wire the four agent outputs into the deterministic merge script and the package reviewer, then run the full `/build_assistive_package` pipeline end-to-end on the baseline episode.

**Substage E.1 — merge script.**
- Implement all thirteen integrity checks and three derivations from plan §2.6 as a Python script.
- Seed broken-input fixtures (missing fields, mismatched wrestling gates, non-monotonic ladders, ladder rungs citing absent facets) and confirm the script exits nonzero on each.
- **Gate E.1.G1 (mechanical).** Script passes on the four gold files; fails on each seeded broken fixture.

**Substage E.2 — package_reviewer agent.**
- Author the reviewer against plan §2.6 criteria.
- Seed a broken `assistive_package.yaml` fixture and confirm the reviewer returns REVISE with a specific finding.
- **Gate E.2.G1 (agent review).** Reviewer ACCEPTs the gold-derived package and REVISEs the broken fixture.

**Substage E.3 — first full pass.** (Second architecture checkpoint.)
- Run `/build_assistive_package` end-to-end on the baseline episode. Sequence: analyst → diagnostic → prose → discussion → reviewer → merge.
- **Gate E.3.G1 (mechanical).** End-to-end succeeds; `assistive_package.yaml` validates.
- **Gate E.3.G2 (agent review).** Reviewer ACCEPTs the package without REVISE.
- **Gate E.3.G3 (architecture checkpoint).** Operator reads the final `assistive_package.yaml` against architecture §1.5 ("detection app-owned, content pipeline-owned, routing student-owned") and plan §2.7 (probe-record handoff contract) and answers:
  - Could a non-AI app render every field in the package via dictionary lookup at runtime?
  - Does the probe-record handoff contract have enough structure for the app to durably track student state?
  - Does the package contain any field that requires runtime NLP, affect detection, or inference?

**Substage E.4 — probe-record smoke test.**
- Hand-simulate one student session: walk through three probe taps and confirm that the package contains everything needed to route the student and record state, without runtime inference.
- **Gate E.4.G1 (mechanical).** Every tap resolves to a dictionary entry present in the package.

**Exit criterion.** Merge script, reviewer, and `/build_assistive_package` command all committed and passing on the baseline episode.

---

### Stage F — Capability flags and cleanup

**Goal.** Exercise the capability-flag matrix on a contrast story, then retire the old commands.

**Substage F.1 — contrast-case run.**
- Use the contrast story chosen in Stage B, task 4.
- The contrast story must differ from the baseline on at least two of the five capability flags in plan §4 (`pedagogical_register`, `uses_character_growth`, `declares_calibration_warnings`, `uses_stance_positions`, `supports_jigsaw`).
- Run `/build_assistive_package` on one episode of the contrast story.
- **Gate F.1.G1 (mechanical).** End-to-end succeeds; reviewer ACCEPTs.
- **Gate F.1.G2 (agent review).** Reviewer confirms that capability-flag-gated fields are populated when the flag is true and absent when the flag is false.

**Substage F.2 — command retirement.**
- Delete `/analyze_transcript` and `/design_scaffolding` commands and their agents (`evaluator`, `scaffolding_id`, `scaffolding_reviewer`, `analysis_reviewer`). Keep `transcript_id`, `transcript_reviewer`, `dialog_writer`, `planning_agent`, `projection_reviewer`, `validation_agent`, `story_consistency_reviewer` — these are still used upstream.
- Update `CLAUDE.md` Pipeline Flow section to show the new command surface.
- Re-run Stage E.3 end-to-end after deletions to confirm no silent coupling.
- **Gate F.2.G1 (mechanical).** E.3 still passes after retirement; grep for retired command names returns only archive/ hits.

**Substage F.3 — archive this plan.**
- Move this file to `framework/docs/archive/pipeline-revision-implementation.md` with a "frozen YYYY-MM-DD" header.
- If collapsing architecture + plan into one design doc (per prior discussion), do it now as a separate landing commit.

**Exit criterion.** `/build_assistive_package` is the only package-building command; the retired commands are gone; this file is archived.

---

## Part III — Cross-cutting disciplines

### III.1 Commit discipline

- One stage = one landing commit (or one landing commit per substage for D and E).
- Commit message cites the stage/substage ID and the gates that passed.
- Architecture-checkpoint commits additionally cite the architecture or plan sections consulted.
- Do not split a stage across commits without updating this plan first.

### III.2 Reviewer reuse

The reviewer subagent authored in E.2 is also used by D.1.G2, D.3.G2, and D.4.G2 — same agent, different criterion sets passed in the prompt. Do not author a new reviewer per substage.

### III.3 Escalation triggers

Stop and escalate (ask the operator for a structural decision) if any of the following occur:

- Two successive prompt revisions on a single agent improve the target metric by <5%. The problem is structural, not prompt-level.
- An architecture checkpoint fails for a reason not anticipated in plan or architecture. The spec needs an amendment before execution continues.
- A gate requires more than three iterations to pass.
- The gold files turn out to be wrong. See the D.3 hard-stop rule.

### III.4 Spec-cascade rules

If `pipeline-revision-plan.md` or `pipeline-architecture.md` changes during execution:

- **Schema change** → re-run Stage C (affected gold files and schemas) and all downstream stages.
- **Agent boundary change** → re-run Stage D (affected substage) and all downstream.
- **Merge-script check added/removed** → re-run Stage E.1 and E.3.
- **Capability flag added** → re-run Stage F.1 with an updated contrast story.
- **Architectural rationale change with no spec impact** → no re-run; update cross-references only.

---

## Appendix A — Inventory and dependency graph

*Filled during Stage B (2026-04-10).*

### A.1 Baseline

- **Pilot story:** `the-field-trip` (5 episodes)
- **Baseline episode:** `the-field-trip/episodes/episode_01`
- **Baseline artifacts:** `episode.yaml`, `transcript.yaml` (produced by upstream `/create_episode` + `/create_transcript`)

### A.2 Contrast-case decision

Capability flags are story-level. The pilot's flag matrix:

| Flag | Value |
|---|---|
| `pedagogical_register` | `neutral` |
| `uses_character_growth` | `true` |
| `declares_calibration_warnings` | `false` |
| `uses_stance_positions` | `false` |
| `supports_jigsaw` | `false` |

All 5 episodes share identical flags. A second episode of the same story cannot differ on ≥2 flags. **A second short pilot story is required for Stage F**, authored to differ on ≥2 flags (e.g., `pedagogical_register: unfinished_not_wrong`, `uses_character_growth: false`, and at least one of `supports_jigsaw: true` or `uses_stance_positions: true`). This story is authored during Stage F.1, not before — it needs the schemas and agents to be stable first.

### A.3 Work items

Each item has a unique ID, a description, the plan/architecture section it traces to, the implementation stage it belongs to, and its dependencies.

#### Reference files

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| R1 | Author `framework/reference/wrestling_gates.yaml` — closed vocabulary: `selected_a_facet`, `viewed_turn_for_15s`, `attempted_one_sentence`, `viewed_second_lens` (plus any additions ratified at authoring time) | plan §2.3.3 | C.1 | — |

Existing reference files (no work needed): `facet_inventory.yaml`, `lenses.yaml`, `explanatory_variables.yaml`.

#### Schemas

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| S1 | Write `ground_truth.schema.yaml` — facets_present, facets_absent_but_tempting, lens_visibility, turn_annotations, causal_layer, perspective_transitions, counterfactuals, connects_to | plan §2.1, §2.2 | C.2 | R1 |
| S2 | Write `diagnostic.schema.yaml` — probes (§2.3.1), interventions (§2.3.2), struggle_calibration (§2.3.3), conditional blocks (§2.3.4), response_space | plan §2.3 | C.2 | R1 |
| S3 | Write `prose.schema.yaml` — episode_opening, entry_prompts, consensus_check | plan §2.4 | C.2 | — |
| S4 | Write `discussion.schema.yaml` — discussion_cues (7-axis indexing), talk_moves, jigsaw_fragments (capability-flagged) | plan §2.5 | C.2 | — |
| S5 | Write `assistive_package.schema.yaml` — merged view, integrity check specs, derivation specs | plan §2.6 | C.2 | S1, S2, S3, S4 |

#### Gold files (hand-authored for baseline episode)

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| G1 | Hand-author gold `ground_truth.yaml` for episode_01 | plan §2.1, §2.2 | C.3 | S1 |
| G2 | Hand-author gold `diagnostic.yaml` for episode_01 | plan §2.3 | C.3 | S2, G1 |
| G3 | Hand-author gold `prose.yaml` for episode_01 | plan §2.4 | C.3 | S3, G1, G2 |
| G4 | Hand-author gold `discussion.yaml` for episode_01 | plan §2.5 | C.3 | S4, G1, G2, G3 |

#### Validation and forcing function

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| V1 | Run `validate_schema.py` on each gold file against its schema | plan §5 Stage 1 | C.4 | G1, G2, G3, G4 |
| V2 | Forcing function: confirm every gold-file field is renderable by non-AI app via dictionary lookup | plan §5 Stage 1 | C.5 | V1 |

#### Agent prompts

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| A1 | Write `analyst_agent` prompt; run on baseline; diff against gold G1 | plan §5 Stage 2, arch §3.1 | D.1 | V2 |
| A2 | Write `diagnostic_agent` prompt; run on baseline reading A1 output; diff against gold G2 | plan §5 Stage 3, arch §3.2 | D.2 | A1 |
| A3 | Write `prose_agent` prompt; run on baseline reading A1+A2 outputs; diff against gold G3 | plan §5 Stage 4, arch §3.3 | D.3 | A2 |
| A4 | Write `discussion_agent` prompt; run on baseline reading A1+A2+A3 outputs; diff against gold G4 | plan §5 Stage 5, arch §3.4 | D.4 | A3 |

#### Merge script and reviewer

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| M1 | Implement merge script — 13 integrity checks + 3 deterministic derivations (prior_exposure, turn causal_signals, ladder endpoint lifts) + calibration_warnings derivation | plan §2.6 | E.1 | S5, A4 |
| M2 | Write `package_reviewer` agent; seed 4 broken fixtures (hallucinated facet, missing interaction, generic intervention cell, collapsing cues); verify catches | plan §5 Stage 6 | E.2 | M1 |

#### Integration

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| I1 | Wire `/build_assistive_package` command — full end-to-end: analyst → diagnostic → prose → discussion → reviewer → merge | plan §5 Stage 6 | E.3 | M1, M2 |
| I2 | Probe-record smoke test — hand-simulate one student session (3 probe taps); confirm dictionary-lookup routing | plan §2.7 | E.4 | I1 |
| I3 | Second-episode unassisted run — run full pipeline on episode_02 of the-field-trip with no manual intervention; cross-episode validation (connects_to.echoes, register non-drift, creative non-convergence) | plan §5 Stage 6 | E.5 | I2 |

#### Contrast case and cleanup

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| F1 | Author contrast-case pilot story (differs on ≥2 capability flags from the-field-trip); run upstream + `/build_assistive_package` on one episode | plan §5 Stage 7, plan §4 | F.1 | I3 |
| F2 | Delete `/analyze_transcript`, `/design_scaffolding` commands and retired agents (`evaluator`, `scaffolding_id`, `scaffolding_reviewer`, `analysis_reviewer`); update CLAUDE.md | impl §F.2 | F.2 | F1 |
| F3 | Archive this implementation plan; optionally collapse architecture + plan docs | impl §F.3 | F.3 | F2 |

#### Handoff contract (documentation, no code)

| ID | Item | Section | Stage | Depends on |
|---|---|---|---|---|
| H1 | Document probe-record handoff contract — naming convention, app-owned state shape, schema versioning | plan §2.7 | E.3 | S5 |
| H2 | Document capability-flag schema in story frontmatter (coverage + creative flags) | plan §4 | C.2 | — |

### A.4 Dependency graph (adjacency list)

```
R1  → [S1, S2]
S1  → [S5, G1]
S2  → [S5, G2]
S3  → [S5, G3]
S4  → [S5, G4]
S5  → [M1, H1]
G1  → [G2, V1]
G2  → [G3, V1]
G3  → [G4, V1]
G4  → [V1]
V1  → [V2]
V2  → [A1]
A1  → [A2]
A2  → [A3]
A3  → [A4]
A4  → [M1]
M1  → [M2, I1]
M2  → [I1]
I1  → [I2]
I2  → [I3]
I3  → [F1]
F1  → [F2]
F2  → [F3]
H1  → []
H2  → []
```

### A.5 Topological sort order

```
Layer 0:  R1, S3, S4, H2
Layer 1:  S1, S2
Layer 2:  S5, G1
Layer 3:  G2, H1
Layer 4:  G3
Layer 5:  G4
Layer 6:  V1
Layer 7:  V2
Layer 8:  A1
Layer 9:  A2
Layer 10: A3
Layer 11: A4
Layer 12: M1
Layer 13: M2
Layer 14: I1
Layer 15: I2
Layer 16: I3
Layer 17: F1
Layer 18: F2
Layer 19: F3
```

Total: 26 work items. No cycles. The critical path runs R1 → S2 → G2 → ... → F3 (length 20). Parallelism opportunities exist at Layers 0–1 (schemas and reference files can be worked concurrently) and at Layer 12–13 (merge script and reviewer can be developed in parallel once all agents land).

### A.6 Acceptance artifacts per stage

| Impl stage | Work items | Acceptance artifact |
|---|---|---|
| C.1 | R1 | `wrestling_gates.yaml` committed |
| C.2 | S1–S5, H2 | Five `.schema.yaml` files committed; capability-flag documentation committed |
| C.3 | G1–G4 | Four gold YAML files committed |
| C.4 | V1 | `validate_schema.py` passes on all gold files |
| C.5 | V2 | Operator sign-off: every field is dictionary-lookup renderable |
| D.1 | A1 | `analyst_agent` prompt committed; generated output validates and passes agent review against G1 |
| D.2 | A2 | `diagnostic_agent` prompt committed; generated output validates and passes architecture checkpoint |
| D.3 | A3 | `prose_agent` prompt committed; generated output validates and passes agent review against G3 |
| D.4 | A4 | `discussion_agent` prompt committed; generated output validates and passes agent review against G4 |
| E.1 | M1 | Merge script committed; passes on gold files; fails on seeded broken fixtures |
| E.2 | M2 | `package_reviewer` committed; ACCEPTs gold package; REVISEs broken fixture |
| E.3 | I1, H1 | `/build_assistive_package` end-to-end succeeds; architecture checkpoint passes; handoff contract documented |
| E.4 | I2 | Three probe taps resolve to dictionary entries |
| E.5 | I3 | Episode_02 passes end-to-end unassisted; cross-episode checks pass |
| F.1 | F1 | Contrast story passes end-to-end; capability-flag gating verified |
| F.2 | F2 | Retired commands deleted; grep returns only archive/ hits; E.3 re-run passes |
| F.3 | F3 | Implementation plan archived |
