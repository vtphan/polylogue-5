# Story Design (v2)

**Status.** Pre-implementation draft. Describes how to author a Polylogue story **for the v2 pipeline** (`/build_assistive_package`), which is not yet implemented. Written *before* the v2 pipeline runs, so some guidance here is informed prediction rather than observed reality. Expect this document to be revised after the first v2 pilot story is authored and run end-to-end — the pilot session is also a feedback pass on this guide. See `pipeline-v1-to-v2-migration.md` for the v1→v2 pipeline diff and `pipeline-architecture.md` for the v2 design rationale.

**For v1 story authoring**, see `story-design.md`, which remains the reference for stories authored against the currently-live v1 pipeline.

---

This document is operator guidance for designing a Polylogue story under the episodes-first authoring model, **targeted at the v2 pipeline's assistive package**. It is written for the person sitting at the keyboard authoring a story design doc and per-episode drafts, and the curriculum coordinator reading over their shoulder. It is not a schema reference and not a pipeline runbook.

A story is the unit of curriculum the pipeline produces. The v2 system enforces structural requirements (cast bounds via prose review, coverage contract via the validator, mixed-valence rotation via the validator) — these are unchanged from v1. What v2 adds is a **richer runtime affordance surface** that rewards stories designed to exploit it. A v2 story that merely passes the validators but doesn't take advantage of the assistive package is a missed opportunity: the pipeline will technically work, but the resulting runtime will be shallow where v2 is designed to be deep. This document is about designing stories that give v2 something to operate on.

## The v2 design lens

> **Read this section before anything else.** These five affordances reshape what a "good story" means for v2. They are story-shape decisions — made at the design-doc level, before any per-episode draft exists. You cannot bolt them on later. Get them right at the doc level and the drafts fall out naturally; get them wrong and no amount of draft-stage editing will recover.

### 1. Afforded-missing as first-class

The v2 pipeline treats `(engagement: none, affordance: rich)` passages — moments where a lens is richly available but the characters walk right past it — as the **pedagogically most valuable case**. In v1 these were annotated as "blindspots" but had no special runtime structure. In v2 they become `tempting_absent` intervention cells at maximum urgency. The diagnostic agent's richest structure fires here.

**For authoring.** Deliberately build in moments where one or more lenses *would have illuminated the situation* but no character takes that move. The miss must be genuine (the lens is plainly available in the text) and consequential to the story. Investigative and mystery genres are natural fits: the detective who ignores the obvious clue, the witness whose testimony contradicts itself in plain sight, the team that fails to ask "who benefits."

**Test.** For each passage, ask: *if a 6th grader read this and noticed [lens X], would they be noticing something the characters missed?* If "no, the characters already covered it," the passage has no afforded-missing cell. A story where every passage is "characters reasoned well" starves v2's richest runtime structure.

### 2. Causal layer with real interaction

The v2 `ground_truth.yaml` requires every passage's causal layer to specify how a cognitive pattern and a social dynamic *interact*, not just co-occur. "Confirmation bias was present and group pressure was also present" is not enough — the analyst agent has to write down *how the social dynamic shapes the cognitive pattern* (or vice versa) for that specific moment.

**For authoring.** Your story arc needs beats where the cognitive and social layers *do real work on each other*. Group pressure that *weaponizes* confirmation bias is interaction. Authority deference that *protects* a false cause is interaction. Conflict avoidance that *suppresses* the one character with the relevant evidence is interaction. Two patterns in the same room is not interaction.

**Test.** For each passage, ask: *can I write one sentence of the form "the [social dynamic] makes the [cognitive pattern] worse / harder to escape / more rewarding"?* If you can't, the interaction isn't there yet.

### 3. Continuation chains for individual→group handoff

V2's discussion cues are indexed by `continuation_of: (turn, facet)` so the runtime can route a student who noticed something privately into a group discussion that builds on their specific insight. This only works if your story has beats that **reward private noticing** and then become **group-conversation leverage**.

**For authoring.** Find moments where a student reading alone could arrive at a reading the characters missed (affordance 1 territory), then design the next beat so that someone bringing that reading to a group conversation would *change the conversation*. The chain is: private insight → group entry point → discussion shifts. Stories where every insight is either obvious-to-everyone or terminal (nothing builds on it) starve the continuation chain.

**Test.** Walk through your episode arc and mark every passage with a candidate "private insight." In the next group-phase beat, is there a place where a student arriving with that insight would have something to say — and would the cast respond to it? If most answers are "no, the next beat moves on," your continuation chains will be thin.

### 4. Turn-anchor granularity

V2 keys every intervention cell on `(turn, facet)`. Stories where reasoning moves are concentrated into one or two passages give the per-turn intervention dictionary very little room — most turns become "no facet load-bearing here, skip." Stories where reasoning moves are *distributed across many turns* give the dictionary something to do at every step.

**For authoring.** Resist the temptation to pile the dramatic weight into one big confrontation passage. Spread reasoning shifts across turns. A character should be making a small reasoning move — a dismissal, an unsupported leap, a quiet reframe — every two or three turns, not just at the climax. The emotional arc can still pile into one moment, but the *reasoning* arc should be distributed.

**Test.** Count load-bearing facet moves per episode. v2 wants more, smaller moves rather than fewer, bigger ones.

### 5. Register and genre as deliberate choice

The `pedagogical_register` capability flag is v2's lever for tonal range. V1 stories were authored in a default earnest civic-realism register (maker space, civic meeting, park sightings). That register is workable but not the only one available, and 6th graders are not a uniformly civic-minded audience. V2 lets you pick a register and have the prose agent and discussion agent both honor it.

**For authoring.** Pick a genre and register **first**, before drafting episodes. Investigative (detective, journalism, forensic), speculative (near-future, alternate-history, science-as-mystery), or character-driven (relationship conflict where reasoning moves are the substance of the conflict) each change what the prose agent can do. The choice should be load-bearing on the rest of authoring — a detective story makes affordance 1 (afforded-missing) practically free, a speculative story makes affordance 2 (interaction) easier to dramatize, a character-driven story makes affordance 3 (continuation chains) feel natural.

**Test.** If you can swap your story's setting from a maker space to a detective's office to a moon colony and nothing about the reasoning beats changes, the register isn't load-bearing — you're writing a v1-shaped story in a v2 wrapper.

### These are story-shape decisions, not annotations

You will be tempted to write a story you already had in mind and then "annotate it for v2" at the per-episode-draft stage. This does not work, for the same reason adding a coverage contract at draft time doesn't work — by the time the prose exists, the affordances either are or aren't there, and you cannot retrofit them without rewriting beats. The five affordances above are checks on the **story design doc**, before any per-episode draft is written.

---

## What a Polylogue story is

**Story.** A self-contained multi-episode narrative with a fixed cast, an arc across episodes, and a declared coverage contract. A story is captured in two kinds of artifact, both authored as prose:

- **The story design doc** at `framework/stories/{story_id}.md`. Markdown with YAML frontmatter at the top (`story_id`, `title`, `coverage_mode`, `declared_facets`, `declared_cognitive_patterns`, `declared_social_dynamics`, `episode_count`) plus a prose body (premise, setting, cast, arc summary, stakes, pedagogical commitments, **declared register**, and **which of the five v2 affordances the arc leans on hardest**). The frontmatter is the machine-readable contract; the prose body is the source of truth for character identity and register.
- **The per-episode drafts** at `framework/stories/{story_id}/episode_{NN}.md`, one per episode. Each draft has YAML frontmatter (the operator's authoring artifact for one episode — see Appendix B of `framework/docs/story-pipeline-revision.md`) plus a prose body (beats, authorial notes, why-these-targets). The frontmatter schema is the same as v1; what changes is what you *aim the signals at* — see §Designing for the assistive package below.

**Episode.** One discussion within a story. Each episode is generated by the v2 per-episode pipeline (`/create_episode` → `/create_transcript` → `/build_assistive_package`; app-layer configuration happens outside the pipeline) and lives at `artifacts/{story_id}/episodes/episode_{NN}/`.

**Cast.** The recurring characters defined in the story design doc's prose. Each character is described in narrative terms — voice, the way they reason, their lens disposition, and any growth arc they have. There is no separate cast schema; the design doc IS the cast definition.

The **design inversion** carries over from v1 intact: design a cast you find interesting, plan an arc that surfaces their tendencies in different episodes, then check that the cast collectively covers what the framework requires. V2 adds one further inversion on top: the arc should also be shaped by which of the five affordances you're leaning on. An arc that doesn't exploit at least two of the five is under-designed for v2.

## The cast: six design rules (unchanged from v1)

These rules are load-bearing — `story_consistency_reviewer` checks them as it reads the design doc and per-episode drafts together — and they encode design wisdom you should believe in, not merely satisfy.

1. **The cast collectively carries the declared coverage.** Not in every episode — somewhere in the season. A facet can appear as a target weakness in episode 2 and as a target strength in episode 4. What is forbidden is declaring coverage of something the cast cannot plausibly carry.

2. **No character is an embodied fallacy.** Each character carries 2–3 cognitive tendencies and contributes to one social dynamic. Tendencies surface or stay dormant depending on the situation. Real people have several flaws and several strengths and the situation determines which ones show up.

3. **Each character has at least one stable strength they reliably bring.** Strengths are not consolation prizes for weak characters. They are how the cast teaches that good reasoning is a practice everyone is capable of.

4. **At most two characters in the cast have visible growth arcs.** Constancy is the default; growth is the exception. Growth is dramatically expensive and students need stable reference points.

5. **The cast collectively models the three lens dispositions** (Logic-leaning, Evidence-leaning, Scope-leaning). None of these labels ever appear in dialog, but the cast should *embody* them. A cast where everyone reasons the same way cannot teach perspectival learning.

6. **Cast size is bounded: 4–6 characters total, 2–3 leads per episode.** For a focused-coverage pilot, five characters is the right number. Six characters across 5 episodes weakens the "recurring cast students recognize" rationale.

**Strength-carrier and weakness-carrier rotation.** Strength carriers rotate explicitly across episodes; `validate_story.py` computes per-character counts and fails the story if any one character carries more than half. The same rule applies to weaknesses. This is the explicit answer to the legacy regression where the same persona always "won" and "lost."

## Cast prose and growth

Cast tendencies live in **prose** in the story design doc. Each character gets a section describing how they reason: voice, the cognitive moves they tend to make, the social dynamic they tend to drive or absorb, and (if they have a growth arc) the inflection that shifts how they reason mid-story.

There are no episode-indexed tendency fields and no `signal_template` machinery. The cast is defined in narrative; per-episode behavior is captured in the per-episode drafts; `story_consistency_reviewer` reads both as prose and checks that they agree.

**V2 note on voice and register.** In v2, the character's voice must also be consistent with the declared register. A detective-fiction story can't have a character whose voice is pure civic-meeting earnestness — the register would collapse. Pick voices that the register supports and the register supports back.

## The coverage contract (unchanged structure, new emphasis)

A story declares either `full` or `focused` coverage in the design doc's YAML frontmatter.

- **Full coverage** commits the story to covering all 10 facets, all 8 cognitive patterns, and all 3 social dynamics across its episodes. Default ambition for 6+ episode stories.
- **Focused coverage** declares a subset. The focused floor is hard: at least 3 facets, at least 1 cognitive pattern, at least 1 social dynamic.

**V2 note on the coverage contract.** The facet-pattern-dynamic inventory is unchanged. What changes is that a v2 story should aim for coverage entries where the facet is plausibly *afforded-missing* in at least one passage (affordance 1), and where the declared cognitive pattern and social dynamic *interact* rather than just co-occur (affordance 2). A coverage contract technically closes if you have any facet anywhere; it closes *for v2* if the way you carried that facet gave the assistive package something to work with.

**What `validate_story.py` checks** (unchanged from v1):
- *Coverage closure* (facets, patterns, dynamics across the season; every facet both as weakness and as strength somewhere).
- *Lens distribution* (each of logic/evidence/scope primary in at least one episode; no lens primary in more than half).
- *Mixed-valence shape rotation* (no single shape more than half the episodes).
- *Strength rotation* and *weakness rotation* per character.
- *Hedged-annotation rule* (post-Phase-7; every declared pattern/dynamic needs at least one unhedged annotation).

The hedged-annotation rule deserves the same warning it got in v1: **the correct response to coverage failure caused by persistent hedging is to revise the per-episode draft or the design doc so the evidence becomes unambiguous — not to pressure the agents to commit harder.** If the same pattern keeps coming back hedged, the cast cannot actually carry it in the situations the arc puts them in, and the design needs revision.

## What `story_consistency_reviewer` checks

Prose-on-prose review, unchanged from v1. It reads the design doc and every per-episode draft and checks character consistency, voice consistency, earned growth beats, and rubric items 1–8 from Part 10 of `story-pipeline-revision.md`. Item 9 ("moment of surprise") stays human-only.

Invoked after each new episode draft, as a final pass before Phase 7, and after any re-planning loop.

The eight rubric items:
1. Concrete and personal stakes?
2. Cast small and distinct?
3. Arc with momentum?
4. Coverage contract closes?
5. Mixed-valence varied?
6. Ending earns its lack of tidy resolution?
7. Any character feel like an embodied fallacy?
8. Would a 6th grader want to know what happens in episode 4 after reading episode 3?

Items 1, 4, and 7 are not-ready conditions. The others are improvement targets.

**Item 9**, the one the agent will not check: "Is there at least one moment of genuine surprise — a character doing something unexpected but in-character?" You have to put this in by hand. V2 gives you an extra tool for surprise: an afforded-missing cell is a natural home for one, because the miss itself can be the surprise.

## Designing for the assistive package

This section replaces v1's worked example. Where v1 walked through how a cast tendency translates into a per-episode draft signal, v2 walks through how the same translation also has to *load* the assistive package. Same frontmatter schema, different authoring strategy.

Suppose the story design doc establishes **Maya** as a Logic-leaning character who tends to overstate how settled a question is — she remembers a single source and treats it as the whole record. The design doc also declares the story's register as **investigative** (a student newspaper investigating a local claim) and notes that Maya's tendency is most dangerous when combined with her deference to an older student, Kai, whom she treats as an authority.

Episode 2 targets `sufficiency` as a facet weakness under the Evidence lens, with Maya as the carrier. The v1 draft would write a `cognitive_signal` and a `social_signal`; v2 wants the same fields but aimed at the assistive package:

```yaml
- facet: sufficiency
  lens: evidence
  carrier: Maya
  cognitive_pattern: false_certainty
  social_dynamic: authority_deference
  cognitive_signal: >
    Maya cites a single article Kai showed her last week as if it settled
    the question of whether the school's water-testing report is credible,
    and dismisses Jordan's request for more sources as overcautious.
  social_signal: >
    Maya frames her certainty as "Kai already looked into this," and Jordan
    backs off because contradicting Maya would mean contradicting Kai. The
    missing-sources question goes unasked for the rest of the passage.
```

The v1-valid reading of this signal is: Maya displays `false_certainty`, Jordan's acquiescence is `authority_deference`, and `sufficiency` is underweighted. The v2-valid reading adds:

- **Afforded-missing (affordance 1).** The Evidence lens is richly available in this passage — there's a specific, checkable claim (a water-testing report). No character asks "what's in the report?" That's an afforded-missing cell. A student reading this will feel the absence if they're watching for it.
- **Real interaction (affordance 2).** The `authority_deference` is not happening *alongside* the `false_certainty`, it's **propping it up**. Maya's certainty is load-bearing on her deference to Kai. The interaction sentence writes itself: *Maya's deference to Kai makes her false certainty socially unchallengeable.* That's the kind of interaction the analyst agent needs for `ground_truth.causal_layer`.
- **Continuation chain (affordance 3).** A student who notices "Maya never asked what's in the report" is holding a reading that can become the group phase's opening. The next beat can be designed so that a student who brings up "what about the report itself?" changes the conversation — moving the group from "do we trust Maya's source?" to "what does the source actually say?"
- **Turn-anchor granularity (affordance 4).** This episode should have three or four other load-bearing moves before and after this one — Kai's earlier framing, Jordan's acquiescence, a later beat where Maya almost catches herself — not just this one big moment. Distribute the reasoning.
- **Register (affordance 5).** The investigative register makes all of the above practically free. A maker-space story would have to work harder to stage a missed-evidence moment that lands.

If episode 2 instead tried to assign Maya `confirmation_bias` (a pattern not established in the design doc), `story_consistency_reviewer` would flag the drift. And if the interaction sentence couldn't be written — if `authority_deference` and `false_certainty` were just both present without one supporting the other — the analyst agent would produce a weak causal layer at Phase 7, and the diagnostic agent's interventions for this passage would be correspondingly shallow.

**The point.** In v1 the question is "does this signal accurately describe a move in Maya's voice?" In v2 the question is "does this signal *and the beat it sits in* load the assistive package's richest structures?" Same frontmatter, deeper demand.

## The information barrier, briefly

Unchanged from v1. The dialog writer receives only a barrier-safe projection (`episode_writer_input.yaml`) — no facet IDs, no lens names, no cognitive pattern or social dynamic labels. Your `cognitive_signal` and `social_signal` prose must be **stage directions, not analysis.** "Maya cites one article as if it settled the question" projects cleanly. "Maya exhibits false_certainty driven by authority_deference" either gets stripped (losing steering) or leaks (breaking the barrier).

Two enforcement mechanisms run on every projection: a literal scan in `validate_schema.py` and the `projection_reviewer` agent. Neither alone is sufficient.

The v2 analyst, diagnostic, prose, and discussion agents all run *outside* the projection boundary — they see full framework vocabulary. Only the dialog writer is on the inside. This means your v2 affordances can be discussed freely in the design doc and per-episode draft prose body (the reviewers read those), but still must not appear in cognitive_signal / social_signal fields in the form of labels.

## Where to start

**Do not use `/brainstorm` for v2.** That skill was built against v1's authoring surface. Use a free-form authoring conversation instead, with this document as the design lens.

Start with a **register choice** (affordance 5), not a premise. The register will constrain the premise in productive ways. Some register seeds that v2 is designed to do well:

- **Investigative** — student journalism, amateur detective work, a small mystery to solve. Makes afforded-missing (affordance 1) practically free because the genre *is* noticing what was missed. Makes continuation chains (affordance 3) natural because investigations build on each other's findings.
- **Speculative** — near-future, alternate-history, a science-as-puzzle premise. Makes interaction (affordance 2) easy to dramatize because the stakes often depend on *how* pressures combine. Risk: speculative settings can feel abstract to 6th graders if the stakes don't land locally.
- **Character-driven** — a conflict where the substance of the fight *is* the reasoning. Friends disagreeing about whether to believe a shared acquaintance; a family decision where each person is interpreting the same evidence differently. Makes continuation chains (affordance 3) feel natural.

**Do not start with a civic-realism frame** unless you can articulate which of the five affordances that register is going to carry better than the alternatives. The v1 pilots showed that civic-realism works but does not lean into v2's strengths.

Once you have a register, write the **premise** (1 paragraph), then the **cast** (5 characters in the prose style v1 used), then the **arc** (5 episodes, each with a sentence about which affordances it leans on), then the **coverage contract** (full or focused, declared inventory). Only then start per-episode drafts.

Expect a revision pass on the design doc as a result of writing the per-episode drafts. That's normal — the drafts reveal which affordances actually show up vs. which you claimed would.

## The two artifacts and how they relate

The **story design doc** is the vision and the source of truth for character identity and register. Written for humans, used for pitching to teachers, used for onboarding new operators, used as the prose context every reviewer consults.

The **per-episode drafts** are the authoring artifacts for what happens in each episode. The frontmatter is what `/create_episode` consumes; the prose body is what `story_consistency_reviewer` reads.

The two should not drift apart. If `story_consistency_reviewer` surfaces drift, revise either the design doc or the offending episode draft (or both). Expect at least one revision pass on the design doc as a result of writing the per-episode drafts.

## What does *not* change in v2

Cast bounds, mixed-valence rotation, prose-first authoring, the per-episode draft template, the coverage contract's structural checks, the information barrier, the role of `story_consistency_reviewer`. V2 adds requirements (the five affordances, register as a first-class choice); it removes none.

## Where to look next

- **Per-episode draft template:** Appendix B of `framework/docs/story-pipeline-revision.md`.
- **v2 pipeline architecture:** `framework/docs/pipeline-architecture.md` — the design rationale for the assistive package.
- **v2 schemas:** `framework/docs/pipeline-revision-plan.md` §2 — the schemas the agents produce.
- **v1→v2 diff:** `framework/docs/pipeline-v1-to-v2-migration.md`.
- **v1 story-design guide:** `framework/docs/story-design.md` — still the authoritative reference for the carry-forward rules and for stories authored against the v1 pipeline.
- **Validator:** `framework/pipeline/scripts/validate_story.py`.
- **Prose-on-prose reviewer:** `framework/pipeline/agents/story_consistency_reviewer.md`.

---

## Appendix: Feedback from the first v2 pilot

*Empty until the first pilot is authored and run. After the pilot session, the operator revises this document with what was learned — which affordances translated, which didn't, which tests were useful, which were noise. Only then does this guide become stable.*
