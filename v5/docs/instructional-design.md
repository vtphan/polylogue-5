# Polylogue v5 Instructional Design

This document describes the pedagogy of v5 — what the system teaches, how episodes generate teachable moments, how those moments become quizzes, and what the student experiences. It is the companion to `architecture.md`: architecture describes the system's structural shape; this document describes why that shape is instructionally correct.

## 1. Purpose

Polylogue teaches critical-thinking recognition to middle-school students (grades 6-8). Students do not write arguments; they read short story transcripts and learn to recognize what reasoning is doing — when it is strong, when it is weak, and why.

The instructional unit is the **episode**. Each episode is a short 8–10 minute read in dialogue form, followed by a small number of quiz-style checkpoints on specific turns of that dialogue.

The learning target is *reasoning literacy*: students should leave able to articulate what someone is trying to argue, decide whether the argument holds up, and say why.

## 2. Core Concepts

### 2.1 Lens

A **lens** is a broad family of reasoning concern. v5 uses three:

- `logic` — does the reasoning path hold up?
- `evidence` — is the support offered enough and trustworthy?
- `scope` — is the claim framed at the right size and under the right conditions?

Lenses are the concept level students feel first. They are broad enough to stay stable in memory across many episodes.

### 2.2 Reasoning item

A **reasoning item** is a specific dimension within a lens. v5 uses six:

- under `logic`: `conclusion_support`, `correlation_vs_causation`
- under `evidence`: `evidence_sufficiency`, `source_credibility`
- under `scope`: `perspective_consideration`, `conditions_and_consequences`

Reasoning items are more specific than lenses. Each item has both a **weak face** and a **strong face** — the same dimension seen from opposite sides.

### 2.3 Polarity

**Polarity** names which face an anchor is on: `weak` or `strong`. A turn that draws a well-supported conclusion and a turn that jumps to a conclusion teach the same reasoning item (`conclusion_support`) from opposite polarities.

This matters because v5 treats weak and strong reasoning as peers. Strong reasoning is not "absence of a flaw"; it is a recognizable thing a speaker can do.

### 2.4 Anchor

An **anchor** is a transcript turn selected as a teaching moment. Each anchor resolves to a `(reasoning_item_id, polarity)` pair from the taxonomy and carries an articulated intended claim.

### 2.5 Claim

The **claim** is what the speaker is trying to get others to believe or do. Articulating the claim is the first step of reasoning analysis — before a student can judge whether an argument is strong, they have to know what the argument is.

The claim need not be stated in the line itself. Turns that set up, invite, or drive toward a claim count as long as a reviewer can state the claim.

## 3. Story Design

Episodes should be designed so reasoning worth teaching about emerges naturally from believable social interaction, rather than being extracted post hoc from dialogue that was never built to teach.

### 3.1 The frame

Each episode is designed around four fields in `episode-plan.yaml`:

- **`context`** — what the episode is generally about: mood, theme, social situation.
- **`argument`** — what one character is trying to get others to believe or do.
- **`description`** — a creative episode concept that satisfies the instructional conditions.
- **`lenses[]`** — one or more of `logic`, `evidence`, `scope`, naming which lens(es) the episode will expose.

`argument` is the load-bearing field. It creates the **persuasive thread** in which reasoning becomes visible and teachable. Without a character actively trying to convince another character of something, reasoning stays latent and anchors have to be manufactured after the fact.

### 3.2 Lens choice

Each episode declares one or more lenses at design time. The choice is driven by what the `argument` naturally exposes:

- an argument that moves too fast from observation to conclusion → `logic`
- an argument that leans on a single shaky source → `evidence`
- an argument that ignores other possibilities or conditions → `scope`

An episode may foreground one lens, combine two, or use all three. Lens choice is a story-level decision, not a pipeline-level quota.

### 3.3 Audience appropriateness

All three story-design text fields (`context`, `argument`, `description`) are pitched to a 6th-grade reader. Subject matter lives inside a middle-schooler's direct experience or routine media exposure: school, friends, family, sports, games, pets, online life, local community. Adult-specialized topics (finance, law, corporate jargon, academic framing) are out of bounds unless the story introduces them explicitly in-scene.

Enforcing audience appropriateness at story-design time means downstream stages do not re-check it per turn. Every anchor inside a well-scoped episode inherits the episode's audience fit.

### 3.4 What the episode is not

An episode plan is not a scene outline, not a worksheet, and not a vehicle for instructional vocabulary. Story pressure, private stakes, character voice, and momentum come first; teaching anchors emerge from that pressure. An episode that reads like a disguised lesson plan will produce anchors that feel like disguised lesson plans.

## 4. Detection

Detection is the pipeline stage where specific transcript turns are selected as anchors and classified. In v5, detection is performed by `script_doctor` (see `architecture.md` §3.2).

### 4.1 Five selection criteria

A turn becomes an anchor candidate only if all five hold:

1. **The turn is doing argumentative work.** The speaker is trying to support, justify, persuade, reject, or conclude something.
2. **The turn is not merely expressive language.** It is not just hype, emotion, humor, or conversational exaggeration.
3. **The speaker's claim or intention is clear.** A reviewer can state what the speaker is trying to get others to believe — even if the claim is implied rather than stated.
4. **The reasoning quality is strongly expressed in the line itself.** The turn shows meaningfully strong or weak reasoning without heavy reconstruction. If it does not, `script_doctor` may revise the turn until it does.
5. **The turn maps to a specific `(reasoning_item_id, polarity)` pair.** The reasoning move matches one reasoning item clearly enough to name it without speculation.

### 4.2 Weak and strong are peers

Selection treats weak-reasoning and strong-reasoning turns as peers. A story built around a character making careful, well-supported arguments is as legitimate a source of anchors as one built around a character making shaky ones. Individual episodes may lean one way or the other by design, but that lean is a story-level choice, not a pipeline default.

### 4.3 What weakness is not

Weakness lives in the reasoning move, not in:

- casual wording or conversational compression
- ordinary exaggeration or figure of speech
- absolute language used for emphasis ("the best", "always", "never")
- lack of courtroom-level explicitness

Absolute terms become reasoning-relevant only when they are being used to *support or close off* an argument — not when they are shorthand or emphasis.

### 4.4 What strength is not

Strength also lives in the reasoning move, not in:

- formal-sounding vocabulary
- articulate or confident delivery
- conventional politeness or caution
- invoking sources or terms without actually using them to reason

A character who says "according to research" has not, by saying that, made a strong argument. The question is whether the research is actually being used to support the conclusion drawn.

### 4.5 Dialogue revision policy

v5 permits `script_doctor` to revise the wording of a selected anchor turn so its reasoning move is audible in the line itself. This is a deliberate departure from the rule that transcripts are source dialogue and not analytic containers. The rule is relaxed only for selected anchors, and only to make reasoning quality perceptible.

Revisions must:

- preserve the speaker's voice, stance, and social position in the scene
- sound like a believable middle-school character, not a didactic narrator
- sharpen the claim or the support, not invent new plot or new information

Non-anchor turns remain source dialogue and are not subject to reasoning-motivated revision. Revised anchor turns are subject to operator review in the proposal-approval gate.

## 5. The Three-Step Quiz

Each anchor becomes one quiz level in the lesson package. The quiz follows the natural order of reasoning analysis: identify the claim, decide whether you buy it, say why.

### 5.1 Structure

```
Step 1 — Claim
  "What is this character trying to get the others to believe?"
  → student selects from authored options

Step 2 — Judgment
  "Do you buy this character's argument?"
  → "Yes, this is a strong argument."
  → "No, I'm not completely convinced."

Step 3 — Why
  If student chose Yes → "What makes the argument strong?"
  If student chose No  → "Why is the argument not convincing?"
  → student selects from authored options
```

### 5.2 Why this order

Students often struggle with reasoning questions because they don't first identify what the speaker is trying to get others to believe. If the intended claim is unclear to the student, the later reasoning question becomes guesswork.

Staging the quiz as claim → judgment → why:

- separates argument from expression (Step 1 forces the student to find the claim)
- gives the student a forced reflective pause (Step 2)
- makes the reasoning question concrete rather than abstract (Step 3 asks about a specific claim the student has already identified)

### 5.3 Parity across polarities

The same three-step structure applies to both weak and strong anchors. In the strong case, Step 2 resolves to "Yes, this is a strong argument" and Step 3 asks what makes it strong. In the weak case, Step 2 resolves to "No" and Step 3 asks why it falls short. Branches differ; the scaffold does not.

### 5.4 Feedback policy

Per-choice feedback is expensive to author and only valuable where it does real instructional work. v5's default:

- **Step 1 (claim)** — per-choice feedback: full. Helps students recalibrate when they pick a wrong reading of the claim.
- **Step 2 (judgment)** — no per-choice feedback, or only light routing text. The judgment is a reflection prompt, not a correctness test.
- **Step 3 (why)** — per-choice feedback: full. This is where the reasoning lesson lives.

### 5.5 Progressive reveal

To minimize extraneous cognitive load, the app shows one step at a time:

- show the anchor turn
- show Step 1 only
- after Step 1 is answered, reveal Step 2
- after Step 2 is answered, reveal only the matching Step 3 branch
- after Step 3, show feedback and takeaway

The panel stays focused. The student never scans irrelevant options.

### 5.6 What the authored level must carry

Because the app does no runtime inference, the lesson package must author everything the quiz renders:

- a `turn_id` reference into `transcript.yaml` (anchor text rendered via lookup)
- `reasoning_item_id` and `polarity`
- the intended claim
- Step 1 question, options, correct option id(s), per-choice feedback
- Step 2 question, two options
- Step 3 `why_yes` branch: question, options, correct option id(s), per-choice feedback
- Step 3 `why_no` branch: question, options, correct option id(s), per-choice feedback
- optional hint
- level takeaway

## 6. Student Journey

A student reads an episode in one sitting. The flow is:

1. **Episode opens.** A short summary sets the scene. On episode 2+, a "previously" line carries forward what happened before.
2. **Scene-by-scene reading.** Transcript turns appear in order, grouped into 3+ scenes with concise scene summaries.
3. **Anchor encounter.** When a turn has an anchor attached, the reading pauses and a quiz panel opens on that turn.
4. **Three-step quiz.** Student answers Step 1, then Step 2, then the matching Step 3 branch, then reads feedback and the level takeaway.
5. **Resume reading.** The quiz panel closes; reading continues.
6. **Episode closes.** Final takeaway appears on the last screen.

### 6.1 Engagement

Polylogue uses restrained engagement mechanics only:

- episode-local stars for level completion
- a single bonus star per episode
- no streaks, timers, leaderboards, cumulative totals, or public rankings

The goal is for the student to feel the story, not to chase points.

### 6.2 Finished is not frozen

An episode becomes "finished" when the student reaches the final scene, not when they perfect every quiz. Students can return to a finished episode to retry quiz levels they skipped or got wrong. There is no time pressure and no "you failed" state.

## 7. Authoring Principles

These hold regardless of who or what writes the pipeline:

1. **Teaching content is fully authored, never inferred at runtime.** Every quiz option, branch, and feedback string is authored upstream. The app is a renderer, not a teacher.
2. **Transcripts are source dialogue for most turns.** Only selected anchor turns may be revised for reasoning clarity, and only with operator approval.
3. **The taxonomy is the single pivot.** Every anchor in the system resolves to a `(reasoning_item_id, polarity)` pair. No ad-hoc labels, no "other," no freeform tags.
4. **Audience fit is an upstream constraint, not a per-turn check.** Downstream agents and the app do not re-verify grade-level appropriateness.
5. **Weak and strong anchors use the same scaffold.** Branches differ; the quiz structure does not.

## 8. Cross-references

- System structure and artifact flow: [`architecture.md`](architecture.md)
- Taxonomy content: [`../reference/reasoning-taxonomy.yaml`](../reference/reasoning-taxonomy.yaml)
- Artifact shape contracts: [`../schemas/`](../schemas/)
- Operator workflow: [`operator-workflow.md`](operator-workflow.md)
- Scoping, phasing, open questions: [`../todo-01.md`](../todo-01.md)
