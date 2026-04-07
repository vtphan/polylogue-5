STORY PIPELINE REVISION — UNIFIED PLAN

Status: Phases 1–4 implemented (2026-04-06). Phase 5 onward redesigned per Part 13 (episodes-first authoring) and pending implementation. No legacy support — this is a clean break from the current scenario-sequence model.

This document supersedes evidence-grounding-plan.md. The evidence-grounding work is fully incorporated here as one half of the revision; the other half is the move from disposable per-scenario personas to multi-episode stories with predefined recurring AI characters.

READING ORDER FOR PHASE 5+ IMPLEMENTERS: read Part 13 first. Part 13 documents a model change adopted after Phases 1–4 shipped that supersedes parts of Parts 5, 5.5, 6, 8, and 8.5 — specifically, anything describing /design_story as a drafting command, story.yaml as an operator-authored contract, story_planner as a drafting agent, or signal_template / active_from_episode / active_through_episode as schema fields. The cross-episode coverage rules, the projection barrier, the evidence-grounding work in Part 4, and the per-episode pipeline downstream of /create_episode all survive unchanged. Appendix B specifies the per-episode draft template that replaces story.yaml as the operator's authoring artifact.

================================================================
PART 1 — WHY: THE TWO RATIONALES
================================================================

1A. Why evidence grounding for explanatory variables

The framework rests on three layers: lenses (3) → facets (10 structural dimensions of reasoning quality) → explanatory variables (8 cognitive patterns + 3 social dynamics) that explain why reasoning goes wrong. For this to be honest, every cognitive pattern or social dynamic the system claims must be visible in the transcript itself — not projected onto it.

A devil's-advocate review of the current pipeline found that this grounding is only partial:

- Facet weaknesses are required to be evidenced (the evaluator must cite evidence_sentences, the analysis_reviewer reads them back, and the transcript_reviewer checks the weakness is detectable). Strengths are similarly enforced.
- The cognitive pattern and social dynamic in target_facets[].designed_explanation have no equivalent enforcement. Nothing in the pipeline checks that the named pattern or dynamic actually left a behavioral trace in the dialog.
- Social dynamics structurally require a turn-pair (a move and a response) to be visible at all. The planning agent is not required to engineer such a pair into the turn outline.
- Even when evidence is present, the evaluator commits to a single label where textual evidence often supports several. This makes the analysis sound more diagnostic than the transcript justifies.

The fix is to make explanatory variables earn their place the same way facet weaknesses and strengths already do: pre-committed by the operator with a behavioral signal description, translated into the turn outline by the planning agent, preserved by the dialog writer, verified by the transcript reviewer, and grounded with an explicit evidence_basis field by the evaluator.

1B. Why stories with recurring casts

The current scenario-sequence model has each scenario invent fresh personas tuned to that scenario's target facets. Personas are disposable. Five strategic problems follow:

- Same persona arc in every scenario (assertive-but-shaky vs pragmatic-but-yields, with the cautious one capitulating). Students start predicting the arc by scenario 3.
- Strength carriers cluster on the "loser" persona; the only mixed-valence shape is "early strength → collapse."
- Lens distribution skews — Scope is primary in 4 of 5 scenarios, Logic in 1.
- PBL context is identical across all scenarios; four of five have students planning their own project.
- Topics are consensus-safe, so perspective engagement is taught on manufactured rather than genuine disagreement.

The deeper issue is that disposable personas can't carry growth, can't carry consequences across episodes, and can't become legible to students as recognizable people. Recurring characters with engineered tendencies fix all five problems at once and turn "we teach 10 facets across 5 scenarios" into "we teach critical thinking through an 8-episode story about kids trying to save their school's maker space" — a project description that actually excites teachers and students.

The two revisions are complementary. Evidence grounding makes the framework honest at the artifact level. Stories make the framework engaging at the experience level. Neither is sufficient on its own.

================================================================
PART 2 — STRATEGIC FRAME: STORIES, EPISODES, CASTS
================================================================

Terminology

- Story — a self-contained multi-episode narrative with a fixed cast, an arc, and a declared coverage contract. Replaces the current scenario-sequence concept. Authored as story.yaml.
- Episode — one discussion within a story. Schema-internally still called a scenario (scenario.yaml is unchanged as a filename). Human-facing language is "episode N of story X."
- Cast — the recurring characters defined at the story level. Each character has stable tendencies (cognitive patterns, social dynamic contributions, lens disposition) and an optional growth arc.
- Session — one classroom sitting on one episode. Unchanged.

Design inversion

The current order is: pick facets → invent personas → write dialog. The story order is: design the cast (with stable tendencies and growth potential) → plan which episodes surface which tendencies → check that the cast collectively covers the framework → write each episode's dialog within those constraints.

This inversion is what makes "interesting stories" and "framework coverage" compatible instead of in tension. The cast is what makes the stories interesting; the cast's engineered distribution of weaknesses and strengths is what guarantees coverage.

Cast design rules

1. Collectively the cast must carry the coverage declared in story.yaml — not in every episode, but somewhere in the season.
2. No character is an embodied fallacy. Each character carries 2–3 cognitive tendencies and contributes to 1 social dynamic. Tendencies surface or don't depending on the situation.
3. Each character has at least one stable strength they reliably bring.
4. At most 2 characters in the cast have visible growth arcs across the story. Constancy is realistic and gives students stable reference points.
5. The cast collectively models the three lens dispositions (Logic-leaning, Evidence-leaning, Scope-leaning), without ever naming the lenses.
6. Cast size is bounded: 4–6 characters total, 2–3 per episode. If a character can be removed without breaking the coverage_check, remove them.

Strength-carrier rotation

In the current system, strength tends to live with the "loser" persona. In the story system, strength carriers rotate explicitly across episodes. Track which character carried the strength in each episode; the validator flags if one character carries more than half the strengths in a story.

================================================================
PART 3 — COVERAGE CONTRACT
================================================================

Each story declares its coverage in story.yaml. Two coverage modes:

- Full coverage: the story commits to covering all 10 facets, all 8 cognitive patterns, and all 3 social dynamics across its episodes. The validator fails the story if any inventory entry is uncovered. This is the default ambition for stories of 6+ episodes.
- Focused coverage: the story declares a subset and the validator only checks the declared subset. This is for shorter mini-stories used in compact units. Focused coverage has a hard floor: a focused story must cover at least 3 facets, at least 1 cognitive pattern, and at least 1 social dynamic, otherwise the mode becomes an escape hatch and the framework promise erodes.

A coverage contract entry for each item names which character carries it and in which episode. The validator checks that:

- Every declared facet has at least one episode where it appears as a target_facet (weakness) and at least one episode where it appears as a target_strength.
- Every declared cognitive pattern is carried by at least one character in at least one episode, with the cognitive_signal field non-empty (see Part 4) AND with at least one unhedged single-label annotation in that episode's analysis.yaml. Hedged (multi-label) annotations do not satisfy coverage — only confidently single-labeled ones do. This creates the right incentive: the evaluator commits when the evidence justifies a single label, hedges when it doesn't, and the operator is responsible for ensuring at least one episode in the story produces an unhedged annotation for each declared pattern.
- Every declared social dynamic is carried by at least one character in at least one episode, with the social_signal field non-empty AND with at least one unhedged annotation, on the same rule.
- Cast-tendency consistency: for every episode, every target_facets[i].carrier_persona must have the corresponding cognitive pattern and social dynamic in their episode-active tendencies (see Part 5 on episode-indexed tendencies). An episode may not assign a target to a carrier whose cast definition does not include that tendency in the active set for that episode. This is the load-bearing check that prevents the cast from becoming decorative.
- Lens distribution: across the full arc, each lens (logic, evidence, scope) must appear as a primary lens in at least one episode AND no single lens may be primary in more than half the episodes (rounded down). This replaces an earlier "≥25% per lens" rule that was unsatisfiable for short focused stories. The framework's perspectival learning model breaks if one lens is starved across an entire story or if one dominates; this rule prevents the Scope-dominance regression seen in the legacy 5-scenario sequence while remaining feasible for 3-episode focused stories.
- Mixed-valence shape rotation: across the full arc, no single mixed_valence_shape value (see Part 5) may appear in more than half of the episodes. There is no "each shape must appear" requirement — the five shapes are a menu, not a checklist. (An earlier draft required every shape to appear in stories of 5+ episodes; this conflicted with the "no shape >half" rule for the recommended 5-episode pilot and forced unnatural variety.)
- Strength rotation: no single character carries more than half of the story's strengths. Validator-computed from the arc — not operator-declared.
- Weakness rotation: no single character carries more than half of the story's weaknesses. Validator-computed from the arc — not operator-declared.

The coverage contract is the load-bearing piece that ties the story-level redesign to the framework's existing inventory. Without it, stories become narrative artifacts with vague pedagogical claims. With it, stories are auditable curriculum.

================================================================
PART 4 — EVIDENCE GROUNDING (incorporated from evidence-grounding-plan.md)
================================================================

Three gaps to close, unchanged from the original plan:

- Gap 1 — Cognitive pattern and social dynamic have no required textual grounding.
- Gap 2 — Social dynamics need turn-pairs but nothing enforces it.
- Gap 3 — Single-label over-claim where evidence underdetermines.

4A. Operator prompt — episode-level

Per target facet in an episode, in addition to existing fields (facet ID, lens, cognitive pattern, social dynamic, carrier, signal_mechanism), require two new sub-fields:

- cognitive_signal — one sentence describing the behavioral trace of the cognitive pattern in the dialog. Required iff cognitive_pattern is non-null.
- social_signal — one sentence describing the move/response turn-pair shape that realizes the social dynamic. Must reference at least two turns. Required iff social_dynamic is non-null.

These propagate from the operator prompt into target_facets[].designed_explanation in scenario.yaml.

4B. Schema additions

scenario.yaml — in target_facets[].designed_explanation, add cognitive_signal and social_signal fields parallel to interaction_note. (Scenario schema is otherwise unchanged from the current schema; the rename to story-aware happens at the story.yaml level, not here.)

analysis.yaml — in facet_annotations[].explanatory_variables:
- Widen cognitive_pattern and social_dynamic to allow either a string (single-label, "confident") or a list of strings (multi-label, "hedged"). Hedged annotations are honest but do not satisfy story-level coverage (see Part 3); the operator must ensure each declared pattern/dynamic has at least one unhedged annotation across the story.
- Add a new required sibling to evidence_sentences:

  evidence_basis:
    type: string
    required: true
    description: >
      One sentence pointing to the specific behavioral evidence in
      evidence_sentences that supports the cognitive_pattern and
      social_dynamic assignments. If the evidence is consistent with
      multiple labels, name the alternatives here rather than committing
      to a single one.

dialog_writer_input.yaml — no change. The information barrier holds.

4C. Agent changes

planning_agent: extends designed_explanation handling to include cognitive_signal and social_signal copied verbatim from the operator prompt. Adds a new translation rule: social_signal → turn_outline. The move/response pair must be realized as two adjacent (or near-adjacent) entries in turn_outline, each with an accomplishes field encoding the beat in natural language. The dynamic name itself never appears.

dialog_writer: receives no new fields. One addition to "Following the Turn Outline":
> When two consecutive accomplishes entries describe a move and a response, preserve that beat structure exactly. These pairs are load-bearing and must not be merged, reordered, or softened.

transcript_reviewer: split criterion 5 into 5a–5d:
- 5a. Facet signal landed (existing weakness check).
- 5b. Cognitive signal landed. For each designed cognitive_signal, locate the line(s) where the behavioral trace is visible. Quote them. If the cognitive pattern is inferable only from the facet weakness itself, flag as ISSUE.
- 5c. Social signal landed. For each designed social_signal, locate the move turn and the response turn. Quote both. If only one half is present, flag as ISSUE.
- 5d. Strength signal landed (existing strength check).

evaluator: in pass 1 (Targeted weaknesses), populate evidence_basis with one sentence pointing to the specific behavior that supports the cognitive_pattern and social_dynamic assignments. If the evidence is consistent with more than one label, list alternatives in the (now list-typed) fields and explain the underdetermination in evidence_basis. In pass 2 (non-targeted facets the evaluator surfaces opportunistically), evidence_basis is still required: it cites the line(s) that prompted the evaluator to surface the facet at all. The rule is uniform — every annotation has an evidence_basis, regardless of whether the facet was pre-targeted.

Hedging is a calibration tool, not a coverage workaround. The evaluator must hedge whenever evidence underdetermines, even if doing so causes a story-level coverage failure. Operators (and reviewers) must never push the evaluator to commit to a single label in order to satisfy coverage. The correct response to a coverage failure caused by persistent hedging is to revise the cast or arc so the evidence becomes unambiguous — not to recalibrate the evaluator. analysis_reviewer is responsible for catching evaluator commitments that the evidence does not justify.

analysis_reviewer: in criterion 1, verify that evidence_basis cites behavior that actually appears in evidence_sentences and actually supports the named pattern/dynamic, rather than restating the facet weakness.

4D. Validation script

scripts/validate_schema.py enforces three new conditional rules at the episode level:
1. In scenario.yaml: if target_facets[i].designed_explanation.cognitive_pattern is non-null, cognitive_signal is required and non-empty.
2. In scenario.yaml: if target_facets[i].designed_explanation.social_dynamic is non-null, social_signal is required and non-empty.
3. In analysis.yaml: every facet_annotations[i] has a non-empty evidence_basis.

================================================================
PART 5 — NEW SCHEMA: story.yaml
================================================================

framework/schemas/story.yaml (new file)

Top-level structure:

  story_id: kebab-case identifier
  title: human-readable
  premise: 2-3 sentences setting up stakes and frame
  setting: where and when the story takes place
  episode_count: integer
  coverage_mode: "full" or "focused"

  cast:
    list of characters, each:
      - name: string
        voice: short style notes for the dialog writer (informal,
                tone, verbal habits) — barrier-safe
        lens_disposition: "logic" | "evidence" | "scope" | "balanced"
                          (used for planning, never named in dialog)
        tendencies:
          # Each tendency is episode-indexed via active_through_episode,
          # which resolves the growth-arc / stable-tendency tension. A
          # tendency with active_through_episode: null is active for the
          # entire story; one with a value is active only through that
          # episode (inclusive). Post-inflection tendencies use
          # active_from_episode instead.
          cognitive:
            - pattern: cognitive_pattern_id
              active_from_episode: integer (default 1)
              active_through_episode: integer or null (default null)
              signal_template: >
                One sentence describing the *kind* of behavioral trace
                this tendency produces in dialog when it surfaces — a
                template the episode-level cognitive_signal must be a
                concrete instantiation of. Example: "Mira's confirmation_bias
                surfaces as repeated reference to a single emotional source
                she encountered recently." Used by validate_story.py to
                check that episode-level cognitive_signal entries are
                consistent with the cast template.
          social:
            - dynamic: social_dynamic_id
              active_from_episode: integer (default 1)
              active_through_episode: integer or null
              signal_template: >
                One sentence describing the *kind* of move/response
                turn-pair this character contributes to. Used the same way
                as cognitive signal_template.
        strengths:
          facets:
            - facet: facet_id
              active_from_episode: integer (default 1)
              active_through_episode: integer or null
        growth_arc:
          present: boolean (at most 2 characters in the cast have present: true)
          from: short description of starting tendency
          to: short description of ending tendency
          inflection_episode: episode where the change becomes visible
          # Tendencies that change must use active_through_episode and
          # active_from_episode in the cognitive/social/strengths lists
          # above to express the change concretely. The growth_arc block
          # is the human-readable narrative; the per-tendency episode
          # ranges are the machine-readable contract the validator uses.

  arc:
    list of episodes, each:
      - episode_number: integer
        title: human-readable
        premise: one paragraph — what happens
        lead_characters: list of cast names (2–3)
        target_facets: list of facet IDs (weaknesses), with carrier_persona
        target_strengths: list of facet IDs, with carrier_persona
        cognitive_patterns: list of patterns this episode surfaces
        social_dynamics: list of dynamics this episode surfaces
        primary_lens: "logic" | "evidence" | "scope"
                      (used for lens-distribution validation in Part 3)
        growth_beat: optional reference to a character's growth_arc
                     inflection if this episode hits it
        mixed_valence_shape: one of:
          "early_strength_collapse" | "strength_prevails" |
          "stalemate" | "self_correction" | "unresolved_disagreement"

  coverage_contract:
    # The operator authors only the three `declared_*` lists below, plus
    # `coverage_mode` at the top of story.yaml. validate_story.py reads
    # this and writes its computed audit to a SIDECAR file
    # `validation_report.yaml` in the story root — never back into
    # story.yaml itself. This avoids the round-trip / diff-noise problem
    # of having a tool rewrite an operator-authored file.
    declared_facets: [list of facet_ids covered by this story]
    declared_cognitive_patterns: [list of cognitive_pattern_ids]
    declared_social_dynamics: [list of social_dynamic_ids]

  # validation_report.yaml (sidecar, written by validate_story.py)
  # ──────────────────────────────────────────────────────────────
  # Lives at artifacts/{story_id}/validation_report.yaml. Schema:
    audit:
      facets:
        <facet_id>: { weakness_episodes: [...], strength_episodes: [...] }
      cognitive_patterns:
        <pattern_id>: { episodes: [...], carriers: [...] }
      social_dynamics:
        <dynamic_id>: { episodes: [...], carriers: [...] }
      lens_distribution:
        logic: integer (count of episodes with primary_lens: logic)
        evidence: integer
        scope: integer
      shape_distribution:
        <shape_name>: integer
      strengths_per_character:
        <character_name>: integer
      weaknesses_per_character:
        <character_name>: integer

The audit lives in the sidecar `validation_report.yaml`, not in story.yaml. The operator declares intent (coverage_mode and, for focused stories, the declared subset). validate_story.py walks the arc, audits the actual carriers per episode, and writes the audit block. The validator fails the story if any check from Part 3 is violated.

================================================================
PART 5.5 — INFORMATION BARRIER PROJECTION
================================================================

This is the load-bearing addition that the review identified as the highest-risk omission. story.yaml contains everything: cast, lens dispositions, cognitive tendencies, social dynamic contributions, signal templates, the coverage contract. None of this can reach the dialog_writer. The barrier in the current pipeline is enforced by (a) the dialog_writer running in a fresh context window with no Read tool, and (b) the calling command passing only a stripped, barrier-safe input inline. The new pipeline must preserve both mechanisms and make the projection explicit.

The split

- planning_agent reads the full story.yaml. It needs all of it: cast tendencies (episode-active), arc, coverage_contract, signal templates, growth arcs. It is allowed to see framework terminology because its job is to translate framework intent into barrier-safe instructions.

- dialog_writer never sees story.yaml. It receives only a projected slice — a new artifact called episode_writer_input.yaml — that the planning_agent produces and the calling command (/create_transcript Step 2) passes inline. dialog_writer's tool restrictions stay as today: fresh context, no Read tool, no file paths to story.yaml or scenario.yaml.

- transcript_reviewer, evaluator, analysis_reviewer all read the full story.yaml and the full scenario.yaml. They are post-generation reviewers; the barrier does not apply to them. They need framework terminology to do their job.

The episode_writer_input.yaml schema (new file: framework/schemas/episode_writer_input.yaml)

The projected slice contains exactly these fields and nothing else:

  story_premise: 1-2 sentences setting the world (no facet/pattern/dynamic terminology)
  episode_premise: 1 paragraph — what happens this episode (narrative only)
  episode_number: integer (so the writer knows where in the story this falls)
  previously: 1-2 sentences summarizing what students saw in earlier episodes
              that this episode references (narrative recap, no framework terms)
  lead_characters:
    - name: string
      voice: barrier-safe style notes (informal, tone, verbal habits)
      perspective: what they believe and want in this episode (narrative)
      knowledge: what they've researched or experienced (narrative)
      weaknesses: barrier-safe character traits — what they get wrong, why,
                  phrased as personality not as fallacies. Translated by
                  planning_agent from cast tendencies and episode targets.
                  No facet IDs, no pattern names, no dynamic names.
      strengths: barrier-safe character traits — what they get right, why,
                 same translation rule.
      prior_beats: 1-2 sentences naming what this character has done in
                   prior episodes that affects how they sound now (narrative
                   continuity only). Empty for episode 1.
  discussion_arc: narrative description of how tension rises and resolves
                  (no framework terms)
  turn_outline:
    - speaker: persona name
      accomplishes: what this turn does for the story, in natural language
                    (no framework terms — the move/response beats encoded
                    here are the only carrier of the social signal into
                    the writer)

What is explicitly excluded from episode_writer_input.yaml:
- Any facet_id, lens name, cognitive_pattern, or social_dynamic name
- Any signal_mechanism, cognitive_signal, or social_signal field (these stay
  in scenario.yaml and are read by the reviewers)
- The story.yaml file itself, in any form
- The cast section's tendencies, signal_templates, growth_arc, lens_disposition
- The coverage_contract section
- target_facets and target_strengths from scenario.yaml

The projection step

A new responsibility added to planning_agent: after producing scenario.yaml, planning_agent also produces episode_writer_input.yaml at artifacts/{story_id}/episodes/episode_{NN}/intermediates/episode_writer_input.yaml. /create_transcript Step 2 reads this file and passes its contents inline to dialog_writer. dialog_writer never sees the path; the calling command opens the file and embeds the YAML in the prompt.

A schema validation rule (new) in scripts/validate_schema.py:

  4. In episode_writer_input.yaml: scan the entire file for any of the
     framework's reserved terms — facet IDs from facet_inventory.yaml,
     lens names (logic, evidence, scope) used as classification rather
     than narrative, cognitive_pattern IDs from explanatory_variables.yaml,
     social_dynamic IDs. If any reserved term appears, fail the file.
     This is a literal scan; it catches accidental leakage that the
     planning_agent might otherwise let through.

This rule is the structural enforcement of the barrier at the file level, in addition to the fresh-context + tool-restriction enforcement at the runtime level. Two mechanisms, neither alone sufficient, both together load-bearing.

Projection narrative-leakage review

The literal-scan catches reserved terms but does not catch *paraphrased* leakage — for example, a `previously` field that says "Mira kept citing the same source she liked" (a confirmation_bias gloss in plain English) or a `voice` note that says "talks past people" (a perspective_engagement gloss). These pass the regex but tell the dialog_writer the answer in different words.

A new agent, projection_reviewer, runs after planning_agent produces episode_writer_input.yaml and before /create_transcript Step 2 reads it. projection_reviewer reads BOTH the full story.yaml/scenario.yaml AND the projected episode_writer_input.yaml, and checks that each barrier-sensitive field — `previously`, `prior_beats`, `weaknesses`, `strengths`, `voice`, `discussion_arc`, and every `accomplishes` entry — describes the *behavior or stakes* without naming or paraphrasing the underlying framework label. If any field is a thinly-disguised restatement of a cognitive_pattern, social_dynamic, or facet name, projection_reviewer flags it as ISSUE and planning_agent must rewrite the field. The rubric is: "would a reader of only this projection be able to recover the framework label, or only the dramatic content?" The latter passes; the former fails.

This is the human-judgment counterpart to the literal-scan. Both run on every projection.

Cast-template ↔ episode-signal consistency

When planning_agent translates an episode's target into the persona weaknesses and the turn_outline accomplishes, it must also verify that the episode-level cognitive_signal is a concrete instantiation of the cast-level signal_template for that character (when present). If the operator-authored episode signal contradicts the cast template, planning_agent flags this as an authoring error and returns a validation failure rather than silently producing an inconsistent scenario.yaml. The same rule applies to social_signal vs cast social signal_template.

This is the answer to review concern #8 (signal_mechanism ownership). Templates live at the cast level; concrete instantiations live at the episode level; the validator checks consistency at scenario.yaml creation time.

================================================================
PART 6 — UPDATED PIPELINE FLOW
================================================================

New command flow:

  /design_story  →  /create_scenario  →  /create_transcript  →
  /analyze_transcript  →  /design_scaffolding  →  /configure_session

/design_story is the new upstream command, run once per story before any episode is created. It produces story.yaml with cast, arc, and the declared coverage subset. Operators interactively brainstorm with Claude; the story_reviewer agent then performs a per-episode dry run of target assignment (see expanded scope in Part 8) to verify that every episode's declared targets can actually be carried by the lead characters' episode-active tendencies. If any episode fails the dry run, the story is sent back for revision before being frozen.

/create_scenario is modified to accept story_id and episode_number. It reads story.yaml for cast, arc context, and the episode's slot in the coverage contract. The operator's per-episode prompt becomes much shorter — most of the framework targets are derived from story.yaml; the operator adds the episode-specific signal_mechanism, cognitive_signal, and social_signal narrative for the targets the story slot pre-assigns. The episode-level signals must be concrete instantiations of the cast-level signal templates (Part 5.5); planning_agent enforces this consistency.

Information barrier — agent-by-agent

- planning_agent reads the full story.yaml and the full scenario.yaml. Allowed framework terminology.
- story_planner / story_reviewer (the /design_story agents) read story.yaml and reference data. Allowed framework terminology.
- dialog_writer reads only episode_writer_input.yaml, passed inline. Fresh context, no Read tool, no file paths to story.yaml. Never sees framework terminology. (See Part 5.5 for the projection schema and the literal-scan validation rule.)
- transcript_reviewer, evaluator, analysis_reviewer read story.yaml and scenario.yaml. Allowed framework terminology — they are post-generation reviewers.
- continuity_reviewer (deferred to v2 — not Phase 1 of this revision; see Phase 5e) eventually reads story.yaml and the analysis.yaml of every prior episode in the story.

Re-planning loop for failed coverage

Episode-level reviewer failures bubble up to the story level when persistent:

1. transcript_reviewer flags an ISSUE on cognitive_signal or social_signal landing → planning_agent re-invokes dialog_writer with the reviewer feedback (the existing local fix loop).
2. If the same signal fails to land on a second attempt, the episode is marked as a structural problem and validate_story.py is re-run. The story-level audit will now show the affected pattern or dynamic as missing its unhedged-annotation requirement.
3. The operator then revises the cast tendencies, the arc, or the failing episode's plan and re-runs from the affected episode forward. Because no episode is "shipped" until the entire story passes validation, cast and arc edits are free during authoring — there are no live artifacts to invalidate. Earlier episodes whose carriers depend on edited tendencies must be re-validated (and re-generated if their scenario.yaml is now inconsistent), but this is a within-authoring cost, not a live-content cost.

The story is not allowed to "ship" — i.e., be marked complete and consumed by classroom sessions — with a broken coverage contract. This three-step escalation is a runbook the operator follows, supported by the validator's clear failure messages.

Reasoning Lab — also a clean break

Reasoning Lab migrates to the story model in v1 alongside Lens. The earlier draft of this document scoped Reasoning Lab out of v1; that decision is reversed because (a) the shared upstream (`/create_scenario`, `/create_transcript`, `/analyze_transcript`) is being modified for stories anyway, so a fork would create exactly the legacy-vs-new dual-system burden this revision is trying to eliminate, and (b) Reasoning Lab's competitive scoring benefits from recurring cast at least as much as Lens does — students scoring rare findings against a familiar cast is more legible than against disposable personas.

Reasoning Lab's downstream commands (`/design_scoring_rubric`, `/configure_competition`) gain access to story.yaml as additional context, the same way Lens's `/design_scaffolding` and `/configure_session` do. The Reasoning Lab–specific schemas (scoring, competition_facilitation, session) are unchanged structurally; they gain `story_id` and `episode_number` for traceability, mirroring scenario.yaml. Reasoning Lab files appear in the modified-files list in Part 8.

The legacy `registry/` directory remains frozen as historical reference for both applications. No artifact equivalence is required between the legacy system and the new story-based system, for either Lens or Reasoning Lab.

The downstream commands (/create_transcript, /analyze_transcript, /design_scaffolding, /configure_session) are unchanged in name and flow. They gain access to story.yaml as additional context for planning_agent and the reviewers, but the dialog_writer's input continues to be passed inline through episode_writer_input.yaml as specified in Part 5.5.

================================================================
PART 7 — DIRECTORY LAYOUT
================================================================

  artifacts/
    {story_id}/
      story.yaml
      episodes/
        episode_01/
          scenario.yaml
          transcript.yaml
          analysis.yaml
          facilitation.yaml
          intermediates/
            episode_writer_input.yaml   (barrier-safe projection from story.yaml +
                                         scenario.yaml; consumed by dialog_writer)
          lens/
            scaffolding.yaml
            facilitation.yaml
            session.yaml
        episode_02/
          ...

A "story root" holds story.yaml plus an episodes/ directory. Each episode subdirectory contains exactly the artifacts the current pipeline produces, plus episode_writer_input.yaml under intermediates/ as the only thing dialog_writer ever sees from the story layer. No schema migration needed below the episode level.

================================================================
PART 8 — AGENT AND COMMAND CHANGES SUMMARY
================================================================

New files

- framework/schemas/story.yaml (schema — Part 5, with episode-indexed tendencies and cast-level signal templates)
- framework/schemas/episode_writer_input.yaml (schema — Part 5.5, the barrier-safe projection)
- framework/pipeline/commands/design_story.md (command — see spec below)
- framework/pipeline/agents/story_planner.md (agent — drafts story.yaml from operator brief; see spec below)
- framework/pipeline/agents/story_reviewer.md (agent — performs per-episode dry run of target assignment against episode-active cast tendencies; checks the eight rubric items in Part 10; flags rubric item 9 ("moment of surprise") as human-only and does not score it)
- framework/pipeline/agents/projection_reviewer.md (agent — reads full story.yaml/scenario.yaml plus the projected episode_writer_input.yaml; flags paraphrased framework-label leakage in barrier-sensitive narrative fields per Part 5.5)
- framework/pipeline/scripts/validate_story.py (validator — implements all coverage_contract checks from Part 3, including cast-tendency consistency, lens distribution, mixed_valence_shape rotation, hedged-annotation rule, and strength/weakness rotation; writes its audit output to a sidecar file `validation_report.yaml` in the story root, never modifying the operator-authored story.yaml)

Modified files

- framework/schemas/scenario.yaml — add cognitive_signal and social_signal in target_facets[].designed_explanation; add top-level story_id and episode_number fields for traceability. Both new top-level fields are REQUIRED — there is no non-story scenario.yaml in the new system. (The clean-break framing in CLAUDE.md means no legacy scenario.yaml needs to validate against this schema; legacy files stay frozen under registry/ and are not validated by validate_schema.py.)
- framework/schemas/analysis.yaml — add evidence_basis (required), widen cognitive_pattern and social_dynamic to allow either string (confident) or list (hedged); document that hedged annotations do not satisfy story-level coverage
- framework/pipeline/agents/planning_agent.md — read full story.yaml; translate cognitive_signal and social_signal; enforce move/response turn-pairs; produce episode_writer_input.yaml as the barrier-safe projection (Part 5.5); verify episode-level signals are concrete instantiations of cast-level signal templates
- framework/pipeline/agents/dialog_writer.md — preserve move/response beats; receive episode_writer_input.yaml inline; never sees story.yaml or scenario.yaml directly
- framework/pipeline/agents/transcript_reviewer.md — split criterion 5 into 5a–5d
- framework/pipeline/agents/evaluator.md — populate evidence_basis; emit list-typed labels (hedged) when evidence underdetermines, single-label (confident) otherwise
- framework/pipeline/agents/analysis_reviewer.md — verify evidence_basis; verify hedged-vs-confident label choices match what the evidence_sentences support
- framework/pipeline/commands/create_scenario.md — accept story_id and episode_number; derive most targets from story.yaml; ensure planning_agent emits episode_writer_input.yaml for the next stage
- framework/pipeline/commands/create_transcript.md — Step 2 reads episode_writer_input.yaml from the episode's intermediates/ directory and passes its contents inline to dialog_writer; never passes a file path
- framework/pipeline/scripts/validate_schema.py — four new conditional rules (the three in Part 4D, plus the literal-scan rule for episode_writer_input.yaml in Part 5.5)
- apps/lens/schemas/scaffolding.yaml, session.yaml — add story_id and episode_number for traceability
- apps/lens/pipeline/commands/design_scaffolding.md, configure_session.md — gain story.yaml as additional context for planning
- apps/reasoning-lab/schemas/scoring.yaml, competition_facilitation.yaml, session.yaml — add story_id and episode_number for traceability
- apps/reasoning-lab/pipeline/commands/design_scoring_rubric.md, configure_competition.md — gain story.yaml as additional context for planning
- apps/reasoning-lab/pipeline/agents/scoring_rubric_agent.md — story-aware (recurring cast carries scoring archetypes across episodes)
- CLAUDE.md — replace the parallel-systems migration paragraph with the clean-break statement: the new system replaces the legacy system for Lens, no artifact equivalence is required, and the legacy registry/ directory remains frozen indefinitely as historical reference (not as a migration target)

Removed files (clean break, no legacy support)

- framework/reference/scenario_sequence.yaml — replaced by per-story story design docs (one per story under framework/docs/stories/). Phase 8 step 43 deletes this file after the first story ships.
- framework/docs/scenario-sequence.md — replaced by framework/docs/story-design.md (operator guidance) plus per-story design docs at framework/docs/stories/{story_id}.md. Phase 8 step 43 deletes this file after the first story ships.
- registry/* legacy artifacts — out of scope for the new pipeline; remain frozen but no migration is performed.

Additional removals introduced by the Part 13 episodes-first revision (Phase 5):

- framework/pipeline/commands/design_story.md — deleted. Drafting work moves to prose authoring in Phase 6.
- framework/pipeline/agents/story_planner.md — deleted. Story design is operator + AI in conversation, not a drafting agent.
- framework/schemas/story.yaml — deleted. Replaced by YAML frontmatter on the story design doc plus the per-episode draft frontmatter (Appendix B). The few fields that survive (story_id, title, coverage_mode, declared lists, episode_count) move to the story design doc's frontmatter.

Renames introduced by the Part 13 episodes-first revision (Phase 5):

- /create_scenario → /create_episode (command name).
- framework/pipeline/commands/create_scenario.md → create_episode.md.
- framework/schemas/scenario_plan.yaml → framework/schemas/episode_plan.yaml.
- artifacts/{story_id}/episodes/episode_{NN}/scenario.yaml → episode.yaml.
- framework/pipeline/agents/story_reviewer.md → story_consistency_reviewer.md (with rewritten responsibilities per Part 13.7).
- All references to "scenario.yaml", "create_scenario", and "scenario_plan.yaml" in agent prompts, validators, downstream apps (Lens and Reasoning Lab), command files, the spec, and CLAUDE.md. Approximately 47 files total.

Reference data — unchanged

- framework/reference/facet_inventory.yaml
- framework/reference/explanatory_variables.yaml
- framework/reference/lenses.yaml

================================================================
PART 8.5 — UPSTREAM AGENT AND COMMAND SPECS
================================================================

These specs define the previously under-described upstream pieces.

/design_story (command)

  Inputs (from operator, interactively):
    - story_brief: free-text paragraph describing premise, setting, target
                   grade band, intended episode count, and any pedagogical
                   commitments (e.g., "must teach all 10 facets" or "focus
                   on perspective engagement")
    - coverage_mode: "full" or "focused"
    - if focused: declared_facets, declared_cognitive_patterns,
                  declared_social_dynamics

  Procedure:
    Step 1. Operator runs /design_story and provides the brief inline.
    Step 2. Command invokes story_planner agent with the brief and the
            three reference files (facet_inventory, explanatory_variables,
            lenses). story_planner produces a draft story.yaml.
    Step 3. Command invokes story_reviewer agent with the draft story.yaml.
            story_reviewer runs the per-episode dry run, the eight-item
            rubric (Part 10), and reports ISSUEs.
    Step 4. Command runs validate_story.py against the draft and emits
            validation_report.yaml.
    Step 5. If story_reviewer or validate_story.py report any failures,
            the command surfaces them to the operator and either (a) loops
            back to story_planner with the feedback, or (b) returns control
            to the operator for manual revision. Maximum two automatic
            revision passes; after that, the operator must intervene.
    Step 6. Once story.yaml passes both story_reviewer and validate_story.py,
            the command writes it to artifacts/{story_id}/story.yaml and
            the sidecar validation_report.yaml.

  Output: artifacts/{story_id}/story.yaml + validation_report.yaml.
  Termination: explicit pass from both reviewers, or operator override
               (recorded in validation_report.yaml as `operator_override:
               true` with a justification field).

story_planner (agent)

  Reads: the operator brief, facet_inventory.yaml, explanatory_variables.yaml,
         lenses.yaml. Allowed framework terminology.
  Writes: a draft story.yaml conforming to the schema in Part 5.

  Responsibilities:
    - Propose a cast of 4–6 characters with distinct voices, lens
      dispositions, and 2–3 cognitive tendencies plus 1 social dynamic
      contribution per character.
    - Author cast-level signal_template fields for every tendency.
    - Author the arc: episode_number, title, premise, lead_characters,
      target_facets, target_strengths, cognitive_patterns, social_dynamics,
      primary_lens, mixed_valence_shape for each episode.
    - Engineer the cast and arc together so that the declared coverage
      contract (full or focused) actually closes — every declared facet
      has both a weakness and a strength episode, every declared pattern
      and dynamic has at least one carrier episode whose carrier_persona
      has the corresponding tendency in their episode-active set.
    - Rotate strength carriers across episodes (no carrier holds more
      than half of the story's strengths).
    - Vary mixed_valence_shape across episodes (no shape in more than half).
    - Design at most 2 growth arcs; express them via active_from_episode /
      active_through_episode on the affected tendencies.

  Does NOT: produce episode_writer_input.yaml (that's planning_agent's job
            during /create_scenario), and does NOT author scenario.yaml
            files (also planning_agent's job).

story_reviewer (agent)

  Reads: the draft story.yaml, the three reference files, the operator brief.
  Writes: a structured review report (ISSUE / OK per rubric item).

  Per-episode dry run: for each episode in arc, simulate target assignment.
  For each target_facets[i], verify carrier_persona's episode-active
  cognitive and social tendencies (resolved via active_from_episode /
  active_through_episode at this episode_number) include the assigned
  cognitive_pattern and social_dynamic. If not, ISSUE: "Episode N assigns
  pattern X to character Y, but Y's active tendencies at episode N do not
  include X."

  Eight-item rubric (Part 10 items 1–8). Item 9 ("moment of surprise") is
  human-only and explicitly skipped.

  story_reviewer cannot mutate story.yaml. It only reports.

projection_reviewer (agent)

  Reads: full story.yaml, full scenario.yaml for the episode, and the
         projected episode_writer_input.yaml.
  Writes: ISSUE / OK per barrier-sensitive field.

  See Part 5.5 "Projection narrative-leakage review" for the rubric.
  Runs after planning_agent produces episode_writer_input.yaml and before
  /create_transcript Step 2 reads it.

================================================================
PART 9 — IMPLEMENTATION ORDER (across conversations)
================================================================

Phase 1 — Foundation (schemas and validation)
1. Draft framework/schemas/story.yaml schema (Part 5), including episode-indexed tendencies and cast-level signal templates.
2. Draft framework/schemas/episode_writer_input.yaml schema (Part 5.5).
3. Draft framework/pipeline/scripts/validate_story.py to enforce all coverage_contract checks from Part 3 (cast-tendency consistency, lens distribution, mixed_valence_shape rotation, focused-coverage floor, hedged-annotation rule, strength/weakness rotation).
4. Update framework/schemas/scenario.yaml with cognitive_signal, social_signal, story_id, and episode_number fields.
5. Update framework/schemas/analysis.yaml with evidence_basis (required) and list-typed explanatory variables (hedged option).
6. Extend framework/pipeline/scripts/validate_schema.py with the four new conditional rules (three from Part 4D plus the literal-scan rule for episode_writer_input.yaml from Part 5.5).

Phase 2 — New upstream command and agents
7. Draft framework/pipeline/commands/design_story.md.
8. Draft framework/pipeline/agents/story_planner.md.
9. Draft framework/pipeline/agents/story_reviewer.md (with the per-episode dry-run requirement and the eight-item rubric from Part 10).
9a. Draft framework/pipeline/agents/projection_reviewer.md (Part 5.5; runs as the human-judgment counterpart to the literal-scan).

Phase 3 — Modified downstream pipeline
10. Modify framework/pipeline/agents/planning_agent.md to read story.yaml, handle the new signal fields, produce episode_writer_input.yaml, and verify episode signals against cast templates.
11. Modify framework/pipeline/agents/dialog_writer.md to preserve move/response beats and to consume episode_writer_input.yaml inline (no file paths).
12. Modify framework/pipeline/commands/create_transcript.md to read episode_writer_input.yaml and pass it inline.
13. Modify framework/pipeline/agents/transcript_reviewer.md (split criterion 5).
14. Modify framework/pipeline/agents/evaluator.md (evidence_basis, hedging semantics).
15. Modify framework/pipeline/agents/analysis_reviewer.md (verify evidence_basis and hedged/confident label choices).
16. Modify framework/pipeline/commands/create_scenario.md to accept story context.
16a. Modify Reasoning Lab schemas (scoring, competition_facilitation, session) to add story_id and episode_number; modify apps/reasoning-lab/pipeline/commands/{design_scoring_rubric,configure_competition}.md and the scoring_rubric_agent to be story-aware. This is the Reasoning Lab clean-break migration; see Part 6 "Reasoning Lab — also a clean break."
16b. Modify Lens schemas (scaffolding, session) to add story_id and episode_number; modify apps/lens/pipeline/commands/{design_scaffolding,configure_session}.md to read story.yaml as additional planning context.

Phase 4 — Documentation and CLAUDE.md update (does NOT remove legacy sequence files yet)
17. Author framework/docs/story-design.md (operator guidance).
18. Update CLAUDE.md to replace the parallel-systems migration paragraph with the clean-break statement (Part 8). Make it explicit that the new pipeline does not produce artifacts equivalent to the legacy system, and that the legacy registry/ directory remains frozen as historical reference.

Note: framework/reference/scenario_sequence.yaml and framework/docs/scenario-sequence.md are NOT removed in Phase 4. They are removed in Phase 5 step 24, after the first story has been authored, validated, and run end-to-end through the new pipeline. This avoids the window in which there is no source-of-truth sequencing artifact in the repo.

NOTE: Phases 5–8 below were rewritten on 2026-04-06 to reflect the episodes-first authoring revision documented in Part 13. The original Phase 5 (single phase, story.yaml authored via /design_story, then 5a–5e substeps) has been replaced. Read Part 13 first if you are implementing any of these phases — the model the original Phase 5 assumed (operator-authored story.yaml from a brief; story_planner agent; signal_template machinery) is being deleted, not extended.

Phase 5 — Schema and pipeline simplification (episodes-first migration)

Phase 5 is the cleanup pass that makes Phase 6 possible. It deletes the parts of Phases 1–3 that the episodes-first model makes unnecessary, renames scenario→episode across the codebase, and writes the operator manual that documents the new authoring loop. No story is authored in Phase 5; that is Phase 6.

25. Delete the /design_story command, the story_planner agent, and the framework/schemas/story.yaml schema file. Their drafting work moves to prose authoring in Phase 6. (Part 13.3 lists every file to delete and every reference to remove.)

26. Delete signal_template, active_from_episode, and active_through_episode fields from any surviving schema or agent. These existed to mediate between a separately-authored cast definition and per-episode signals; under the episodes-first model the cast lives in prose in the story design doc and the per-episode signals live in the episode drafts, with no mediating layer.

27. Rename scenario→episode across the codebase. /create_scenario → /create_episode. framework/schemas/scenario_plan.yaml → framework/schemas/episode_plan.yaml. The artifact filename artifacts/{story_id}/episodes/episode_{NN}/scenario.yaml → episode.yaml. All references in agent prompts, validators, downstream apps, command files, the spec, and CLAUDE.md. Approximately 47 files. This undoes the Phase 1 compromise of "internally scenario, externally episode."

28. Rename and rewrite story_reviewer → story_consistency_reviewer. The agent's new job is prose-on-prose review: it reads the story design doc and all N episode drafts and checks character consistency, voice consistency, unearned growth beats, and rubric items 1–8 from Part 10. Item 9 stays human-only. It is invoked routinely (after each new episode draft is authored, and as a final pass before the pipeline runs), not just at story-design time.

29. Rewrite validate_story.py to walk the story design doc frontmatter plus all episode draft frontmatter. The cross-episode checks (lens distribution, mixed-valence rotation, strength rotation, weakness rotation, focused-coverage floor, coverage closure) are unchanged in spirit; the input changes from a single story.yaml to a directory of prose drafts with YAML frontmatter. The hedged-annotation rule still requires post-pipeline analysis.yaml files and runs as a separate later check.

30. Simplify planning_agent. Remove the cast-template ↔ episode-signal consistency check (templates no longer exist). Remove the read of story.yaml (file no longer exists). Add the read of the episode draft at framework/docs/stories/{story_id}/episode_{NN}.md and the story design doc at framework/docs/stories/{story_id}.md. Continue producing episode.yaml and episode_writer_input.yaml. The information barrier projection is unchanged.

31. Rewrite /create_episode (formerly /create_scenario) to read the per-episode draft directly instead of taking interactive operator input. Args unchanged: <story_id> <episode_number>. The command locates framework/docs/stories/{story_id}/episode_{NN}.md, parses the frontmatter, and hands it to planning_agent. The interactive prompt phase goes away.

32. Update framework/docs/story-design.md to reflect the new model. Remove references to signal_template, active_from_episode, active_through_episode, and /design_story. Add the per-episode draft authoring workflow and the role of story_consistency_reviewer. The cast-design rules (Part 2) survive; the mechanism for expressing them changes from "fields in story.yaml" to "prose in the story design doc, behavior in episode drafts."

33. Author framework/docs/operator-manual.md. End-to-end runbook for authoring a story from scratch under the new model: prerequisites, the prose-first authoring loop, per-episode draft conventions, how to read reviewer reports, the re-planning loop runbook (Part 6 in operator language), reading the artifacts, common failures, and how to stop and resume across multiple authoring conversations. Writing the manual during Phase 5 is the test of whether the cleanup is complete; if you cannot write it, the model has gaps.

34. Update CLAUDE.md to reflect the new model: drop /design_story from the pipeline flow diagram, drop story.yaml from the artifact storage layout (replaced by the story design doc front-matter under framework/docs/stories/), update the Information Barrier section to reference the prose-first authoring loop, update Conventions to note the {story_id}/episodes/episode_{NN}/episode.yaml naming.

Phase 6 — Author the first story (prose only)

Phase 6 is creative authoring done by the operator (with AI assistance) across however many conversations are needed. No pipeline runs.

35. Author framework/docs/stories/saving-the-maker-space.md — the story design doc. Premise, setting, cast (5 characters described in prose with their tendencies and growth arcs in narrative form), arc summary, stakes, pedagogical commitments. YAML frontmatter at the top with story_id, title, coverage_mode (focused for the pilot), declared_facets, declared_cognitive_patterns, declared_social_dynamics, episode_count.

36. Author framework/docs/stories/saving-the-maker-space/episode_{01..05}.md — five per-episode drafts, one per episode of the pilot. Each draft has YAML frontmatter (the operator prompt for /create_episode: targets, carriers, signals, lead_characters, primary_lens, mixed_valence_shape, premise, previously) plus prose body (beats, authorial notes, why-these-targets). Authored in episode order; cliffhangers and continuity work as you go.

37. Run validate_story.py and story_consistency_reviewer iteratively as drafts are written. Coverage closure, lens distribution, rotation checks, character consistency. Revise drafts as the validator and reviewer surface gaps. Expect multiple passes — this is design work, not transcription.

38. Phase 6 closeout: all five episode drafts and the story design doc pass validate_story.py and story_consistency_reviewer with no outstanding ISSUEs (or with operator overrides documented in writing). The first story is now ready for the pipeline.

Phase 7 — Run the first story end-to-end

Phase 7 is mechanical execution of what Phase 6 already decided. One conversation per episode, you driving, capturing friction.

39. For each episode 1..5 in order: run /create_episode {story_id} {N}, /create_transcript {story_id} {N}, /analyze_transcript {story_id} {N}, /design_scaffolding {story_id} {N}, /configure_session {story_id} {N}. Read every artifact. Verify the projection barrier holds (literal scan + projection_reviewer reports), evidence_basis is populated on every annotation, hedged labels are honest, and the resulting Lens session looks like something a 6th grader would actually do.

40. If a reviewer flags a cognitive_signal or social_signal as not landing, run the re-planning loop from Part 6: local fix, then structural mark and story-level revalidation if it fails again, then story-level repair via revising the relevant episode draft (or the story design doc, if the drift is character-level). Earlier episodes whose drafts depend on a revised character may need regeneration.

41. Append to framework/docs/stories/saving-the-maker-space-friction-log.md after each episode. Capture every place the pipeline surprised you, every reviewer false positive, every place the manual was wrong or incomplete, every place a schema or agent should change in v2.

Phase 8 — Closeout

42. Lessons-learned writeup. Append a summary section to the friction log naming what should change in v2: candidate continuity_reviewer scope, schema gaps surfaced during authoring, agent prompts that misfired, validator messages that were unactionable. Do not implement v2 fixes in Phase 8 — capture them for a future revision pass.

43. Delete framework/reference/scenario_sequence.yaml and framework/docs/scenario-sequence.md. Verify with grep that nothing in framework/, apps/, or any non-legacy location references either path before deleting. Update CLAUDE.md if any framing in the Legacy System section becomes stale (the deletion is now a fact, not a planned action).

44. Update the phase memory entry at ~/.claude/projects/-Users-vinhthuyphan-Development-polylogue-5/memory/project_story_pipeline_phases.md to mark the entire revision done. List the story_id, the artifact paths, the friction-log location, and the v2 candidates surfaced in step 42.

Recommendation for the first story: Frame A (Saving the Maker Space) as a 5-episode focused-coverage pilot with a 5-character cast, per Part 11. Five episodes is enough to exercise rotation rules and the re-planning loop honestly while staying small enough that a single operator can author the whole thing in a reasonable number of authoring sessions.

================================================================
PART 10 — STORY DESIGN AS CREATIVE WORK
================================================================

The schema enforces structural requirements (coverage contract, cast size bounds, mixed-valence rotation). The creative design has narrative requirements that schemas cannot capture, and these matter as much as the structural ones if students are going to care about the result.

What makes a Polylogue story excellent

- Stakes that 11–13 year olds will actually care about. Not abstract environmental harm. Something concrete, local, and personal: a place they love is threatened, a friend is being misjudged, a decision is about to be made that will affect their daily life.
- A premise specific enough to feel real but general enough to travel between schools. "Saving our school's maker space" works in any school with a maker space; "Saving the Bridgewater Middle School maker space from Principal Vasquez" travels less well. Use generic place names and constructed school cultures.
- Cast voices distinct enough that students can predict them. By episode 3, students should be able to look at an unattributed line and guess which character said it more often than chance.
- An arc with momentum. Each episode ends with a reason to want the next: an unanswered question, an unresolved tension, a piece of new information that recontextualizes what came before.
- At least one moment of genuine surprise per story. A character does something unexpected but in-character — the brash editor turns out to be right, the cautious researcher takes a risk. Surprise without violation of character is what teaches students that flaws aren't traits.
- An ending that resists tidy resolution. Mixed-valence at the story level, not just the episode level. The kids do not unambiguously win. They learn something. They lose something. That is more honest than victory and more memorable than failure.

The relationship between the prose design document and story.yaml

The prose design document is the vision — written for humans, used for pitching, used for onboarding new operators, used as the source the YAML is filled in from. The YAML is the contract — written for the pipeline, used by the planning agent and validators, mechanical and complete.

Both are kept. They serve different audiences. The prose document lives at framework/docs/stories/{story_id}.md and is committed to the repo as a first-class artifact. The story_reviewer agent (Phase 2) eventually reads both and verifies they agree.

The story design rubric (for story_reviewer agent and human authors)

When evaluating a proposed story, ask:
1. Are the stakes concrete and personal to the cast?
2. Is the cast small enough (4–6 characters) and distinct enough (each with predictable voice and tendencies)?
3. Does the arc have momentum across episodes, not just within them?
4. Does the coverage contract close — can the cast actually carry every declared facet, pattern, and dynamic? (Validator-scorable.)
5. Is mixed-valence varied across episodes (not the same shape every time)? (Validator-scorable via shape_distribution.)
6. Does the ending earn its lack of tidy resolution?
7. Does any character feel like an embodied fallacy? (If yes, redesign.)
8. Would a 6th grader want to know what happens in episode 4 after reading episode 3?
9. Is there at least one moment of genuine surprise — a character doing something unexpected but in-character? (Human-only; story_reviewer agent does not score this.)

A story that fails any of 1, 4, or 7 is not ready. The others are improvement targets. Items 4 and 5 are scored mechanically by validate_story.py; item 9 is explicitly excluded from agent review and must be checked by a human.

Why the first story is the project's first real deliverable

Up to this point, Polylogue has been a framework with reference implementations. After Phase 5, it becomes a framework with a first piece of curriculum that exists as a coherent thing teachers can adopt. That shift matters strategically: "we have a framework" and "we have a story" are different conversations to have with a curriculum coordinator. The story is what makes the framework legible and adoptable.

================================================================
PART 11 — SUGGESTED FIRST STORIES
================================================================

Three contrasting frames are sketched here so the creative work in 5a can begin immediately rather than waiting for "we should think about a story sometime." Pick one as the pilot; the other two become candidates for later stories in the catalog.

Frame A — Saving the Maker Space (civic, internal stakes)

Premise: Six 6th graders form a club to save the school's maker space, which the principal has announced will be closed at the end of the term to free the room for a new computer lab. The kids investigate why, build a case, present it, fail, regroup, and eventually win a partial reprieve.

Why it works: stakes are concrete and local. Real disagreement about means (everyone wants to save it; they fight about how). An adversary who isn't a villain (the principal balancing a budget) teaches students to evaluate adversaries' reasoning charitably. The partial-win ending models that good reasoning produces progress, not always victory.

Cast (sketch): for the recommended 5-episode pilot, scope the cast to FIVE characters, not six — six characters across 5 episodes with 2–3 leads each means several characters lead only one episode, weakening the "recurring cast students recognize" rationale (Part 1B). Suggested five: Mira (passionate, cherry-picks evidence), Theo (cautious, sometimes the strength carrier, sometimes paralyzed), Dev (charismatic editor, decisive but reasoning-shallow), Sam (quiet, finds her voice mid-arc — one of the two growth arcs), Ren (researcher with mixed source quality). The sixth character originally sketched (Luca, perspective-engagement carrier) folds back in if this becomes an 8-episode story later.

Best fit for: a school doing a civic-engagement or PBL unit.

Frame B — The Beat (journalism, evaluating others' reasoning)

Premise: Three to five 6th graders run a small student newspaper or podcast called The Beat. Each episode covers one story they are reporting: choosing what to investigate, evaluating sources, deciding what to publish, dealing with consequences. Two arcs in one story: a snack-drive-shortfall mystery (episodes 1–4) and a contentious mural vote (episodes 5–8).

Why it works: journalism is applied epistemics — every facet maps to a journalism decision. Gets students out of "we are planning our own project" entirely; they evaluate sources, decisions, and arguments that aren't theirs. Format variety is built in (group meetings, interviews, published articles + comments, DMs, council meetings).

Cast (sketch): Mira (Evidence-leaning, document obsessive), Jules (Logic-leaning, contradiction spotter), Sam (Scope-leaning, asks who's missing), Devon (the editor, social-pressure engine), Ms. Reyes (faculty advisor, occasional appearances).

Best fit for: a school with a journalism or media-literacy unit; works especially well if the framework's perspective-engagement work is the priority.

Frame C — The Capsule (mystery, evaluating reasoning artifacts)

Premise: A 6th-grade class opens a 50-year-old time capsule containing real-feeling reasoning artifacts from 1975: a student council proposal, a science fair poster, a letter to the editor, a school newspaper article. Each episode the kids discuss one artifact. The artifacts are richly flawed in interesting ways. By episode 6 the kids realize the artifacts are connected — the same student is behind several of them, and there's a story to piece together about what happened.

Why it works: the kids spend the entire story evaluating someone else's reasoning, which is the broader real-world skill the framework wants to transfer to. The mystery layer (what happened to this 1975 student?) provides serial momentum. Each artifact is a different format, so the kids practice the lens vocabulary on radically different texts. Highest format variety of the three frames.

Cast (sketch): a small group of students who reconvene for each artifact, plus Ms. Reyes (or equivalent advisor) who occasionally surfaces context. Cast can be smaller (4 characters) because the artifacts carry as much pedagogical weight as the cast.

Best fit for: a school that wants the strongest critical-thinking-as-evaluation framing; works as a self-contained mini-unit that can be plugged into many courses.

How to choose

Frame A maximizes emotional investment and is the easiest to pitch. Frame B maximizes framework coverage and lens balance. Frame C maximizes "evaluating someone else's reasoning" transfer and format variety. For a first pilot, Frame A is the safest creative choice — recurring stakes, recognizable cast, civic engagement is a familiar genre for middle school. Frame C is the most pedagogically novel but harder to author well because each artifact must work as a standalone reasoning specimen.

Recommendation for Phase 5a: start with Frame A. Scope it to 5 episodes for the pilot (the maker-space threat, the petition, the first failure, Sam finding her voice, the partial-win resolution). Save Frames B and C for the second and third stories in the catalog.

================================================================
PART 12 — WHAT THIS UNLOCKS
================================================================

For students

- Recurring characters they can hold in mind, predict, and be surprised by.
- Cognitive patterns learned as character tendencies, not vocabulary lists.
- Growth visible in the dialog itself — modeling that critical thinking is a practice, not a property.
- Cliffhangers and serial momentum that disposable scenarios cannot create.
- Genuine value-loaded disagreement when the story arc calls for it, instead of manufactured opposition.

For teachers

- A project description that sells itself: "an 8-episode story about kids trying to save their school's maker space, structured to teach all 10 facets of reasoning quality."
- Coverage that is auditable, not asserted.
- Stories that are self-contained and swappable — no implicit commitment to a continuing canon.
- Multiple stories can coexist for different grade levels or units, with no coordination overhead between authors.

For the framework

- Honest evidence grounding for the explanatory variables — every claimed cognitive pattern and social dynamic is traceable to a specific line or turn-pair in the transcript.
- The framework's inventory becomes a story-level coverage contract, enforced by a validator, rather than a per-scenario scramble.
- Cast-as-coverage-vehicle gives operators a structural reason to design characters carefully, not just topics.

For the project

- A clean break from the disposable-persona model with no legacy migration debt.
- A pipeline that produces auditable curriculum artifacts a curriculum coordinator can review.
- A frame that excites teachers and students at first contact, while preserving the framework's pedagogical rigor.

================================================================
PART 13 — REVISION: EPISODES-FIRST AUTHORING (2026-04-06)
================================================================

This part documents a model change adopted after Phases 1–4 shipped and before Phase 5 began. It supersedes parts of Parts 5, 5.5, 6, 8, and 8.5 — specifically, anything in those parts that describes /design_story as a drafting command, story.yaml as an operator-authored contract, story_planner as a drafting agent, or signal_template / active_from_episode / active_through_episode as schema fields. The cross-episode coverage rules, the projection barrier, the evidence-grounding work in Part 4, and the per-episode pipeline downstream of /create_episode are all unchanged. Read this part before implementing Phase 5+.

13.1 — Why the change

The original model put cast design and arc design at the story level (operator-authored story.yaml via /design_story) and per-episode signals at the episode level (operator-typed at /create_scenario time). This created a two-layer authoring problem with no machine-checked link between the layers — the cast-level signal_template and the episode-level cognitive_signal were two separate writing tasks that had to stay consistent by hand. Phase 1 added a planning_agent check (cast-template ↔ episode-signal consistency) to catch inconsistency, but the underlying problem was structural: the operator was being asked to write the cast in the abstract before knowing what the episodes would do with it, then to write the episodes against an abstraction they had already had to imagine concretely.

The episodes-first model collapses the two layers into one: episodes are authored in prose, with the per-target signals embedded as the operator's prompt for /create_episode, and the "cast" emerges as a property of the episode set. The story design doc (prose) is the source of truth for character identity; the episode drafts (prose with YAML frontmatter) are the source of truth for what happens. story.yaml as a separately-authored contract disappears entirely. The signal_template field, which existed to mediate between an authored cast and an authored episode, has nothing to mediate and is deleted with it.

This is a smaller system than what Phases 1–3 built. It deletes real work — story_planner, the signal_template machinery, the active_from/through_episode machinery, the cast-template consistency check in planning_agent, the standalone story.yaml schema. None of that is wasted: the design exercise that produced it is what made the simpler model legible. But the cleanup is honest, not a rebuild on top of legacy assumptions.

13.2 — The new authoring loop

Three artifacts the operator authors, in this order:

1. The story design doc at framework/docs/stories/{story_id}.md. Prose. Contains: premise, setting, cast (one prose section per character — name, voice notes, tendencies described as personality, growth arcs as narrative beats, lens disposition as a description of how they reason), arc summary, stakes, pedagogical commitments. Plus YAML frontmatter at the top with the small amount of machine-readable story metadata: story_id, title, coverage_mode, declared_facets, declared_cognitive_patterns, declared_social_dynamics, episode_count.

2. The per-episode drafts at framework/docs/stories/{story_id}/episode_{NN}.md, one per episode. Each draft has YAML frontmatter (the operator prompt for /create_episode: targets with carriers and signals, lead_characters, primary_lens, mixed_valence_shape, premise, previously) plus prose body (beats, authorial notes, why-these-targets). See Appendix B for the full template.

3. The friction log at framework/docs/stories/{story_id}-friction-log.md. Captured during Phase 7 as the pipeline runs.

The story design doc is the load-bearing contract for character identity. The episode drafts are the load-bearing contract for what happens in each episode. story_consistency_reviewer reads both and checks they agree.

13.3 — What is deleted

Files removed entirely in Phase 5:

- framework/pipeline/commands/design_story.md — drafting command, no longer needed.
- framework/pipeline/agents/story_planner.md — drafting agent, no longer needed.
- framework/schemas/story.yaml — separate machine-authored contract, no longer needed. The few fields that survive (story_id, title, coverage_mode, declared lists, episode_count) move to the story design doc's YAML frontmatter.

Schema fields removed:

- signal_template (cognitive and social) on cast tendencies — the abstraction had nothing to abstract over once episodes became the source of truth.
- active_from_episode and active_through_episode on cast tendencies, strengths, and growth arcs — episode-indexed tendencies were a workaround for needing to express growth in a separate cast definition. Growth is now expressed in prose in the story design doc and in the per-episode drafts that show it happening.
- The entire cast: section of the (now-deleted) story.yaml schema.

Agent responsibilities removed:

- planning_agent's cast-template ↔ episode-signal consistency check (Part 5.5) — there are no templates.
- planning_agent's read of story.yaml — the file does not exist. Replaced by reads of the story design doc (for character context and the "previously" recap) and the episode draft (for the targets and signals).

Validator rules removed:

- validate_story.py's cast-tendency consistency check — no separately-authored cast to be inconsistent with. Character consistency is now a prose-on-prose review job (story_consistency_reviewer), not a structural validator job.

13.4 — What is renamed

scenario → episode across the codebase, undoing the Phase 1 compromise of "internally scenario, externally episode":

- /create_scenario → /create_episode
- framework/pipeline/commands/create_scenario.md → create_episode.md
- framework/schemas/scenario_plan.yaml → framework/schemas/episode_plan.yaml
- artifacts/{story_id}/episodes/episode_{NN}/scenario.yaml → episode.yaml
- All references in agent prompts, validators, downstream apps (Lens and Reasoning Lab schemas and commands), command files, the spec, and CLAUDE.md.

Approximately 47 files. Mechanical but not trivial. Phase 5 step 27.

story_reviewer → story_consistency_reviewer. The new name reflects the new job: prose-on-prose character and voice consistency checking across the story design doc and all episode drafts, plus rubric items 1–8 from Part 10. Item 9 (moment of surprise) remains human-only. Invoked routinely, not just at story-design time.

13.5 — What survives

The per-episode pipeline downstream of /create_episode is unchanged in spirit. Specifically:

- episode.yaml (formerly scenario.yaml) schema with cognitive_signal, social_signal, story_id, episode_number — unchanged except for the field rename.
- episode_writer_input.yaml schema and the projection barrier — unchanged. Two enforcement mechanisms (literal scan in validate_schema.py, projection_reviewer agent) still load-bearing.
- analysis.yaml with evidence_basis (required) and the hedged/confident widening — unchanged. Hedged annotations still do not satisfy story-level coverage; the fix is still to revise the episode draft or the story design doc, never to pressure the evaluator.
- evaluator, analysis_reviewer, transcript_reviewer, dialog_writer, projection_reviewer, validation_agent, transcript_id — all unchanged in scope. dialog_writer's information barrier is unchanged.
- planning_agent — simplified per 13.3 above, but still produces episode.yaml and episode_writer_input.yaml with the same projection rules.
- The Lens and Reasoning Lab downstream commands — unchanged in scope; they continue to gain story-context by reading the story design doc instead of story.yaml.
- The four conditional rules in validate_schema.py (three from Part 4D plus the literal-scan rule) — unchanged.
- validate_story.py — survives, with a different input shape. Walks the story design doc frontmatter plus all episode draft frontmatter and runs all the cross-episode checks from Part 3 except cast-tendency consistency (which is gone).

13.6 — How story-level coverage works in the new model

The declared coverage subset (for focused stories) lives in the story design doc's YAML frontmatter:

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

validate_story.py walks this frontmatter plus all the per-episode draft frontmatter. Coverage closure is computed as the union of (facet, pattern, dynamic) targets across all episode drafts. For focused stories, the validator checks the union covers the declared subset. For full stories, the validator checks the union covers the entire framework inventory. The focused-coverage floor (≥3 facets, ≥1 cognitive pattern, ≥1 social dynamic) still applies to the declared lists at story-design time.

The other cross-episode rules — lens distribution, mixed-valence rotation, strength rotation, weakness rotation — are computed across the per-episode draft frontmatter exactly as they were across story.yaml's arc section in the old model. Same rules, different input format.

The hedged-annotation rule still requires post-pipeline analysis.yaml files (because hedging is determined by the evaluator at /analyze_transcript time, not by the operator at draft time). It runs as a separate later check, after Phase 7's episode runs have produced the analyses.

13.7 — How character consistency works in the new model

Under the old model, character consistency was a structural property of story.yaml: each character had explicit cognitive/social tendencies with episode ranges, and validate_story.py checked that any episode assigning a target to a carrier had the corresponding tendency in that carrier's episode-active set. Drift was caught mechanically.

Under the new model, character consistency is a prose review property. The story design doc is the source of truth for who each character is and how they reason. The episode drafts are the source of truth for what each character does in each episode. story_consistency_reviewer reads both and checks they agree:

- Does each character's behavior across episodes match what the story design doc establishes? (If episode 4 shows Mira doing confirmation_bias when episodes 1–3 had her doing false_certainty and the story design doc never mentions her doing confirmation_bias, that is drift.)
- Are growth beats earned by what earlier episodes establish? (If Sam's growth inflection happens in episode 4, do episodes 1–3 actually show the pre-growth pattern she is growing out of?)
- Do voices stay distinct across episodes? (Could a student attribute an unattributed line to the right character by episode 3?)
- Do rubric items 1–8 from Part 10 hold? (Stakes, cast distinctness, arc momentum, coverage closure, mixed-valence variety, ending earned, no embodied fallacies, episode-to-episode pull.)

This is a real LLM judgment job. It is not replaced by a regex. story_consistency_reviewer is invoked routinely in Phase 6 — after each new episode draft is authored, and as a final pass before Phase 7 begins. It is also invoked in Phase 7 if a re-planning loop forces a draft revision, to check that the revision did not introduce drift.

The deferred continuity_reviewer agent (mentioned in Phase 5e of the original spec) is now subsumed by story_consistency_reviewer. There is no separate v2 agent for cross-episode character consistency; that is exactly the job story_consistency_reviewer does in v1.

13.8 — What this means for Phases 5–8

Phase 5 is the cleanup pass: delete the deprecated files and fields, perform the rename, simplify planning_agent, rewrite story_consistency_reviewer, rewrite validate_story.py, write the operator manual, and update CLAUDE.md and story-design.md. No story is authored in Phase 5.

Phase 6 is the prose authoring pass: write the story design doc plus all five episode drafts for Saving the Maker Space, iterating with validate_story.py and story_consistency_reviewer. No pipeline runs.

Phase 7 is the pipeline execution pass: run /create_episode through /configure_session for each of the five episodes in order, capturing friction.

Phase 8 is closeout: lessons-learned, delete legacy sequence files, update memory.

The phase numbering changes from "5 with substeps 5a–5e" to "5/6/7/8" because the substeps were entangling pipeline runs with creative authoring with cleanup work. Separating them into distinct phases lets each one be its own conversation (or many conversations, in Phase 6's case) without the others bleeding in.

================================================================
APPENDIX A — REVIEW RESPONSES
================================================================

This appendix documents how the 17 findings in story-pipeline-revision-review.md were resolved in this revision pass. Each finding cites the section(s) where the fix landed.

Structural / schema gaps

#1. Cast tendencies vs. episode targets — no consistency check.
    APPLIED. Part 3 adds the cast-tendency consistency rule as a load-bearing
    coverage_contract check. Validator computes per-episode active tendencies
    (Part 5) and fails the story if any episode's carrier_persona lacks the
    required tendency. Part 5.5 also makes planning_agent enforce
    cast-template ↔ episode-signal consistency at scenario.yaml creation.

#2. Growth arcs vs. stable tendencies tension.
    APPLIED. Part 5 introduces episode-indexed tendencies via
    active_from_episode and active_through_episode fields. Each tendency
    declares the episode range over which it is active; growth arcs are
    expressed as one tendency ending at the inflection episode and another
    beginning. Validator and planning_agent both consult the active set
    per episode, not the global character profile.

#3. Lens disposition has no enforcement.
    APPLIED. Part 3 adds the lens distribution rule: each lens must appear
    as primary in at least 25% of episodes. Part 5 adds a primary_lens
    field to each arc entry so the validator has the input it needs.

#4. mixed_valence_shape rotation asserted but not validated.
    APPLIED. Part 3 adds the shape rotation rule: no single shape in more
    than half of episodes; each used shape must appear at least once for
    stories of 5+ episodes. Validator computes shape_distribution.

#5. Focused coverage has no minimum.
    APPLIED. Part 3 adds the focused-coverage floor: ≥3 facets, ≥1 cognitive
    pattern, ≥1 social dynamic. Below this, the mode becomes an escape hatch.

#6. evidence_basis widening of labels can erode signal.
    APPLIED. Part 3 and Part 4 establish that hedged (multi-label)
    annotations do not satisfy story-level coverage. Only single-label
    (confident) annotations count. This creates the right incentive: the
    evaluator commits when justified, hedges when not, and the operator
    must ensure each declared pattern/dynamic has at least one unhedged
    annotation across the story.

Pipeline / agent concerns

#7. Information barrier risk in story.yaml.
    APPLIED. New Part 5.5 specifies the projection split exactly:
    planning_agent reads full story.yaml; dialog_writer reads only
    episode_writer_input.yaml (a new schema, also added in Part 5.5);
    a literal-scan validation rule prevents framework terms from leaking
    into the projection. This was the highest-priority addition.

#8. signal_mechanism ownership unclear.
    APPLIED. Part 5 introduces cast-level signal_template fields for both
    cognitive and social tendencies. Episode-level cognitive_signal and
    social_signal must be concrete instantiations of the cast templates.
    Part 5.5 adds the consistency check that planning_agent enforces.

#9. No re-planning loop for failed coverage.
    APPLIED. Part 6 adds a three-step re-planning loop spec: local fix,
    structural mark + story-level revalidation, story-level repair via
    cast revision or arc revision. The story is not allowed to ship with
    a broken coverage contract.

#10. story_reviewer satisfiability check is too weak.
    APPLIED. Part 6 and Part 8 expand story_reviewer's responsibilities
    to perform a per-episode dry run of target assignment against
    episode-active cast tendencies. Listed as an explicit Phase 2
    requirement in Part 9 step 9.

#11. planning_agent reading story.yaml directly.
    APPLIED. Part 6 documents the agent-by-agent read access matrix
    explicitly. planning_agent is allowed full story.yaml access (it
    needs framework terminology to do its translation job). dialog_writer
    is not. The barrier is enforced structurally by Part 5.5's projection
    schema and literal-scan validator.

Process / scope concerns

#12. Phase 5a in parallel with Phase 1 is risky.
    APPLIED. Part 9 Phase 5 (steps 19–24) explicitly acknowledges that
    5a will iterate as Phase 1 schema work surfaces gaps. The mitigation
    is to expect iteration, not to serialize.

#13. Clean break + frozen registry — migration exit criterion drift.
    APPLIED. Part 8 modified files list now includes a CLAUDE.md update:
    replace the parallel-systems migration paragraph with the clean-break
    statement. Part 9 Phase 4 step 18 is the explicit action.

#14. Reasoning Lab not mentioned.
    APPLIED. Part 6 adds an explicit "Reasoning Lab (out of scope for v1)"
    section. Lens migrates to stories in v1; Reasoning Lab continues
    against the legacy disposable-persona model and is reconsidered in v2.

#15. Removing scenario-sequence files in Phase 4 before any story exists.
    APPLIED. Part 9 Phase 4 explicitly says these files are NOT removed
    in Phase 4. They are removed in Phase 5 step 24, after the first
    story is end-to-end validated and has earned its successor status.

#16. No spec for multi-story coverage.
    ACKNOWLEDGED, deferred to v2. The reviewer themselves marked this as
    fine for v1. Mentioned here for traceability; no doc change.

#17. Word/turn budget unchanged but cast is larger.
    PARTIALLY APPLIED. Recurring characters reduce exposition burden
    (students already know who Mira is by episode 4), so the 10–14 turn
    / <400 word budget likely holds and may even feel more comfortable.
    But this is an empirical question. Phase 5c (step 21) is the place
    to capture friction with the budget honestly. No schema change in
    this revision pass; flag retained for Phase 5e lessons-learned.

Smaller items

- cast.yaml dropped (Part 7).
- story_id and episode_number added to scenario.yaml (Part 8).
- rotation_check made fully validator-computed, not operator-declared (Part 5
  coverage_contract section is now an audit block written by the validator).
- "Moment of surprise" flagged as human-only in the rubric (Part 10 item 9).

Two findings with the highest implementation priority

1. Information barrier projection (#7) — Part 5.5 is the most important
   addition in this revision pass. It must be implemented in Phase 1
   alongside the story.yaml schema, not deferred.

2. Cast-tendency consistency check (#1) — implemented in validate_story.py
   in Phase 1 step 3. Without this check the entire "cast drives coverage"
   inversion is unenforced.

   (Note 2026-04-06: this check is removed in the Part 13 episodes-first
   revision. There is no separately-authored cast for an episode to be
   inconsistent with; character consistency becomes a prose-on-prose review
   job for story_consistency_reviewer. See Part 13.7.)

================================================================
APPENDIX B — PER-EPISODE DRAFT TEMPLATE (Part 13)
================================================================

This appendix specifies the per-episode draft format introduced in the Part 13 episodes-first revision. The draft is the operator's authoring artifact for one episode of one story. It lives at framework/docs/stories/{story_id}/episode_{NN}.md and is what /create_episode reads when invoked.

Each draft is a Markdown file with two parts: YAML frontmatter (the machine-readable operator prompt that planning_agent consumes) and a prose body (the human-readable beat sheet, authorial notes, and target rationale that story_consistency_reviewer reads).

B.1 — Frontmatter schema

The frontmatter is delimited by `---` on the first line and a matching `---` after the last field. All fields are required unless noted.

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

Operators may add other sections as needed (e.g., "Open questions", "Notes for the dialog writer that won't survive the projection barrier"). story_consistency_reviewer reads the whole prose body; planning_agent reads only the frontmatter.

B.3 — What the frontmatter must satisfy

These are the rules planning_agent and validate_story.py enforce when consuming a draft:

1. Schema-level: every field above is present and well-typed; cognitive_signal is non-empty iff cognitive_pattern is non-null; social_signal is non-empty iff social_dynamic is non-null. Enforced by validate_schema.py with a new conditional rule keyed on the episode-draft schema.

2. Reference integrity: every facet, lens, cognitive_pattern, and social_dynamic ID resolves to an entry in framework/reference/. Enforced by validate_schema.py.

3. Carrier-in-cast: every carrier named in targets and strengths is named in lead_characters AND is described in the story design doc's cast section. Enforced by story_consistency_reviewer (a prose check, not a regex — the story design doc is prose).

4. Cross-episode rules (lens distribution, mixed-valence rotation, strength rotation, weakness rotation, coverage closure): computed across all episode drafts in the story by validate_story.py. Run after each draft is added or revised.

5. Character behavior consistent with the story design doc: a prose-on-prose check by story_consistency_reviewer. The cognitive_signal for a target must be a recognizable instance of how the carrier reasons per the story design doc, not a contradiction. Same for social_signal and beats.

B.4 — Worked example

A complete worked example for episode 2 of Saving the Maker Space (Frame A pilot) is included in the Phase 6 authoring artifact at framework/docs/stories/saving-the-maker-space/episode_02.md once Phase 6 ships. Until then, the canonical worked example lives in this conversation's design history (the per-episode draft for "The Petition"). The template above is the schema; the worked example is the calibration of how prose-y the prose can be without losing the discipline.

B.5 — Relationship to /create_episode

When the operator runs /create_episode {story_id} {episode_number}, the command:

1. Locates framework/docs/stories/{story_id}/episode_{NN}.md.
2. Locates framework/docs/stories/{story_id}.md (the story design doc).
3. Parses the episode draft frontmatter and the story design doc frontmatter.
4. Hands both to planning_agent inline.
5. planning_agent reads the prose body of the story design doc (for character context), the targets and signals from the episode draft frontmatter (as the operator prompt), and the previously field (for the narrative recap that flows into episode_writer_input.yaml).
6. planning_agent produces episode.yaml at the standard artifact path AND episode_writer_input.yaml under intermediates/, exactly as in the current pipeline.
7. The information barrier projection is unchanged: episode_writer_input.yaml contains zero framework terminology, is checked by the literal-scan rule in validate_schema.py, and is reviewed by projection_reviewer before /create_transcript step 2 reads it.

The interactive prompt phase that the legacy /create_scenario had is gone. The episode draft IS the operator prompt, authored ahead of time and committed to the repo as a versionable artifact.
