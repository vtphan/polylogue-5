STORY PIPELINE — DESIGN SPEC

Status: Shipped. The episodes-first authoring model (Part 13) is the live system. Parts 1–4 and Part 13 are the authoritative spec; Part 5.5 (information barrier projection), Part 6 (re-planning loop), Part 10 (story design rubric), Part 11 (suggested first stories), and Appendix B (per-episode draft template) are referenced by schemas, validators, agents, and operator docs and must stay stable. The older parts describing `story.yaml`, `/design_story`, `story_planner`, and `signal_template` machinery have been removed from this document — see Part 13 for why.

READING ORDER: Parts 1–2 give the rationale. Parts 3–4 are the coverage and evidence-grounding specs. Part 13 is the authoring model. Part 5.5 is the information barrier spec. Appendix B is the per-episode draft template.

================================================================
PART 1 — WHY: THE TWO RATIONALES
================================================================

1A. Why evidence grounding for explanatory variables

The framework rests on three layers: lenses (3) → facets (10 structural dimensions of reasoning quality) → explanatory variables (8 cognitive patterns + 3 social dynamics) that explain why reasoning goes wrong. For this to be honest, every cognitive pattern or social dynamic the system claims must be visible in the transcript itself — not projected onto it.

A devil's-advocate review of the pre-revision pipeline found that this grounding was only partial:

- Facet weaknesses were required to be evidenced (the evaluator must cite evidence_sentences, the analysis_reviewer reads them back, and the transcript_reviewer checks the weakness is detectable). Strengths are similarly enforced.
- The cognitive pattern and social dynamic in target_facets[].designed_explanation had no equivalent enforcement. Nothing in the pipeline checked that the named pattern or dynamic actually left a behavioral trace in the dialog.
- Social dynamics structurally require a turn-pair (a move and a response) to be visible at all. The planning agent was not required to engineer such a pair into the turn outline.
- Even when evidence was present, the evaluator committed to a single label where textual evidence often supported several. This made the analysis sound more diagnostic than the transcript justified.

The fix is to make explanatory variables earn their place the same way facet weaknesses and strengths already do: pre-committed by the operator with a behavioral signal description, translated into the turn outline by the planning agent, preserved by the dialog writer, verified by the transcript reviewer, and grounded with an explicit evidence_basis field by the evaluator. Part 4 is the spec.

1B. Why stories with recurring casts

The legacy scenario-sequence model had each scenario invent fresh personas tuned to that scenario's target facets. Personas were disposable. Five strategic problems followed:

- Same persona arc in every scenario (assertive-but-shaky vs pragmatic-but-yields, with the cautious one capitulating). Students started predicting the arc by scenario 3.
- Strength carriers clustered on the "loser" persona; the only mixed-valence shape was "early strength → collapse."
- Lens distribution skewed — Scope primary in 4 of 5 scenarios, Logic in 1.
- PBL context identical across all scenarios; four of five had students planning their own project.
- Topics consensus-safe, so perspective engagement was taught on manufactured rather than genuine disagreement.

The deeper issue is that disposable personas can't carry growth, can't carry consequences across episodes, and can't become legible to students as recognizable people. Recurring characters with engineered tendencies fix all five problems at once and turn "we teach 10 facets across 5 scenarios" into "we teach critical thinking through a multi-episode story about kids solving a problem they care about" — a project description that actually excites teachers and students.

The two revisions are complementary. Evidence grounding makes the framework honest at the artifact level. Stories make the framework engaging at the experience level. Neither is sufficient on its own.

Clean break. The story-based pipeline is a clean break from the legacy disposable-persona system. No migration is performed, no artifact equivalence is required, and the legacy `registry/` directory remains frozen indefinitely as historical reference. This is stated in CLAUDE.md and is the only relevant policy on legacy compatibility.

================================================================
PART 2 — STRATEGIC FRAME: STORIES, EPISODES, CASTS
================================================================

Terminology

- Story — a self-contained multi-episode narrative with a fixed cast, an arc, and a declared coverage contract. Authored as a prose design doc (`framework/stories/{story_id}.md`) with YAML frontmatter.
- Episode — one discussion within a story. Authored as a per-episode draft (`framework/stories/{story_id}/episode_{NN}.md`) — see Appendix B. The planning pipeline writes `episode.yaml` from the draft.
- Cast — the recurring characters defined at the story level in prose. Each character has stable tendencies (cognitive patterns, social dynamic contributions, lens disposition) and an optional growth arc.
- Session — one classroom sitting on one episode.

Design inversion

Scenario order: pick facets → invent personas → write dialog. Story order: design the cast (with stable tendencies and growth potential) → plan which episodes surface which tendencies → check that the cast collectively covers the framework → write each episode's dialog within those constraints. This inversion is what makes "interesting stories" and "framework coverage" compatible instead of in tension.

Cast design rules

1. Collectively the cast must carry the declared coverage — not in every episode, but somewhere in the season.
2. No character is an embodied fallacy. Each character carries 2–3 cognitive tendencies and contributes to 1 social dynamic. Tendencies surface or don't depending on the situation.
3. Each character has at least one stable strength they reliably bring.
4. At most 2 characters in the cast have visible growth arcs across the story. Constancy is realistic and gives students stable reference points.
5. The cast collectively models the three lens dispositions (Logic-leaning, Evidence-leaning, Scope-leaning), without ever naming the lenses.
6. Cast size is bounded: 4–6 characters total, 2–3 per episode. If a character can be removed without breaking coverage, remove them.

Strength-carrier rotation. Strength carriers rotate explicitly across episodes. `validate_story.py` flags if one character carries more than half the strengths in a story.

================================================================
PART 3 — COVERAGE CONTRACT
================================================================

Each story declares its coverage in the story design doc's YAML frontmatter. Two coverage modes:

- Full coverage: the story commits to covering all 10 facets, all 8 cognitive patterns, and all 3 social dynamics across its episodes. The validator fails the story if any inventory entry is uncovered. Default ambition for stories of 6+ episodes.
- Focused coverage: the story declares a subset and the validator only checks the declared subset. For shorter mini-stories. Has a hard floor: ≥3 facets, ≥1 cognitive pattern, ≥1 social dynamic — otherwise the mode becomes an escape hatch.

`validate_story.py` checks, across all per-episode draft frontmatter in the story:

- Every declared facet has at least one episode where it appears as a target (weakness) and at least one episode where it appears as a target_strength.
- Every declared cognitive pattern is carried by at least one character in at least one episode, with the cognitive_signal field non-empty AND with at least one unhedged single-label annotation in that episode's analysis.yaml. Hedged (multi-label) annotations do not satisfy coverage — only confidently single-labeled ones do. This creates the right incentive: the evaluator commits when evidence justifies a single label, hedges when it doesn't, and the operator is responsible for ensuring at least one episode in the story produces an unhedged annotation for each declared pattern.
- Every declared social dynamic is carried similarly, on the same rule.
- Lens distribution: across the full arc, each lens (logic, evidence, scope) must appear as a primary lens in at least one episode AND no single lens may be primary in more than half the episodes (rounded down). Prevents the Scope-dominance regression while remaining feasible for 3-episode focused stories.
- Mixed-valence shape rotation: across the full arc, no single mixed_valence_shape value may appear in more than half of the episodes. The five shapes are a menu, not a checklist — no "each shape must appear" rule.
- Strength rotation: no single character carries more than half of the story's strengths. Validator-computed from the arc.
- Weakness rotation: no single character carries more than half of the story's weaknesses. Validator-computed from the arc.

Cast-tendency consistency (character drift) is NOT a structural check in the episodes-first model — it is a prose-on-prose review job for `story_consistency_reviewer` (see Part 13.7).

The coverage contract is the load-bearing piece that ties the story-level design to the framework's existing inventory. Without it, stories become narrative artifacts with vague pedagogical claims. With it, stories are auditable curriculum.

================================================================
PART 4 — EVIDENCE GROUNDING
================================================================

Three gaps to close:

- Gap 1 — Cognitive pattern and social dynamic have no required textual grounding.
- Gap 2 — Social dynamics need turn-pairs but nothing enforces it.
- Gap 3 — Single-label over-claim where evidence underdetermines.

4A. Operator prompt — episode-level

Per target in the per-episode draft frontmatter (Appendix B), in addition to facet ID, lens, cognitive pattern, social dynamic, and carrier:

- `cognitive_signal` — one sentence describing the behavioral trace of the cognitive pattern in the dialog. Required iff `cognitive_pattern` is non-null.
- `social_signal` — one sentence describing the move/response turn-pair shape that realizes the social dynamic. Must reference at least two turns. Required iff `social_dynamic` is non-null.

These propagate into `target_facets[].designed_explanation` in `episode.yaml`.

4B. Schema additions

`episode.yaml` — `target_facets[].designed_explanation` carries `cognitive_signal` and `social_signal` parallel to `interaction_note`.

`analysis.yaml` — in `facet_annotations[].explanatory_variables`:
- Widen `cognitive_pattern` and `social_dynamic` to allow either a string (single-label, "confident") or a list of strings (multi-label, "hedged"). Hedged annotations are honest but do not satisfy story-level coverage (see Part 3).
- Add a required `evidence_basis` sibling to `evidence_sentences`: one sentence pointing to the specific behavioral evidence that supports the cognitive_pattern and social_dynamic assignments. If the evidence is consistent with multiple labels, name the alternatives here rather than committing to a single one.

`episode_writer_input.yaml` — no change. The information barrier holds (Part 5.5).

4C. Agent changes

`planning_agent`: extends `designed_explanation` handling to include `cognitive_signal` and `social_signal` copied verbatim from the per-episode draft. Translation rule: `social_signal` → `turn_outline`. The move/response pair must be realized as two adjacent (or near-adjacent) entries in `turn_outline`, each with an `accomplishes` field encoding the beat in natural language. The dynamic name itself never appears.

`dialog_writer`: receives no new fields. When two consecutive `accomplishes` entries describe a move and a response, preserve that beat structure exactly. These pairs are load-bearing and must not be merged, reordered, or softened.

`transcript_reviewer`: criterion 5 is split into 5a–5d:
- 5a. Facet signal landed (weakness).
- 5b. Cognitive signal landed. For each designed `cognitive_signal`, locate the line(s) where the behavioral trace is visible. Quote them. If inferable only from the facet weakness itself, flag ISSUE.
- 5c. Social signal landed. For each designed `social_signal`, locate the move turn and the response turn. Quote both. If only one half is present, flag ISSUE.
- 5d. Strength signal landed.

`evaluator`: in every annotation pass, populate `evidence_basis` with one sentence pointing to the specific behavior in `evidence_sentences` that supports the cognitive_pattern and social_dynamic assignments. If the evidence is consistent with more than one label, list alternatives in the (now list-typed) fields and explain the underdetermination in `evidence_basis`. The rule is uniform: every annotation has an `evidence_basis`, regardless of whether the facet was pre-targeted.

Hedging is a calibration tool, not a coverage workaround. The evaluator must hedge whenever evidence underdetermines, even if doing so causes a story-level coverage failure. Operators (and reviewers) must never push the evaluator to commit to a single label in order to satisfy coverage. The correct response to a coverage failure caused by persistent hedging is to revise the cast or arc so the evidence becomes unambiguous — not to recalibrate the evaluator. `analysis_reviewer` is responsible for catching evaluator commitments that the evidence does not justify.

`analysis_reviewer`: in criterion 1, verify that `evidence_basis` cites behavior that actually appears in `evidence_sentences` and actually supports the named pattern/dynamic, rather than restating the facet weakness.

4D. Validation script

`scripts/validate_schema.py` enforces three conditional rules at the episode level:

1. In `episode.yaml`: if `target_facets[i].designed_explanation.cognitive_pattern` is non-null, `cognitive_signal` is required and non-empty.
2. In `episode.yaml`: if `target_facets[i].designed_explanation.social_dynamic` is non-null, `social_signal` is required and non-empty.
3. In `analysis.yaml`: every `facet_annotations[i]` has a non-empty `evidence_basis`.

================================================================
PART 5.5 — INFORMATION BARRIER PROJECTION
================================================================

The information barrier is the load-bearing commitment that `dialog_writer` must never see facet IDs, lens names, cognitive patterns, or social dynamics. The barrier is enforced by (a) `dialog_writer` running in a fresh context window with no Read tool, and (b) the calling command passing only a stripped, barrier-safe projection inline.

The split

- `planning_agent` reads the full story design doc and the full per-episode draft. It needs all of it — character context, cast tendencies, arc, coverage, the draft's signals. It is allowed to see framework terminology because its job is to translate framework intent into barrier-safe instructions.
- `dialog_writer` never sees the story design doc or the per-episode draft. It receives only a projected slice — `episode_writer_input.yaml` — that `planning_agent` produces and `/create_transcript` passes inline. `dialog_writer`'s tool restrictions stay: fresh context, no Read tool, no file paths.
- `transcript_reviewer`, `evaluator`, `analysis_reviewer`, `transcript_id` all read the full `episode.yaml` and story context. They are post-generation reviewers; the barrier does not apply to them.

The `episode_writer_input.yaml` schema (`framework/schemas/episode_writer_input.yaml`)

The projected slice contains exactly these fields and nothing else:

- `story_premise` — 1–2 sentences setting the world (no facet/pattern/dynamic terminology).
- `episode_premise` — 1 paragraph, narrative only.
- `episode_number` — integer.
- `previously` — 1–2 sentences of narrative recap (no framework terms).
- `lead_characters[]` — `{name, voice, perspective, knowledge, weaknesses, strengths, prior_beats}`. `weaknesses` and `strengths` are barrier-safe character traits — what they get wrong or right, why, phrased as personality not as fallacies. Translated by `planning_agent` from cast prose and per-episode draft targets. No facet IDs, no pattern names, no dynamic names.
- `discussion_arc` — narrative description of how tension rises and resolves.
- `turn_outline[]` — `{speaker, accomplishes}`. The `accomplishes` field is the only carrier of the social signal into the writer: move/response beats are encoded as two adjacent entries in natural language.

Explicitly excluded: any `facet_id`, lens name, `cognitive_pattern`, or `social_dynamic` name; any `signal_mechanism`, `cognitive_signal`, or `social_signal` field; the story design doc or per-episode draft in any form; `target_facets` and `target_strengths` from `episode.yaml`.

The projection step

A responsibility of `planning_agent`: after producing `episode.yaml`, `planning_agent` also produces `episode_writer_input.yaml` at `artifacts/{story_id}/episodes/episode_{NN}/intermediates/episode_writer_input.yaml`. `/create_transcript` Step 2 reads this file and passes its contents inline to `dialog_writer`. `dialog_writer` never sees the path.

Two enforcement mechanisms, neither alone sufficient:

1. **Literal scan** (`scripts/validate_schema.py`, rule 4): scan `episode_writer_input.yaml` for any reserved framework term — facet IDs from `facet_inventory.yaml`, lens names used as classification, cognitive_pattern IDs, social_dynamic IDs. If any appears, fail the file. This catches accidental leakage.

2. **`projection_reviewer` agent**: reads both the full `episode.yaml` and the projected `episode_writer_input.yaml`, and checks every barrier-sensitive field — `previously`, `prior_beats`, `weaknesses`, `strengths`, `voice`, `discussion_arc`, every `accomplishes` entry — describes the *behavior or stakes* without naming or paraphrasing the underlying framework label. Rubric: "would a reader of only this projection be able to recover the framework label, or only the dramatic content?" The latter passes; the former fails. This catches paraphrased leakage that the regex can't see.

Both run on every projection.

================================================================
PART 6 — RE-PLANNING LOOP
================================================================

Episode-level reviewer failures bubble up to the story level when persistent:

1. `transcript_reviewer` flags an ISSUE on `cognitive_signal` or `social_signal` landing → `/create_transcript` re-invokes `dialog_writer` with the reviewer feedback (local fix, one retry).
2. If the same signal fails to land on a second attempt, the episode is marked as a structural problem. Re-run `validate_story.py`; the story-level audit will now show the affected pattern or dynamic as missing its unhedged-annotation requirement.
3. The operator then revises the per-episode draft's `cognitive_signal` / `social_signal` / carrier, OR revises the story design doc (if the drift is character-level), and re-runs from the affected episode forward. Because no episode is shipped until the entire story passes, cast and arc edits are free during authoring. Earlier episodes whose carriers depend on edited character descriptions must be re-validated (and re-generated if their `episode.yaml` is now inconsistent), but this is a within-authoring cost, not a live-content cost.

The story is not allowed to ship with a broken coverage contract. Never pressure the evaluator to commit harder to satisfy coverage. Persistent hedging is information about the design, not noise to be tuned away.

================================================================
PART 10 — STORY DESIGN AS CREATIVE WORK
================================================================

The validators enforce structural requirements (coverage contract, cast size bounds, mixed-valence rotation). Creative design has narrative requirements that schemas cannot capture.

What makes a Polylogue story excellent

- Stakes that 11–13 year olds will actually care about. Not abstract environmental harm. Something concrete, local, and personal.
- A premise specific enough to feel real but general enough to travel between schools. Use generic place names and constructed school cultures.
- Cast voices distinct enough that students can predict them. By episode 3, students should be able to attribute an unattributed line to the right character more often than chance.
- An arc with momentum. Each episode ends with a reason to want the next.
- At least one moment of genuine surprise per story — a character does something unexpected but in-character. Surprise without violation of character is what teaches students that flaws aren't traits.
- An ending that resists tidy resolution. Mixed-valence at the story level, not just the episode level.

The story design rubric (for `story_consistency_reviewer` and human authors)

1. Are the stakes concrete and personal to the cast?
2. Is the cast small enough (4–6 characters) and distinct enough (each with predictable voice and tendencies)?
3. Does the arc have momentum across episodes, not just within them?
4. Does the coverage contract close — can the cast actually carry every declared facet, pattern, and dynamic? (Validator-scorable.)
5. Is mixed-valence varied across episodes (not the same shape every time)? (Validator-scorable.)
6. Does the ending earn its lack of tidy resolution?
7. Does any character feel like an embodied fallacy? (If yes, redesign.)
8. Would a 6th grader want to know what happens in episode 4 after reading episode 3?
9. Is there at least one moment of genuine surprise — a character doing something unexpected but in-character? (Human-only; `story_consistency_reviewer` does not score this.)

A story that fails any of 1, 4, or 7 is not ready. The others are improvement targets. Items 4 and 5 are scored mechanically by `validate_story.py`; item 9 is explicitly excluded from agent review and must be checked by a human.

================================================================
PART 11 — SUGGESTED FIRST STORIES
================================================================

Three contrasting frames sketched here as starting points for the catalog.

Frame A — Saving the Maker Space (civic, internal stakes)

Premise: 6th graders form a club to save the school's maker space, which the principal has announced will be closed at the end of the term. The kids investigate why, build a case, present it, fail, regroup, and eventually win a partial reprieve.

Why it works: stakes concrete and local. Real disagreement about means (everyone wants to save it; they fight about how). An adversary who isn't a villain teaches students to evaluate adversaries' reasoning charitably. The partial-win ending models that good reasoning produces progress, not always victory.

Cast (sketch, 5 characters for a 5-episode pilot): Mira (passionate, cherry-picks evidence), Theo (cautious, sometimes strength carrier, sometimes paralyzed), Dev (charismatic editor, decisive but reasoning-shallow), Sam (quiet, finds her voice mid-arc — one of the two growth arcs), Ren (researcher with mixed source quality).

Shipped as the first pilot story (`saving-the-maker-space`, 5 episodes).

Frame B — The Beat (journalism, evaluating others' reasoning)

Premise: 6th graders run a small student newspaper or podcast. Each episode covers one story they are reporting: choosing what to investigate, evaluating sources, deciding what to publish, dealing with consequences.

Why it works: journalism is applied epistemics. Gets students out of "we are planning our own project" entirely; they evaluate sources, decisions, and arguments that aren't theirs.

Frame C — The Capsule (mystery, evaluating reasoning artifacts)

Premise: A 6th-grade class opens a 50-year-old time capsule containing real-feeling reasoning artifacts from 1975. Each episode the kids discuss one artifact. By the final episode the kids realize the artifacts are connected.

Why it works: the kids spend the entire story evaluating someone else's reasoning. The mystery layer provides serial momentum. Highest format variety of the three frames.

How to choose. Frame A maximizes emotional investment. Frame B maximizes framework coverage and lens balance. Frame C maximizes "evaluating someone else's reasoning" transfer and format variety.

================================================================
PART 13 — EPISODES-FIRST AUTHORING (authoritative model)
================================================================

This is the authoring model the pipeline implements. An earlier draft of this document put cast design at the story level (operator-authored `story.yaml` via a `/design_story` command) and per-episode signals at a separate episode level. That two-layer model had no machine-checked link between the layers — the cast-level `signal_template` and the episode-level `cognitive_signal` were two separate writing tasks that had to stay consistent by hand. The operator was being asked to write the cast in the abstract before knowing what the episodes would do with it, then to write the episodes against an abstraction they had already had to imagine concretely.

The episodes-first model collapses the two layers into one: episodes are authored in prose, with the per-target signals embedded as the operator's prompt for `/create_episode`, and the "cast" emerges as a property of the episode set. The story design doc (prose) is the source of truth for character identity; the episode drafts (prose with YAML frontmatter) are the source of truth for what happens. `story.yaml` as a separately-authored contract does not exist. The `signal_template` field, which existed to mediate between an authored cast and an authored episode, has nothing to mediate and is also not in the system.

13.1 — The authoring loop

Three artifacts the operator authors, in this order:

1. **Story design doc** at `framework/stories/{story_id}.md`. Prose. Contains: premise, setting, cast (one prose section per character — name, voice notes, tendencies described as personality, growth arcs as narrative beats, lens disposition as a description of how they reason), arc summary, stakes, pedagogical commitments. Plus YAML frontmatter at the top with the small amount of machine-readable story metadata: `story_id`, `title`, `coverage_mode`, `declared_facets`, `declared_cognitive_patterns`, `declared_social_dynamics`, `episode_count`.

2. **Per-episode drafts** at `framework/stories/{story_id}/episode_{NN}.md`, one per episode. Each draft has YAML frontmatter (the operator prompt for `/create_episode`: targets with carriers and signals, `lead_characters`, `primary_lens`, `mixed_valence_shape`, `premise`, `previously`) plus prose body (beats, authorial notes, why-these-targets). See Appendix B for the full template.

3. **Friction log** at `framework/stories/{story_id}-friction-log.md`. Captured during Phase 7 as the pipeline runs.

The story design doc is the load-bearing contract for character identity. The episode drafts are the load-bearing contract for what happens. `story_consistency_reviewer` reads both and checks they agree.

13.2 — Commands and artifact naming

- `/create_episode <story_id> <NN>` reads the per-episode draft and the story design doc, and invokes `planning_agent`.
- `framework/schemas/episode_plan.yaml` is the schema for `episode.yaml`.
- The on-disk artifact is `artifacts/{story_id}/episodes/episode_{NN}/episode.yaml` (plus `intermediates/episode_writer_input.yaml`, the barrier-safe projection — see Part 5.5).
- `story_consistency_reviewer` does prose-on-prose character and voice consistency checking across the story design doc and all episode drafts, plus rubric items 1–8 from Part 10. Item 9 (moment of surprise) is human-only. Invoked routinely, not just at story-design time.

13.3 — What survives from the original design

The per-episode pipeline downstream of `/create_episode` is unchanged in spirit. Specifically:

- `episode.yaml` schema with `cognitive_signal`, `social_signal`, `story_id`, `episode_number`.
- `episode_writer_input.yaml` schema and the projection barrier (Part 5.5). Two enforcement mechanisms (literal scan in `validate_schema.py`, `projection_reviewer` agent) still load-bearing.
- `analysis.yaml` with `evidence_basis` (required) and the hedged/confident widening (Part 4). Hedged annotations still do not satisfy story-level coverage; the fix is to revise the episode draft or the story design doc, never to pressure the evaluator.
- `evaluator`, `analysis_reviewer`, `transcript_reviewer`, `dialog_writer`, `projection_reviewer`, `validation_agent`, `transcript_id` — all unchanged in scope. `dialog_writer`'s information barrier is unchanged.
- `planning_agent` — produces `episode.yaml` and `episode_writer_input.yaml` with the same projection rules. Reads the story design doc (for character context and the "previously" recap) and the per-episode draft frontmatter (for the targets and signals).
- The Lens and Reasoning Lab downstream commands — gain story-context by reading the story design doc.
- The four conditional rules in `validate_schema.py` (three from Part 4D plus the literal-scan rule from Part 5.5).
- `validate_story.py` — walks the story design doc frontmatter plus all episode draft frontmatter and runs all the cross-episode checks from Part 3 except cast-tendency consistency (which has no meaning without a separate cast definition).

13.4 — How story-level coverage works

The declared coverage subset lives in the story design doc's YAML frontmatter:

    ---
    story_id: saving-the-maker-space
    title: Saving the Maker Space
    coverage_mode: focused
    declared_facets: [sufficiency, source_credibility, relevance, perspective_engagement]
    declared_cognitive_patterns: [false_certainty, confirmation_bias]
    declared_social_dynamics: [group_pressure]
    episode_count: 5
    ---

    (rest of the file is prose: premise, setting, cast, arc summary, stakes, pedagogical commitments)

`validate_story.py` walks this frontmatter plus all per-episode draft frontmatter. Coverage closure is computed as the union of (facet, pattern, dynamic) targets across all episode drafts. For focused stories, the validator checks the union covers the declared subset. For full stories, it checks the union covers the entire framework inventory. The focused-coverage floor (≥3 facets, ≥1 cognitive pattern, ≥1 social dynamic) still applies at story-design time.

The other cross-episode rules — lens distribution, mixed-valence rotation, strength rotation, weakness rotation — are computed across the per-episode draft frontmatter.

The hedged-annotation rule still requires post-pipeline `analysis.yaml` files (because hedging is determined by the evaluator at `/analyze_transcript` time, not by the operator at draft time). It runs as a separate later check, after Phase 7's episode runs have produced the analyses.

13.5 — Artifact storage

    framework/stories/{story_id}.md                      # Story design doc (authored)
    framework/stories/{story_id}/episode_{NN}.md         # Per-episode drafts (authored)
    framework/stories/{story_id}-friction-log.md         # Friction log (authored during Phase 7)
    framework/stories/validation/{story_id}-validation-report-{timestamp}.yaml  # validate_story.py sidecar audit (gitignored)

    artifacts/{story_id}/episodes/episode_{NN}/
      episode.yaml
      transcript.yaml
      analysis.yaml
      facilitation.yaml
      intermediates/
        episode_writer_input.yaml
      lens/
        scaffolding.yaml
        facilitation.yaml
        session.yaml
      reasoning-lab/
        scoring.yaml
        competition-facilitation.yaml
        session.yaml

13.6 — How character consistency works

Under this model, character consistency is a prose review property. The story design doc is the source of truth for who each character is and how they reason. The episode drafts are the source of truth for what each character does in each episode. `story_consistency_reviewer` reads both and checks they agree:

- Does each character's behavior across episodes match what the story design doc establishes?
- Are growth beats earned by what earlier episodes establish?
- Do voices stay distinct across episodes?
- Do rubric items 1–8 from Part 10 hold?

This is a real LLM judgment job. It is not replaced by a regex. `story_consistency_reviewer` is invoked routinely in Phase 6 — after each new episode draft is authored, and as a final pass before Phase 7 begins. It is also invoked in Phase 7 if a re-planning loop forces a draft revision, to check that the revision did not introduce drift.

There is no separate v2 agent for cross-episode character consistency; that is exactly the job `story_consistency_reviewer` does.

================================================================
APPENDIX B — PER-EPISODE DRAFT TEMPLATE
================================================================

The per-episode draft is the operator's authoring artifact for one episode of one story. It lives at `framework/stories/{story_id}/episode_{NN}.md` and is what `/create_episode` reads when invoked.

Each draft is a Markdown file with two parts: YAML frontmatter (the machine-readable operator prompt that `planning_agent` consumes) and a prose body (the human-readable beat sheet, authorial notes, and target rationale that `story_consistency_reviewer` reads).

B.1 — Frontmatter schema

Delimited by `---` on the first line and a matching `---` after the last field. All fields required unless noted.

    story_id: kebab-case identifier matching the story design doc
    episode_number: integer, matches the file's NN
    title: human-readable episode title
    premise: >
      One paragraph in narrative terms — the situation the characters find
      themselves in and what is at stake for them this episode. No framework
      vocabulary (no facet IDs, no lens names, no cognitive_pattern names,
      no social_dynamic names).
    lead_characters: [list of character names from the story design doc, 2–3 names]
    primary_lens: logic | evidence | scope
    mixed_valence_shape: early_strength_collapse | strength_prevails | stalemate | self_correction | unresolved_disagreement

    previously: >
      One or two sentences naming what happened earlier in the story that
      this episode references. Narrative recap, no framework terms. Empty
      string ("") for episode 1.

    targets:
      # Each target is a (facet, carrier, cognitive_pattern, social_dynamic, signals) bundle.
      # planning_agent consumes this list directly as the per-target operator prompt for /create_episode.
      - facet: facet_id
        lens: logic | evidence | scope
        carrier: character name (must be in lead_characters and named in the story design doc)
        cognitive_pattern: cognitive_pattern_id   # may be null if no cognitive pattern target this turn
        social_dynamic: social_dynamic_id         # may be null if no social dynamic target this turn
        cognitive_signal: >
          Required iff cognitive_pattern is non-null. One concrete sentence
          describing the behavioral trace of the cognitive pattern in this
          episode's dialog. Stage direction, not analysis. Must be a faithful
          instantiation of how this character reasons (per the story design doc),
          not a contradiction of their established voice.
        social_signal: >
          Required iff social_dynamic is non-null. One sentence describing the
          move/response turn-pair shape that realizes the social dynamic. Must
          reference at least two turns (the move and the response).
        interaction_note: >
          Optional. Anything else planning_agent needs to know about how this
          target plays in this episode — interactions between the cognitive and
          social signals, how the target relates to other targets in the same
          episode, how the carrier's involvement compares to their default voice.

    strengths:
      # Same shape as targets but lighter; no signals required (strengths are the
      # carrier reasoning *well*, not exhibiting a pattern).
      - facet: facet_id
        carrier: character name
        note: >
          Optional. How the strength shows up in this episode and why this
          carrier holds it now (rotation context).

    beats:
      # The episode's dramatic shape, in operator language. Read by
      # story_consistency_reviewer to check character consistency against the
      # story design doc. NOT consumed by planning_agent; the targets list above
      # carries the engineering. The beats are for human review and authorial
      # discipline.
      - "One sentence per beat. Five to eight beats per episode is typical."

B.2 — Prose body sections

Below the closing `---`, the file contains free-form Markdown sections. Two are conventional:

    ## Authorial notes

    Free prose. What this episode is for in the arc. What you want students to
    notice. What you considered and rejected. Cliffhangers, callbacks, anything
    future-you needs to remember when revising.

    ## Why these targets

    Optional but strongly recommended. One paragraph per target (and per
    strength) explaining why this facet/pattern/dynamic landed on this carrier
    in this episode. story_consistency_reviewer reads this to check that the
    targets aren't arbitrary — they should follow from the story design doc's
    character descriptions and the arc.

Operators may add other sections as needed. `story_consistency_reviewer` reads the whole prose body; `planning_agent` reads only the frontmatter.

B.3 — What the frontmatter must satisfy

Rules `planning_agent` and `validate_story.py` enforce:

1. Schema-level: every field above is present and well-typed; `cognitive_signal` is non-empty iff `cognitive_pattern` is non-null; `social_signal` is non-empty iff `social_dynamic` is non-null. Enforced by `validate_schema.py`.
2. Reference integrity: every facet, lens, cognitive_pattern, and social_dynamic ID resolves to an entry in `framework/reference/`. Enforced by `validate_schema.py`.
3. Carrier-in-cast: every carrier named in targets and strengths is named in `lead_characters` AND is described in the story design doc's cast section. Enforced by `story_consistency_reviewer` (prose check).
4. Cross-episode rules (lens distribution, mixed-valence rotation, strength rotation, weakness rotation, coverage closure): computed across all episode drafts by `validate_story.py`.
5. Character behavior consistent with the story design doc: prose-on-prose check by `story_consistency_reviewer`.

B.4 — Relationship to /create_episode

When the operator runs `/create_episode {story_id} {episode_number}`, the command:

1. Locates `framework/stories/{story_id}/episode_{NN}.md`.
2. Locates `framework/stories/{story_id}.md` (the story design doc).
3. Parses the episode draft frontmatter and the story design doc frontmatter.
4. Hands both to `planning_agent` inline.
5. `planning_agent` reads the prose body of the story design doc (for character context), the targets and signals from the episode draft frontmatter (as the operator prompt), and the `previously` field (for the narrative recap that flows into `episode_writer_input.yaml`).
6. `planning_agent` produces `episode.yaml` at the standard artifact path AND `episode_writer_input.yaml` under `intermediates/`.
7. The information barrier projection (Part 5.5) is unchanged: `episode_writer_input.yaml` contains zero framework terminology, is checked by the literal-scan rule in `validate_schema.py`, and is reviewed by `projection_reviewer` before `/create_transcript` Step 2 reads it.

The episode draft IS the operator prompt, authored ahead of time and committed to the repo as a versionable artifact.
