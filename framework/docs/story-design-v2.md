# Story Design for the v2 Assistive Package

**Status.** Pre-implementation draft. Describes story authoring requirements *specific to the v2 pipeline's downstream* (`/build_assistive_package`), which is not yet implemented. Derived from `pipeline-revision-plan.md` §2, which specifies the assistive package schemas. Every substantive constraint in this document cites its §2 subsection. Expect this document to be revised after the first v2 pilot is authored and run end-to-end — some §2 details will crystallize differently when the schemas are actually written in Stage C of the implementation plan, and this guide's predictions will need correction.

**This is an addendum, not a standalone guide.** Read `story-design.md` first — it governs story authoring for the **shared upstream** (`/create_episode` and `/create_transcript`), which is unchanged between v1 and v2. Cast bounds, coverage contract, rotation rules, information barrier, prose-first authoring, the per-episode draft frontmatter template, and the role of `story_consistency_reviewer` all live there and apply equally to v2. This document adds the constraints that come from what the four downstream v2 agents (analyst, diagnostic, prose, discussion) need in order to produce a non-vacuous, high-quality assistive package.

## Episode, passage, turn

Before anything else, three terms that §2 uses precisely and that are easy to conflate:

- **Episode** — one full discussion, one transcript, one pipeline run. Lives at `artifacts/{story_id}/episodes/episode_{NN}/`. A five-episode story has five episodes.
- **Passage** — a subdivision *within* an episode, covering a subset of the episode's turns (a `turn_range`). An episode typically contains 2–4 passages. A passage is where the analyst's cognitive work lands — one passage roughly corresponds to "one unit of reasoning scene." A five-episode story with 3 passages per episode has 15 passages total.
- **Turn** — one speaker's contribution in the transcript. A passage contains multiple turns (the `turn_range`). The per-turn intervention dictionary and orientation probes in §2.3 are keyed to turns inside passages.

The v2 assistive package is structured hierarchically: **episode → passages → turns → facet/lens cells.** Most of what you're designing *for* in this document lands at the passage or turn level, not the episode level.

---

## What the v2 pipeline rewards (one-sentence summary per agent)

Before the field-by-field walk, here is the compressed version:

- **Analyst** rewards stories with **multi-readable passages** — scenes where several facets plausibly apply, several lenses are available, and the characters engage some while visibly missing others.
- **Diagnostic** rewards stories where the analyst has rich material to work with, because most diagnostic ladder rungs are lifted verbatim from analyst output, not authored from scratch.
- **Prose** rewards stories with **clear episode hooks and clear closing questions** — episodes that can be opened in one paragraph and closed with a specific "what did the group decide or fail to decide" probe.
- **Discussion** rewards stories with **distinct character voices, lens-crossable moves, and steelman-able positions** — because every discussion cue has to fit one of three creative axes (lens refraction, persona projection, stance inversion), and each axis has its own story requirement.

The cross-cutting theme: v2 is a reverse-engineering opportunity. The merge script (§2.6) deterministically derives ladder rungs, discussion-cue coverage, and prior exposure from analyst output. Rich story → rich analyst output → rich downstream, for free. The downstream agents are only the dense cognitive producers for the things the analyst can't derive — the probe options, the intervention openings, the discussion cue text itself. Everything else is a pass-through. **You cannot compensate for a thin story by running the diagnostic agent harder.**

---

## Part 1 — What the analyst agent needs from your story (§2.1, §2.2)

The analyst produces `ground_truth.yaml`, which sits at the root of everything downstream. Its job is accuracy, not pedagogy — it describes what is actually happening in the passage in framework vocabulary. Nearly every other agent's output either consumes the analyst's output or is deterministically derived from it. Most of the v2 story-shape constraints land here.

### 1.1 Facets must have cite-able evidence turns with one-line descriptions (§2.1, `facets_present[]`)

Every facet the analyst identifies needs `evidence_turns[]` (at least one turn citation inside the passage's `turn_range`), a `severity` judgment, and a `one_line` description of what's happening. This means the facet must be exhibited in visible behavior — not implied, not inferable from what's missing, not "well, the characters are generally being careless." It has to be *this turn, this speaker, this thing they said*.

**Authoring test.** For each facet you plan to carry in a passage, can you point at the specific sentence a character says and write a one-line description of what they're doing wrong (or right) there? If the answer is "well, it's more the vibe of the whole scene," the facet isn't concrete enough for the analyst to cite.

**Implication for beats.** Character mistakes (and strengths) must be anchored in specific dialogue moves. "Mira is generally too trusting" isn't a facet instance. "Mira says 'it's from a real magazine' and moves on without naming the magazine" is one. Design beats at the sentence level, not the paragraph level.

### 1.2 Every passage needs a discrimination surface (§2.1, `facets_absent_but_tempting[]`)

§2.1 says `facets_absent_but_tempting[]` needs "at least one entry per passage where any discrimination is possible." These are facets that *look like they might apply but don't*, each with `why_tempting` and `why_wrong`. They feed the tempting-absent intervention role (§2.3.2) and the merge-script-derived redirect rungs.

**What this requires of the story.** Passages where every facet move is textbook-clean leave the analyst with nothing for `facets_absent_but_tempting[]`. You want passages with *near-misses* — moments where a student could plausibly misattribute a problem to the wrong facet. Example: a passage where a character cites a weak source. The student might initially suspect `relevance` ("maybe the article isn't even about the right topic") before recognizing that the real problem is `source_credibility` ("the article might be about the right topic, but we don't know where it came from"). The `relevance` misattribution is the tempting-absent facet.

**Authoring test.** For each passage, ask: *if a 6th grader read this and flagged the wrong facet, which wrong facet would they most plausibly flag?* If there's no good wrong answer — if the right facet is just obvious — the passage has no discrimination surface and the tempting-absent role has nothing to populate.

**Implication for beats.** Build moments of plausible ambiguity deliberately. A story where every mistake is unmistakable is teaching recognition, not discrimination, and v2 wants both.

### 1.3 `lens_visibility` and the afforded-missing cell (§2.1, `lens_visibility`)

Each passage gets a `lens_visibility` block, per lens, with two orthogonal enum fields: `engagement` (`none | partial | high`) — a pure observation of how much the characters used the lens — and `affordance` (`none | thin | moderate | rich`) — a judgment about how much the topic would give the lens to work with if engaged. Plus a prose `what_shows` description.

The **invalid combinations** are `(engagement: partial, affordance: none)` and `(engagement: high, affordance: none)` — the merge script rejects these, because characters cannot engage with a lens the topic affords nothing. What this means for you: every passage where a character engages a lens must also *support* engagement with that lens.

The **legal and most pedagogically valuable combination** is `(engagement: none, affordance: rich)` — the topic richly supports the lens, but no character engages it. This is the afforded-missing cell, and it becomes a `tempting_absent`… no — an `afforded_missing` intervention cell at §2.3.2, routed to by the orientation probe's `afforded-missing` option. **The diagnostic agent treats these cells with maximum urgency.** This is v2's headline upgrade over v1.

**What this requires of the story.** Passages must be substantive enough on the *topic* side that all three lenses can potentially apply — not necessarily that all three will be engaged, but that a judge reading the passage could honestly say "yes, the Evidence lens would have a lot to work with here if anyone had bothered." Then deliberately choose which lens(es) the characters *don't* engage, so you generate afforded-missing cells.

**Authoring test.** For each passage, list the three lenses (Logic, Evidence, Scope). For each lens, ask: (a) how much does the *topic* afford this lens? (`none | thin | moderate | rich`); (b) how much do the *characters* engage it? (`none | partial | high`). The best passages have at least one lens in the `(engagement: none, affordance: rich)` cell.

**Implication for genre.** Investigative and mystery genres make this practically free — the "clue nobody picks up" is exactly an afforded-missing cell. Civic-realism genres can do it too but have to work harder because the characters are usually trying to reason carefully. Pick genres that make afforded-missing cells natural consequences of the plot.

### 1.4 Every passage must afford at least one perspective transition (§2.1, `perspective_transitions[]`)

**This is required on every passage.** `perspective_transitions[]` is a list of directional pairs between lenses, each with `from`, `to`, `trigger`, `what_they_gain`, `what_they_realize`, `prompt`. It feeds the merge-script-derived `lens_switch` ladder rungs in the diagnostic agent's interventions (§2.3.2) — which means if `perspective_transitions[]` is empty or thin, the `lens_switch` rungs are empty or thin, and the diagnostic agent has one fewer move to make.

**What this requires of the story.** Every passage must support at least one plausible move from one lens to another. Narrowly single-lens passages — scenes where only Evidence-lens content is in play, with no plausible Logic or Scope angle — are structurally impoverished for v2. The author must be able to write sentences like "a Logic-leaning student would, at this point, naturally move to asking a Scope question about X, and would realize Y."

**Authoring test.** For each passage, ask: *given what's in play here, can I name at least one lens-to-lens transition that a thoughtful reader would plausibly make?* If no, the passage is too narrow — add content that opens another lens.

### 1.5 Counterfactuals must be turn-specific and behavior-specific (§2.1, `counterfactuals[]`)

Every facet present needs a one-sentence counterfactual that (a) cites at least one `evidence_turn` from the passage AND (b) names a specific change to that turn's content. Generic prescriptions — "be more careful," "check your sources" — are rejected by the reviewer. Counterfactuals feed the merge-script-derived `worked_example` ladder rungs (§2.3.2). Thin counterfactuals → thin worked-example rungs.

**What this requires of the story.** Character mistakes must be **behaviorally specific**. "Mira could have asked Jordan to read the article first" is a counterfactual. "Mira could have reasoned better" is not. The fix has to be nameable as a specific action at a specific turn.

**Authoring test.** For each facet you plan to carry, write the counterfactual sentence: *"On turn X, [character] could have [specific action] instead of [what they did]."* If you can't write the sentence concretely, the beat isn't specific enough and the worked-example rung will be vacuous.

### 1.6 Turn annotations: empty turns are legal and endorsed (§2.1, `turn_annotations[]`)

§2.1 says every turn inside the passage's `turn_range` gets an entry (one-to-one with the transcript), but the content fields are populated **iff the turn is load-bearing** — load-bearing meaning the turn has a facet signal, a lens transition, a cognitive/social signal feeding `causal_layer`, or a claim that later turns respond to. **An empty entry is a positive assertion that the framework has nothing to say about the turn, not a mark of omission.**

**This corrects a claim I made earlier.** The current `story-design-v2.md` predecessor suggested "distribute reasoning moves across many turns." That was wrong. §2.1 endorses concentration: empty turns are legitimate, and a reviewer can dispute an empty turn as a *legitimate extension*, not as a failure. If your episode has three turns where a lot of reasoning happens and eight turns of narrative connective tissue, that's fine — the analyst just produces empty entries for the connective turns.

**What this *does* require.** Load-bearing turns should be **multi-interpretable** (see §2.3.1 below). A turn that's load-bearing but supports only one reading produces a weak two-option probe.

**Authoring test.** For each passage, identify which turns are load-bearing in the §2.1 sense (at least one of: facet signal, lens transition, causal signal, respondable claim). Those turns should each support 2–3 plausible readings — see 2.1 below on probe options. Non-load-bearing turns are fine as narrative fabric.

### 1.7 Causal layer and interaction — required for 8 of 10 facets (§2.2)

Every entry in `causal_layer.facets_explained` must have an `interaction` field, with allowed values: `cognitive_only`, `social_only`, `cognitive_amplified_by_social`, `social_amplified_by_cognitive`, `mutual`. **`cognitive_only` is legal only for `relevance` and `inferential_validity`** — per §2.2 and framework §4, those are the two facets with no social-dynamic account. For the other **eight facets**, a social dynamic must be in play.

**This is the hardest schema-enforced constraint in §2.** If your story is carrying `source_credibility` or `scope_affected_parties` or any of the other eight, the beat **must** have a genuine social dynamic shaping the cognitive move. An isolated cognitive error — a character who's just wrong in a vacuum — cannot anchor these facets under v2.

**What this requires of the story.** When a character makes a mistake on one of the eight social-inflected facets, there has to be a social reason the mistake stuck. `authority_deference` that made the mistake unchallengeable. `group_pressure` that rewarded it. `conflict_avoidance` that suppressed the one person who would have caught it. The reviewer will check your causal layer against `facet_inventory.yaml` (§2.2 rule 3) and flag entries that list one force when the evidence supports more than one.

**The interaction value matters too.** `cognitive_only` and `social_only` are the weak forms. `cognitive_amplified_by_social`, `social_amplified_by_cognitive`, and `mutual` are the strong forms. A story where every beat falls out as `social_only` (social dynamic alone, no cognitive pattern) is under-exercising the causal layer.

**Authoring test.** For each beat where you're carrying a facet from the eight social-inflected facets, write one sentence of the form: *"The [social dynamic] makes the [cognitive pattern] [harder to catch / more rewarding / unchallengeable / mutually reinforcing]."* If you can't, the beat is `cognitive_only` — which is illegal for these facets — and you need to either strengthen the social dimension or pick a different beat.

**Exception.** If you're carrying `relevance` or `inferential_validity`, `cognitive_only` is legal. These two facets are the ones where "the character was just wrong, socially unremarkably" is a valid pattern. Use this deliberately when the beat is genuinely about a logical or relevance error with no social context.

### 1.8 Connects_to: echoes and contrasts across passages (§2.1, `connects_to`)

`connects_to` has two fields: `echoes[]` (backward pointers the merge script uses to derive `prior_exposure`) and `contrasts[]` (bare cross-passage comparisons for analytical traceability). The echoes field is what makes the **arc** of the story count, not just the cast. If episode 4 passage 2 echoes episode 2 passage 1, the merge script adds episode 2's facets to episode 4's `prior_exposure`, which then feeds the diagnostic agent's personalized faded-assistance filter.

**What this requires of the story.** The arc must actually thread. Facets introduced in early episodes should resurface — with more nuance, in different character voices, under different social conditions — in later episodes. A story where every episode is a self-contained set of beats unrelated to the others doesn't feed the prior-exposure mechanism.

**Authoring test.** For each episode after the first, name at least two passages from earlier episodes that this episode echoes. If you can't, the arc is flat — episodes are parallel, not sequential — and v2's `prior_exposure` mechanism has nothing to work with.

---

## Part 2 — What the diagnostic agent needs from your story (§2.3)

The diagnostic agent authors the per-turn three-role intervention dictionary, the orientation and explanation probes, and `struggle_calibration`. It is the densest new structure in v2 by a wide margin. **But most of its ladder rungs are lifted from ground_truth.** This is the critical insight: authoring a rich story → rich analyst output → rich ladders, for free. Thin story → thin analyst output → thin ladders, irrecoverably.

### 2.1 Load-bearing turns must be multi-interpretable (§2.3.1, `probes.facet.by_turn`)

The orientation probe is one multiple-choice probe per load-bearing turn, with options drawn from three sources: facets the analyst signaled on that turn (`present` role), facets the lens-visibility matrix says were afforded but nobody engaged — distributed to the turns where those missing observations would most naturally attach (`afforded_missing` role), and facets the analyst marked in `facets_absent_but_tempting[]` that would plausibly attract a student's attention on this turn (`tempting_absent` role). Plus a blank-page escape.

A well-shaped orientation probe has **2–3 plausible options per role**, so 4–6 total options (plus blank-page). A turn that supports only one reading — where only one facet is in play, no afforded-missing candidate applies, and no tempting-absent candidate is plausible — produces a weak probe.

**What this requires of the story.** Load-bearing turns should be **multi-interpretable by design**. A turn where Mira trusts a source uncritically might also plausibly be read as a `relevance` question ("is the article even about the right topic?") and be happening in a context where `scope_affected_parties` is afforded-missing ("nobody asked who this decision affects"). That single turn then supports three distinct probe options.

**Authoring test.** For each load-bearing turn, can you list at least 2–3 plausible readings? If only one facet is in play, the turn is probe-thin.

**Implication.** This does NOT mean every turn should be load-bearing. §2.1 is explicit that empty turns are legitimate. It means the turns that *are* load-bearing should each carry multiple layers. Density of interpretation per load-bearing turn, not density of load-bearing turns.

### 2.2 Ladder rungs are largely lifted, not authored (§2.3.2, §2.6)

This is the part I missed in my previous version of this doc, and it's the most important thing to internalize about v2.

The diagnostic agent writes each intervention cell's `opening`, its initial `nudge`/`question`/`hint` rungs, and — for `has_explanation_depth: true` cells — the explanation sub-ladder. But three of the six rung types are **deterministically lifted from ground_truth by the merge script** (§2.6):

- **`worked_example` rungs** ← `counterfactuals[]` entries, filtered by matching facet and evidence turn.
- **`lens_switch` rungs** ← `perspective_transitions[]` entries.
- **`redirect` rungs on tempting-absent cells** ← `facets_absent_but_tempting[F].why_wrong` entries.

What this means: **the quality of these ladder rungs is set by the quality of your ground_truth, not by the diagnostic agent's effort.** If `counterfactuals[]` is generic, the worked-example rungs are generic and there is nothing the diagnostic agent can do about it. If `perspective_transitions[]` is thin, the lens_switch rungs are thin. If the tempting-absent `why_wrong` entries are rushed, the redirect rungs are rushed.

**Translating this into story-design requirements.** If you want rich diagnostic ladders — the main lift of v2 — you must give the analyst rich source material. That means:

- **Concrete, turn-specific counterfactuals** (Part 1.5 above). Each facet present needs a one-sentence fix that names the turn and the specific action.
- **Meaningful perspective transitions** (Part 1.4 above). Every passage needs at least one lens-to-lens move that a thoughtful reader would plausibly make.
- **Well-written tempting-absent `why_wrong` entries** (Part 1.2 above). Every discrimination surface needs a clear explanation of why the tempting wrong facet doesn't apply here.

These are story-shape decisions because the analyst can't invent them — they have to be readable off the text you wrote. If your beat doesn't support a concrete counterfactual, the worked-example rung is empty, and no amount of diagnostic-agent effort will save it.

**Authoring test.** For each beat carrying a facet, ask the three lifting questions: (a) *can I write a turn-specific counterfactual?* (b) *does this passage afford a lens transition?* (c) *is there a plausible tempting-wrong facet with a clear why_wrong?* If yes to all three, the downstream ladders will be rich for free.

### 2.3 Role-gated authoring depth (§2.3.2)

The diagnostic agent authors at different depths for the three roles:

- **`present` cells** get full ladders (~4 rungs) plus optional explanation sub-ladders. These are the "you noticed it, let's go deeper" interventions.
- **`afforded_missing` cells** get medium ladders (~4 rungs) without explanation branching. These are the "notice what's missing" interventions — the headline v2 case.
- **`tempting_absent` cells** get short redirect ladders (1–2 rungs), often lifted verbatim from `why_wrong` entries. These are the "actually, here's what's really going on" redirects.

**What this means for you.** The three roles are not equally demanding on the story. What the story needs to supply:

- For `present` roles: rich behavioral specificity (Parts 1.1, 1.5, 1.7).
- For `afforded_missing` roles: genuine afforded-missing cells in `lens_visibility` (Part 1.3).
- For `tempting_absent` roles: near-misses and discrimination surfaces (Part 1.2).

A story that has all three in every passage feeds the richest diagnostic output. A story that has only `present` roles (clean facet moves, no near-misses, no missed lenses) feeds a diagnostic output that looks shallow compared to v2's promise — because two of the three role slots are empty.

### 2.4 Explanation depth is opt-in, not universal (§2.3.1, §2.3.2, `has_explanation_depth`)

Not every `(turn, facet)` cell gets an explanation probe. The diagnostic agent flags cells with `has_explanation_depth: true` only where "why did this happen?" is pedagogically load-bearing — typically cells where `interaction` is non-trivial (see 1.7 above) or where `(engagement: none, affordance: rich)` is the situation (1.3).

**What this means for you.** Your story should give the diagnostic agent reasons to flag some cells for depth. Beats with `cognitive_amplified_by_social` or `mutual` interactions naturally deserve a "why" — because the why has structure. Beats with `cognitive_only` (legal only for `relevance` and `inferential_validity`) often don't need depth — the why is "the character was wrong, end of story."

**Authoring test.** For each beat, ask: *is there something interesting to say about why this went wrong, beyond just "the character made this mistake"?* If yes, the beat supports `has_explanation_depth: true`. If no, it's a shallow-but-legitimate cell.

Aim for 2–4 depth cells per episode, not every cell. Explanation depth is the expensive authoring; making every cell deep drowns it.

### 2.5 struggle_calibration is thin and you don't author it directly (§2.3.3)

`struggle_calibration` is three lean fields per passage: `pace`, `minimum_wrestling[]`, `productive_duration`. It's coarse pricing on top of the ladders the diagnostic agent already authored. §2.3.3 is explicit: *it is not the mechanism of productive struggle; the mechanism is the shape of the ladders.*

**What this means for story design.** Effectively nothing direct. You don't write `pace: generous` into the story design doc. The diagnostic agent sets these based on where the passage sits in the arc (early passages are more generous, high-stakes passages are more strict, etc.). If you want to signal pacing hints, do it in the per-episode draft prose body ("this passage is where things get hard and students should feel it") and the diagnostic agent can pick that up.

### 2.6 Character growth fields are conditional on the capability flag (§2.3.4, `uses_character_growth`)

`growth_beats` and `character_arc_position` are populated only when `uses_character_growth: true`. If your story uses growth arcs (at most two characters, per v1 `story-design.md` cast rule 4), flip the flag and the diagnostic agent will populate these. If not, leave the flag false and save the authoring.

**What this requires of the story if you flip it on.** The growth must be *earned* across episodes — a pre-growth stretch, an inflection episode, a post-growth stretch. This is governed by v1's cast rules and by `story_consistency_reviewer`. Nothing v2-specific is added here except that the flag determines whether the diagnostic agent bothers to populate the fields.

---

## Part 3 — What the prose agent needs from your story (§2.4)

The prose agent is the smallest of the four. Three blocks: `episode_opening`, `entry_prompts[]`, `consensus_check[]`. All are short, voiced, register-matched prose. No diagnostic muscle, no three-axis creativity. The story requirements are correspondingly narrow but sharp.

### 3.1 Episodes need a landable one-paragraph hook (§2.4, `episode_opening`)

`episode_opening` is one paragraph, student-facing, written in the story's declared `pedagogical_register`, ending with a non-leading "what to watch for" sentence that primes attention without naming facets, patterns, or dynamics.

**What this requires of the story.** Episodes need a crystallized **hook** — a narrative situation that can be set up in one paragraph without the reader needing prior context they don't have. Episodes that begin "continuing from last time, the group is still arguing about..." don't land; episodes that begin "the petition needs fifty signatures by Friday and only twenty people have signed" do.

**The non-leading closing sentence is the tricky part.** It has to prime attention ("watch how the group handles disagreement about evidence") without naming framework vocabulary ("watch for source_credibility failures"). This requires the episode to have a *direction of attention* that can be pointed to in voiced language.

**Authoring test.** For each episode, try writing the opening paragraph now, in the design doc, before drafting the rest. If you can't write it in one paragraph — if you need two paragraphs, or you need to cite prior episodes to make sense — the episode is under-crystallized and will produce a weak `episode_opening`.

### 3.2 Every passage, every lens needs an actionable starter stem (§2.4, `entry_prompts[]`)

`entry_prompts[]` is per passage, per lens. One-sentence starter stems the student can adopt verbatim if they can't begin: *"I noticed that in turn ___, ___ assumes ___."* These scaffold writing production, do not reveal the observation, and are used as the opening rung of the `blank_page` ladder in §2.3.2.

**What this requires of the story.** Each (passage, lens) pair — where the lens has nonzero affordance — must support a stem like this. The test: *can a 6th grader fill in the blanks using content visible in the passage?* If the answer is no ("I noticed that in turn ___, [character] assumes ___" doesn't have anything to fill in because nobody visibly assumes anything in the passage), the passage isn't giving the prose agent anything to work with for that lens.

**Authoring test.** For each passage and each lens with nonzero affordance, try to fill in a generic stem: *"I noticed that in turn ___, ___ assumes ___"* or *"I noticed that ___ is missing ___"*. If you can't fill it in using specific passage content, the lens doesn't have enough to work with on that passage.

### 3.3 Episodes need a crystallized closing question (§2.4, `consensus_check[]`)

`consensus_check[]` is 1–2 short questions asked after group discussion: *"Did your group decide whether the article was good evidence? If not, what's the sticking point?"* These fire on the navigation event "group phase ending," not on state detection.

**What this requires of the story.** Episodes need a clear **closing question** — a thing the group was implicitly or explicitly trying to decide, that the episode either resolved or left unresolved. Meandering episodes without a clear "what was this episode about, and did we resolve it?" moment can't produce a non-generic consensus check.

**Authoring test.** For each episode, name in one sentence: *"By the end of this episode, the question on the table was X, and the characters' answer was Y (or: they failed to agree on Y)."* If you can't name it, the episode is unfocused.

### 3.4 Register shapes all three blocks (§2.4, capability flag `pedagogical_register`)

All three prose blocks are written in the story's declared `pedagogical_register`. §4 specifies the allowed values: `unfinished_not_wrong | neutral` (default: `neutral`). **Narrower than I claimed in the previous draft** — the flag isn't a free-form genre setting, it's a binary choice between "unfinished_not_wrong" (a specific pedagogical stance where reasoning is presented as in-progress rather than defective) and "neutral" (the default).

**What this means for you.** Register as a v2 constraint is narrower than I previously implied. You don't pick "investigative vs speculative vs character-driven" via `pedagogical_register` — that's genre, which is set in the prose body of the story design doc and flows through character voices, not through a flag. What the flag controls is the *pedagogical framing stance* of the prose agent's output: does it frame student reasoning as "unfinished" (growth-oriented) or "neutral" (assessment-oriented).

**General authoring advice on genre** (not v2-specific) lives in `story-design.md`. Pick your genre via the story's premise, voices, and stakes. It matters for the story's quality. It just doesn't hook into v2 via the `pedagogical_register` flag the way I previously suggested.

---

## Part 4 — What the discussion agent needs from your story (§2.5)

The discussion agent produces `discussion_cues[]` across three creative axes, indexed richly enough for the app to select cues per student based on the student's probe record from the individual phase. This is where v2's individual→group handoff works or fails.

### 4.1 The three creative axes and what each requires from the story (§2.5)

Every discussion cue fits one of three axes:

**1. Lens refraction** — the same observation viewed through a different related lens. *"Mira trusted the article because it sounded official. What would an Evidence-leaning student say is missing? What would a Scope-leaning student ask about who wrote it?"*

**Story requirement.** Moves must be **lens-crossable**. A beat that only makes sense through one lens — no plausible refraction to another — can only produce one-angle cues and the lens-refraction axis is starved. This ties back to the perspective-transitions requirement in Part 1.4: if the analyst can write `perspective_transitions[]` entries for a passage, the discussion agent can write lens-refraction cues for it.

**2. Persona projection** — *"What would character X ask?"* or *"What would absent character Y ask?"*

**Story requirement.** The cast must be **distinct enough that the question has a specific answer**. This is already in v1 cast rules (each character has 2–3 stable cognitive tendencies, a social-dynamic profile, and a lens disposition) but v2 makes it *mechanically* load-bearing: if a 6th grader can't answer "what would Priya ask?" with a specific lean, the persona-projection axis is flat.

This is the first v2 requirement that isn't a new rule but a *harder enforcement of an existing v1 rule*. V1 said cast voices should be distinct for good craft; v2 says the discussion agent actually needs them distinct to produce one of its three required output axes.

**Authoring test.** For each character in your cast, can you complete the sentence: *"Given a passage about X, [character] would most likely ask about Y because they tend to Z"*? The Y and Z should be specific. If every character would "ask about the evidence" the cast is undifferentiated.

**3. Stance inversion** — *"Defend the opposite. Argue that Mira was right to trust the article. What would you need to believe?"*

**Story requirement.** Positions must have a **steelman-able opposite**. A beat where a character is unambiguously, indefensibly wrong can't be stance-inverted — there's no intellectually honest defense to mount. Beats need to be *defensible from both sides*, with the character having picked the weaker defense.

**Authoring test.** For each beat where a character makes a mistake, can you write the opposite argument as something a thoughtful person could believe? If not, the beat is too cartoonish for stance-inversion to work on it.

**Implication.** This pushes against "embodied fallacy" characterization (v1 cast rule 2). A character who is *just* wrong produces unsteelmannable beats. A character who is wrong *because they believed a defensible thing that turned out not to apply here* produces beats where stance-inversion works. The harder form — genuine ambivalence — is the richer form.

### 4.2 Continuation chains depend on app-side probe records (§2.5, §2.7)

`discussion_cues[].continuation_of` is a `{turn, facet}` tuple (or `null`) that indexes group cues to individual-phase probe taps. At the group-phase transition, the app reads each student's probe record and fetches a cue with matching `continuation_of`, falling back to same-facet-different-turn, then to `continuation_of: null` on the student's most-engaged turn, then to generic openers for empty-history students.

**What this requires of the story.** Beats where a private-phase insight *naturally continues* into a group-phase discussion. Concretely: if the analyst will annotate turn 6 with `source_credibility`, the discussion agent needs to be able to write a group cue that picks up "you noticed Mira trusted the article — bring this to your group: what would have convinced her to check?" The cue's content has to *exist* as a plausible group discussion, not just exist as a cue-shaped text.

**The harder form.** For a really rich continuation, the group phase of the episode should have beats where bringing the private insight *actually changes the group conversation* — where someone arriving with "I noticed Mira didn't check the source" would move the group from "was Mira right?" to "what would checking the source have shown?" This is a story-arc decision: design the individual→group transition so that private insights have somewhere to go.

**The important caveat (§2.7).** The probe record is **app-owned state**. The pipeline writes the package assuming the app maintains `(turn, facet, explanatory_variable, rung_reached, timestamp)` records per student. **If the Lens app's first version doesn't implement probe-record tracking, rich continuation chains are wasted authoring.**

I should be honest about this: authoring continuation chains now is a bet that the app layer will catch up. It's a reasonable bet — §2.7 is explicit that the package is indexed for probe records — but it's not a certainty. If the pilot Lens runtime ships with generic group cues and no per-student routing, the continuation_of field populates the YAML without paying off at runtime.

**Authoring test.** For each beat where a student could arrive at a private insight, ask: *in the group phase, is there a place where someone arriving with that insight would actually change the conversation?* If yes, the continuation chain has a target. If no, the cue would be a hollow pointer.

### 4.3 The intervention↔cue rule is the real cross-file constraint (§2.6)

The merge script enforces: *for every `(turn, facet)` intervention cell with `role: present` or `role: afforded_missing`, there is at least one `discussion_cues` entry whose `angle` equals that facet.*

**In English.** Every facet the analyst calls out as present or afforded_missing must have at least one group-phase discussion cue about it. **You cannot have a private-phase facet that is terminal — something the student notices and then nothing can be said about it in the group phase.** If the merge script finds a dead-end facet, the package fails integrity and the episode is not considered complete.

**What this requires of the story.** For every facet you carry, you must be able to imagine a group conversation about it. "Mira trusted the article" → group can discuss what trust requires. "Nobody asked who this affects" → group can discuss scope. Beats where the facet is genuinely private — the kind of thing that would occur to someone alone but has no obvious group continuation — break this rule.

In practice this is usually easy; most facets have obvious group discussion. But it is a hard merge-script check, and it should be validated at the design-doc stage, not discovered at the merge step.

**Authoring test.** For each facet you plan to carry in a passage, ask: *can I imagine a plausible group-phase discussion cue about this facet, for this specific turn?* If not, drop the facet or pick a different turn.

### 4.4 Per-passage cue-cover rule — empty-history guarantee (§2.6)

For every lens with `affordance ∈ {moderate, rich}` on a passage, there must be at least one `discussion_cue` with `continuation_of: null` whose `lens` matches. This is the empty-history-student guarantee: a student who skipped the individual phase or blanked out on it still gets a relevant group-phase opener per lens.

**What this requires of the story.** Passages that afford a lens well must support a general opening cue for that lens, independent of any specific student insight. This is usually trivial — if a lens is moderately or richly afforded, there's always *something* general to say about it — but it ties back to the lens-visibility requirement in Part 1.3.

---

## Part 5 — Capability flags (§4)

§4 lists five capability flags beyond coverage. Each is an authoring commitment, not a free toggle. Flipping a flag on means committing to the authoring requirement it gates.

- **`pedagogical_register: unfinished_not_wrong | neutral`** (default `neutral`). Shapes prose-agent and discussion-agent tone. Narrow binary choice. Not genre. See §3.4 above.
- **`uses_character_growth: true | false`** (default `false`). Turns on `growth_beats` (episode-level) and `character_arc_position` (passage-level) in `diagnostic.yaml`. Requires growth arcs authored per v1 cast rule 4 (at most two growing characters) and tracked by `story_consistency_reviewer`.
- **`declares_calibration_warnings: true | false`** (default `false`). Turns on the merge script's lifting of a `## Calibration warnings` section from the story design doc. If flipped on, the story design doc must contain this section with entries the merge script can lift verbatim.
- **`uses_stance_positions: true | false`** (default `false`). Turns on `stance_positions[]` in the diagnostic agent's per-passage output. Used for stories where explicit pro/con framings are pedagogically load-bearing.
- **`supports_jigsaw: true | false`** (default `false`). Turns on `discussion.jigsaw_fragments[]`. If flipped on, the story must afford all three lenses strongly enough that `lens_visibility.what_shows` is substantive per lens per passage — the merge script sources jigsaw fragments from `what_shows` (§2.5).

**Authoring principle.** Default to all flags off. Turn on only the ones your story actually needs. Flags that are on but not exercised produce either empty fields (wasting schema space) or forced content (wasting authoring effort on fields that aren't earning their place).

---

## Part 6 — What does *not* apply specifically to v2

Several things I previously listed as v2 constraints turn out not to be v2-specific:

- **Genre choice.** Picking investigative vs. speculative vs. character-driven is general story-design advice. It affects quality in both v1 and v2. The `pedagogical_register` flag is not the lever for genre — it's a binary pedagogical-framing choice. Treat genre as a quality decision, not a v2 requirement. See `story-design.md`.
- **Distributing reasoning moves across many turns.** §2.1 explicitly endorses concentration: empty turn_annotations entries are legitimate positive assertions. Load-bearing turns can pile up in one part of the passage; the constraint is that *load-bearing* turns are multi-interpretable (§2.3.1), not that load is uniform.
- **Cast voice distinctness.** Already required by v1 cast rule 5 (models three lens dispositions). V2 makes it mechanically load-bearing (persona-projection axis, §4.1 above) but doesn't add a new rule.
- **Arc with momentum.** Already required by v1 rubric item 3 and general craft. V2's `connects_to.echoes[]` / `prior_exposure` mechanism rewards it at the structural level, but the rule itself is not new.

---

## Part 7 — A worked example under v2 design

Suppose the story design doc establishes **Mira** as a Logic-leaning character who tends to treat authority-sounding statements as settled, and **Jordan** as an Evidence-leaning character who tends to acquiesce under social pressure rather than push back. The story's register is investigative — a student newspaper investigating a school water-testing report.

**Episode 2 passage 1 beat.** Mira, quoting a PTA newsletter article, states that the water testing was "done by a certified lab last month." Jordan starts to ask "which lab?" but Mira moves on and the group follows.

Now walk the §2 requirements:

- **`facets_present[]` (§1.1).** Turn 4: Mira, `source_credibility` (weakness). Evidence turns: t4, t6. One-line: "Mira cites 'certified lab' as settled without naming the lab or its certifier." That's cite-able and specific.
- **`facets_absent_but_tempting[]` (§1.2).** `relevance` is tempting because the student might first wonder "is the article even about our school's testing?" `why_tempting`: "the PTA newsletter might cover lots of schools." `why_wrong`: "the article explicitly names our school, so relevance is satisfied; the real issue is where the claim about the lab comes from."
- **`lens_visibility` (§1.3).** Evidence: `(engagement: none, affordance: rich)` — the article has a specific checkable claim; nobody in the group checks it. **This is an afforded-missing cell.** Logic: `(engagement: partial, affordance: moderate)` — Mira is reasoning, just badly. Scope: `(engagement: none, affordance: thin)` — the passage doesn't really open "who else does this affect" as a natural move.
- **`perspective_transitions[]` (§1.4).** From Evidence to Logic: "if a student is looking at the evidence gap, they might realize Mira's own reasoning — 'it sounded certified, so it was' — is a logical leap from the name of the newsletter to the quality of the claim." That's one transition. You could write a second from Logic to Scope.
- **`counterfactuals[]` (§1.5).** `source_credibility`: "On turn 4, Mira could have said 'the newsletter quotes a certified lab — which one? let's look it up' instead of 'a certified lab did it last month.'" Turn-specific, behavior-specific.
- **`causal_layer` / interaction (§1.7).** `source_credibility` is one of the eight social-inflected facets, so `cognitive_only` is illegal. `interaction: cognitive_amplified_by_social`. `interaction_note`: "Mira's authority_deference to the newsletter makes her uncritical_acceptance of the 'certified lab' claim socially unchallengeable, because Jordan's move to ask 'which lab?' is deflected by the group's willingness to move on." Both `uncritical_acceptance` (cognitive) and `conflict_avoidance` (social, on Jordan's side) are at work.
- **Orientation probe options (§2.1 Part 2).** Turn 4 probe can support:
  1. "Mira trusted the 'certified lab' without asking which lab" → `source_credibility, present`
  2. "Nobody asked to see the actual report" → `source_credibility, afforded_missing` (same facet, different reading)
  3. "Maybe the article isn't even about our school" → `relevance, tempting_absent`
  4. "I'm not sure what I'm noticing" → `blank_page`
- **Lifted ladder rungs (§2.2 Part 2).** The `source_credibility` present cell's worked-example rung is lifted from `counterfactuals[]`: "Mira could have said 'which lab?'..." The `lens_switch` rung is lifted from `perspective_transitions[]`. The `redirect` rung on the `relevance` tempting-absent cell is lifted from `facets_absent_but_tempting[relevance].why_wrong`: "the article explicitly names our school, so relevance is satisfied..." All three rungs populate for free from the ground_truth work.
- **`has_explanation_depth` (§2.4 Part 2).** This beat has non-trivial interaction (`cognitive_amplified_by_social`), so it deserves depth. The explanation probe at t4.source_credibility asks "why do you think Mira believed it so easily?" with options routing to `cognitive` (uncritical_acceptance), `social` (authority_deference to the newsletter), `interaction` (both at once), and `tempting_absent` (a misreading the agent has to decide on).
- **`discussion_cues[]` axes (§4.1 Part 4).** All three axes produce content:
  - **Lens refraction:** "Through the Logic lens, what was wrong with going from 'the newsletter says certified lab' to 'a certified lab did it'?"
  - **Persona projection:** "If Jordan had pushed back instead of acquiescing, what would she have asked?"
  - **Stance inversion:** "Defend the opposite: argue that Mira was right to trust 'certified lab.' What would you need to believe about the PTA newsletter to justify that?"
- **Continuation chain (§4.2 Part 4).** A student who tapped the `source_credibility, present` option at turn 4 continues into the "bring this to your group: what would have convinced Mira to check?" group cue.
- **Cross-file rule (§4.3 Part 4).** Every facet called out as present or afforded_missing (here: `source_credibility`) has at least one discussion cue with `angle: source_credibility`. ✓

Notice what made this work: the beat was *designed* with multi-readability in mind. A single turn supports a present reading, an afforded-missing reading, and a tempting-absent reading, under a real social-cognitive interaction, with a turn-specific counterfactual and a crossable lens. That's the density v2 wants at load-bearing turns. The rest of the episode's turns can be narrative fabric with empty annotations — that's fine.

**What would have made this beat under-exercise v2.** A beat where Mira was just wrong in isolation (no Jordan, no group moving on, no interaction — pure `cognitive_only` on a facet where that's illegal). A beat where the counterfactual was "Mira should have been more careful" (generic, not turn-specific). A beat where no lens transition was available (Evidence was the only lens in play). A beat where the `why_wrong` on `relevance` was hand-waved ("it's just not relevant") instead of specific ("the article explicitly names the school"). Any of these shortcuts thins the ground_truth, which thins the ladders, which thins the discussion cues, all downstream.

---

## Part 8 — The authoring workflow for v2

The short version:

1. **Read `story-design.md` first.** Cast bounds, coverage contract, prose-first authoring, information barrier, per-episode draft template. That's the upstream foundation.
2. **Pick genre and register.** Genre in the story design doc's prose; `pedagogical_register` flag if `unfinished_not_wrong` vs `neutral` matters for your teaching stance. Genre is a quality decision, not a v2 requirement.
3. **Design the cast** per v1 cast rules — but specifically check that each character would answer "what would X ask about this?" with a specific, different lean, because v2's persona-projection axis needs it (§4.1 Part 4).
4. **Sketch the arc** as a 5-episode sequence (for a pilot), with explicit attention to which episodes echo earlier ones (feeds `prior_exposure`, §1.8 Part 1).
5. **For each episode, draft 2–4 passages** where each passage:
   - Has 2–4 load-bearing turns, each multi-interpretable (§2.1 Part 2).
   - Affords at least one lens transition (§1.4 Part 1).
   - Has a discrimination surface (§1.2 Part 1).
   - Ideally has at least one afforded-missing cell (§1.3 Part 1).
   - Carries facets whose counterfactuals you can write as turn-specific, behavior-specific sentences (§1.5 Part 1).
   - Carries facets whose social dynamic you can name and whose interaction you can describe (§1.7 Part 1) — for 8 of 10 facets, this is a hard requirement.
6. **For each episode, draft a one-paragraph opening and a one-sentence closing question** — if you can't, the episode is under-crystallized (§3.1 and §3.3 Part 3).
7. **Run `validate_story.py`** for coverage closure, rotation, lens distribution. These checks are v1/v2 shared.
8. **Run `story_consistency_reviewer`** for prose-on-prose character consistency. Also v1/v2 shared.
9. **Only then run `/create_episode` + `/create_transcript` on episode 1.** That produces the baseline artifact for Stage A of the v2 implementation plan.

**Do not use `/brainstorm`.** That skill was built against v1's authoring surface and elicits signals in v1's vocabulary. Use a free-form authoring conversation with this document as the design lens.

---

## Part 9 — Caveats and pre-implementation status

Several things in this document are **predictions, not observations**, because v2 has not run yet:

- **The §2 schemas do not exist as YAML yet.** They're specified in prose in `pipeline-revision-plan.md` §2. The actual YAML schemas will be authored in Stage C of the implementation plan, alongside hand-authored gold files. Some §2 details will crystallize differently in Stage C than they read now. When that happens, this document needs revision.
- **The Lens app runtime may not implement everything the package supports.** §2.7 is explicit that the probe record is *app-owned state*. If the first Lens runtime ships without `(turn, facet, explanatory_variable, rung_reached)` tracking, rich continuation chains are wasted authoring. This is a reasonable risk to take — the package schema is forward-looking, and the app will catch up — but it is a risk worth naming.
- **The pilot session is the first empirical test of this document.** If the pilot reveals that some constraint here is wrong in practice (e.g., multi-interpretable turns turn out to produce probes that confuse 6th graders, or lens-crossability is harder to author than predicted), revise the constraint. The appendix below is the placeholder for those revisions.
- **§2 may change during Stage C.** If it does, the spec-cascade rules in `pipeline-revision-implementation.md` §III.4 apply, and this document needs to be re-checked.

## Part 10 — Where to look next

- **Upstream authoring guide:** `story-design.md` (cast, coverage, barrier, drafts — the shared foundation).
- **Assistive package schema spec:** `pipeline-revision-plan.md` §2 (the ground truth for this document).
- **v2 pipeline architecture:** `pipeline-architecture.md` (the design rationale).
- **v1→v2 diff:** `pipeline-v1-to-v2-migration.md`.
- **Implementation runbook:** `pipeline-revision-implementation.md`.
- **Per-episode draft template:** Appendix B of `story-pipeline-revision.md`.
- **Validator:** `framework/pipeline/scripts/validate_story.py`.
- **Prose-on-prose reviewer:** `framework/pipeline/agents/story_consistency_reviewer.md`.

---

## Appendix: Feedback from the first v2 pilot

*Empty until the first pilot is authored and run end-to-end. After the pilot session, the operator revises this document section-by-section, noting which constraints translated, which didn't, which tests were useful, and which were noise. Only then does this guide become stable reference material.*
