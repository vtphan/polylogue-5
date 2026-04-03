# User Stories

This document describes how each role interacts with the Lens app. It is written to ensure the pipeline produces sufficiently rich artifacts for every interaction described here, and to validate that the student experience aligns with the conceptual framework (`polylogue-v5-4.md`).

**Roles:** Researcher, Teacher, Student

**Session structure:** Each discussion session has two phases — Evaluate ("What do you see in the reasoning?") and Explain ("Why did they think this way?"). Each phase follows an Individual → Peer → AI → Consensus sequence. The flow is linear: Evaluate completes fully before Explain begins.

**Devices:** Researchers use desktop (large screen). Teachers use desktop (primary) and tablet (when circulating). Students use tablets (touch-only, shared among groups of 2-4).

---

## Constraints

These are practical realities that the instructional design and delivery must respect. They constrain the pipeline (what it generates), the app (how it scaffolds), and the session design (how time is used).

### Teacher constraints

1. **Teachers should be informed, not burdened.** Teachers need to know the discussion topic, personas, highlighted passages, what's structurally present, and what the AI will say — before the session. They should not need to study the material deeply. The facilitation guide must be scannable in 2-3 minutes. A pedagogy primer and discussion briefing support onboarding and per-scenario preparation.

2. **Do not expect teachers to scaffold individual students in real time.** A teacher circulating among 5-6 groups of 3-4 students cannot provide timely, individualized feedback to each student. The app is the primary scaffold — lens questions, hints, sentence starters, AI perspectives. The teacher facilitates group discussion and helps stuck groups, not stuck individuals.

### Student constraints

3. **Students should not have to write a lot.** 6th graders have limited writing stamina and will disengage if the task feels like an essay. Use scaffolds — hints, sentence starters — to reduce the writing burden. Short, specific responses ("They only used one source") are more valuable than long, vague ones.

4. **Student responses should be low-stakes.** No grades attached to what students write. The append-only design means students can't fail — they can always add more. The system tracks growth over time through behavioral signals, not correctness per session. The activity should feel like thinking out loud, not being tested.

5. **Students work at different speeds.** In a group of 2-4, some students will finish the Individual step in 2 minutes, others in 8. The app cannot hold fast students hostage waiting for slow ones, and cannot rush slow ones. The peer step uses progressive reveal — fast students start seeing peers' work as it appears. The consensus step has a hard gate (all must finish the AI step), but the teacher can manually advance past it.

6. **Students should engage with the AI perspective, not skip it.** The AI step is where formal vocabulary gets introduced and where the framework's expert perspective adds value. If it's optional or easily skippable, most 6th graders will skip it. The app requires viewing the AI perspective and writing a brief response (even one sentence) before the phase is complete. The response can be as simple as "I noticed something different" — it forces a moment of engagement rather than passive scrolling.

### Discussion constraints

7. **A generated discussion should be short.** Students must read the entire discussion, evaluate multiple passages, discuss with peers, encounter the AI perspective, and reach group consensus — all within one session. The discussion transcript should be 10-14 turns, 1-3 sentences per turn, under 400 words total, readable in 3 minutes. Longer discussions don't produce proportionally richer evaluation — they produce fatigue.

8. **A generated discussion should be coherent.** The discussion must read like a real conversation — characters respond to each other, the topic develops, and the discussion reaches a resolution (or a meaningful failure to resolve). Coherence is what makes the evaluation task feel authentic rather than artificial. Students won't take the activity seriously if the discussion feels like a list of disconnected statements.

9. **A generated discussion should feel natural.** Characters should sound like students, not like textbooks. Language should be at the 6th-grade level. Reasoning weaknesses should emerge from the characters' perspectives and knowledge gaps, not from artificially planted errors. If a student can tell the discussion was designed to contain a specific flaw, the discussion has failed.

### Session constraints

10. **The session must fit in one class period.** At UMS, PBL is on Fridays, approximately 50 minutes. Both phases (Evaluate and Explain) with their full Individual → Peer → AI → Consensus cycles must complete within this time. This constrains everything — discussion length, number of highlighted passages, depth of articulation expected. The session configuration should allow the teacher to reduce the number of passages for shorter sessions.

11. **Group discussion is face-to-face, not app-mediated.** The app displays peers' written responses for reference, but the real peer exchange happens in person. 6th graders talking to each other is more productive than 6th graders typing at each other. The app's role in the Peer and Consensus steps is to make different perspectives visible and persistent, and to capture group decisions — not to mediate the conversation.

12. **Every group must have at least 2 students.** This is enforced during session setup. If an absence drops a group below 2, the teacher must reassign the student to another group before activating the session.

---

## Researcher

The researcher is the system administrator who sets up the app, manages teacher accounts, connects the pipeline's output to the app, and onboards new collaborators.

- Logs in with username and password.
- Creates teacher accounts (username and password).
- Configures the app's data sources (registry path, configs path). The app imports scenario artifacts into the database on publish. After import, scenarios are self-contained.
- Can view all classes, sessions, and aggregate student data across teachers (read-only).
- Can update reference materials when the framework evolves (e.g., revised facet inventory after pilot validation).
- Uses the **Framework Explorer** to navigate the conceptual framework (lenses → facets → explanatory variables) through three progressive levels: core essence, illustrative example, and full reference inventory.
- Uses the **Pipeline Walkthrough** to trace how any scenario was built — what went in, what came out, how the information barrier worked.
- Uses the **Artifact Viewer** to inspect scenario artifacts with overlay annotations explaining design intent, facet signals, and cross-artifact connections.

---

## Teacher

The teacher manages classes, configures sessions, facilitates the activity, and monitors student progress.

### Account and Classes

- Logs in with username and password.
- Has a dashboard showing all classes and recent session activity.
- Creates classes with a name and section identifier.
- Creates student accounts in batch for each class (full names only, no passwords).
- Assigns students to groups of 2-4 within each class. Groups can be reassigned between sessions.

### Pedagogy Onboarding

- On first login, sees a **pedagogy primer** — a paginated card sequence (~2 minutes) covering what students do, the three lenses, the four steps, why peer discussion matters, and why the expert perspective is not the answer.
- The primer is skippable and always available via a "How it works" link.

### Session Setup

- Creates a discussion session through a **step-by-step wizard**:
  1. **Select scenario** from researcher-published list. Each card shows topic, persona count, passage count.
  2. **Discussion briefing** — a structured walkthrough of the scenario: topic and context, persona cards, what's designed into the discussion (plain language), passage-by-passage preview with likely observations and misses per lens, what the AI will say. Includes a Scope lens callout when applicable. Read-only — the teacher absorbs the scenario before configuring.
  3. **Configure session parameters:**
     - **Lens assignment mode:** Assign lenses to students (ensuring each group has coverage across all three lenses) or let students choose. Assignment is recommended to guarantee perspectival diversity within groups.
     - **Highlighted passages:** Which passages students will evaluate. Defaults to all evaluable passages; the teacher can reduce for shorter sessions. Ordered by difficulty (from `scaffolding.yaml`).
     - **Explanation scaffolding:** Whether to show sentence starters in the Explain phase. Whether to show the cognitive pattern and social dynamic reference lists.
     - **Completion thresholds:** Minimum passages for Evaluate and Explain phases. These are soft gates — students are encouraged to continue but can move to peer discussion once they meet the minimum.
     - **"Why this matters" annotations** appear inline beneath each option, explaining the pedagogical rationale.
  4. **Review groups** — editable snapshot of class groups for this session only. Drag-and-drop students between groups. Validation: every student must be in a group, every group must have at least 2 students.
  5. **Review and save as draft.**
- **Session lifecycle:** Draft (fully editable) → Active (config and groups frozen, join code displayed, students can enter) → Closed (no new responses, all data preserved).

### During the Session

- **Session join code** displayed prominently on the monitoring dashboard. Teacher projects or reads aloud for students to enter.
- Views the **facilitation guide** as a collapsible side panel on the monitoring dashboard:
  - Per-passage content adapts to the current step: `whats_here` with quality levels during Individual, `productive_questions` during Peer, `what_the_ai_will_say` during AI. During Consensus, AI step content and peer questions remain visible.
  - Compact mode on tablet shows only the most actionable content per step.
  - Clicking a group in the monitoring panel highlights that group's passages in the guide.
- Monitors the class dashboard in real time:
  - Which students have completed each step (Individual, Peer, AI, Consensus) in each phase.
  - Which groups are at which step.
  - Flag for students who appear stuck (no response after a configurable time).
  - Can manually advance a group past the peer gate or consensus gate.
- Can view any student's responses at any time (lens choice, rating, articulations, explanations, consensus positions).

### Whole-Class Debrief

- After both phases complete, the teacher leads a whole-class debrief using the facilitation guide's `debrief` section:
  - **Key takeaways** — 2-3 main insights in teacher/facet language.
  - **Cross-group prompts** — questions to surface cross-group patterns, supplemented by live consensus data: "Groups A and C disagreed with the expert on passage 2 — what did you see that the expert missed?"
  - **Connection to next** — optional bridge to future sessions.
- The debrief is teacher-led, not app-mediated. The app does not track whether a debrief occurred — this is intentionally offline to keep it conversational.

### Closing the Session

- The teacher closes the session when both phases and the whole-class debrief are complete.
- Closing prevents new responses but preserves all existing data.
- Late students who didn't complete can be given additional time before close (teacher's discretion).
- A closed session can be reopened if needed but this should be rare.

### After the Session

- Reviews student responses through multiple views:
  - **By passage** — all student articulations for a passage, grouped by lens. Shows perspectival diversity.
  - **By student** — individual student's full response trail across all passages and steps (the four-step trajectory).
  - **By group** — group consensus positions across passages, with the individual reflections that preceded them.
- Views **engagement snapshot** per student — behavioral signals as patterns, not scores:
  - Passages beyond threshold, post-peer additions, AI reflection effort, consensus participation.
- Views learning trends per student over time:
  - **Perspectival range:** How many lenses has the student used across sessions?
  - **Articulation depth:** Word count trends for individual-step responses.
  - **Independence:** Hint usage rate and redirect trigger rate trends.
  - **Engagement trend:** Passages-beyond-threshold across sessions.
- Writes a **qualitative growth note** for each student (visible on the student's dashboard).
- Can view the full discussion transcript, expert analysis, scaffolding materials, and facilitation guide for any session at any time.

---

## Student

The student evaluates AI-generated group discussions through lenses, discusses with peers, encounters expert perspectives, and participates in group consensus. The app scaffolds this process through two phases on a tablet.

### Login and Dashboard

- Logs in by entering a **session join code** (short alphanumeric, displayed by the teacher) and **selecting their name** from the roster of students assigned to that session. No password.
- Sees a dashboard with:
  - Current session (prominent, one-tap entry) and past sessions (journey map — visual timeline of sessions as nodes on a path).
  - **Gamified growth indicators** (exploration/growth metaphor, not competition):
    - **Lens collection** — three lens icons that fill in as the student uses each lens across sessions. All three = milestone badge.
    - **Curiosity trail** — a visual that grows when the student evaluates more passages than required.
    - **Voice marker** — lights up for sessions where the student appended observations after seeing peers.
    - **Team marker** — lights up for sessions where the student's group completed consensus.
  - **Teacher's note** — a qualitative growth message written by the teacher, read-only.
  - Students do **not** see scores, rubric levels, speed metrics, peer comparisons, or AI agreement rates.

### Entering a Session

- Student opens the current session.
- **Onboarding moment:** Before evaluation begins, the student sees:
  - The discussion topic and a brief context ("A group of students is discussing whether schools should ban plastic bags...").
  - The characters in the discussion — names and brief perspectives.
  - A short instruction: "Read the discussion, then we'll look at it together through different lenses."
- The student reads the full discussion transcript (chat-style conversation). This is a dedicated reading step — no evaluation yet. The app tracks when the student has scrolled through the full discussion.
- After reading, the student is assigned a lens (or chooses one, depending on teacher configuration). The app displays the lens name and its question prominently throughout the Evaluate phase:
  - **Evidence:** "Is the claim supported?"
  - **Logic:** "Does the reasoning hold?"
  - **Scope:** "Is the analysis thorough?"
- The lens assignment scopes the Evaluate phase only. In the Explain phase, the student works across all passages they evaluated, regardless of which lens they used. The Explain question ("Why did they think this way?") is lens-independent — it draws on cognitive and social variables, not lenses.

---

### Evaluate Phase

*"What do you see in the reasoning?"*

The student evaluates highlighted passages in the discussion through their assigned lens.

#### Individual Step

- Student sees the full discussion transcript. Speakers are identified by name. Each turn is visible.
- Highlighted passages have numbered icons at the end of the most prominent turn. Passages are suggested in order of accessibility (using the difficulty signal from `scaffolding.yaml`), but the student can evaluate in any order.
- Student taps a highlighted passage icon. A modal opens (near-fullscreen on tablet) showing:
  - **The passage** — the 1-3 turns that form a coherent moment in the discussion.
  - **The lens-specific entry prompt** — a per-passage prompt more directed than the generic lens question. e.g., "Looking through Evidence: what sources did they use, and are those sources convincing?" (from `scaffolding.yaml`).
  - **Rating** — Strong or Weak. The student commits to a position.
  - **Articulation box** — The student writes what they observe.
  - **Partial hint button** (optional) — If the student is stuck, they can tap to see 1-2 directional prompts that point toward something worth noticing without completing the observation. e.g., "Something about the sources..." The hint gives direction; the student does the cognitive work of articulating.
- **Misreading redirects.** If a student's articulation matches a predicted common misreading (from `scaffolding.yaml`), the app surfaces a gentle redirect after submission — a prompt that redirects attention without naming the correct observation. e.g., "You noticed there's a lot of evidence — now look more closely at where it comes from." The student can add to their response. This is attentional redirect, not correction.
- All responses are **append-only**. The student cannot edit what they wrote, but they can always add more.
- After evaluating the required number of passages (set by teacher's completion threshold), the student sees encouragement to move to the Peer step. They can also continue evaluating more passages.

#### Peer Step

- The student indicates they are ready for peer discussion (button tap).
- **Progressive reveal:** As each peer taps "Ready," their responses become visible to everyone already waiting. No all-ready gate — respects async pacing. Fast students start seeing peers' work as it appears. While waiting, the student can continue evaluating more passages.
- The app shows how peers in their group evaluated the same passages:
  - **Organized by passage** — each passage shows all peers' responses together.
  - **Cross-lens visibility** — the student sees what peers saw through *different* lenses on the same passage.
  - For each peer: which lens they used, how they rated (strong/weak), what they wrote.
  - **Disagreement highlighting** — passages where peers gave different ratings (strong vs. weak), or where two peers with the same lens noticed different things, are visually marked as "interesting differences." Different-lens observations on the same passage are the expected state and are not highlighted as surprising.
- Students discuss in person. The app makes perspectives visible and persistent, not a chat interface.
- After discussion, the student can add more observations (append-only).
- When done discussing, they move to the AI step individually.

#### AI Step

- The app shows the **Evaluate AI perspective** for each highlighted passage (`ai_perspective_evaluate` from the expert analysis):
  - Per-lens observations: "Looking through the Evidence lens, I notice that both sources come from the same organization..."
  - A `what_to_notice` prompt: "Something interesting to think about: did anyone in the group push back on this?"
- The AI perspective is framed as one more voice, not the answer: "Here's what an expert noticed when looking through each lens."
- The student sees a **passage-specific reflection prompt** (from `scaffolding.yaml`).
- The student writes a brief response. Required (even one sentence). Append-only.

#### Consensus Step

- When all group members finish their AI reflections, the consensus step opens. (Teacher can manually advance past this gate.)
- For each evaluated passage, the group sees:
  - The AI perspective (same content from the AI step)
  - Each group member's individual AI reflection (read-only)
- The group discusses face-to-face — debating whether the expert's observations match what they saw. Then the group submits a single consensus response per passage:
  - **Position:** Agree or Disagree with the AI perspective
  - **Rationale:** A short written explanation (1-3 sentences) of why the group agrees or disagrees
- One group member submits on behalf of the group. After submission, any group member can append additional thoughts (append-only).
- Disagreeing is explicitly legitimate: "The expert noticed X, but we think Y matters more because..."
- After completing consensus for all passages, the group transitions to the Explain phase.

---

### Explain Phase

*"Why did they think this way?"*

The student considers why the characters in the discussion reasoned the way they did — practicing perspective taking by reasoning about others' thinking. Students consider both individual thinking patterns and group dynamics as possible forces shaping the characters' reasoning. The lens assignment from the Evaluate phase no longer applies.

#### Individual Step

- Student sees the full discussion transcript with passage icons.
- Tapping a passage opens a modal showing:
  - **The passage** — same 1-3 turns.
  - **Their Evaluate responses** — visible at the top, read-only, so they can see what they already observed.
  - **Bridge prompt** (from `scaffolding.yaml`) — connects the student's Evaluate observation to the Explain task, personalized to the lens they used. e.g., "You noticed something about the evidence. Now think about *why* — what was going on in the group when this happened?"
  - **Explanation prompt** — "Why do you think they reasoned this way?"
  - **Sentence starters** (if enabled by teacher):
    - Generic session-level starters always visible:
      - "I think they reasoned this way because they were focused on..." (cognitive)
      - "I think the group..." (social)
      - "The group made it easier/harder for this kind of thinking because..." (interaction)
    - **Passage-specific starters** behind "I need more help" (from `scaffolding.yaml`).
  - **Reference lists** (if enabled by teacher) — browsable cognitive patterns and social dynamics with descriptions. Reference, not a menu — the student writes in their own words.
- Append-only. Same threshold + soft gate as Evaluate.

#### Peer Step

- Same progressive reveal model as Evaluate. Display organized by passage:
  - Each peer's explanation
  - **Difference highlighting** — flags where one peer identified a cognitive pattern and another a social dynamic
  - Append-only additions after discussion
  - Teacher can manually advance groups

#### AI Step

- The app shows the **Explain AI perspective** for each passage (`ai_perspective_explain` from the expert analysis):
  - An explanatory note introducing formal vocabulary as perspective: "A cognitive scientist might call this confirmation bias..."
  - Cognitive connection, social connection, interaction note
  - Passage-specific reflection prompt (from `scaffolding.yaml`)
- Required response (even one sentence). Append-only.

#### Consensus Step

- Same structure as the Evaluate consensus. When all group members finish their AI reflections:
  - For each passage, the group sees: the AI perspective + each group member's individual AI reflection
  - The group discusses face-to-face, then submits a single consensus response per passage:
    - **Position:** Agree or Disagree with the AI's explanation
    - **Rationale:** Why the group agrees or disagrees (1-3 sentences)
  - Same submission model: one member submits, others can append.
- After completing consensus for all passages → **Session Complete** screen with summary and encouragement.

---

### Session Completion

- After the Explain Consensus step, the student sees a brief summary:
  - Which passages they evaluated and explained.
  - Which lens they used in the Evaluate phase.
  - Group consensus positions (agreed/disagreed with expert on which passages).
  - A note encouraging continued growth: "You evaluated 3 passages through the Evidence lens. Next time, try looking through the Logic lens to see different things."
- Responses remain append-only until the teacher closes the session.

---

## Pipeline Artifact Requirements

This section maps each user interaction to the pipeline artifact that supports it, ensuring nothing is missing.

| Interaction | Artifact | Specific field(s) |
|---|---|---|
| Student reads discussion | `transcript.yaml` | `turns`, `sentences`, `personas` |
| Student sees highlighted passages | `session.yaml` | `passages` (evaluable passages with turn ranges) |
| Student sees lens question | `session.yaml` | `lens_definitions` |
| Student sees lens-specific entry prompt | `scaffolding.yaml` | `passage_scaffolding[].evaluate.lens_entry_prompts` |
| Student sees difficulty-ordered passages | `scaffolding.yaml` | `passage_scaffolding[].evaluate.difficulty` |
| Student gets partial hint | `scaffolding.yaml` | `passage_scaffolding[].evaluate.partial_hints` per lens |
| Student sees misreading redirect | `scaffolding.yaml` | `passage_scaffolding[].common_misreadings` per lens |
| Student sees Evaluate AI perspective | `analysis.yaml` | `ai_perspective_evaluate` (per-lens observations, `what_to_notice`) |
| Student sees Evaluate AI reflection prompt | `scaffolding.yaml` | `passage_scaffolding[].evaluate.ai_reflection_prompts` per lens |
| Student sees bridge prompt | `scaffolding.yaml` | `passage_scaffolding[].explain.bridge_prompts` per lens |
| Student sees generic sentence starters | `session.yaml` | `explain_phase.individual.sentence_starters` |
| Student sees passage-specific starters | `scaffolding.yaml` | `passage_scaffolding[].explain.passage_sentence_starters` |
| Student sees reference lists | `session.yaml` | `explain_phase.reference_lists` |
| Student sees Explain AI perspective | `analysis.yaml` | `ai_perspective_explain` (explanatory note, connections, interaction) |
| Student sees Explain AI reflection prompt | `scaffolding.yaml` | `passage_scaffolding[].explain.ai_reflection_prompt` |
| Group consensus on Evaluate AI | `analysis.yaml` | `ai_perspective_evaluate` (displayed during consensus for group deliberation) |
| Group consensus on Explain AI | `analysis.yaml` | `ai_perspective_explain` (displayed during consensus for group deliberation) |
| Teacher sees facilitation guide | `facilitation.yaml` | `overview`, `passage_guides` (per phase and step) |
| Teacher sees what's structurally present | `facilitation.yaml` | `passage_guides.whats_here` (facet language, quality levels) |
| Teacher sees likely observations | `facilitation.yaml` | `passage_guides.likely_observations` per lens |
| Teacher sees discussion starters | `facilitation.yaml` | `passage_guides[].evaluate.peer.productive_questions`, `passage_guides[].explain.peer.productive_questions` |
| Teacher sees scaffolding materials | `scaffolding.yaml` | Full artifact |
| Teacher configures session | `session.yaml` | `evaluate_phase`, `explain_phase`, `passages`, `lens_definitions` |
| Teacher sees observation rubric | `scaffolding.yaml` | `passage_scaffolding[].observation_rubric` (per lens, basic/developing/differentiated) |
| Teacher sees explanation rubric | `scaffolding.yaml` | `passage_scaffolding[].explanation_rubric` (per category: cognitive/social/interaction) |
| Teacher reviews facilitation debrief | `facilitation.yaml` | `debrief` (key takeaways, cross-group prompts, connection to next) |
| Researcher explores framework | Reference data | `lenses.yaml`, `facet_inventory.yaml`, `explanatory_variables.yaml` |

### Design Decisions Reflected

1. **Partial hints, not complete observations.** Hints give direction ("Something about the sources..."); the student does the cognitive work of articulating. The app tracks hint usage as a behavioral signal.

2. **Lens assignment scopes to Evaluate only.** The Explain phase is lens-independent — it asks "why did they think this way?" which draws on cognitive and social variables, not lenses.

3. **Cross-lens peer visibility.** In the Peer step, students see what peers saw through *different* lenses on the same passage. Without cross-lens visibility, students in a group with assigned lenses would only see agreement or disagreement within the same lens.

4. **Required AI response.** The AI step requires a brief written response (even one sentence) before the student can proceed to consensus. This forces engagement with the AI perspective rather than passive consumption.

5. **Consensus step positions AI as evaluable, not authoritative.** The group decides whether to agree or disagree with the expert's perspective. This binary decision anchors discussion for 6th graders while making disagreement explicitly legitimate. The consensus rationale captures collaborative reasoning.

6. **Assessment through behavioral signals, not rubric matching.** The app tracks objective signals (passages beyond threshold, post-peer additions, hint usage, consensus participation, word count trends) rather than matching articulations against rubrics at runtime. Rubrics remain a teacher-facing reference for qualitative review. No LLM at runtime.

7. **Session close is a teacher action.** The teacher explicitly closes the session. This prevents indefinite open sessions and creates a clean boundary for data analysis.

8. **Linear phase progression.** Students complete the full Evaluate phase (Individual → Peer → AI → Consensus) before the Explain phase unlocks. No toggling between phases.

9. **Gamified student dashboard.** Growth indicators reward exploration, engagement, and collaboration — not speed, correctness, or competition. Students never see scores, rubric levels, or peer comparisons.
