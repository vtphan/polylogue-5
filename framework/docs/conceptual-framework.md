# A Framework for Examining Reasoning Quality

This document defines the conceptual framework that underlies Polylogue. The framework is an **ontology of reasoning quality** — a structured vocabulary for describing what reasoning is made of, such that its quality can be examined. It is application-agnostic. It makes no claims about students, teaching, or learning; those belong to the instructional designs built on top of it (see `apps/{app-id}/docs/instructional-design.md`).

The prose in this document is the conceptual source of truth. The canonical machine-readable inventories live in `framework/reference/`: `lenses.yaml`, `facet_inventory.yaml`, and `explanatory_variables.yaml`. A Graphviz diagram of the framework's structure is at `framework/docs/framework-graph.dot`.

## Contents

1. [What the Framework Enables](#1-what-the-framework-enables)
2. [Lenses that Reveal, Facets of Reasoning, and Forces that Weaken](#2-lenses-that-reveal-facets-of-reasoning-and-forces-that-weaken)
    - 2.1 [Lenses that Reveal Reasoning](#21-lenses-that-reveal-reasoning)
    - 2.2 [Facets of Reasoning](#22-facets-of-reasoning)
    - 2.3 [Forces that Weaken Reasoning (Explanatory Variables)](#23-forces-that-weaken-reasoning-explanatory-variables)
3. [The Same Flaw Through Different Lenses](#3-the-same-flaw-through-different-lenses)
4. [How Forces Weaken Facets of Reasoning](#4-how-forces-weaken-facets-of-reasoning)
5. [Future Considerations](#5-future-considerations)

---

## 1. What the Framework Enables

The framework gives you a vocabulary for doing three things with a piece of reasoning: **naming what is weak about it**, **explaining why the reasoner got there**, and **holding more than one valid perspective** on either. These are the framework's three **affordances**. Everything in §2–§4 exists to make them precise. An application decides how to turn them into a student experience; the framework does not dictate that choice.

---

## 2. Lenses that Reveal, Facets of Reasoning, and Forces that Weaken

Start with a piece of reasoning:

> *"Everyone in my family has used this brand of vitamins for years and we're all healthy, so these vitamins obviously work. My cousin tried a different brand and got sick, which proves it."*

Something is off about this, but "it's bad reasoning" doesn't say enough. The framework gives you three words to say more.

- **Facets** are the sub-qualities the reasoning is strong or weak *on*. This passage is weak on *source diversity* (only one family), on *relevance* (being healthy while taking vitamins doesn't show the vitamins did anything), and on *perspective engagement* (no alternatives considered). Every passage has a value — strong or weak — on every facet. A "flaw" is just a low value.
- **Lenses** are the angles you view the reasoning *from*. Looking through the **Evidence** lens, you notice the narrow support. Looking through **Logic**, you notice the leap from "healthy while taking X" to "X caused it." Looking through **Scope**, you notice the unexamined alternatives. The same passage yields different but compatible perspectives depending on which lens you pick up.
- **Forces** are what caused the reasoner to produce weak reasoning in the first place. Maybe *confirmation bias* — they only looked at cases that fit the belief. Maybe *overgeneralization* — one cousin treated as proof. Maybe *tunnel vision*. These are candidate explanations, not verdicts.

Facets sit in the middle. Lenses reveal them; forces cause them to come out weak.

```
   Lenses  ──reveal──→  Facets  ←──cause──  Forces
   (angles of           (sub-qualities      (cognitive biases
    examination)         of reasoning)       and social dynamics)
```

That middle layer is what makes observation and explanation line up: a reader using a lens and an analyst proposing a cause are both talking about the *same* facet. §2.1, §2.2, and §2.3 cover each piece in turn. Elsewhere in the Polylogue system — schemas, reference data, and earlier documents — the force layer is called **explanatory variables**. That name is retained for compatibility; the rest of this document uses *forces* for readability.

> **Design note.** The framework commits to three relations that all pass through the facet layer: *primary lens → facet* (§2.1, §2.2), *cross-lens visibility* (§3), and *force → facet* (§4). These are independent — each has to be established on its own grounds, and they do not compose. Two facets produced by the same bias are still two distinct facets, not one facet reached through two lenses. And a facet observable through two lenses is not thereby explained by any particular force.

### 2.1 Lenses that Reveal Reasoning

Each lens is one angle you can view reasoning from. Each asks a different question, and each reveals a set of facets.

| Lens | What it evaluates | The question |
|---|---|---|
| **Logic** | The inferential structure connecting premises to conclusions | Does the reasoning hold? |
| **Evidence** | The support offered for claims | Is the claim supported? |
| **Scope** | The breadth of factors, perspectives, and consequences considered | Is the analysis thorough? |

The three lenses are tools for directing attention, not a partition of argument space. They overlap: when reasoning looks at only one side, that can be seen as an Evidence observation (insufficient evidence) or a Scope observation (missing perspectives) or both. §3 maps the overlaps.

> **Design note — why these three.** Logic and Evidence are core evaluative operations across the critical thinking literature (Facione's Delphi Report, Ennis, Toulmin, Halpern). Scope consolidates what other frameworks distribute across several concepts (Paul & Elder's *implications*, *point of view*, and *breadth*; Toulmin's *rebuttal*; Ennis's *problem identification*). All of these ask the same underlying "is the analysis thorough?" question and can be learned as a single lens. The three lenses do not exhaust critical thinking — capacities such as epistemic humility and metacognitive monitoring lie beyond this framework's scope.

### 2.2 Facets of Reasoning

Facets are the sub-qualities of reasoning that a passage is strong or weak on. Each lens asks one question on the surface, but the reasoning it examines is internally complex — and that complexity is what the facets name.

Ten facets, grouped by the lens that reveals each one most directly:

**Evidence lens**

- **Source credibility** — *shaky sources: leaning on sources that aren't trustworthy.*
- **Source diversity** — *narrow sources: hearing from only one side or one kind of voice.*
- **Relevance** — *off-target evidence: citing facts that don't actually support the claim.*
- **Sufficiency** — *thin evidence: too little to justify the conclusion being drawn.*

**Logic lens**

- **Inferential validity** — *leaps in reasoning: conclusions that don't follow from what was said.*
- **Internal consistency** — *contradictions: claims that quietly clash with each other.*
- **Reasoning completeness** — *missing steps: important parts of the argument left unsaid.*

**Scope lens**

- **Perspective engagement** — *ignoring other viewpoints: never engaging with people who would disagree.*
- **Consequence consideration** — *overlooking consequences: not thinking through what could happen next.*
- **Condition sensitivity** — *missing limits: treating an idea as if it works in every situation.*

§3 covers which facets can be seen through more than one lens. §4 covers which forces tend to weaken each one.

> **Design note.** A "flaw" and a "weak facet" are the same observation in different words: "thin evidence" and "weak on sufficiency" name one event. Causation lives one layer further out — forces (§2.3) cause facets to come out weak. The correct direction is *confirmation bias* → *weak source diversity*, not *weak source diversity* → *a flaw*. The inventory of ten facets is a design choice to be validated and revised through use, not a theoretical commitment. Formal definitions live in `framework/reference/facet_inventory.yaml`.

### 2.3 Forces that Weaken Reasoning (Explanatory Variables)

Forces are what cause facets to come out weak. There are two kinds — genuinely different but coupled mechanisms: **cognitive biases** (individual thinking tendencies) and **social dynamics** (patterns of group interaction).

#### Cognitive Biases

Individual thinking tendencies that shape how a person processes information and draws conclusions:

| Pattern | Description |
|---|---|
| Confirmation bias | Only looking for information that supports what you already believe |
| Tunnel vision | Focusing so narrowly on one aspect that you miss the bigger picture |
| Overgeneralization | Drawing a broad conclusion from too little evidence |
| False cause | Assuming one thing caused another just because they're connected |
| Uncritical acceptance | Believing something without checking the source or reasoning |
| Black-and-white thinking | Seeing only two options instead of recognizing complexity |
| Egocentric thinking | Only considering the perspectives of people like yourself |
| False certainty | Feeling confident about something without checking whether the reasoning supports it |

> **Design note.** These are drawn from the cognitive bias literature (Kahneman & Tversky, Gigerenzer, Stanovich) and translated into everyday language. The list is deliberately reduced from the full catalog to a set that is distinct, observable in discussion, and describable in a single sentence.

#### Social Dynamics

Group interaction patterns that shape how a discussion unfolds:

| Dynamic | Description |
|---|---|
| Group pressure | The group discouraging disagreement — whether through pressure that makes individuals go along despite private doubts, or through collective convergence where no one questions at all |
| Conflict avoidance | Giving up a point you believe in because disagreeing feels uncomfortable |
| Authority deference | Letting the loudest or most confident person win without evaluating their reasoning |

> **Design note.** These are drawn from social psychology research (Asch, Janis, Milgram) on how group processes shape individual behavior. They are genuine causal mechanisms: group pressure, for instance, reliably produces agreement independent of reasoning quality.

#### Biases and dynamics interact

Cognitive biases and social dynamics are not alternative explanations to choose between. A social dynamic can amplify a bias: confirmation bias persists because nobody in the group challenges it (conflict avoidance). A bias can reshape the social environment: black-and-white thinking reframes disagreement as moral failure, making it hard for others to maintain a nuanced position. Every moment in reasoned discussion has both a cognitive and a social dimension, and understanding how they interact — in both directions — is the deepest level of explanation the framework supports.

> **Design note.** This force-to-force coupling is not captured in the force → facet tables of §4; those tables encode only the direct connection to facets. Both inventories are also deliberately deficit-focused: every entry describes a failure mode. This is because deficits have genuine causal specificity ("he drew a broad conclusion from one example" identifies a mechanism), while positive thinking patterns tend to redescribe good reasoning rather than explain it. Sound reasoning is accounted for contrastively, as the absence of the deficits.

---

## 3. The Same Flaw Through Different Lenses

A facet can be observable through more than one lens. The relevance of evidence to a claim, for example, is visible through the Evidence lens ("is this the right kind of support?") *and* through the Logic lens ("does this premise connect to that conclusion?"). Two readers looking through different lenses can land on the same feature of the reasoning and describe it differently, and both perspectives are legitimate. The formal name for this property is **cross-lens visibility**.

This is one of the two structural sources of the third affordance (multiple legitimate perspectives). It means diversity of observation is built into the framework itself, not left to the reader's idiosyncrasy.

### Map

| Facet | Primary Lens | Also Visible Through |
|---|---|---|
| Source credibility | Evidence | Logic |
| Source diversity | Evidence | Scope |
| Relevance | Evidence | Logic |
| Sufficiency | Evidence | Scope, Logic |
| Inferential validity | Logic | — (convergent) |
| Internal consistency | Logic | Evidence |
| Reasoning completeness | Logic | Evidence |
| Perspective engagement | Scope | Evidence, Logic |
| Consequence consideration | Scope | Logic |
| Condition sensitivity | Scope | Logic, Evidence |

### How each facet appears through its secondary lenses

- **Source credibility** — through Logic, a conclusion built on an unreliable premise can be seen as an inferential failure rather than an evidence problem ("their whole argument falls apart because that fact isn't even true").
- **Source diversity** — through Scope, narrow sourcing can be seen as a breadth problem ("they only looked at one kind of source") rather than an evidence problem.
- **Relevance** — through Logic, a weakly-related piece of evidence can be seen as an inferential gap ("that example doesn't have anything to do with what they're trying to prove"). This is one of the highest-overlap facets in the inventory.
- **Sufficiency** — through Scope, thin evidence can be seen as insufficient breadth of consideration; through Logic, the mismatch between evidence weight and conclusion strength can be seen as an inferential problem.
- **Inferential validity** — rarely visible through other lenses. This is the most Logic-specific facet. When the inferential step itself is broken, it is almost always perceived as a logic problem.
- **Internal consistency** — through Evidence, contradictory claims can be seen as contradictory evidence ("they cited two things that say opposite things") rather than a logical problem.
- **Reasoning completeness** — through Evidence, a missing step can be seen as missing evidential support ("they jumped to the conclusion without showing how the evidence supports it").
- **Perspective engagement** — through Evidence, missing perspectives can be seen as missing evidence ("they didn't look at evidence from people who disagree"); through Logic, a mischaracterized counter-argument can be seen as a straw-man inferential failure.
- **Consequence consideration** — through Logic, failing to consider downstream effects can be seen as an incomplete argument ("they proved it's good in one way but didn't check if it causes other problems").
- **Condition sensitivity** — through Logic, an unconditional conclusion from conditional premises is an inferential problem; through Evidence, a conclusion stated more broadly than the evidence supports is an evidence gap.

Inferential validity is the only facet with no cross-lens visibility — it is the most lens-specific facet in the inventory, and almost always perceived as a Logic observation. **Scope is the most independent *lens*** in a different sense: visibility flows *into* Logic and Evidence *from* Scope facets, but no Logic or Evidence facet lists Scope as a secondary lens. Scope readers reach into the other lenses; the other lenses do not reach into Scope. The highest-overlap facets — relevance, sufficiency, condition sensitivity, perspective engagement — are where cross-lens diversity is most easily produced.

---

## 4. How Forces Weaken Facets of Reasoning

A force *causes* a facet to come out weak. One force can weaken several facets, and one weak facet can be produced by several forces. That is the other structural source of the third affordance: because more than one force can account for the same observation, no observation has a unique correct explanation.

Not every facet has both a cognitive and a social cause — *relevance* and *inferential validity* are accounted for by cognitive biases alone (see the per-facet table). The claim holds across the inventory as a whole, not uniformly at every facet.

The three tables below are three views of the same relation, organized by cognitive bias, by social dynamic, and by facet. The connections listed are illustrative, not exhaustive: a student or analyst may offer a valid explanation that is not listed here, and the framework does not treat the listed connections as privileged.

### Cognitive bias coverage

| Cognitive Bias | Facets It Commonly Causes to Weaken |
|---|---|
| Confirmation bias | Source diversity, relevance, perspective engagement |
| Tunnel vision | Source diversity, internal consistency, consequence consideration, condition sensitivity |
| Overgeneralization | Relevance, sufficiency, condition sensitivity |
| False cause | Inferential validity |
| Uncritical acceptance | Source credibility, reasoning completeness |
| Black-and-white thinking | Inferential validity, consequence consideration |
| Egocentric thinking | Perspective engagement, condition sensitivity |
| False certainty | Sufficiency, reasoning completeness, condition sensitivity |

### Social dynamic coverage

| Social Dynamic | Facets It Commonly Causes to Weaken |
|---|---|
| Group pressure | Source diversity, sufficiency, internal consistency, perspective engagement, consequence consideration, condition sensitivity |
| Conflict avoidance | Perspective engagement, internal consistency |
| Authority deference | Sufficiency, reasoning completeness, perspective engagement, source credibility |

### Per-facet view

| Facet | Cognitive Biases | Social Dynamics |
|---|---|---|
| Source credibility | Uncritical acceptance | Authority deference |
| Source diversity | Confirmation bias, tunnel vision | Group pressure |
| Relevance | Confirmation bias, overgeneralization | — |
| Sufficiency | Overgeneralization, false certainty | Group pressure, authority deference |
| Inferential validity | False cause, black-and-white thinking | — |
| Internal consistency | Tunnel vision | Group pressure, conflict avoidance |
| Reasoning completeness | Uncritical acceptance, false certainty | Authority deference |
| Perspective engagement | Confirmation bias, egocentric thinking | Group pressure, conflict avoidance, authority deference |
| Consequence consideration | Tunnel vision, black-and-white thinking | Group pressure |
| Condition sensitivity | Tunnel vision, overgeneralization, egocentric thinking, false certainty | Group pressure |

Relevance and inferential validity have no social-dynamic connection. Both are primarily cognitive mechanisms that do not require a social account.

---

## 5. Future Considerations

**False certainty vs. uncritical acceptance — monitor for merge.** These biases are adjacent: both involve insufficient checking. The current distinction is directional — uncritical acceptance is about intake (accepting others' claims without questioning), false certainty is about output (asserting conclusions without supporting). If use reveals that the two cannot be reliably distinguished, they are a merge candidate.

**Group pressure — monitor for split.** The current entry covers two mechanisms in one row: public compliance (going along despite private doubts) and collective convergence (nobody questions at all). These are causally distinct — the first requires felt pressure, the second does not — and if use shows that they produce recognizably different facet weaknesses, they are a split candidate.

**Emotional reasoning — candidate for future addition.** "Believing something because it feels right, not because the reasoning supports it." Distinct from the current eight cognitive biases. Deferred because it may be hard to distinguish from uncritical acceptance or false certainty in practice, and adding a ninth bias increases vocabulary load.
