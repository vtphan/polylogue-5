# Pipeline Revision Implementation Plan

**Status.** Draft for review. Not yet approved for execution.
**Audience.** Whoever is executing the revision (primarily the operator + Claude Code).
**Scope.** Lens application only. Reasoning Lab migration is deferred (spec §7.1) and is explicitly out of scope for this plan. Any RL-only files encountered are archived but not rewritten.

> **What this document is.** The execution plan for the revision described in `pipeline-revision-plan.md` (the spec) and `pipeline-architecture.md` (the memo). It chooses a sequencing optimized for risk, reversibility, and reviewable-artifact size, rather than mirroring the spec's §5 explanatory order. Every execution step cites its spec or memo source; every spec §5 stage is covered by the coverage matrix in §I.3. Structural authority remains in the spec: if execution reveals the spec is wrong about what a stage contains, the spec is updated first and this plan is swept in the same commit.
>
> **What this document is not.** It is not a second source of truth for schemas, field definitions, governance rules, or agent cognitive jobs. Those live in the spec and memo. This plan only adds the execution layer: order, grouping, gates, rollback, and sign-off.
>
> **One-commit discipline.** Any edit to `pipeline-revision-plan.md` §2, §4, §5, §7, or `pipeline-architecture.md` §6 must sweep this file in the same commit. If a sweep would be non-trivial, stop and reconcile before landing the spec edit.
>
> **Retirement.** This document exists only until the revision lands. When Stage F exits and the first story ships on the revised pipeline, this file is moved to `archive/` with a `frozen YYYY-MM-DD` header. It is not maintained afterward.

---

## Part I — Framing

### I.1 Relationship to spec §5

Spec §5 describes seven stages in an explanatory order: schema-first hand authoring, then one agent at a time, then reviewer + package, then contrast case. That order is correct for a reader who wants to understand the *shape* of the revision, and it is the order in which agent prompt authoring will actually proceed once the ground is cleared.

This plan re-sequences the work around three execution concerns that §5 does not address:

1. **Preservation.** The old pipeline must be archived before anything is edited in place, so old-vs-new comparisons remain cheap and the rearchitecture can proceed as additive work against a frozen baseline.
2. **Risk ordering.** Schema and hand-authoring work land early, when rollback is free. Agent work lands in the order §5 prescribes because that order already reflects dependency.
3. **Reviewable-artifact sizing.** Stages end at artifacts a reviewer can inspect in isolation. Where §5 stages produce multiple artifacts (e.g., Stage 6 produces a reviewer agent *and* a full end-to-end run), this plan splits them; where §5 stages are tightly coupled (e.g., Stages 2 and the §2.1 schema), this plan groups them.

The result is six execution stages, lettered A–F to make the departure from §5 numbering visible. The coverage matrix in §I.3 shows how every §5 stage maps into this plan.

### I.2 Gate taxonomy

This plan uses three kinds of gate, named explicitly so reviewers know what judgment is being asked for.

- **Mechanical gate** — a script, validator, or `grep` with binary pass/fail output. Cheap. Examples: `validate_schema.py` green, `grep` for reserved IDs empty, file count matches expected. Mechanical gates never require operator judgment.

- **Agent review** — a subagent (existing or new) reads a named artifact and reports ACCEPT / REVISE / REJECT against a bounded criterion set. Examples: the package_reviewer introduced in Stage E; a projection_reviewer-style pass on new prompts. Agent reviews are reproducible but not free.

- **Architecture checkpoint** — the operator reads the named artifacts against the twelve rules in memo §6 and the three-affordance-at-three-scales matrix in memo §1.2. Expensive; reserved for points where a silent Rule 11 or Rule 12 violation is plausible. Spec §5 names architecture reviews after Stages 4 and 6; this plan keeps both and adds one before Stage A exits (to catch archive-scope mistakes before they cascade).

Every gate in this plan declares its type. When a gate has multiple components, each component declares its own type.

### I.3 Coverage matrix — execution stages vs. spec §5

Every §5 stage is covered. Stages marked `(new)` have no §5 counterpart because §5 does not address preservation or inventory.

| Execution stage | Covers spec §5 | Covers memo § | Gate type(s) |
|---|---|---|---|
| A. Archive and baseline | *(new)* | Rule 12 (boundary awareness during classification) | Mechanical + Architecture checkpoint |
| B. Inventory and dependency graph | *(new; supports §5 pre-Stage-1 spike)* | §3.6, §6 Rule 11 | Architecture checkpoint |
| C. Schema freeze and gold hand-authoring | §5 Stage 1 | §1.2 (3×3 matrix), §3.1–§3.5 | Mechanical + Architecture checkpoint (schema reality check) |
| D. Agent authoring chain | §5 Stages 2, 3, 4, 5 | §3.1–§3.4, §6 Rule 8, Rule 11 | Agent review + Architecture checkpoint (after D.3, per §5 Stage 4) |
| E. Reviewer + merge script + first full pass | §5 Stage 6 (split) | §3.5, §6 Rule 9 | Mechanical + Agent review + Architecture checkpoint |
| F. Contrast-case run and retirement of legacy surface | §5 Stage 7 | §6 Rule 2, Rule 12 | Mechanical + Agent review |

Every §5 stage 1–7 has a row. No row invents work that is not sourced from the spec or the memo.

### I.4 Rollback posture

The revision is executed as additive work against a frozen archive (Stage A). For Stages C–E, rollback means `git revert` of the landing commit; the archive guarantees that the old behavior is recoverable without git archaeology. For Stage F, rollback means restoring the retired legacy files from the archive if a regression surfaces in the contrast-case run.

Each stage declares its specific rollback trigger ("if gate G fails, do X") so rollback is not improvised mid-execution.

### I.5 Non-goals for this plan

- **No schema definitions.** Field-level content lives in spec §2. This plan only sequences the *authoring* of those schemas.
- **No rule rewriting.** Governance rules live in memo §6. This plan only cites them.
- **No Reasoning Lab work.** Per spec §7.1, RL migration is deferred. Any RL file touched by the archive step is a preservation action, not a rewrite.
- **No new governance rules.** If a rule gap is discovered during execution, stop and update memo §6 first.
- **No changes to Phase 6 story authoring.** `/create_episode`, `/create_transcript`, `/configure_session`, story design docs, and per-episode drafts are untouched by this revision (spec Appendix B). This plan explicitly confirms non-disturbance of those surfaces in Stage A's gate.

---

## Part II — Execution stages

### Stage A — Archive and baseline

**Goal.** Freeze the pre-revision surface on disk so every subsequent stage can proceed as additive work and every old-vs-new comparison is a cheap file diff.

**Inputs.** Current state of `framework/reference/`, `framework/pipeline/`, `framework/schemas/`, relevant `framework/docs/`, `apps/lens/pipeline/`, `apps/lens/schemas/`, `apps/lens/docs/pipeline-spec.md`.

**Outputs.**

- `archive/pre-revision-2026-04-08/framework-reference/` — snapshot of `framework/reference/`.
- `archive/pre-revision-2026-04-08/framework-pipeline/` — snapshot of `framework/pipeline/` (agents, commands, scripts).
- `archive/pre-revision-2026-04-08/framework-schemas/` — snapshot of `framework/schemas/`.
- `archive/pre-revision-2026-04-08/apps-lens-pipeline/` — snapshot of `apps/lens/pipeline/`.
- `archive/pre-revision-2026-04-08/apps-lens-schemas/` — snapshot of `apps/lens/schemas/`.
- `archive/pre-revision-2026-04-08/apps-lens-docs-pipeline-spec.md` — the one app-level doc describing the old pipeline shape.
- `archive/pre-revision-2026-04-08/README.md` — the discipline note (see below).

**Tasks.**

1. Create `archive/pre-revision-2026-04-08/` at repo root. Matches the precedent set by the legacy `configs/`, `docs/`, `registry/` frozen directories.
2. Copy (not move) each source tree listed in Outputs into its archive subdirectory. Preserve file mtimes where possible so git blame on the archive remains interpretable.
3. Write `archive/pre-revision-2026-04-08/README.md` stating: (a) this is a point-in-time snapshot frozen on 2026-04-08 before the pipeline revision described in `framework/docs/pipeline-revision-plan.md` began execution; (b) it is read-only historical reference, not a fallback module path; (c) nothing in the live tree may `import`, `reference`, or `$ref` into this archive; (d) retention is indefinite, mirroring the legacy frozen directories.
4. Classify each archived file against memo §6 Rule 12: *universal* (belongs in `framework/` after the revision), *app-coupled Lens* (belongs in `apps/lens/` after the revision), or *retired* (no counterpart in the revision). Record the classification in a new `archive/pre-revision-2026-04-08/classification.yaml` with one entry per archived file. This is the first concrete application of the universal/app-coupled split and will seed the inventory in Stage B.
5. Confirm non-disturbance of Phase 6 surfaces: `framework/pipeline/commands/create_episode.md`, `create_transcript.md`, `brainstorm.md`, and the `planning_agent`, `dialog_writer`, `validation_agent`, `projection_reviewer`, `story_consistency_reviewer`, `transcript_reviewer`, `transcript_id` agents are archived for reference but will not be rewritten by any subsequent stage. Record this confirmation in `classification.yaml`.

**Gates.**

- **A.G1 (mechanical).** `ls archive/pre-revision-2026-04-08/` lists the six expected subdirectories + README + classification.yaml. Every file under the archived source trees has a counterpart in the archive (size and path match).
- **A.G2 (mechanical).** `grep -r "archive/pre-revision-2026-04-08" framework/ apps/` returns zero live references. The archive is not load-bearing.
- **A.G3 (architecture checkpoint).** Operator reads `classification.yaml` against memo §6 Rule 12. Every *app-coupled Lens* entry has a justification naming the Lens-specific dependency; every *retired* entry has a justification naming what replaces it (citing spec §2.7 Appendix B). No entry is classified without a stated reason. This is the stage's most important gate — the classification seeds Stage B's inventory, and a misclassification here silently miscategorizes downstream work.

**Rollback.** If A.G3 surfaces a structural mistake in the classification, fix `classification.yaml` in place (it has no downstream dependents yet). If the archive itself is corrupted or incomplete, delete `archive/pre-revision-2026-04-08/` and redo. No live-tree changes have been made at this point, so rollback is free.

**Exit criterion.** All three gates pass. Stage B is unblocked.

---

### Stage B — Inventory and dependency graph

**Goal.** Produce a flat inventory of every discrete work item implied by spec §2, §4, §5 and memo §§3.1–3.5, §6 Rules 1–11; then a dependency graph over that inventory that justifies the ordering of Stages C–F. Resolve the pre-Stage-1 spike named in spec §5 opening.

**Inputs.** Spec §2 (field-level definitions), §4 (capability flags), §5 (stage narrative), §7.3 (open questions), Appendix B (diff); memo §§3.1–3.5 (agent architecture), §6 (governance rules); Stage A's `classification.yaml`.

**Outputs.**

- `framework/docs/pipeline-revision-inventory.md` — flat list of work items, each with: ID (e.g., `I-015`), title, source citation (spec or memo §), universal-or-app-coupled classification, dependencies (other item IDs), risk tag (`low | med | high`), acceptance-artifact description.
- `framework/docs/pipeline-revision-inventory.md` §"Dependency graph" — adjacency list over item IDs; nodes annotated with which execution stage they land in.
- `framework/docs/pipeline-revision-inventory.md` §"Spike resolution — turn annotation granularity" — the one-hour spike on Overton Park episode 3's densest passage called for by spec §5 opening. Records: the two hand-annotations, the token-count comparison, the UI-affordance test, and the decision.

**Tasks.**

1. Extract every discrete work item from spec §2.1–§2.6 (each required block, each enforcement rule, each conditional block is a separate item). Cite the spec § and the subsection. Items that are purely field definitions get classified `schema-item`; items that require prompt-level work (e.g., "analyst must strip pedagogical speculation") get classified `prompt-item`; items that require script work (e.g., merge-script enforcement checks) get classified `script-item`.
2. Extract every capability flag from spec §4 as its own item. Each flag has a dependency on the schema item that owns its gated content (e.g., `uses_character_growth` depends on `diagnostic.growth_beats`).
3. Extract every enforcement check from spec §2.6 as a `script-item` owned by the merge script. Each check gets its own acceptance test.
4. Extract every memo §6 rule that requires implementation work as an item. Most rules are acceptance constraints not work items; but Rule 6 ("turn anchors mandatory"), Rule 7 ("IDs hidden, labels student-facing"), and Rule 11 ("one cognitive job per agent") generate mechanical-gate items that land in Stage E.
5. Build the dependency graph. The expected shape: schema items precede prompt items for the same agent; the analyst prompt item precedes the diagnostic, prose, and discussion prompt items (diagnostic/prose/discussion all read analyst output from file); the merge script precedes the package reviewer (the reviewer needs a merged package to review). Validate that the graph is acyclic.
6. Execute the turn-annotation granularity spike. Hand-annotate the densest passage of Overton Park episode 3 under both policies (every turn vs. load-bearing turns only). Record token counts and the UI-affordance comparison. Write the decision and its justification in the spike-resolution section.

**Gates.**

- **B.G1 (architecture checkpoint).** Operator reads the inventory against spec §2 and memo §§3.1–3.5. Every required block in spec §2.1–§2.5 has at least one inventory item; every enforcement check in spec §2.6 has one; every capability flag in spec §4 has one. Any missing item is added before exit. Every item's classification (universal vs. app-coupled) is consistent with Stage A's `classification.yaml` — if an item is classified universal but its closest archived ancestor was app-coupled, the mismatch is investigated and resolved.
- **B.G2 (architecture checkpoint).** Operator reads the dependency graph against memo §6 Rule 11 ("one cognitive job per agent; one agent per file"). No dependency edge crosses agent boundaries in a way that would require two agents to negotiate at runtime. If such an edge exists, either the inventory item is in the wrong agent or Rule 11 is under threat — stop and resolve.
- **B.G3 (mechanical).** The spike-resolution section names a decision and a justification. The resolved policy is recorded as the acceptance rule for the `turn_annotations` inventory item.

**Rollback.** The inventory is a standalone markdown file with no live-tree dependencies. Edit in place on gate failure. No rollback needed.

**Exit criterion.** All three gates pass. The inventory is the working reference for Stages C–F.

---

### Stage C — Schema freeze and gold hand-authoring

**Goal.** Execute spec §5 Stage 1. Write the four new schema files, hand-author a gold instance of each for Overton Park episode 3, and freeze the schemas before any agent prompt is written.

**Inputs.** Stage B inventory; spec §2.1–§2.6; memo §1.2 (the 3×3 matrix as correctness oracle); Overton Park episode 3 transcript and current `analysis.yaml` / `facilitation.yaml` / `lens/scaffolding.yaml` / `lens/facilitation.yaml` (as raw source content for the hand-authoring, not as structural templates).

**Outputs.**

- `framework/schemas/ground_truth.schema.yaml`
- `framework/schemas/diagnostic.schema.yaml`
- `framework/schemas/prose.schema.yaml`
- `framework/schemas/discussion.schema.yaml`
- `framework/schemas/assistive_package.schema.yaml`
- `artifacts/overton-park/episodes/episode_03/ground_truth.yaml` (hand-authored gold)
- `artifacts/overton-park/episodes/episode_03/diagnostic.yaml` (hand-authored gold)
- `artifacts/overton-park/episodes/episode_03/prose.yaml` (hand-authored gold)
- `artifacts/overton-park/episodes/episode_03/discussion.yaml` (hand-authored gold)

**Tasks.**

1. Write the five schema files, one at a time, in the order ground_truth → diagnostic → prose → discussion → assistive_package. For each required block in spec §2.N, add the block to the schema; for each enforcement rule, add a comment referencing the rule. Each schema file carries a top-level `schema_version: 1` field (per spec §7.2 risk mitigation).
2. Extend `framework/pipeline/scripts/validate_schema.py` to load and apply the five new schemas. Legacy schema validation continues to work against legacy files; this is additive.
3. Hand-author the four gold files for Overton Park episode 3 against the schemas. Author ground_truth first, then diagnostic, then prose, then discussion — matching the dependency order the agents will later follow.
4. For every required field, apply the forcing function named in spec §5 Stage 1: "could a non-AI app render or use this without further inference?" If not, revise the schema and re-author the affected field. Record the revision as an inventory delta in `pipeline-revision-inventory.md`.
5. Commit the schemas and the gold files in the same commit. The commit message names Overton Park episode 3 as the gold baseline.

**Authorship discipline.** Per spec §5 Stage 1: hand-authored gold files must be committed before any Stage D agent prompt is written. If possible, the gold files are authored by a different operator than the one who will later write the agent prompts, to prevent self-grading.

**Gates.**

- **C.G1 (mechanical).** `validate_schema.py` passes on all four gold files. Exit code 0. No warnings.
- **C.G2 (mechanical).** `grep` the gold files for reserved framework IDs in student-facing fields (memo §6 Rule 7) — zero matches in `episode_opening`, `entry_prompts`, `discussion_cues[].text`, `role_cards[].stance`. Zero matches for non-canonical IDs in machine-readable fields.
- **C.G3 (architecture checkpoint — schema reality check, from spec §5 Stage 1 gate review).** Operator reads the gold files against memo §1.2. Every cell of the 3×3 affordance-at-three-scales matrix is exercised by at least one field in the gold files. Every field in the gold files traces to one cell. Fields that cannot be placed in the matrix are flagged as candidates for removal or as evidence the matrix is incomplete (the latter is a memo-edit, not a plan-edit). Findings are written as a short report appended to the inventory; schema and spec are revised if necessary.

**Rollback.** If C.G3 surfaces a structural problem with a schema, revert the schema commit and redo. If the problem is in spec §2, escalate: update spec §2 first, sweep this plan in the same commit, then resume.

**Exit criterion.** All three gates pass. The schemas are frozen (no edits without re-running C.G3). Stage D is unblocked.

---

### Stage D — Agent authoring chain

**Goal.** Execute spec §5 Stages 2, 3, 4, 5 — write the four authoring agent prompts and run each on Overton Park episode 3, comparing against the gold files from Stage C. Land the architecture checkpoint spec §5 Stage 4 prescribes after the prose agent.

**Inputs.** Frozen schemas from Stage C; gold files from Stage C; memo §§3.1–3.4 (per-agent cognitive jobs); spec §2.1–§2.5 enforcement rules; the existing `framework/pipeline/agents/evaluator.md` (as source material for the analyst, per spec §5 Stage 2 "Port the existing evaluator prompt"); inventory items classified as `prompt-item`.

**Outputs.**

- `framework/pipeline/agents/analyst_agent.md`
- `framework/pipeline/agents/diagnostic_agent.md`
- `framework/pipeline/agents/prose_agent.md`
- `framework/pipeline/agents/discussion_agent.md`
- Four generated artifacts under `artifacts/overton-park/episodes/episode_03/generated/` — one per agent, for diff against the gold files. The `generated/` subdirectory keeps machine-written output from polluting the hand-authored gold.
- A short diff report per agent appended to the inventory, summarizing where the agent over- or under-reached.

**Substages.**

This stage has four substages. Each substage is a full spec §5 stage. Substages are sequential — D.2 depends on D.1's output, etc. — because the downstream agents read upstream output from file per Rule 11.

#### D.1 — Analyst agent (spec §5 Stage 2)

**Tasks.**
1. Port `framework/pipeline/agents/evaluator.md` into `analyst_agent.md`. Strip every instance of pedagogical speculation (any field the old evaluator wrote that is now a diagnostic-, prose-, or discussion-agent concern). Every stripped field is logged in the diff report.
2. Add the new required blocks from spec §2.1 that the evaluator did not produce: `causal_layer_episode`, `discussion_cue_seeds[]`, `connects_to.contrast_prompt`, `counterfactuals[]` with the quality bar, `perspective_transitions[]`.
3. Declare `schema_version: 1` for `ground_truth.schema.yaml` in the agent prompt's front matter.
4. Run the analyst on Overton Park episode 3. Diff against the gold `ground_truth.yaml`.

**Gates.**
- **D.1.G1 (mechanical).** `validate_schema.py` passes on the generated `ground_truth.yaml`.
- **D.1.G2 (mechanical; from spec §5 Stage 2 exit criterion).** ≥90% of hand-authored `facets_present` entries are produced by the analyst with matching `facet_ref` and at least one overlapping `evidence_turn`. Zero hallucinated facets (every generated entry has a real match in gold). 100% of analyst turn citations resolve to real turns. Every `causal_layer` entry has a populated enumerated `interaction` field. `causal_layer_episode` present. `discussion_cue_seeds[]` populated on every load-bearing turn (per the Stage B spike decision).
- **D.1.G3 (agent review — analyst fidelity).** An ad-hoc review pass (operator or a dedicated reviewer subagent if cheap) reads the generated file against the gold and reports where the analyst over- or under-reached. Findings feed the diff report.

**Rollback.** If D.1.G2 fails, revise the analyst prompt and rerun. If the gap is structural (the prompt cannot bridge the gap without violating Rule 8 role purity), stop and reconsider whether the analyst's cognitive job is correctly scoped — this is a memo §3.1 question, not a prompt-tuning question.

#### D.2 — Diagnostic agent (spec §5 Stage 3)

**Tasks.**
1. Write `diagnostic_agent.md` *from scratch* per spec §5 Stage 3 ("Do not adapt the old evaluator"). The agent reads `ground_truth.yaml` from file; it does not invent ground truth (memo §6 Rule 8).
2. Declare inputs: episode plan, enumerated transcript, `ground_truth.yaml` (from D.1's output, read from file), story position object, canonical reference files.
3. Declare `schema_version: 1` for `diagnostic.schema.yaml`.
4. Run the diagnostic on Overton Park episode 3. Diff against gold `diagnostic.yaml`.

**Gates.**
- **D.2.G1 (mechanical).** `validate_schema.py` passes. `next_move` is a non-empty string on every `response_space` entry. `recommended_lens_switch` populated on every `blindspots[]` entry.
- **D.2.G2 (agent review — diagnostic specificity, from spec §5 Stage 3 gate review).** Sample five entries per category (likely_readings, partial_readings, misreadings, blindspots) across the three lenses. Mark each as "passage-specific" (names something in the actual transcript) or "generic" (could apply to any passage). ≥80% passage-specific to pass.

**Rollback.** If D.2.G2 fails, the diagnostic prompt is under-constrained; add counterexamples from Overton Park ep 3 and re-run. If ≥80% still fails, the problem is upstream (analyst output is too thin to support diagnostic specificity), and D.1 needs revisiting.

#### D.3 — Prose agent (spec §5 Stage 4)

**Tasks.**
1. Write `prose_agent.md` from scratch. Declare the story design doc as an explicit read-only input (spec §5 Stage 4). The agent reads `ground_truth.yaml` and `diagnostic.yaml` from file.
2. Declare `schema_version: 1` for `prose.schema.yaml`.
3. Run the prose agent on Overton Park episode 3. Diff against gold `prose.yaml`.

**Gates.**
- **D.3.G1 (mechanical).** `validate_schema.py` passes. `episode_opening` present. Literal-scan for reserved framework terms in `episode_opening`, `entry_prompts`, `consensus_check`, `group_stall_signals`, `causal_discussion_prompts` returns zero matches.
- **D.3.G2 (agent review — pedagogical register, from spec §5 Stage 4 gate review).** Sample five entries per block. Mark each as "student-sounding" or "adult-sounding." ≥80% student-sounding to pass. Confirm register matches the story's declared `pedagogical_register`.
- **D.3.G3 (architecture checkpoint — first end-to-end architecture review, from spec §5 Stage 4).** After D.3 is the first point at which analyst + diagnostic + prose have run end-to-end on a real episode. Operator answers the three spec §5 Stage 4 questions: (a) Does the three-affordance-at-three-scales spine in memo §1.2 still hold? (b) Does the block structure feel orthogonal in practice, or are fields accidentally drifting between files? (c) Are the governance rules in memo §6 being respected? Findings may revise memo §1 or spec §2/§4 before D.4 proceeds. If spec or memo change, sweep this plan in the same commit.

**Rollback.** Spec §5 explicitly permits memo/spec edits as an outcome of this checkpoint. If they happen, D.1 and D.2 may need partial re-authoring against the revised schemas; the gold files are re-authored first, then the agents are re-run. This is the most expensive rollback in the plan and is why C.G3 exists — to catch as many of these before any agent is written.

#### D.4 — Discussion agent (spec §5 Stage 5)

**Tasks.**
1. Write `discussion_agent.md` from scratch. Declare the three creative axes (lens refraction, persona projection, stance inversion — spec §2.5) as structured prompt content, not as free-form guidance.
2. The agent reads `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, story design doc, reference files. Declare `schema_version: 1` for `discussion.schema.yaml`.
3. Run on Overton Park episode 3. Diff against gold `discussion.yaml`.

**Gates.**
- **D.4.G1 (mechanical).** `validate_schema.py` passes. Every load-bearing turn meets the mechanical cue-count floor (`len(cues_for_turn) ≥ distinct_angle_count`). Every role card's lens has `signal ≥ moderate` in `lens_visibility`. Literal-scan for reserved framework IDs in cue text and role cards returns zero matches.
- **D.4.G2 (agent review — creative generativity, from spec §5 Stage 5 gate review).** Sample ten cues. Mark each as "generative" (introduces a new angle or framing) or "paraphrase" (rewords ground truth). ≥70% generative to pass. Confirm at least two of the three axes are exercised across the episode. Confirm persona-projected cues honor established character voices.

**Rollback.** If D.4.G2 fails, the discussion prompt's three-axis structure is under-specified; add worked examples of each axis from the gold discussion.yaml and re-run. If the gold itself does not exercise two of three axes, the gold is under-authored — this is a Stage C regression and C.G3 should have caught it. Stop and escalate.

**Exit criterion for Stage D.** All four substages exit. The four new agent prompts exist, each has been run on Overton Park episode 3 with gate-passing results, and the spec §5 Stage 4 architecture checkpoint has landed.

---

### Stage E — Reviewer + merge script + first full pass

**Goal.** Execute spec §5 Stage 6. Write the merge script (spec §2.6) and the package reviewer agent (spec §2 references, memo §3.5), then run the full pipeline end-to-end with no operator intervention on a second Overton Park episode.

**Split from spec §5 Stage 6.** Spec §5 Stage 6 bundles "write the reviewer" with "run the full pipeline on a fresh episode." This plan splits them into E.1 (merge script), E.2 (reviewer agent with seeded broken cases), and E.3 (first unassisted end-to-end run on a fresh episode). The split lets E.1 and E.2 gate independently and gives E.3 a clean "is the system cohesive?" test rather than a compound "is the reviewer AND the chain correct?" test.

**Inputs.** Stage D outputs; memo §3.5 (package reviewer's thirteen criteria); spec §2.6 (merge-script enforcement checks and derivations); spec §2.8 (handoff contract); memo §6 Rules 9, 11, 12.

**Outputs.**

- `framework/pipeline/scripts/build_assistive_package.py` — the merge script.
- `framework/pipeline/agents/package_reviewer.md` — the reviewer agent (replaces `analysis_reviewer.md` and `scaffolding_reviewer.md` from the archive).
- `framework/pipeline/commands/build_assistive_package.md` — the new command that runs analyst → diagnostic → prose → discussion → reviewer → merge.
- Four deliberately broken package fixtures under `framework/pipeline/tests/broken_packages/` (spec §5 Stage 6: hallucinated facet, missing interaction, generic diagnostic prose, cues collapsing under cosmetic variation).
- `artifacts/overton-park/episodes/episode_04/` — the full generated package from the unassisted run, including `assistive_package.yaml`.

#### E.1 — Merge script

**Tasks.**
1. Write `build_assistive_package.py` as pure Python + PyYAML. It reads the four agent outputs for one episode, computes the deterministic derivations listed in spec §2.6 (`prior_exposure`, `turn_annotations[].causal_signals` inversion, `calibration_warnings[]` lifting when flagged, discussion-cue minimum-count enforcement), and writes `assistive_package.yaml`.
2. Implement every enforcement check listed in spec §2.6 as a distinct Python function with a clear error message citing the spec § and the specific field. On any failure, exit with nonzero status.
3. The script writes only to `artifacts/{story_id}/episodes/episode_{NN}/`. It never reads or writes under `{app_id}/` subdirectories (spec §2.8, memo §6 Rule 12).

**Gates.**
- **E.1.G1 (mechanical).** Running the merge script on the Stage C gold files produces a valid `assistive_package.yaml` that passes all enforcement checks.
- **E.1.G2 (mechanical).** Running the merge script on deliberately invalid input (a gold file with one `response_space.maps_to_facet` pointing at a nonexistent facet) exits nonzero with an error message naming the offending field and spec §2.6.

#### E.2 — Package reviewer agent

**Tasks.**
1. Write `package_reviewer.md`. Criteria list comes from memo §3.5 (thirteen criteria) — do not re-state them here.
2. Write the four broken-package fixtures.
3. Run the reviewer against each fixture and verify it catches the specific failure. The fixtures are seeded from failures actually observed in Stage D (not imagined failures), per spec §5 Stage 6 discipline.

**Gates.**
- **E.2.G1 (mechanical).** Reviewer catches all four seeded broken cases. For each, the reviewer's output names the specific criterion and the specific field.
- **E.2.G2 (agent review — reviewer calibration).** Run the reviewer against the Stage C gold package (known-good). It returns ACCEPT with no flagged findings. Any flagged finding on a known-good package indicates reviewer over-sensitivity; tune the prompt.

#### E.3 — First unassisted end-to-end run

**Tasks.**
1. Choose the fresh episode: Overton Park episode 4 (episode 3 was the Stage C gold; a distinct episode is required for the unassisted test).
2. Write `build_assistive_package.md` as the orchestrating command. It runs analyst → diagnostic → prose → discussion → reviewer → merge with no operator intervention.
3. Execute the command against Overton Park episode 4.
4. Run cross-episode mode: operate the pipeline across episodes 3 and 4 together so `connects_to` references resolve and `pedagogical_register` consistency can be checked.

**Gates.**
- **E.3.G1 (mechanical; from spec §5 Stage 6 exit criterion).** The full pipeline produces `assistive_package.yaml` that passes all merge-script integrity checks with no operator intervention between agents.
- **E.3.G2 (agent review).** The package reviewer passes the generated package against all thirteen criteria.
- **E.3.G3 (mechanical).** Cross-episode run succeeds: `connects_to` references between episode 3 and episode 4 resolve. `pedagogical_register` consistent. Creative non-convergence holds (reviewer criterion 12) for the discussion agent's output across the two episodes.
- **E.3.G4 (architecture checkpoint — second architecture review, from spec §5 Stage 6).** Operator answers the same three memo §6 / §1.2 questions from D.3.G3, now with a more complete dataset. Did the second-episode run surface issues the first hid? Any cross-episode interactions missed? Findings may revise the memo or spec; sweep this plan if so.

**Rollback.** If E.3.G1 or E.3.G2 fails, the failure mode determines rollback scope. An agent-side failure reopens the relevant D substage. A merge-script failure reopens E.1. A reviewer-side false positive reopens E.2. An architecture-level failure reopens C or the memo. The decision tree is: failures at the leaves (single field, single criterion) are prompt tuning; failures at the root (architecture checkpoint) trigger spec/memo edits.

**Exit criterion for Stage E.** All three substages exit. The revised universal pipeline is demonstrably end-to-end operational on a real episode with no operator intervention.

---

### Stage F — Contrast-case run and retirement of legacy surface

**Goal.** Execute spec §5 Stage 7 (contrast-case run), then retire the legacy files the revision replaces.

**Inputs.** Stage E outputs; spec §5 Stage 7; spec Appendix B (the list of replaced files); Stage A's `classification.yaml` (the catalog of what can be retired).

**Outputs.**

- `artifacts/{contrast_story}/episodes/episode_01/` — the generated package from the contrast-case run.
- Retired files: the "retired" entries from `classification.yaml` are deleted from the live tree. The archive retains them indefinitely.
- `framework/docs/pipeline-revision-implementation.md` — this file — moved to `archive/pre-revision-2026-04-08/pipeline-revision-implementation.md` with a `frozen 2026-04-NN` header.

#### F.1 — Contrast-case run

**Tasks.**
1. Choose the contrast story per spec §7.3: use `saving-the-maker-space` as-is, or hand-author a minimal contrast story, whichever the operator decides before this substage begins. The criterion is that the contrast story opts *out* of several capability flags that Overton Park opts *into*.
2. Run the full pipeline on episode 1 of the contrast story.

**Gates.**
- **F.1.G1 (mechanical; from spec §5 Stage 7 exit criterion).** Contrast story produces a valid assistive package. Every conditional block tied to a capability flag the contrast story does *not* declare is absent. Every conditional block tied to a flag the contrast story *does* declare is present.
- **F.1.G2 (agent review — capability-declaration respect, from spec §5 Stage 7 gate review).** The reviewer is not confused by absence. It does not flag absent conditional blocks as under-specification. It does flag missing required blocks.
- **F.1.G3 (agent review).** The prose and discussion agents honor the contrast story's `pedagogical_register` if it differs from Overton Park's.

**Rollback.** If F.1 fails, the failure is in capability-flag handling — either in a schema, an agent prompt, the merge script, or the reviewer. Trace to the specific file and re-run the relevant D or E substage.

#### F.2 — Retirement of legacy surface

**Tasks.**
1. For every "retired" entry in `classification.yaml`, delete the file from the live tree. Expected deletions (per spec Appendix B): `framework/pipeline/agents/evaluator.md`, `framework/pipeline/agents/analysis_reviewer.md`, `apps/lens/pipeline/agents/scaffolding_reviewer.md` (if present), `framework/pipeline/commands/analyze_transcript.md`, `apps/lens/pipeline/commands/design_scaffolding.md` (if present), `framework/schemas/analysis.yaml`, `framework/schemas/facilitation.yaml`, `apps/lens/schemas/scaffolding.yaml`.
2. Update `CLAUDE.md`, `framework/docs/system-architecture.md`, and `framework/docs/operator-manual.md` to reflect the new command surface (`/build_assistive_package`) and the retired commands. These edits are the one place where the revision touches the memo/spec ecosystem *outside* of the pipeline revision documents themselves, so they get their own commit and their own review pass.
3. Move this file to the archive with a `frozen YYYY-MM-DD` header.

**Gates.**
- **F.2.G1 (mechanical).** `grep -r "evaluator\|analysis_reviewer\|scaffolding_reviewer\|analyze_transcript\|design_scaffolding" framework/ apps/` returns zero matches (excluding the archive and the pipeline revision documents that discuss history).
- **F.2.G2 (mechanical).** A fresh clone + `python3 apps/lens/pipeline/initialize_lens.py` succeeds. The resulting `.claude/commands/` and `.claude/agents/` contain the four new agents and the new command. No legacy agents or commands are synced.
- **F.2.G3 (mechanical).** Re-running the full pipeline on Overton Park episode 3 and the contrast story episode 1 after retirement produces byte-identical packages to the pre-retirement runs. No regression.

**Rollback.** If F.2.G3 regresses, a retired file was load-bearing in a way `classification.yaml` did not catch. Restore the file from the archive, revisit the classification, and re-run the gate.

**Exit criterion for Stage F.** All three F.1 gates and three F.2 gates pass. The revision is complete. This document is archived.

---

## Part III — Cross-cutting disciplines

### III.1 Commit discipline

- **One stage per commit (preferred) or one substage per commit (acceptable).** Mixing stages in one commit defeats rollback-by-revert.
- **Spec and plan edits in the same commit.** If a stage's gate triggers a spec or memo edit, the spec/memo edit and the plan's sweep land together.
- **Gold files and schemas in the same commit.** Stage C's gold files and schemas are authored together and land together. A gold file without a schema (or vice versa) is a broken state.

### III.2 Reviewer subagent reuse

Where an existing reviewer subagent can be repurposed for a plan gate, reuse it. The existing `projection_reviewer` is a template for building a "paraphrased framework-label leakage" check that the package reviewer should inherit; `story_consistency_reviewer` is a template for prose-on-prose review that the prose agent's register check (D.3.G2) can reuse.

### III.3 When to stop and escalate

Stop execution and escalate (rather than tuning in place) when:

1. A gate fails in a way that implies a memo §6 rule violation. Rules are architectural commitments; tuning around them is the failure mode the twelve rules exist to prevent.
2. A gate failure traces to a dependency that Stage B's graph did not identify. The inventory is wrong; update it before proceeding.
3. An architecture checkpoint (A.G3, B.G1, B.G2, C.G3, D.3.G3, E.3.G4) surfaces a structural problem. These checkpoints exist precisely to catch problems that are cheaper to fix at the checkpoint than later.
4. Two successive substages require the same prompt revision. Repeat revision signals the prompt is under-scoped at a structural level, not a tuning level.

Escalation means: stop execution, document the issue in the inventory, update spec or memo as needed, sweep this plan, and resume from the earliest affected substage.

### III.4 Sign-off authority

- **Mechanical gates** — any operator can declare pass.
- **Agent reviews** — any operator can declare pass after reading the reviewer's output.
- **Architecture checkpoints** — the operator performing the checkpoint names the memo § or spec § they checked against in the commit message. This is the audit trail for the revision.

---

## Appendix — Inventory cross-reference (stub)

This appendix will be populated during Stage B. It is a matrix: rows are inventory item IDs, columns are execution stages A–F, cells mark where the item is touched. The matrix is the mechanical check that every inventory item lands in at least one execution stage and every execution stage's tasks trace to at least one inventory item.

Until Stage B runs, this appendix is a placeholder; no sign-off is required on it.

---

*End of implementation plan.*
