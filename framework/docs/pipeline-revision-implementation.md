# Pipeline Revision Implementation Plan

**Status:** Draft. Execution runbook for reaching the target pipeline design.
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

**Tasks.**
1. Confirm the live design docs (`pipeline-architecture.md`, `pipeline-revision-plan.md`, `pipeline-v1-to-v2-migration.md`) exist and are internally consistent.
2. Confirm the currently-running pipeline docs (`operator-manual.md`, `RUNNING-shared-stages.md`, `pipeline-flow.md`, `system-architecture.md`) are live and describe the current system — these are the baseline this plan works against.
3. Confirm `artifacts/` contains at least one complete episode produced by the currently-running pipeline that can serve as the baseline for hand-authored gold files in Stage C. Record the chosen `{story_id}/episodes/episode_{NN}` here: **TBD (operator to fill before Stage B)**.

**Gate A.G1 (mechanical).** Tasks 1–2 pass; baseline episode is named.

**Exit criterion.** Baseline episode is named; both doc sets (current + target) are in place.

---

### Stage B — Inventory and dependency graph

**Goal.** Produce a flat work-item list covering everything plan §5 and §2 require, with an acyclic dependency graph.

**Tasks.**
1. Extract work items from plan §2.1–2.8 (one per agent output type + merge-script checks + probe-record contract + capability flags).
2. Extract work items from plan §5 (end-to-end sequence).
3. Add reference-file prerequisites: `framework/reference/wrestling_gates.yaml` (new, enumerated in plan §2.3.3) and any other reference files the schemas depend on.
4. Resolve the contrast-case story decision (plan §7 open question): use `saving-the-maker-space` as-is, modify it, or author a minimal new contrast story. Record the decision inline in this plan under F.1.
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

*Stub. Filled in during Stage B.*

Work items, dependencies, acceptance artifacts, and topological sort order go here.
