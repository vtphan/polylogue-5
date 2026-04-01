# Scenario Sequence: Anchor + Breadth (Structure C)

## Rationale

This sequence uses two **anchor facets** — relevance and counter-argument engagement — that appear in the first scenario and return later at higher subtlety. Between the anchors, three scenarios introduce the remaining four Core facets and two Extend facets.

### Why These Anchors

Relevance (Evidence lens) and counter-argument engagement (Scope lens) are the two Core facets with the highest cross-lens visibility:

- **Relevance** is also visible through Logic — students perceive the evidence-claim mismatch as an inferential gap. This means an Evidence student and a Logic student will see different things in the same passage, producing rich perspectival diversity in peer exchange.
- **Counter-argument engagement** is also visible through Evidence and Logic — students can perceive a dismissed argument as unsupported (Evidence) or as an incomplete argument (Logic).

High cross-lens visibility makes these facets ideal for early sessions, where the Evaluate → Peer exchange needs to work well for students to see the value of different lenses. They're also the most intuitive facets — students readily grasp "the evidence doesn't match" and "they ignored a good point" even before developing formal vocabulary.

### Why Anchor + Breadth

- **Depth on anchors:** Students see relevance and counter-argument engagement twice each, at increasing subtlety. The first encounter (Scenario 1) has accessible signals. The return (Scenarios 4 and 5) has subtler signals, requiring sharper observation and more nuanced explanation.
- **Breadth across Core:** Scenarios 2 and 3 introduce the remaining four Core facets (sufficiency, source credibility, inferential validity, perspective breadth), ensuring all six are covered.
- **Extend facets as companions:** When anchors return in Scenarios 4 and 5, they're paired with Extend facets (condition sensitivity, consequence consideration). This models the natural progression — students who have practiced noticing evidence-claim mismatch are ready to notice boundary conditions; students who have practiced noticing dismissed arguments are ready to notice missing consequences.
- **No 3-persona scenarios:** All scenarios use 2 personas. This keeps generation quality consistent and avoids introducing social complexity that could obscure the facet signals. A 3-persona capstone could be added as a 6th scenario if the pilot warrants it.

### Progression Logic

```
Scenario 1: Anchor introduction (accessible signals)
Scenario 2: New Core facets (accessible)
Scenario 3: New Core facets (moderate — inferential validity has low cross-lens visibility)
Scenario 4: Anchor return + Extend (subtler relevance signal)
Scenario 5: Anchor return + Extend (subtler counter-argument signal)
```

The difficulty increases through two mechanisms:
1. **Signal subtlety** — Scenarios 4 and 5 design weaker, more naturalistic signals than Scenarios 1 and 2
2. **Cross-lens visibility** — Scenario 3 includes inferential validity, which has the lowest cross-lens visibility of any Core facet (Logic-specific, rarely visible through other lenses). This is the hardest observation task in the sequence.

---

## Sequence Overview

| # | Scenario | Facets | Lens Pair | Cognitive Patterns | Social Dynamics | Difficulty |
|---|---|---|---|---|---|---|
| 1 | Ocean vs Deforestation | **relevance** + **counter_argument_engagement** | Evidence + Scope | overgeneralization, confirmation_bias | conformity, conflict_avoidance | Accessible |
| 2 | School Garden Water | sufficiency + perspective_breadth | Evidence + Scope | false_certainty, egocentric_thinking | authority_deference, groupthink | Accessible |
| 3 | Recycling Program | source_credibility + inferential_validity | Evidence + Logic | uncritical_acceptance, false_cause | authority_deference, conformity | Moderate |
| 4 | Climate Poster Claims | **relevance** + condition_sensitivity | Evidence + Scope | confirmation_bias, overgeneralization | groupthink, conformity | Moderate–Challenging |
| 5 | Field Trip Proposal | **counter_argument_engagement** + consequence_consideration | Scope + Scope | tunnel_vision, black_and_white_thinking | conflict_avoidance, groupthink | Moderate–Challenging |

**Coverage:**
- Core facets: 6/6 (all covered)
- Extend facets: 2/4 (condition_sensitivity, consequence_consideration)
- Cognitive patterns: 7/8 (all except uncritical_acceptance used once; false_certainty in Scenario 2 only — egocentric_thinking appears once)
- Social dynamics: 4/4 (all covered, most appear multiple times)
- Anchor facets: relevance appears in Scenarios 1 and 4; counter_argument_engagement appears in Scenarios 1 and 5

---

## Scenario 1: Ocean vs Deforestation

**Status:** GENERATED (exists at `registry/ocean-vs-deforestation/`)

See `docs/implementation-pipeline.md`, Test Scenario A for the full operator prompt and design notes.

---

## Scenario 2: School Garden Water

**Status:** PROMPT READY (test case in README.md)

See the Test Case section of `README.md` for the full operator prompt. This scenario is designed as the pipeline test case — run it first to validate the revised agent prompts.

---

## Scenario 3: Recycling Program

### Why This Scenario

This is the hardest observation task in the sequence. Inferential validity has zero cross-lens visibility — it's the most Logic-specific facet. A Logic student will see the flawed inference; an Evidence student may not see anything notable through their lens in that passage. This is intentional: it teaches students that some reasoning problems are only visible through certain lenses, reinforcing the value of multiple perspectives.

Source credibility pairs well because it's highly intuitive through Evidence and also visible through Logic (students perceive unreliable premises as causing argument failure).

### Operator Prompt

```
Topic: Whether the school should switch from sorted recycling bins to
single-stream recycling

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" The school currently has sorted
recycling (paper, plastic, glass in separate bins). The custodial staff says
it's a lot of work and some students don't sort correctly anyway. One group
member found a recycling company's website that says single-stream is "just
as effective." Another group member heard from an older sibling that
single-stream recycling actually ends up in landfills more often.

Instructional goals:
- Practice noticing when a source might not be trustworthy for the claim
  being made
- Practice noticing when a conclusion doesn't actually follow from the
  reasons given

Target complexity: 2 personas, 2 target facets

Target facets:
- Source credibility (Evidence lens) — one persona cites a recycling
  company's website claiming single-stream is "just as effective." The
  source has a financial interest in single-stream adoption (they profit
  from it), making it unreliable for an objective comparison. The persona
  doesn't notice the conflict of interest.
  Cognitive pattern: uncritical acceptance (believes the website because
  it looks professional and has statistics). Social dynamic: authority
  deference (the other persona defers because "they found actual data").
- Inferential validity (Logic lens) — the same persona argues: "the
  custodial staff says sorting is hard, and single-stream is just as
  effective, so we should switch." But "sorting is hard for the staff"
  and "single-stream is effective" don't combine to prove "we should
  switch" — the conclusion doesn't follow because it ignores the
  environmental cost the sibling mentioned.
  Cognitive pattern: false cause (treats the staff's difficulty as a
  reason the environmental outcome would be the same). Social dynamic:
  conformity (both personas want to make the staff's job easier, which
  makes the flawed inference feel reasonable).

The personas should start on opposite sides — one wants single-stream
(it's easier), the other is worried about environmental impact (the
sibling's claim). The worried persona gets won over by the "data" from
the recycling company. The discussion ends with agreement to recommend
single-stream.
```

### Design Notes

- **Source credibility signal:** The recycling company's website is the key. Students looking through Evidence should notice that the source has a financial interest. The website "looks professional and has statistics" — this is the uncritical acceptance trap. The signal is moderate difficulty: the conflict of interest isn't stated explicitly in the dialog, but the company name and context make it inferable.
- **Inferential validity signal:** This is the hardest observation in the sequence. The logical gap is: "sorting is hard" + "single-stream is effective" ≠ "we should switch" because "effective" (from a biased source) doesn't account for the landfill concern. Logic students need to see that the premises don't support the conclusion, even if each premise is accepted. Low cross-lens visibility means Evidence and Scope students may not catch this specific gap.
- **Watch for:** The dialog writer may make the company's bias too obvious (e.g., having a character say "but they're a recycling company, of course they'd say that"). The bias should be inferable from context, not announced. The sibling's claim should be treated as real information by the characters, not dismissed as hearsay.

---

## Scenario 4: Climate Poster Claims

### Why This Scenario

Relevance returns, but subtler. In Scenario 1, the relevance gap was geographic (Pacific Ocean → school project). Here, the gap is about claim precision — the evidence supports a weaker version of the claim than what the group puts on their poster. This is harder to detect because the evidence is genuinely relevant to the topic, just not strong enough for the specific claim being made.

Condition sensitivity (Extend) pairs naturally: if you notice the evidence doesn't quite support the claim, the next question is "under what conditions would it be true?" — a direct bridge from relevance to conditions.

### Operator Prompt

```
Topic: What claims to include on their climate action poster for the school
hallway

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is designing a poster
to display in the school hallway. They need to choose what claims to put on
it. They've done some research and have several facts, but they need to decide
what to highlight. The poster will be seen by other students, teachers, and
parents on open house night.

Instructional goals:
- Practice noticing when evidence supports a narrower claim than the one
  being made (subtler relevance gap than Scenario 1)
- Practice noticing when a conclusion is stated without conditions or
  qualifications

Target complexity: 2 personas, 2 target facets

Target facets:
- Relevance (Evidence lens) — one persona wants to put "Recycling saves
  the planet" on the poster, citing a statistic about how much energy
  recycling aluminum cans saves compared to making new ones. The statistic
  is real and relevant to recycling — but it's specifically about aluminum,
  not "the planet." The evidence supports "recycling aluminum saves energy"
  but gets stretched to "recycling saves the planet."
  Cognitive pattern: overgeneralization (stretches a specific finding to
  a universal claim). Social dynamic: groupthink (both personas like the
  dramatic phrasing and don't question whether it's technically accurate
  for a public poster).
- Condition sensitivity (Scope lens) — the group decides on several
  claims for the poster without qualifying any of them. "Composting
  reduces waste by 30%" — but under what conditions? At what scale?
  For what kinds of waste? The claims are stated as universal facts
  when they're actually conditional on specific circumstances.
  Cognitive pattern: false certainty (presents conditional findings as
  unconditional facts). Social dynamic: conformity (neither persona
  wants to weaken the poster's impact by adding qualifications, so
  they both accept the unqualified claims).

The personas should have slightly different priorities — one wants the
poster to be dramatic and attention-grabbing, the other wants it to be
accurate. But the accuracy-minded persona gets caught up in the excitement
of making an impressive poster and stops pushing for precision. The
discussion ends with them choosing dramatic, unqualified claims.
```

### Design Notes

- **Relevance signal (subtler than Scenario 1):** The aluminum recycling statistic IS about recycling — the evidence is topically relevant. The gap is between "recycling aluminum saves energy" and "recycling saves the planet." This is harder than Scenario 1 because the evidence isn't about a completely different place or topic; it's about a specific subset being generalized. Students who caught the Pacific-to-school gap in Scenario 1 now face a within-topic generalization.
- **Condition sensitivity signal:** The unqualified claims are natural for a poster — students may initially think "of course you simplify for a poster." The Scope question is whether simplification crossed into inaccuracy. This is genuinely debatable, which makes peer exchange richer.
- **Watch for:** The dialog writer may make the accuracy-minded persona too passive. They should actively question at least one claim's precision before getting swept up in poster excitement. The conformity dynamic should feel like shared enthusiasm, not pressure.

---

## Scenario 5: Field Trip Proposal

### Why This Scenario

Counter-argument engagement returns, but the social dynamic is different. In Scenario 1, one persona dismissed the other's concern. Here, both personas genuinely engage with each other's arguments — but they both ignore the downstream consequences of their decision. The counter-argument weakness is not dismissal but scope: they argue well about the pros and cons of each option while failing to consider what happens after the trip.

Consequence consideration (Extend) is the natural companion: the group makes a decision without examining its implications.

### Operator Prompt

```
Topic: Whether to propose a field trip to the local nature preserve or to
the county waste treatment facility

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" The class gets one field trip for
the semester. This group is writing the proposal to the teacher. They need
to argue for one destination. The nature preserve offers guided ecology
tours. The waste treatment facility offers a behind-the-scenes look at
what happens to the school's waste.

Instructional goals:
- Practice noticing when a group engages well with each other but still
  misses important considerations (subtler counter-argument weakness
  than Scenario 1)
- Practice noticing when a decision is made without thinking about what
  happens next

Target complexity: 2 personas, 2 target facets

Target facets:
- Counter-argument engagement (Scope lens) — the two personas actually
  argue well — they listen to each other, respond to specific points,
  and make concessions. But their engagement is entirely about the
  trip experience itself (which is more fun, which is more educational,
  which connects to their project). Neither persona considers what the
  class does WITH the field trip — how it connects to their final
  product, what they'd need to prepare, what follow-up work it creates.
  They engage with each other's arguments but not with the broader
  scope of the decision.
  Cognitive pattern: tunnel vision (focused narrowly on the trip
  experience, missing the before-and-after context). Social dynamic:
  conflict avoidance (they reach a friendly compromise without either
  persona pushing to think more broadly about the decision's
  implications).
- Consequence consideration (Scope lens) — the group picks the nature
  preserve because "it sounds more fun and we'll learn about ecosystems."
  But they don't consider: What will they do with what they learn? How
  does it connect to their escape room project? Will they need special
  permission or equipment? What if it rains? The decision is made in
  a vacuum, without examining downstream effects.
  Cognitive pattern: black and white thinking (it's either "nature
  preserve" or "waste facility" — they don't consider how either
  choice plays out or whether elements of both could work). Social
  dynamic: groupthink (they converge on the "fun" option quickly and
  reinforce each other's enthusiasm without stepping back to check
  whether the choice actually serves their project goals).

The personas should genuinely disagree at first — one wants the preserve,
the other wants the waste facility. But unlike Scenario 1, they should
argue respectfully and make concessions. The discussion should feel like
a GOOD conversation — the weakness is in what they DON'T discuss, not in
how they treat each other. The discussion ends with a clear decision.
```

### Design Notes

- **Counter-argument engagement signal (subtler than Scenario 1):** This is the hardest version of this facet in the sequence. The personas DO engage with each other's arguments — they listen, respond, concede. Students may rate this as "strong" on first read. The weakness is scope-level: they engage on trip-experience arguments but never raise implementation, preparation, or follow-up arguments. Scope students need to notice what categories of argument are missing, not that arguments are being dismissed.
- **Consequence consideration signal:** The discussion ends with a decision but zero consideration of what happens next. This should feel natural — 6th graders excited about a field trip don't naturally think about logistics. The signal is in the absence, which is harder to detect than the presence of a flaw.
- **Watch for:** The dialog writer may make the conversation too smooth (since both personas are engaging well) or introduce artificial tension to make it feel more like a "flawed" discussion. The discussion should genuinely sound like a good conversation — that's the point. The flaw is structural, not interpersonal.
- **Pedagogical note:** This scenario challenges students' assumption that "good engagement = good reasoning." A discussion where people are respectful and responsive can still produce a poorly-considered decision. This is a sophisticated insight that builds on what students learned in Scenarios 1 and 3.

---

## Coverage Summary

### Facets

| Facet | Tier | Scenarios | Notes |
|---|---|---|---|
| relevance | Core | 1, **4** | Anchor — returns at higher subtlety |
| counter_argument_engagement | Core | 1, **5** | Anchor — returns as structural rather than interpersonal weakness |
| sufficiency | Core | 2 | |
| perspective_breadth | Core | 2 | |
| source_credibility | Core | 3 | |
| inferential_validity | Core | 3 | Hardest — lowest cross-lens visibility |
| condition_sensitivity | Extend | 4 | Pairs with returning relevance anchor |
| consequence_consideration | Extend | 5 | Pairs with returning counter-argument anchor |

### Cognitive Patterns

| Pattern | Scenarios |
|---|---|
| overgeneralization | 1, 4 |
| confirmation_bias | 1, 4 |
| false_certainty | 2, 4 |
| egocentric_thinking | 2 |
| uncritical_acceptance | 3 |
| false_cause | 3 |
| tunnel_vision | 5 |
| black_and_white_thinking | 5 |

All 8 cognitive patterns covered.

### Social Dynamics

| Dynamic | Scenarios |
|---|---|
| conformity | 1, 3, 4 |
| conflict_avoidance | 1, 5 |
| authority_deference | 2, 3 |
| groupthink | 2, 4, 5 |

All 4 social dynamics covered, each appearing 2-3 times.

### Lens Usage

| Lens pair | Scenarios |
|---|---|
| Evidence + Scope | 1, 2, 4 |
| Evidence + Logic | 3 |
| Scope + Scope | 5 |

Evidence appears in 4 scenarios, Scope in 4, Logic in 1. Scenario 3 is the only one that exercises Logic as a primary lens, which aligns with inferential validity being the most Logic-specific facet.
