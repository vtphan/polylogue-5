# Pipeline v1 → v2 Migration

**Purpose.** This is the single place that tracks the diff between the currently-running v1 pipeline and the v2 target pipeline. It exists so that `pipeline-architecture.md`, `pipeline-revision-plan.md`, and `pipeline-revision-implementation.md` can describe v2 as a standalone system without interleaved "this was different in v1" commentary.

**How to use it.**
- If you want to know *what the target system is*, read `pipeline-architecture.md` (rationale) and `pipeline-revision-plan.md` (specs). They describe v2 on its own terms.
- If you want to know *how to get from here to there*, read `pipeline-revision-implementation.md`.
- If you want to know *what changes between the live system and the target*, read this document.

Once v2 ships and v1 is no longer the live pipeline, archive this file.

---

## 0. Story and artifact archival

As the first step of the v2 restructure, all v1-pipeline story content is frozen into archive directories and removed from the live tree. This happens *before* any schema or code changes so that every subsequent step operates on a clean tree.

**What moved:**

| From | To |
|---|---|
| `framework/stories/saving-the-maker-space.md` | `framework/stories/archive/v1/saving-the-maker-space.md` |
| `framework/stories/saving-the-maker-space/episode_*.md` | `framework/stories/archive/v1/saving-the-maker-space/episode_*.md` |
| `framework/stories/the-overton-park-sightings.md` | `framework/stories/archive/v1/the-overton-park-sightings.md` |
| `framework/stories/the-overton-park-sightings/episode_*.md` | `framework/stories/archive/v1/the-overton-park-sightings/episode_*.md` |
| `artifacts/saving-the-maker-space/` | `artifacts/archive/v1/saving-the-maker-space/` |

(No `artifacts/the-overton-park-sightings/` exists — that story was authored as drafts but never ran through Phase 7.)

**What the policy is.** The v2 pipeline does not read from archive paths. `validate_story.py` rejects `archive` and `validation` as story IDs with a clear error message. Each archive root has a `README.md` explaining the policy. Live pipeline scripts either (a) are parametric in `story_id` and transparently ignore the archive, or (b) had incidental docstring examples referencing v1 paths, which are updated to generic `{story_id}` placeholders for consistency. No live pipeline file references the v1 story names after this step — verified by grep.

**What did not move.** `framework/stories/validation/` is the gitignored sidecar for `validate_story.py`'s reports; it stays in place. `framework/docs/archive/saving-the-maker-space-friction-log.md` and `saving-the-maker-space-progress.md` were already in the docs archive from a prior pass; they stay there. The legacy `registry/`, `configs/`, and root `docs/` directories are a separate concern (the disposable-persona system) and are governed by the pre-existing legacy policy in `CLAUDE.md`; the v1 story archival does not touch them.

**Why stories are archived rather than deleted.** V1 stories are a source of narrative material — premise, stakes, cast sketches, dramatic arcs — that can be extracted as creative briefs for v2 authoring. The extractions live at `framework/stories/v1-storylines/{v1_story_id}.md` as fresh prose files (no targets, no signals, no framework frontmatter). V2 stories authored from extracted storylines get *new* story IDs and never overwrite the archive.

**Why v2 does not validate against v1 stories.** The original plan was to run `saving-the-maker-space` and `the-overton-park-sightings` through the restructured pipeline as validation. That was rejected in favor of authoring a fresh v2-native pilot story, because the v1 stories were authored against a different affordance surface and would under-exercise or misalign with the v2 runtime package. See `framework/docs/runtime-package-restructure.md` §9 for the reasoning.

---

## 1. Pedagogical commitments and architecture

The pedagogical commitments, the split into authoring agents, and the twelve governance rules are substantively unchanged. What changes is **how productive struggle is operationalized** and **how the package's blocks organize themselves across runtime triggers**.

### 1.1 Three-layer model added

v2 labels every block with exactly one of three runtime triggers: **L1 source** (analyst; not user-visible), **L2 pre-authored navigation** (prose, discussion; shown on navigation events), **L3 reactive intervention** (diagnostic; fired on student-state events).

v1 labeled the columns of the affordance matrix "analytical / individual-phase / group-phase" — when in the student arc content fires. That labeling hid an important distinction: individual-phase and group-phase content can be either pre-authored or reactive, and those two kinds fail in different ways and should be owned by different agents. The three-layer axis makes that split explicit.

### 1.2 Productive struggle reframed

In v1, `struggle_calibration` was positioned as the mechanism of productive struggle. In v2 it is a coarse pricing knob on top of the per-turn intervention ladders the diagnostic agent authors; the ladder shape **is** the mechanism.

v2 corollary to governance Rule 4: *Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.* The pipeline authors no block whose correct operation requires the app to do runtime NLP, runtime affect detection, or runtime pattern matching of student prose. This is the reason v1's `stall_signals` prose, `danger_signals[]`, and pattern-matching assumptions are removed.

### 1.3 Diagnostic agent's cognitive job rewritten

v1: "imagine what 6th-grade students will get wrong." v2: "author the probes and per-turn ladders that let the app deliver calibrated intervention via dictionary lookup." The probe layer and the per-turn three-role intervention dictionary are both new.

### 1.4 Affordance 3 individual-phase upgraded

v1's matrix row for Affordance 3 individual-phase was the weakest cell — v1 had only "recommended_lens_switch on blindspots." v2 anchors it with afforded-missing intervention cells, which make the pedagogically most-valuable case (`engagement: none, affordance: rich`) first-class.

### 1.5 Rule 6 becomes load-bearing at runtime

v2 strengthens Rule 6 (turn anchors are mandatory) by moving the primary intervention key from `(passage, lens)` to `(turn, facet)`. Rule 6 now serves the runtime app loop, not just traceability.

### 1.6 Rule 5 further applied

v2 eliminates six more overlapping pairs on top of v1's six: `causal_discussion_prompts[]` → `discussion_cues.explanatory_ref`; `episode_cues[]` → `discussion_cues` with null turn; `role_cards[]` → `discussion_cues.continuation_of: null`; `attention_cues[]` + `silence_breakers[]` + `recommended_lens_switch` → per-turn intervention ladders; `causal_layer_episode` → `connects_to.echoes`; `lens_stance_stem` removed as an orphaned leftover.

---

## 2. Agents

### 2.1 Authoring agents

| v1 | v2 |
|---|---|
| `evaluator` (mixed analytical + pedagogical work) | `analyst_agent` + `diagnostic_agent` + `prose_agent` + `discussion_agent` |
| `analysis_reviewer` + `scaffolding_reviewer` | `package_reviewer` (merged) |

The evaluator's predictable failure mode (mixing analytical and pedagogical work in one prompt) is the reason for the four-way split. Each v2 agent holds exactly one thing in mind: the analyst holds framework vocabulary, the diagnostic agent holds the student error model, the prose agent holds the story's voice, the discussion agent holds character canon and the three-axis creative surface.

### 2.2 Diagnostic agent scope

v2 drops v1's "imagine student errors" framing. The diagnostic agent now authors the per-turn three-role intervention dictionary directly (`blank_page` + `by_facet[F]` cells per turn), the facet probes that route into it, and the opt-in explanation probes and sub-ladders.

### 2.3 Prose agent scope

Dropped from v1's prose agent responsibilities:
- `group_stall_signals` and related voiced unstall prompts. Group-stall detection is not reliably doable by the app without NLP or affect sensing. Group recovery is instead handled by the cue-refetch loop on UI-state silence, using content from `discussion_cues`.
- `causal_discussion_prompts[]`. Absorbed into `discussion_cues` via `explanatory_ref`.

### 2.4 Discussion agent scope

Dropped from v1's discussion agent responsibilities:
- `role_cards[]`. Pedagogically specific classroom ritual. Cues with `continuation_of: null` carry the same opening-cue function without prescribing the ritual.
- `role_reinforcements[]`. Consequence of dropping role cards.
- `episode_cues[]`. Absorbed into `discussion_cues` with `turn: null`.

### 2.5 Reviewer criteria

Dropped from v1 reviewer criteria:
- Criteria tied to `role_cards[]`, `expected_divergence[]`, and `stall_signals` detection prose (all dropped blocks).
- v1's blindspot-specificity criterion, replaced by the v2 afforded-missing-cell criterion (same content, finer grain).

### 2.6 Internal scratch

v1's likely/partial/misreading/blindspot categories survive in v2 as `diagnostic.response_space.by_lens` — working notes that reviewers see as an audit trace. The merge script does not consume them at runtime; the per-turn intervention dictionary is the runtime source.

---

## 3. Commands and files

### 3.1 Commands

| v1 | v2 |
|---|---|
| `/analyze_transcript` + `/design_scaffolding` | `/build_assistive_package` |
| `/create_episode`, `/create_transcript` | unchanged |
| `/configure_session`, `/configure_competition` | **removed from the pipeline** — see note below |

`/build_assistive_package` runs analyst → diagnostic → prose → discussion → reviewer → merge sequentially.

**Pipeline scope ends at `assistive_package.yaml`.** The v2 pipeline produces a single universal, lookup-ready artifact per episode; anything app-specific (Lens UI layout, Reasoning Lab scoring rubric and team assignment, per-deployment toggles) is an **app-layer** concern, not a pipeline stage. Apps read `artifacts/{story_id}/episodes/episode_{NN}/assistive_package.yaml` directly. This is a change from v1, where `/configure_session` existed partly to stitch together multiple overlapping files — a job the v2 merge step inside `/build_assistive_package` already does. Keeping `/configure_session` as a pipeline stage in v2 would make it either a thin pass-through or a second place where runtime behavior gets decided, cutting against Rule 11 (one capability = one agent + one file).

### 3.2 Files produced per episode

| v1 | v2 |
|---|---|
| `analysis.yaml` | (retired) |
| `facilitation.yaml` | (retired) |
| `lens/scaffolding.yaml` | (retired) |
| `lens/facilitation.yaml` | (retired; enriched version was app-specific) |
| `lens/session.yaml` | **removed from pipeline output** (app-layer, not a pipeline artifact) |
| — | `ground_truth.yaml` |
| — | `diagnostic.yaml` |
| — | `prose.yaml` |
| — | `discussion.yaml` |
| — | `assistive_package.yaml` (deterministically merged) |

### 3.3 Schemas

Retired: `analysis.schema.yaml`, `facilitation.schema.yaml`, `lens/scaffolding.schema.yaml`.

New: `ground_truth.schema.yaml`, `diagnostic.schema.yaml`, `prose.schema.yaml`, `discussion.schema.yaml`, `assistive_package.schema.yaml`.

### 3.4 Reference data

New: `framework/reference/wrestling_gates.yaml` — enumerated vocabulary for `minimum_wrestling[]` entries (initial set: `selected_a_facet`, `viewed_turn_for_15s`, `attempted_one_sentence`, `viewed_second_lens`).

---

## 4. Field-level changes

### 4.1 v1 → v2 field disposition

| v1 field | Disposition under v2 |
|---|---|
| `analysis.yaml` → `ai_perspective.through_{lens}` | `ground_truth.lens_visibility` + `perspective_transitions` |
| `analysis.yaml` → `ai_perspective.why_it_happened` | `ground_truth.causal_layer` with required `interaction` |
| `analysis.yaml` → `diversity_potential.likely_student_observations` | `diagnostic.response_space.by_lens` (working notes) → `diagnostic.interventions.by_turn` (runtime) |
| `scaffolding.yaml` → `scaffold_sequence` (hints) | `diagnostic.interventions.by_turn[T].by_facet[F].ladder` |
| `scaffolding.yaml` → `deepening_probes` | `diagnostic.interventions.*.ladder` question rungs + opt-in explanation sub-ladders |
| `scaffolding.yaml` → `common_misreadings` | `diagnostic.interventions.*` cells with `role: tempting_absent` |
| `scaffolding.yaml` → `observation_rubric` | `diagnostic.response_space.by_lens.likely_readings` (working notes) |
| `scaffolding.yaml` → `explanation_rubric` | `diagnostic.response_space.explanation_quality` (working notes) |
| `facilitation.yaml` → `productive_questions` | **dropped** (teacher surface deferred) |
| `facilitation.yaml` → `watch_for`, `if_students_are_stuck` | `diagnostic.struggle_calibration` (coarse pricing) |
| `facilitation.yaml` → `likely_disagreements` | **dropped** (teacher surface deferred) |

### 4.2 v1 fields fully dropped in v2

`stall_signals.productive/stalled`, `danger_signals[]`, `attention_cues[]` (as separate block), `silence_breakers[]` (as separate block), `causal_layer_episode`, `connects_to.sets_up[]`, `connects_to.contrasts[].contrast_prompt`, `group_stall_prompts[]`, `causal_discussion_prompts[]`, `role_cards[]`, `role_reinforcements[]`, `lens_stance_stem`, `episode_cues[]`, `expected_divergence[]`, `recommended_lens_switch` (as separate field).

Rationale per category:
- **Detection-dependent blocks** (`stall_signals`, `danger_signals`, `group_stall_prompts`, pattern-matching `next_move`): the non-AI app cannot reliably detect the triggering state.
- **Pedagogically-specific rituals** (`role_cards`, `role_reinforcements`, `lens_stance_stem`): the pipeline should not prescribe classroom rituals.
- **Redundant groupings** (`causal_layer_episode`, `causal_discussion_prompts`, `episode_cues`, `attention_cues`, `silence_breakers`, `recommended_lens_switch`): absorbed into more general blocks.
- **Teacher-facing content** (`expected_divergence`, `productive_questions`, `likely_disagreements`): deferred until a teacher surface is designed.
- **Speculative fields** (`connects_to.sets_up`, `contrasts[].contrast_prompt`): no runtime consumer.

### 4.3 v2 new fields

`probes.facet.by_turn`, `probes.explanation.by_turn_facet` (opt-in), `interventions.by_turn.{blank_page, by_facet}` (three roles, ladders, optional explanation sub-ladders), lean `struggle_calibration` (`pace`, `minimum_wrestling[]`, `productive_duration`), `discussion_cues.continuation_of`, `discussion_cues.explanatory_ref`, `discussion_cues` with null turn key, `response_space.by_lens` as scratch/audit trace.

---

## 5. Capability flags

No new capability flags in v2. The five existing flags (`pedagogical_register`, `uses_character_growth`, `declares_calibration_warnings`, `uses_stance_positions`, `supports_jigsaw`) are retained unchanged. The dropped v1 blocks did not have their own flags — they were universal-by-default under v1 and are universally-removed under v2.

---

## 6. Governance rules

Rules 1–12 are verbatim from v1. v2 adds one **operational corollary**, not a new rule: **Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.** This is a consequence of Rules 4 and 11 applied to the productive-struggle surface.

Rule 6 is load-bearing in v2 in a way it was not in v1 — see §1.5 above.

---

## 7. Net effect

Authoring load: roughly **70% reduction** in the incremental diagnostic content the revision introduces over the v1 evaluator, while preserving the per-turn intervention dictionary, which is the design's main lift.

Block count: the v1 five-file overlap structure (six pairs of overlapping fields across `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, `lens/session.yaml`) is eliminated. In v2 no content lives in two places.

Extensibility: adding a future intelligent capability means adding one agent and one file (Rule 11), not bolting fields onto an existing prompt.
