# Reasoning Lab: Game Design

This document specifies the game design for the **Reasoning Lab** — the second application built on the [Perspectival Framework for Teaching Critical Thinking](../../../framework/docs/conceptual-framework.md).

In Reasoning Lab, student teams are forensic analysis units investigating AI-generated group discussions. Each student uses a different scanner tool (lens) to examine evidence sites (passages). Teams score points for valid observations — and rare findings that only one team caught score triple. The core experience is competitive discovery: "what can your team see that nobody else will?"

---

## Design Goals

**Engagement through competition.** The scoring system makes every observation a strategic move. Rare findings score 3x, creating a natural incentive to look deeper and through unusual angles.

**Same framework, different energy.** Reasoning Lab exercises the same perceptual and explanatory capacities as Lens — lenses, hidden facets, explanatory variables — but through a team-based competitive structure rather than individual reflective writing.

**Low writing burden.** Individual scan reports are brief (1–2 sentences). Team case reports are collaborative and short. The cognitive work is in perception and team strategy, not in extended articulation.

**Perspectival diversity by design.** The scoring system structurally rewards diversity — a team that combines observations from multiple scanners scores higher than one that converges on a single finding. The scoreboard reveal makes diversity visible across the entire class.

---

## The Forensic Metaphor

The framework's structures map to forensic investigation language throughout:

| Framework Concept | Reasoning Lab Term | What Students See |
|---|---|---|
| Lens | Scanner tool | Evidence Scanner, Logic Probe, Scope Detector |
| Passage | Evidence site | A highlighted segment of the discussion to investigate |
| Individual diagnosis | Scan report | A brief individual observation filed with your scanner |
| Group discussion | Team brief | Face-to-face discussion combining scan results |
| Hint (lifeline) | Lab consult | Querying the database for guidance (costs a resource) |
| Group assessment | Case report | The team's combined findings, filed for scoring |
| AI perspective | Senior analyst report | Expert analysis available after the scoreboard reveal |
| Session | Case | "Today we're investigating a new case" |

The metaphor is not decorative — it reframes every student action from academic analysis to investigation. "File your scan report" produces the same cognitive work as "write your diagnosis" but carries different social meaning. The language should be consistent across the app UI, teacher materials, and classroom talk.

---

## Per-Passage State Machine

Each evidence site (passage) progresses through five states. Unlike Lens's flexible state machine, Reasoning Lab is **synchronized** — all teams work the same passage simultaneously, because the scoreboard requires cross-group comparison.

### Scan

Each student runs their assigned scanner on the evidence site and files a brief individual scan report (1–2 sentences: what they noticed through their tool). Students cannot see teammates' scan reports until all have filed. This preserves individual commitment before peer exchange.

A scan report includes:
- The scanner used (auto-filled from assignment)
- A strong/weak rating on that scanner's dimension
- A brief observation (what they noticed)

### Brief

All scan reports become visible within the team. The team discusses face-to-face: what did each scanner reveal? Do the findings connect? Are there contradictions? The team strategizes about what to include in their case report — common observations score 1 point, so the team should prioritize their most distinctive findings.

From here, the team can file their case report or spend a lab resource to consult the database.

### Lab Consult (optional)

Costs one lab resource from a shared pool. Returns a targeted hint — the same graduated scaffold as Lens's lifeline system, but framed as a database query result. Hints direct attention without revealing the answer. Sequential: each consult reveals the next hint in the scaffold sequence.

### File Case Report

The team files their case report: 2–4 observations, each with a brief explanation. Each observation includes:
- Which scanner(s) informed it
- What they noticed (1–2 sentences)
- Why the characters may have reasoned this way (1 sentence — optional but scores a bonus)

The case report is final for scoring purposes — no revision after filing. This creates commitment pressure that drives the Brief phase to be thorough. (Teams can still discuss and learn after filing; they just can't change their scored submission.)

### Scoreboard

After all teams file, the system compares observations across teams and reveals the scoreboard. This is the signature moment of each round — the reveal of what was common, what was rare, and what only one team caught.

The scoreboard shows:
- Each team's observations, anonymized or named (teacher's choice)
- Which observations were shared (found by multiple teams) vs. rare (found by one team)
- Point totals for this passage
- Running session total

After the scoreboard, the **senior analyst report** (AI perspective) becomes available to the whole class — free, no resource cost. It provides expert vocabulary for what the class collectively discovered and names any patterns or dynamics that no team caught.

### State Transitions

```
Scan ——→ Brief ——→ [Lab Consult] ——→ File Case ——→ Scoreboard + Senior Analyst
                        ↑    |
                        └────┘ (can consult multiple times)
```

Unlike Lens, the flow is linear and synchronized. All teams progress through the same passage at the same time. The teacher controls pacing — announcing when Scan opens, when teams should move to Brief, and when filing closes.

---

## Scoring System

### Observation Scoring

Each observation in a team's case report is matched against pre-computed scoring rubric entries (produced by the pipeline). The matching determines:

| Category | Points | When |
|---|---|---|
| **Shared finding** | 1 | Multiple teams' observations match the same rubric bucket |
| **Rare finding** | 3 | Only one team's observation matches this rubric bucket |
| **Deep finding bonus** | +1 | Observation matches a Level 3 (differentiated) rubric entry |
| **Explanatory bonus** | +1 | The "why" explanation validly names a cognitive pattern, social dynamic, or their interaction |

### How Matching Works

The pipeline produces observation rubric entries organized by passage, lens, and differentiation level — the same structure as Lens's observation rubric. Each entry is a "bucket" — a paraphrase of what a student might say about a particular facet at a particular level of specificity.

At runtime, the app matches each team's observations against these buckets using approximate text matching (same mechanism as Lens's assessment matching — no LLM at runtime). Two teams whose observations match the same bucket found the "same thing." Observations that match different buckets are different findings.

Observations that don't match any pre-computed bucket are flagged for teacher review. The teacher can award points manually for valid observations the pipeline didn't anticipate. This prevents the scoring system from penalizing genuine insight.

### Rarity Computation

Rarity is computed after all teams file, based on actual class-wide distribution:
- If 2+ teams match the same bucket → shared (1 point each)
- If exactly 1 team matches a bucket → rare (3 points)
- If a bucket exists in the rubric but no team matched it → it appears in the senior analyst report as "something the class missed"

### What the Scoring Rewards

The scoring system is calibrated to reward exactly what the framework values:

- **Perspectival diversity within teams** — A team that combines Evidence Scanner and Scope Detector findings will naturally produce more distinct observations than a team that converges on one scanner's perspective
- **Perceptual depth** — Level 3 (differentiated) observations earn a bonus and are more likely to be rare, since fewer students reach that level of specificity
- **Explanatory reasoning** — The "why" bonus incentivizes considering cognitive patterns and social dynamics, not just identifying what's weak
- **Strategic lens choice** — Students assigned less-obvious scanners for a passage (e.g., Logic Probe on an Evidence-targeted passage) are more likely to produce rare cross-lens findings

### What the Scoring Does Not Reward

- **Volume.** Case reports are capped at 4 observations. More observations don't help — better ones do.
- **Speed.** All teams file before the scoreboard reveals. There's no advantage to filing first.
- **Guessing.** Observations that don't match any rubric bucket score 0 unless the teacher manually validates them.

---

## Scanner Assignment

Each student on a team is assigned a scanner tool for the session. Scanners are the three lenses, renamed:

| Scanner | Framework Lens | The Question |
|---|---|---|
| Evidence Scanner | Evidence | Is the claim supported? |
| Logic Probe | Logic | Does the reasoning hold? |
| Scope Detector | Scope | Is the analysis thorough? |

### Assignment Rules

- **Teams of 3:** One scanner per student. All three lenses are represented.
- **Teams of 2:** Each student gets one scanner. The third lens is uncovered — teams can still make observations through it, but they lack a specialist. This creates a strategic gap that teams can exploit or that other teams may capitalize on.
- **Teams of 4:** One scanner is doubled. The doubled scanner should be the one with highest cross-lens visibility for this scenario's targeted facets (pipeline provides this recommendation in session configuration).

### Rotation

Scanners rotate across sessions — a student who used the Evidence Scanner in Session 1 gets the Logic Probe in Session 2. This ensures every student practices all three lenses over the course of the unit. The rotation also means a student develops expertise: "last time I used Logic Probe and found something nobody else did."

---

## Four Sources of Perspective

The framework requires a fixed sequence: Individual → Peer → AI → Teacher. Reasoning Lab adds a fifth source — cross-group comparison — that sits between Peer and AI:

1. **Individual** → Scan (each student files their own scan report)
2. **Peer (within team)** → Brief (team combines scanner findings face-to-face)
3. **Cross-group** → Scoreboard (teams see what the whole class found — what was common, what was rare)
4. **AI** → Senior analyst report (expert vocabulary for what the class discovered)
5. **Teacher** → Debrief (synthesizes across teams, names patterns, connects to future cases)

The scoreboard is the unique perspectival mechanism in Reasoning Lab. In Lens, students encounter other groups' perspectives only during the teacher debrief. In Reasoning Lab, the scoreboard makes cross-group diversity visible after every passage — "Team 2 caught something through the Scope Detector that nobody else saw." This creates an immediate, concrete experience of perspectival diversity that motivates the next round.

---

## Session Flow (50 minutes)

Two passages per session. The synchronized structure requires tighter pacing than Lens.

| Time | Phase | What Happens |
|---|---|---|
| 0–3 min | **Case briefing** | Teacher introduces the case — scenario context, topic summary. Teams assigned. Scanners distributed. |
| 3–7 min | **Passage 1: Scan** | Students read the passage and file individual scan reports |
| 7–12 min | **Passage 1: Brief** | Teams discuss, strategize, optionally consult the lab database |
| 12–15 min | **Passage 1: File** | Teams file case reports |
| 15–20 min | **Passage 1: Scoreboard** | Reveal. Senior analyst report available. Brief class reaction. |
| 20–24 min | **Passage 2: Scan** | Individual scan reports on harder passage |
| 24–30 min | **Passage 2: Brief** | Team discussion — informed by Passage 1 scoreboard |
| 30–33 min | **Passage 2: File** | Teams file case reports |
| 33–38 min | **Passage 2: Scoreboard** | Reveal. Senior analyst. |
| 38–48 min | **Debrief** | Teacher-led. Connects findings across teams and passages. Names patterns. "Why did these characters reason this way?" |
| 48–50 min | **Final scores + preview** | Session leaderboard. Tease next case. |

### Pacing Notes

- The teacher controls transitions between phases. A timer visible to all teams creates urgency without rigidity — the teacher can extend Brief by a minute if teams are deeply engaged.
- Passage 2 benefits from the Passage 1 scoreboard. Teams that saw a rare Logic Probe finding on the scoreboard will look more carefully through Logic on the next passage. This is the progressive calibration loop — same mechanism as Lens's progressive loop, driven by the scoreboard rather than the AI perspective.
- The debrief is shorter than Lens's (10 min vs. potentially longer) because the scoreboard has already surfaced cross-group diversity. The teacher's job is to deepen, not to reveal.

---

## Teacher Role

The teacher's role differs from Lens in two ways:

**During the session: pacing and energy.** In Lens, the teacher observes quietly. In Reasoning Lab, the teacher is the game master — announcing phases, managing the timer, building anticipation before scoreboard reveals ("Team 4 found something nobody else did..."), and keeping energy high. The facilitation guide provides specific language for these moments.

**During the debrief: deepening, not revealing.** In Lens, the debrief is where cross-group diversity first becomes visible. In Reasoning Lab, the scoreboard has already done this work. The debrief focuses on the "why" — connecting observations to cognitive patterns and social dynamics, naming what the senior analyst report surfaced, and asking "why was this hard to see?" or "why did most teams miss this?"

---

## Assessment

Learning is tracked across four dimensions (adapted from Lens's five):

- **Observation quality** — Do the student's scan reports and the team's case reports match pre-computed rubric entries? At what differentiation level? Tracked from scoring data — the scoring system IS the assessment system.
- **Perspectival range** — Does the student make observations through different scanners across sessions? Tracked from scanner assignment rotation and scan report content.
- **Explanatory depth** — Does the team's case report include valid "why" explanations? Do they reference both cognitive and social forces? Tracked from explanatory bonus scoring.
- **Scoring trajectory** — Is the team finding more rare and deep observations over time? The scoring data naturally tracks growth without additional assessment infrastructure.

Lens's "scaffolding independence" dimension doesn't apply directly (there are no automated probes or misreading redirects). Lab consult usage serves a similar signal — teams that consult less over time are developing independence.

Lens's "engagement" dimension is replaced by the scoring trajectory — in a competitive game, engagement is observable from participation, not from message counts.

---

## Relationship to Lens

Reasoning Lab and Lens are complementary, not competing applications:

| Dimension | Lens | Reasoning Lab |
|---|---|---|
| **Best for** | Depth, sustained reflection, individual growth | Energy, engagement, rapid perceptual sharpening |
| **Writing load** | High (extended articulation) | Low (brief reports, team-authored) |
| **Pacing** | Asynchronous within groups | Synchronized across class |
| **Motivation** | Intrinsic (discovery through articulation) | Competitive (rare findings, team scores) |
| **Cross-group visibility** | Only at teacher debrief | After every passage (scoreboard) |
| **Individual accountability** | High (every student writes a diagnosis) | Moderate (scan reports are brief; team carries the case) |

A teacher might use Reasoning Lab early in a unit to build engagement and lens fluency, then transition to Lens for deeper, more reflective work. Or use Reasoning Lab as an energizer between Lens sessions. The same scenario and transcript can feed both applications — the difference is in how students interact with the material and what artifacts the pipeline produces for each.

---

## Pipeline: Shared and Application-Specific

### Shared with Lens (upstream pipeline)

The following stages and artifacts are identical:

- **Stage 1: Create Scenario** → `scenario.yaml`
- **Stage 2: Create Transcript** → `transcript.yaml`
- **Stage 3: Analyze Transcript** → `analysis.yaml`

The same scenario plan, transcript, and expert analysis serve both applications. The information barrier, dialog writer, and evaluator work identically.

### Application-Specific (Reasoning Lab downstream pipeline)

Reasoning Lab requires three application-specific artifacts, produced by Reasoning Lab agents from the shared analysis:

**Scoring rubric** (`scoring.yaml`). Derived from the expert analysis and organized for cross-group comparison:
- Observation buckets per passage, per lens, at three differentiation levels (same structure as Lens's observation rubric, but tagged with rarity estimates based on cross-lens visibility and signal subtlety)
- Explanation buckets per passage — valid "why" explanations organized by type (cognitive, social, interaction)
- Bucket IDs for matching at runtime

**Competition facilitation guide** (`competition-facilitation.yaml`). The teacher's game-master companion:
- Per-passage pacing guidance and transition language
- Predicted scoreboard outcomes (which findings will likely be common vs. rare, based on signal design)
- Scoreboard reveal talking points ("here's what to highlight when only one team caught this")
- Debrief prompts focused on "why" (since cross-group "what" is already visible from scoreboard)
- Energy management guidance (what to do if competition gets too heated or if teams disengage)

**Session configuration** (`session.yaml`). Reasoning Lab variant:
- Scanner assignment recommendations per team size
- Scanner rotation schedule across sessions
- Scoring parameters (point values, case report observation cap)
- Timer defaults per phase
- Passage ordering (same difficulty signals as Lens)
- Leaderboard configuration (teacher toggles: anonymous vs. named, visible vs. hidden)

### Pipeline Stages (Reasoning Lab)

```
[shared] create_scenario → create_transcript → analyze_transcript
                                                      ↓
                                            design_scoring_rubric → configure_competition
                                                   ↓                        ↓
                                            scoring.yaml              session.yaml
                                            competition-facilitation.yaml
```

**Stage 4a: Design Scoring Rubric.** A scoring rubric agent receives the expert analysis and produces observation and explanation buckets optimized for cross-group comparison. It also produces the competition facilitation guide with predicted scoreboard outcomes. This agent replaces Lens's scaffolding instructional designer — different output, same input.

**Stage 5a: Configure Competition.** Assembles the session configuration from scoring rubric, analysis, and transcript — adding scanner assignments, scoring parameters, and timer defaults.

### What Reasoning Lab Does NOT Produce

- **Scaffolding materials** (Lens's `scaffolding.yaml`) — The graduated hint sequence, misreading redirects, deepening probes, and rubrics that Lens's app uses at runtime. Reasoning Lab uses a simpler lab consult system (hints only, no automated probes or redirects) and derives its assessment from scoring data rather than rubric matching on free text.
- **Lens facilitation guide** (Lens's `facilitation.yaml`) — Replaced by the competition facilitation guide, which has different teacher prompts organized around game pacing and scoreboard reveals rather than per-state scaffolding.
