# Polylogue v5-5: Revised Inventory

This document records changes to the facet inventory and explanatory variables from v5-4. The conceptual framework — lenses, the hidden layer's structural properties, the perspectival learning model, and session structure — remains unchanged. See `polylogue-v5-4.md` for the full framework.

---

## Changes Summary

Two merges simplify the inventory without reducing coverage:

| Change | Before | After | Rationale |
|---|---|---|---|
| Facet merge | `perspective_breadth` + `counter_argument_engagement` (11 facets) | `perspective_engagement` (10 facets) | Both capture whether other viewpoints are considered; the distinction between representation (breadth) and active engagement (counter-argument) is hard to separate operationally — the same passage moment triggers both |
| Social dynamic merge | `conformity` + `groupthink` (4 dynamics) | `group_pressure` (3 dynamics) | Both describe the group suppressing dissent; the theoretical distinction (individual capitulation vs. collective convergence) produces nearly identical observable behavior in a 10-14 turn transcript |

---

## 1. Merged Social Dynamic: Group Pressure

### What was merged

- **Conformity** — going along with the group even when you privately disagree
- **Groupthink** — the group choosing to feel good about their answer instead of checking whether it's right

### Why they overlapped

The two dynamics differ in mechanism (conformity preserves private dissent; groupthink eliminates it) but converge in what a student can observe in a transcript: dissent is absent or abandoned. Distinguishing "she went along despite disagreeing" from "nobody was even questioning anymore" requires internal monologue or heavy-handed dialogue cues — neither of which fits the framework's commitment to naturalistic transcripts.

### Merged definition

**Group pressure** — The group discouraging disagreement — whether through pressure that makes individuals go along despite private doubts, or through collective convergence where no one questions at all.

### Distinction from conflict avoidance

Group pressure and conflict avoidance are adjacent but distinct:

| | Group pressure | Conflict avoidance |
|---|---|---|
| Locus | The group's orientation | An individual's choice |
| Observable behavior | Dissent is absent — the room doesn't make space for it | A character raises a point, then drops it because disagreeing feels uncomfortable |
| Example | Nobody questions the group's conclusion | "Actually — never mind, yeah I agree" |

Group pressure describes the environment. Conflict avoidance describes a character's response to that environment (or to the social discomfort of disagreement in general). A character can practice conflict avoidance without group pressure (dropping a point in a group that would have welcomed it), and group pressure can suppress dissent without any individual consciously avoiding conflict (nobody thinks to question).

### Facet coverage (union of both former dynamics)

| Facet | Connection |
|---|---|
| Source diversity | Group accepted one source and moved on |
| Sufficiency | Group accepted thin evidence without challenge |
| Internal consistency | Character agreed with contradictory positions to stay aligned |
| Perspective engagement | Group converged on one viewpoint; dissenting perspectives dropped |
| Consequence consideration | Group was satisfied with the conclusion and didn't stress-test it |
| Condition sensitivity | Group settled on a clean conclusion and no one complicated it |

---

## 2. Merged Facet: Perspective Engagement

### What was merged

- **Perspective breadth** — the range of stakeholder viewpoints, experiences, or positions considered
- **Counter-argument engagement** — whether opposing positions are addressed, rebutted, or incorporated rather than ignored

### Why they overlapped

Both facets ask whether the discussion considered viewpoints beyond its own. The intended distinction — breadth is about *who* is represented, counter-argument engagement is about *what is done* with opposition — is real in theory but collapses in practice. A passage where counter-arguments are absent also has narrow perspective breadth. A scenario would struggle to target one as weak and the other as strong.

### Merged definition

**Perspective engagement** — The range of viewpoints considered and whether opposing positions are engaged with rather than ignored.

| Strong | Weak |
|---|---|
| Multiple relevant perspectives are considered, including those that challenge the group's position; opposing arguments are addressed with reasoning | Only one perspective is represented, or opposition is dismissed without reasoning or absent entirely |

### Cross-lens visibility

- **Evidence** — "They didn't look at evidence from people who disagree" or "They just said the other side was wrong without showing why," seeing the failure as unsupported dismissal rather than a scope problem.
- **Logic** — "They twisted what the other person said and then argued against that instead," seeing a straw man as a logical failure rather than a scope failure.

### Explanatory connections

| Variable | Connection |
|---|---|
| Confirmation bias | Ignored perspectives and arguments that challenged their view |
| Egocentric thinking | Only considered perspectives like their own |
| Group pressure | Group converged on one viewpoint; treated agreement as success |
| Conflict avoidance | A dissenting perspective was raised but dropped; counter-argument abandoned rather than pursued |
| Authority deference | Counter-argument dismissed by the most confident member and the group followed |

---

## 3. Revised Inventory

### Facets (10)

| Lens | Facet | ID | What it captures |
|---|---|---|---|
| Evidence | Source credibility | `source_credibility` | Reliability and trustworthiness of sources cited |
| Evidence | Source diversity | `source_diversity` | Range and independence of evidence brought to bear |
| Evidence | Relevance | `relevance` | How well evidence connects to the specific claim |
| Evidence | Sufficiency | `sufficiency` | Whether quantity/weight of evidence matches the scope of the conclusion |
| Logic | Inferential validity | `inferential_validity` | Whether the conclusion actually follows from the premises |
| Logic | Internal consistency | `internal_consistency` | Whether claims within the discussion contradict each other |
| Logic | Reasoning completeness | `reasoning_completeness` | Whether steps between premises and conclusion are explicit |
| Scope | Perspective engagement | `perspective_engagement` | Range of viewpoints considered and whether opposing positions are engaged with |
| Scope | Consequence consideration | `consequence_consideration` | Whether downstream effects and unintended outcomes are examined |
| Scope | Condition sensitivity | `condition_sensitivity` | Whether limitations, exceptions, and boundary conditions are acknowledged |

### Cognitive Patterns (8 — unchanged)

| Pattern | ID | Description |
|---|---|---|
| Confirmation bias | `confirmation_bias` | Only looking for information that supports what you already believe |
| Tunnel vision | `tunnel_vision` | Focusing so narrowly on one aspect that you miss the bigger picture |
| Overgeneralization | `overgeneralization` | Drawing a broad conclusion from too little evidence |
| False cause | `false_cause` | Assuming one thing caused another just because they're connected |
| Uncritical acceptance | `uncritical_acceptance` | Believing something without checking the source or reasoning |
| Black-and-white thinking | `black_and_white_thinking` | Seeing only two options instead of recognizing complexity |
| Egocentric thinking | `egocentric_thinking` | Only considering the perspectives of people like yourself |
| False certainty | `false_certainty` | Feeling confident about something without checking whether the reasoning supports it |

### Social Dynamics (3 — was 4)

| Dynamic | ID | Description |
|---|---|---|
| Group pressure | `group_pressure` | The group discouraging disagreement — whether through pressure that makes individuals go along despite private doubts, or through collective convergence where no one questions at all |
| Conflict avoidance | `conflict_avoidance` | Giving up a point you believe in because disagreeing feels uncomfortable |
| Authority deference | `authority_deference` | Letting the loudest or most confident person win without evaluating their reasoning |

---

## 4. Revised Coverage Tables

### Cognitive Pattern → Facet Coverage

| Cognitive Pattern | Facets It Commonly Explains |
|---|---|
| Confirmation bias | Source diversity, relevance, perspective engagement |
| Tunnel vision | Source diversity, internal consistency, consequence consideration, condition sensitivity |
| Overgeneralization | Relevance, sufficiency, condition sensitivity |
| False cause | Inferential validity |
| Uncritical acceptance | Source credibility, reasoning completeness |
| Black-and-white thinking | Inferential validity, consequence consideration |
| Egocentric thinking | Perspective engagement, condition sensitivity |
| False certainty | Sufficiency, reasoning completeness, condition sensitivity |

### Social Dynamic → Facet Coverage

| Social Dynamic | Facets It Commonly Explains |
|---|---|
| Group pressure | Source diversity, sufficiency, internal consistency, perspective engagement, consequence consideration, condition sensitivity |
| Conflict avoidance | Perspective engagement, internal consistency |
| Authority deference | Sufficiency, reasoning completeness, perspective engagement, source credibility |

### Coverage verification

Every facet is reachable by at least one cognitive pattern and at least one social dynamic:

| Facet | Cognitive Patterns | Social Dynamics |
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

**Gap:** Relevance and inferential validity have no social dynamic connection. This is acceptable — both are primarily cognitive errors (using the wrong evidence, drawing the wrong inference) that don't require a social mechanism to explain. A social dynamic *can* contribute (e.g., authority deference might cause the group to accept an irrelevant argument from the most confident member), but these are secondary co-occurrences rather than common explanatory paths. The pipeline can use them when natural; the gap does not indicate a structural problem.

---

## 5. Revised Priority Tiers

| Tier | Facets | Rationale |
|---|---|---|
| **Core** (from week 1) | Source credibility, relevance, sufficiency, inferential validity, perspective engagement | High cross-lens visibility, accessible to 6th graders, produce rich discussion |
| **Extend** (mid-pilot) | Source diversity, reasoning completeness, consequence consideration, condition sensitivity | Require more sophisticated observation, best introduced after students are comfortable with lenses |
| **Reserve** (future) | Internal consistency | Hardest to design for naturally, lowest cross-lens visibility |

**Change from v5-4:** Perspective engagement (Core) absorbs counter-argument engagement (previously Core), keeping the Core tier at 5 facets instead of the previous 6. This is a net simplification for early sessions.

---

## 6. Cross-Lens Visibility Map

| Facet | Primary Lens | Also Visible Through |
|---|---|---|
| Source credibility | Evidence | Logic |
| Source diversity | Evidence | Scope |
| Relevance | Evidence | Logic |
| Sufficiency | Evidence | Scope, Logic |
| Inferential validity | Logic | — |
| Internal consistency | Logic | Evidence |
| Reasoning completeness | Logic | Evidence |
| Perspective engagement | Scope | Evidence, Logic |
| Consequence consideration | Scope | Logic |
| Condition sensitivity | Scope | Logic, Evidence |

Observations from v5-4 remain valid: inferential validity is the only facet with no cross-lens visibility (convergent); Scope is the most independent lens (visibility flows toward Logic and Evidence, not from them).

Perspective engagement inherits the high cross-lens visibility of both its predecessors — it is visible through Evidence ("didn't look at evidence from the other side") and Logic ("argued against a twisted version of what the other person said"). It remains one of the strongest facets for generating perspectival diversity.

---

## 7. Future Considerations

Two observations from the inventory review to revisit after pilot data:

### False certainty vs. uncritical acceptance — monitor for merge

These patterns are adjacent: both involve insufficient checking. The current distinction is directional — uncritical acceptance is about **intake** (accepting others' claims without questioning), false certainty is about **output** (asserting conclusions without supporting). They connect to mostly different facets (source credibility vs. sufficiency/condition sensitivity) with only reasoning completeness shared. If pilot data shows students and the pipeline cannot reliably distinguish them, they are a merge candidate.

### Emotional reasoning — candidate for future addition

"Believing something because it feels right or feels important, not because the reasoning supports it." This is distinct from all 8 current patterns and common in middle school discussions — emotional urgency substituting for evidence or logic. It would connect to relevance (emotionally compelling but tangential evidence treated as relevant), sufficiency (emotional weight substituting for evidential weight), and inferential validity (conclusion follows emotionally but not logically). Deferred because it may be hard for 6th graders to distinguish from uncritical acceptance or false certainty in practice, and adding a 9th pattern increases cognitive load in the Explain phase.
