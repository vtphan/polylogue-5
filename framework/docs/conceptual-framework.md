# A Framework for Examining Reasoning Quality

This document defines the conceptual framework that underlies Polylogue. The framework is an **ontology of reasoning quality** — a structured vocabulary for describing what reasoning is made of, such that its quality can be examined. It is application-agnostic. It makes no claims about students, teaching, or learning; those belong to the instructional designs built on top of it (see `apps/{app-id}/docs/instructional-design.md`).

The prose in this document is the conceptual source of truth. The canonical machine-readable inventories live in `framework/reference/`: `lenses.yaml`, `facet_inventory.yaml`, and `explanatory_variables.yaml`. A Graphviz diagram of the framework's structure is at `framework/docs/framework-graph.dot`.

## Contents

1. [What the Framework Enables](#1-what-the-framework-enables)
2. [Two Aspects, One Pivot](#2-two-aspects-one-pivot)
    - 2.1 [Lenses That Reveal Reasoning](#21-lenses-that-reveal-reasoning)
    - 2.2 [Facets of Reasoning](#22-facets-of-reasoning)
    - 2.3 [Forces That Weaken Reasoning (Explanatory Variables)](#23-forces-that-weaken-reasoning-explanatory-variables)
    - 2.4 [A Worked Example](#24-a-worked-example)
3. [Cross-Lens Visibility](#3-cross-lens-visibility)
4. [How Forces Weaken Facets](#4-how-forces-weaken-facets)
5. [Future Considerations](#5-future-considerations)

---

## 1. What the Framework Enables

The framework provides a vocabulary precise enough to examine reasoning along three affordances:

1. **Recognizing reasoning quality with precision** — naming *which* aspect of a piece of reasoning is strong or weak, not just whether it is good or bad.
2. **Proposing why reasoning came out the way it did** — accounting for observed quality through candidate cognitive and social forces.
3. **Supporting multiple legitimate perspectives** — any single weakness can be revealed through more than one lens (§3) and explained by more than one force (§4). No observation has a single correct reading.

These affordances fall directly out of the two aspects described in §2. An application chooses how to turn them into a student experience; the framework does not dictate that choice. Affordance 1 is what the lens aspect enables; affordance 2 is what the forces aspect enables; affordance 3 arises from the many-to-many mapping between them, at the facet pivot.

---

## 2. Two Aspects, One Pivot

The framework examines reasoning through **two complementary aspects**:

- **Lenses that reveal reasoning** — the angles from which reasoning quality can be examined.
- **Forces that weaken reasoning** *(explanatory variables)* — the cognitive and social forces that cause reasoning to come out weak.

The two aspects are connected by a shared pivot: **facets**, the specific sub-qualities of reasoning along which quality varies. Lenses reveal facets; forces cause those same facets to weaken. The facet layer is where observation and explanation meet — which is what makes the framework's two aspects work together rather than side by side.

```
   Lenses  ──reveal──→  Facets  ←──cause──  Forces
   (angles of           (sub-qualities      (cognitive and social
    examination)         of reasoning)       variables; §2.3)
```

Causation in the framework runs from the forces aspect into the facet pivot; the lens aspect is descriptive, not causal. A lens does not cause anything to happen in the reasoning — it is the angle from which a feature is perceived. A force does not perceive anything — it is a candidate account of why the feature came out as it did.

**The three relations meeting at the facet pivot are orthogonal.** The framework commits to three relations that all pass through the facet layer: *primary lens → facet* (§2.1, §2.2), *cross-lens visibility* (§3), and *force → facet* explanatory connection (§4). These relations are independent and do not compose. A shared cause does not imply cross-lens visibility — two facets produced by the same cognitive bias are still two distinct facets with distinct observable signatures, not one facet reached through two lenses. Cross-lens visibility does not imply a shared cause — a facet observable through two lenses is not thereby explained by any particular force. Each relation has to be established on its own structural or observational grounds.

### 2.1 Lenses That Reveal Reasoning

Reasoning quality is examined from three distinct angles. Each lens asks a different question about a different aspect of argumentation, and each lens reveals a set of facets (§2.2) — specific sub-qualities of reasoning along which quality varies.

| Lens | What it evaluates | The question |
|---|---|---|
| **Logic** | The inferential structure connecting premises to conclusions | Does the reasoning hold? |
| **Evidence** | The support offered for claims | Is the claim supported? |
| **Scope** | The breadth of factors, perspectives, and consequences considered | Is the analysis thorough? |

**Why these three.** Logic and Evidence are universally recognized as core evaluative operations across the critical thinking literature — Facione's Delphi Report, Ennis's taxonomy, Toulmin's model, Halpern's categories. Scope consolidates what multiple frameworks distribute across several concepts: Paul & Elder's *implications*, *point of view*, and *breadth* standards; Toulmin's *rebuttal*; Ennis's *problem identification*. All of these ask the same underlying question — "is the analysis thorough?" — and can be learned as a single lens. The three lenses do not exhaust critical thinking; capacities such as epistemic humility and metacognitive monitoring exist but lie beyond this framework's scope.

**Not silos.** The three lenses sometimes overlap. When reasoning looks at only one side, that can be seen as an Evidence observation (insufficient evidence) or a Scope observation (missing perspectives) or both. The lenses are tools for directing attention, not a partition of argument space.

### 2.2 Facets of Reasoning

Facets are the pivot between the two aspects. They are **specific sub-qualities of reasoning** along which quality varies. Lenses reveal them; forces cause them to weaken. Each lens is simple on its surface — one question — but the reasoning it examines is internally complex, and that internal complexity is made of facets. A passage does not "have" a facet the way it might contain a flaw — it is *strong or weak* on each facet.

**A reasoning flaw, in this vocabulary, *is* a facet being weak.** The flaw and the weak facet are the same observation at different grains — "thin evidence" and "weak on sufficiency" name one event, one in plain language and one in the designer's vocabulary. A weak facet does not *lead to* or *cause* a flaw; it *is* the flaw. Causation in the framework lives one layer further out: forces (§2.3) cause facets to come out weak. So the correct causal direction is *confirmation bias* → *weak source diversity*, not *weak source diversity* → *a flaw*.

The framework does not commit to a specific facet inventory as a theoretical claim. The ten facets below are a design choice meant to be validated and revised through use. Each facet is given with a short formal name, a one-line definition, and an informal phrasing of what weakness on that facet looks like in practice.

Cross-lens visibility and the connections to explanatory variables are the subject of §3 and §4 respectively.

#### Evidence Lens

- **Source credibility** — the reliability and trustworthiness of the sources cited. *Shaky sources: leaning on sources that aren't trustworthy.*
- **Source diversity** — the range and independence of evidence brought to bear. *Narrow sources: hearing from only one side or one kind of voice.*
- **Relevance** — how well the evidence connects to the specific claim being made. *Off-target evidence: citing facts that don't actually support the claim.*
- **Sufficiency** — whether the quantity and weight of evidence matches the scope of the conclusion. *Thin evidence: too little to justify the conclusion being drawn.*

#### Logic Lens

- **Inferential validity** — whether the conclusion actually follows from the premises offered. *Leaps in reasoning: conclusions that don't follow from what was said.*
- **Internal consistency** — whether the claims made within a discussion contradict each other. *Contradictions: claims that quietly clash with each other.*
- **Reasoning completeness** — whether the steps between premises and conclusion are explicit or whether critical steps are missing. *Missing steps: important parts of the argument left unsaid.*

#### Scope Lens

- **Perspective engagement** — the range of viewpoints considered and whether opposing positions are engaged with rather than ignored. *Ignoring other viewpoints: never engaging with people who would disagree.*
- **Consequence consideration** — whether downstream effects, second-order implications, and unintended outcomes are examined. *Overlooking consequences: not thinking through what could happen next.*
- **Condition sensitivity** — whether limitations, exceptions, and boundary conditions are acknowledged. *Missing limits: treating an idea as if it works in every situation.*

### 2.3 Forces That Weaken Reasoning (Explanatory Variables)

Forces are the framework's causal aspect: they cause facets to come out weak. "Forces that weaken reasoning" is the plain-language label; "explanatory variables" is the term used in the research literature the framework cites. The two names refer to the same thing.

There are two kinds of forces, representing genuinely different but coupled mechanisms: **cognitive biases** (individual thinking tendencies) and **social dynamics** (patterns of group interaction).

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

These biases are drawn from the cognitive bias literature (Kahneman & Tversky, Gigerenzer, Stanovich) and translated into everyday language. The list is deliberately reduced from the full catalog to a set that is distinct, observable in discussion, and describable in a single sentence.

#### Social Dynamics

Group interaction patterns that shape how a discussion unfolds:

| Dynamic | Description |
|---|---|
| Group pressure | The group discouraging disagreement — whether through pressure that makes individuals go along despite private doubts, or through collective convergence where no one questions at all |
| Conflict avoidance | Giving up a point you believe in because disagreeing feels uncomfortable |
| Authority deference | Letting the loudest or most confident person win without evaluating their reasoning |

These are drawn from social psychology research (Asch, Janis, Milgram) on how group processes shape individual behavior. They are genuine causal mechanisms: group pressure, for instance, reliably produces agreement independent of reasoning quality.

#### Deficit focus

Both inventories are deficit-focused: all entries describe failure modes. This is an ontological choice, not a pedagogical one. Deficit forces have genuine causal specificity ("he drew a broad conclusion from one example" identifies a mechanism), while positive thinking patterns tend to redescribe good reasoning rather than explain it causally. Sound reasoning is accounted for contrastively, in terms of the absence of the deficits.

#### Interaction

Cognitive biases and social dynamics are not alternative explanations to choose between. They interact. A social dynamic can amplify a cognitive bias: confirmation bias persists because nobody in the group challenges it (conflict avoidance). A cognitive bias can reshape the social environment: black-and-white thinking reframes disagreement as moral failure, making it socially difficult for others to maintain a nuanced position. Every moment in reasoned discussion has both a cognitive and a social dimension; understanding how they interact, in both directions, is the deepest level of explanatory reasoning the framework supports.

### 2.4 A Worked Example

Consider the following short piece of reasoning:

> *"Everyone in my family has used this brand of vitamins for years and we're all healthy, so these vitamins obviously work. My cousin tried a different brand and got sick, which proves it."*

**Through the Evidence lens**, a reader might notice that the support is a single family's experience — weak **source diversity** — and that "we're all healthy" is not really evidence that the vitamins caused the health — weak **relevance**.

**Through the Logic lens**, a different reader might notice the same relevance problem from a different angle ("being healthy while taking vitamins doesn't show the vitamins did anything") and also flag the cousin anecdote as an **inferential validity** failure — one person getting sick after switching brands does not prove the brands caused the outcomes.

**Through the Scope lens**, a third reader might notice that no alternative explanations are considered — genetics, diet, lifestyle — which is weak **perspective engagement**.

Both the Evidence reader and the Logic reader landed on relevance, from different angles. That is cross-lens visibility at work: the same feature of the reasoning is reachable from more than one lens, and both readings are legitimate.

**Asking why** opens the many-to-many mapping. The weak source diversity could be explained by **confirmation bias** (the speaker only looked at cases that confirmed the belief) or by **tunnel vision** (they never widened their attention past their own family). The inferential-validity problem with the cousin anecdote could be **false cause** (post hoc attribution) or **overgeneralization** (one case treated as proof). None of these is *the* correct explanation — each is a defensible account of why the reasoning came out as it did.

This single short passage exercises all three affordances: precise observations (not just "bad reasoning" but *which* aspects), candidate accounts of why, and more than one legitimate reading of both the observation and the explanation.

---

## 3. Cross-Lens Visibility

A facet can be observable through more than one lens. The relevance of evidence to a claim, for example, is visible through both the Evidence lens ("is this the right kind of support?") and the Logic lens ("does this premise connect to that conclusion?"). Two observers looking through different lenses can legitimately land on the same feature of the reasoning and articulate it differently.

This property is one of the two structural sources of the framework's third affordance (multiple legitimate accounts). It means that the same passage can yield genuinely different but complementary observations depending on which lens a reader looks through — diversity is afforded by the ontology, not left to the observer's idiosyncrasy.

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

Inferential validity is the only facet with no cross-lens visibility. **Scope is the most independent lens**: visibility flows toward Logic and Evidence, away from Scope. The highest-overlap facets — relevance, sufficiency, condition sensitivity, perspective engagement — are where cross-lens diversity is most easily produced.

---

## 4. How Forces Weaken Facets

Forces are the framework's causal aspect: a cognitive bias or social dynamic *causes* a facet to come out weak. The mapping between forces and facets is **many-to-many** — a single cognitive or social force can produce weakness on several different facets, and a single weak facet can be produced by several different forces. This is the other structural source of the framework's third affordance: because more than one force can account for the same observation, no observation has a unique correct explanation.

This section enumerates the common connections. They are illustrative, not exhaustive: a student or analyst may offer a valid explanation that is not listed here, and the framework does not treat the listed connections as privileged.

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

Relevance and inferential validity have no social dynamic connection. This is acceptable: both are primarily cognitive mechanisms that do not require a social account.

---

## 5. Future Considerations

**False certainty vs. uncritical acceptance — monitor for merge.** These biases are adjacent: both involve insufficient checking. The current distinction is directional — uncritical acceptance is about intake (accepting others' claims without questioning), false certainty is about output (asserting conclusions without supporting). If use reveals that the two cannot be reliably distinguished, they are a merge candidate.

**Emotional reasoning — candidate for future addition.** "Believing something because it feels right, not because the reasoning supports it." Distinct from the current eight cognitive biases. Deferred because it may be hard to distinguish from uncritical acceptance or false certainty in practice, and adding a ninth bias increases vocabulary load.
