# Review of `story-pipeline-revision.md`

The plan is ambitious and internally coherent. Below are the gaps and concerns to address before implementation.

## Structural / schema gaps

1. **Cast tendencies vs. episode targets — no consistency check.** Part 5 lets each character declare `tendencies.cognitive` and `strengths.facets`, and each episode lists `target_facets` with `carrier_persona`. Nothing in the spec says the validator must enforce that an episode's carrier actually *has* that tendency/strength in their cast definition. Without this, the cast becomes decorative and episodes drift back to ad-hoc assignment.

2. **Growth arcs vs. "stable tendencies" tension is unresolved.** Cast rule 4 caps growth arcs at 2 characters, but the schema doesn't specify how the validator (or planning agent) should treat tendencies *after* the inflection episode. Does `tendencies.cognitive` represent pre-inflection state? Post? Both? The evidence-grounding machinery will get confused if a character is supposed to exhibit `confirmation_bias` in episode 2 but has "grown out of it" by episode 6.

3. **Lens disposition has no enforcement.** Rule 5 says the cast must collectively model all three lens dispositions, and characters carry `lens_disposition`, but the coverage_contract section only audits facets/patterns/dynamics — not lens balance. The original critique (Scope dominates 4 of 5 scenarios) could silently recur.

4. **`mixed_valence_shape` rotation is asserted but not validated.** Part 10 rubric item 5 says shapes should vary, but `coverage_contract` has no `shape_distribution` check. Easy to add; currently missing.

5. **Focused coverage has no minimum.** A 3-episode "focused" story could declare coverage of 1 facet and pass. Consider a floor (e.g., focused stories must cover ≥N facets and ≥1 pattern and ≥1 dynamic) or the mode becomes an escape hatch.

6. **`evidence_basis` widening of labels can erode signal.** Allowing `cognitive_pattern` to be a list lets the evaluator hedge — good for honesty, but downstream consumers (scaffolding, analytics, coverage_contract `with_signal: bool`) all assume a single label. Spec doesn't say how the coverage contract counts a multi-label annotation: does naming `[confirmation_bias, tunnel_vision]` satisfy coverage for both, or neither, or only the first?

## Pipeline / agent concerns

7. **Information barrier risk in `story.yaml`.** The dialog writer is barred from facet IDs, lens names, patterns, and dynamics. But Part 6 says downstream commands "gain access to story.yaml as additional context." `story.yaml` contains all of those things in the cast and arc sections. Spec needs an explicit rule: dialog_writer never receives story.yaml directly; only a barrier-stripped projection (cast voices + premise + lead characters). This is the single highest-risk omission.

8. **`/create_scenario` becomes thinner but `signal_mechanism` ownership is unclear.** Part 6 says "most targets are derived from story.yaml; the operator adds episode-specific signal_mechanism, cognitive_signal, social_signal." But the cognitive/social signals are tightly coupled to character tendencies declared at story level. Why isn't the *signal template* declared once at the cast level and instantiated per episode? Currently, an operator could write a `cognitive_signal` for episode 4 that contradicts the character's story-level tendency, and nothing catches it.

9. **No re-planning loop for failed coverage.** If episode 6's transcript_reviewer flags that a designed cognitive_signal didn't land, the local fix is a rewrite — but if it persistently fails, the *coverage contract* is now broken and the story-level validator should re-run. There's no spec for how episode-level failures bubble up to story-level re-validation.

10. **`story_reviewer` "verifies coverage_contract is satisfiable" before any episode exists.** Satisfiability is mostly a counting exercise at that stage; the *real* test is whether episodes can be authored with the declared targets without violating cast tendencies. The reviewer needs a stronger checklist than "can these IDs be slotted in" — likely a dry-run of target assignment per episode.

11. **`planning_agent` reading `story.yaml` directly.** Risk of leakage same as #7. Planning agent is allowed to see structural metadata, but the spec should be explicit that planning_agent reads story.yaml while dialog_writer reads only the projected slice.

## Process / scope concerns

12. **Phase 5a in parallel with Phase 1 is risky.** The plan acknowledges this is independent creative work, but 5b ("translation is mechanical if the design is good") will reveal schema gaps that force re-authoring. Recommend completing Phase 1 schema draft *before* 5a finalizes, even if 5a starts in parallel — or accept that 5a will iterate.

13. **"Clean break, no legacy support" + frozen `registry/`.** CLAUDE.md says the legacy system stays operational until new system produces identical Lens artifacts. A clean break to story-based pipeline means the new system will *never* produce identical artifacts (different directory layout, different schema fields). The migration exit criterion in CLAUDE.md needs updating, or this revision is implicitly abandoning the parallel-systems plan. Worth naming explicitly.

14. **Reasoning Lab is not mentioned once.** Part 6's pipeline only shows the Lens downstream. Does Reasoning Lab consume `story.yaml`? Does competition design need cast awareness? If Reasoning Lab is genuinely out of scope for this revision, say so; otherwise it's a silent gap.

15. **Removing `scenario-sequence.md` and `scenario_sequence.yaml` (Part 8) before any story is authored** means there's a window with no source-of-truth sequencing artifact. Order Phase 4 step 16 *after* Phase 5b, not before.

16. **No spec for multi-story coverage.** Part 12 promises "multiple stories can coexist." But each story declares its own coverage contract independently. There's no story-of-stories layer for a teacher choosing across the catalog. Probably fine for v1, but worth a sentence acknowledging it's deferred.

17. **Word/turn budget unchanged but cast is larger.** Current constraint is 10–14 turns, 2–3 personas. Part 5 allows 2–3 lead characters per episode, same budget. With recurring characters carrying tendencies *and* growth beats *and* signal pairs, 10–14 turns may be too tight. No analysis of whether the budget still holds.

## Smaller items

- `cast.yaml` is mentioned as "optional split-out" (Part 7) but never specified — drop it or schema it.
- Part 4B says scenario.yaml is "otherwise unchanged," but Part 6 says `/create_scenario` now takes `story_id` and `episode_number` — those need to land *in* scenario.yaml for traceability. Add fields.
- `rotation_check` in Part 5 declares `max_strengths_per_character` as an integer the operator sets, but Part 3 says the validator enforces "≤ half." Either the operator sets it (and the validator checks consistency with story length) or the validator computes it. Pick one.
- "At least one moment of genuine surprise per story" (Part 10) is a great rubric item but unscorable by `story_reviewer` agent. Flag as human-only.

## The two highest-priority fixes before implementation

1. **Information barrier projection for `story.yaml`** (concern #7) — define exactly what the dialog writer sees vs. what planning sees. This is load-bearing and easy to get wrong once implementation starts.
2. **Cast-tendency ↔ episode-target consistency check** (concern #1) — without it, the whole "cast drives coverage" inversion is unenforced and the system slides back to per-episode improvisation under a story-shaped wrapper.
