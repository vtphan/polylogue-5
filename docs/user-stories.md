# User Stories

This document describes how each role interacts with the Perspectives app. It is written to ensure the pipeline produces sufficiently rich artifacts for every interaction described here, and to validate that the student experience aligns with the conceptual framework (`polylogue-v5-4.md`).

**Roles:** Researcher, Teacher, Student

**Session structure:** Each discussion session has two phases — Evaluate ("What do you see in the reasoning?") and Explain ("Why did they think this way?"). Each phase follows an Individual → Peer → AI sequence.

---

## Constraints

These are practical realities that the instructional design and delivery must respect. They constrain the pipeline (what it generates), the app (how it scaffolds), and the session design (how time is used).

### Teacher constraints

1. **Teachers should be informed, not burdened.** Teachers need to know the discussion topic, personas, highlighted passages, what's structurally present, and what the AI will say — before the session. They should not need to study the material deeply. The facilitation guide must be scannable in 2-3 minutes.

2. **Do not expect teachers to scaffold individual students in real time.** A teacher circulating among 5-6 groups of 3-4 students cannot provide timely, individualized feedback to each student. The app is the primary scaffold — lens questions, hints, sentence starters, AI perspectives. The teacher facilitates group discussion and helps stuck groups, not stuck individuals.

### Student constraints

3. **Students should not have to write a lot.** 6th graders have limited writing stamina and will disengage if the task feels like an essay. Use scaffolds — hints, sentence starters, selectable observations — to reduce the writing burden. Short, specific responses ("They only used one source") are more valuable than long, vague ones.

4. **Student responses should be low-stakes.** No grades attached to what students write. The append-only design means students can't fail — they can always add more. The system tracks growth over time, not correctness per session. The activity should feel like thinking out loud, not being tested.

5. **Students work at different speeds.** In a group of 3-4, some students will finish the Individual step in 2 minutes, others in 8. The app cannot hold fast students hostage waiting for slow ones, and cannot rush slow ones. Phase transitions must accommodate asynchronous pacing within groups — fast students can evaluate more passages while waiting, slow students can meet the minimum threshold.

6. **Students should engage with the AI perspective, not skip it.** The AI step is where formal vocabulary gets introduced and where the framework's expert perspective adds value. If it's optional or easily skippable, most 6th graders will skip it. The app requires viewing the AI perspective and writing a brief response (even one sentence) before the phase is complete. The response can be as simple as "I noticed something different" — it forces a moment of engagement rather than passive scrolling.

### Discussion constraints

7. **A generated discussion should be short.** Students must read the entire discussion, evaluate multiple passages, discuss with peers, and encounter the AI perspective — all within one session. The discussion transcript should be 10-14 turns, 1-3 sentences per turn, under 400 words total, readable in 3 minutes. Longer discussions don't produce proportionally richer evaluation — they produce fatigue.

8. **A generated discussion should be coherent.** The discussion must read like a real conversation — characters respond to each other, the topic develops, and the discussion reaches a resolution (or a meaningful failure to resolve). Coherence is what makes the evaluation task feel authentic rather than artificial. Students won't take the activity seriously if the discussion feels like a list of disconnected statements.

9. **A generated discussion should feel natural.** Characters should sound like students, not like textbooks. Language should be at the 6th-grade level. Reasoning weaknesses should emerge from the characters' perspectives and knowledge gaps, not from artificially planted errors. If a student can tell the discussion was designed to contain a specific flaw, the discussion has failed.

### Session constraints

10. **The session must fit in one class period.** At UMS, PBL is on Fridays, approximately 50 minutes. Both phases (Evaluate and Explain) with their full Individual → Peer → AI cycles must complete within this time. This constrains everything — discussion length, number of highlighted passages, depth of articulation expected. The session configuration should allow the teacher to reduce the number of passages for shorter sessions.

11. **Group discussion is face-to-face, not app-mediated.** The app displays peers' written responses for reference, but the real peer exchange happens in person. 6th graders talking to each other is more productive than 6th graders typing at each other. The app's role in the Peer step is to make different perspectives visible and persistent, not to mediate the conversation.

---

## Researcher

The researcher is the system administrator who sets up the app, manages teacher accounts, and connects the pipeline's output to the app.

- Logs in with username and password.
- Creates teacher accounts (username and password).
- Configures the app's data sources:
  - Discussion registry — the directory containing pipeline-generated scenarios (transcripts, expert analyses, facilitation guides, scaffolding materials, session configurations).
  - Reference materials — lens definitions, facet inventory, cognitive patterns, social dynamics.
- Can view all classes, sessions, and aggregate student data across teachers.
- Can update reference materials when the framework evolves (e.g., revised facet inventory after pilot validation).

---

## Teacher

The teacher manages classes, configures sessions, facilitates the activity, and monitors student progress.

### Account and Classes

- Logs in with username and password.
- Has a dashboard showing all classes and recent session activity.
- Creates classes with a name and section identifier.
- Creates student accounts in batch for each class (full names only, no passwords).
- Assigns students to groups of 3-4 within each class. Groups can be reassigned between sessions.

### Session Setup

- Creates a discussion session by selecting a scenario from the registry. The teacher sees:
  - The discussion topic and PBL connection.
  - A plain-language summary of what's designed into the discussion (from the facilitation guide overview).
  - The number of highlighted passages and which lenses are most relevant.
- Configures session parameters:
  - **Lens assignment mode:** Assign lenses to students (ensuring each group has coverage across all three lenses) or let students choose. Assignment is recommended to guarantee perspectival diversity within groups.
  - **Highlighted passages:** Which passages students will evaluate. Defaults to all evaluable passages; the teacher can reduce for shorter sessions. The app uses difficulty signals from `scaffolding.yaml` to suggest a default ordering (accessible passages first).
  - **Explanation scaffolding:** Whether to show sentence starters in the Explain phase. Whether to show the cognitive pattern and social dynamic reference lists. Recommended: starters on from the start, reference lists introduced after a few sessions.
  - **Completion thresholds:** Minimum engagement for each phase — e.g., "evaluate at least 2 highlighted passages" for Evaluate, "explain at least 2 passages" for Explain. These are completion gates, not quality measures.

### During the Session

- Views the facilitation guide for the current session:
  - **Overview:** Topic, what's structurally present (in facet language), suggested timing, what to expect.
  - **Per-passage guides:** For each highlighted passage, organized by phase (Evaluate, Explain) and step (Individual, Peer, AI):
    - What students are likely to see and miss through each lens.
    - Suggested redirects if students are stuck ("Try looking through the Scope lens — who is missing from this conversation?").
    - Likely disagreements during peer discussion and productive questions to deepen it.
    - **Discussion starter questions** — specific, pipeline-generated questions the teacher can pose to a group to surface disagreement. e.g., "Maya rated this as strong through Evidence and Jayden rated it weak through Logic — can you both explain what you saw?" These are in the facilitation guide's `productive_questions` fields, enriched by the scaffolding instructional designer.
    - What the AI will say, so the teacher isn't surprised.
- Monitors the class dashboard in real time:
  - Which students have completed the Individual step and are ready for peer discussion.
  - Which groups are in peer discussion vs. still working individually.
  - Which students have viewed the AI perspective and written a response.
  - Flag for students who appear stuck (no response after a configurable time).
- Can view any student's responses at any time (lens choice, rating, articulations, explanations).

### Closing the Session

- The teacher closes the session when both phases are complete and wrap-up discussion is done.
- Closing prevents new responses but preserves all existing data.
- Late students who didn't complete can be given additional time before close (teacher's discretion).
- A closed session can be reopened if needed but this should be rare — it signals to students that the session is done.

### After the Session

- Reviews student responses per passage:
  - Sees all student articulations for a passage, grouped by lens. This shows the teacher whether perspectival diversity occurred — did students looking through different lenses see different things?
  - Sees all student explanations, noting whether students identified cognitive patterns, social dynamics, or their interaction.
- Views learning statistics per student over time:
  - **Articulation quality:** Are descriptions getting more specific across sessions? Tracked by matching articulations against the observation rubric (basic → developing → differentiated). Shown as a trend, not a score.
  - **Perspectival range:** How many lenses has the student used? Do they tend to default to one lens?
  - **Explanatory depth:** Are explanations connecting cognitive and social forces, or only identifying one?
- Can export session data for research purposes.

### Viewing Discussion Content

- Can view the full discussion transcript for any session.
- Can view the expert analysis — both the hidden layer (facet annotations, explanatory variables) and the visible layer (AI perspectives for Evaluate and Explain phases).
- Can view the scaffolding materials — hints, prompts, rubric entries — to understand what the app showed students.
- Can view the facilitation guide at any time, not just during the session.

---

## Student

The student evaluates AI-generated group discussions through lenses, discusses with peers, and encounters expert perspectives. The app scaffolds this process through two phases.

### Login and Dashboard

- Logs in with full name only. No password.
- Sees a dashboard with:
  - Current session (if active) and past sessions.
  - Personal learning statistics (simplified for 6th graders):
    - Number of sessions completed.
    - Lenses used (visual indicator showing which lenses they've practiced).
    - A qualitative growth indicator — not a grade, but something like "You're getting more specific in your observations" — generated by comparing recent articulations against the observation rubric's differentiation levels.

### Entering a Session

- Student opens the current session.
- **Onboarding moment:** Before evaluation begins, the student sees:
  - The discussion topic and a brief context ("A group of students is discussing whether schools should ban plastic bags...").
  - The characters in the discussion — names and brief perspectives.
  - A short instruction: "Read the discussion, then we'll look at it together through different lenses."
- The student reads the full discussion transcript. This is a dedicated reading step — no evaluation yet. The app tracks when the student has scrolled through the full discussion.
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
- Highlighted passages have numbered icons at the end of the most prominent turn. The numbers are passage identifiers, not flaw labels. Passages are suggested in order of accessibility (using the difficulty signal from `scaffolding.yaml`), but the student can evaluate in any order.
- Student clicks a highlighted passage icon. A modal opens showing:
  - **The passage** — the 1-3 turns that form a coherent moment in the discussion. (The icon is on one turn, but the modal shows the full passage for context.)
  - **The lens-specific entry prompt** — a per-passage prompt more directed than the generic lens question. e.g., "Looking through Evidence: what sources did they use, and are those sources convincing?" (from `scaffolding.yaml`). Falls back to the generic lens question if the teacher has disabled passage-specific prompts.
  - **Rating** — Strong or Weak. The student commits to a position.
  - **Articulation box** — The student writes what they observe.
  - **Partial hint button** (optional) — If the student is stuck, they can click to see 1-2 directional prompts that point toward something worth noticing without completing the observation. e.g., "Something about the sources..." or "Notice how the conclusion compares to the evidence..." The partial hint appears as a prompt *above* the articulation box — the student must write their own response, not select a pre-written one. The hint gives direction; the student does the cognitive work of articulating.
- All responses are **append-only**. The student cannot edit what they wrote, but they can always add more — like text messages. This creates a visible record of how their thinking builds over time.
- After evaluating the required number of passages (set by teacher's completion threshold), the student sees encouragement to move to the Peer step. They can also continue evaluating more passages.

#### Peer Step

- The student indicates they are ready for peer discussion (button click).
- The app shows how peers in their group evaluated the same passages:
  - **Organized by passage** — each passage shows all peers' responses together, making it easy to compare.
  - **Cross-lens visibility** — the student sees what peers saw through *different* lenses on the same passage. If Maya evaluated through Evidence and Jayden through Logic, Maya sees Jayden's Logic observation and vice versa. This is where perspectival diversity becomes visible.
  - For each peer: which lens they used, how they rated (strong/weak), what they wrote.
  - **Disagreement highlighting** — passages where peers gave different ratings or used different lenses are visually marked as "interesting differences" to discuss.
- Students discuss in person (the app does not mediate the conversation — this is face-to-face in the classroom). The app makes perspectives visible so students can see what their peers saw differently.
- After seeing peers' responses, the student can add more to their own articulations — new observations prompted by what peers noticed. Append-only.
- When ready, the student clicks to move to the AI step.

#### AI Step

- The app shows the **Evaluate AI perspective** for each highlighted passage. This is the `ai_perspective_evaluate` block from the expert analysis:
  - Per-lens observations: "Looking through the Evidence lens, I notice that both sources come from the same organization..."
  - A `what_to_notice` prompt: "Something interesting to think about: did anyone in the group push back on this?"
- The AI perspective is framed as one more voice, not the answer: "Here's what an expert noticed when looking through each lens."
- The student sees a **passage-specific reflection prompt** (from `scaffolding.yaml`): e.g., "The AI noticed the sources all come from one place. Did you notice that too, or were you looking at something different?" This is more engaging than the generic "What do you think?" and models the perspectival engagement the framework values.
- The student writes a brief response to the AI perspective. This is required (not optional) to complete the phase, but can be as short as one sentence. The purpose is to force a moment of engagement — considering the AI's perspective against their own — rather than passive scrolling. Append-only.

---

### Explain Phase

*"Why did they think this way?"*

The student considers why the characters in the discussion reasoned the way they did — practicing perspective taking by reasoning about others' thinking, not asserting a correct diagnosis. Students consider both individual thinking patterns and group dynamics as possible forces shaping the characters' reasoning. The lens assignment from the Evaluate phase no longer applies — the Explain question is lens-independent.

#### Individual Step

- Student sees the full discussion transcript, same as before.
- The passages they evaluated in the Evaluate phase are marked with icons. When the student clicks one, a modal opens showing:
  - **The passage** — same 1-3 turns.
  - **Their Evaluate responses** — visible at the top of the modal, so they can see what they already observed. These are read-only.
  - **Bridge prompt** (from `scaffolding.yaml`) — connects the student's Evaluate observation to the Explain task, personalized to the lens they used. A student who evaluated through Evidence sees: "You noticed something about the evidence. Now think about *why* — what was going on in the group when this happened?" A student who evaluated through Logic sees: "You noticed something about the reasoning. Now think about *why* — what led them to think that way?" This makes the transition from "what do you see" to "why" feel continuous rather than abrupt.
  - **Explanation prompt** — "Why do you think they reasoned this way?"
  - **Sentence starters** (if enabled by teacher):
    - Generic session-level starters shown first:
      - "I think they reasoned this way because they were focused on..." (cognitive)
      - "I think the group..." (social)
      - "The group made it easier/harder for this kind of thinking because..." (interaction — connects cognitive and social)
    - **Passage-specific starters** available as a fallback if the student is stuck (from `scaffolding.yaml`). These are more directed, gesturing toward what's structurally present without naming it: e.g., "I think Maya kept going back to cost because..." The generic starters are always visible; the passage-specific starters appear when the student clicks "I need more help."
  - **Reference lists** (if enabled by teacher) — A browsable list of cognitive patterns ("Confirmation bias: Only looking for information that supports what you already believe") and social dynamics ("Conformity: Going along with the group even when you privately disagree"). These are reference, not a menu to select from — the student writes in their own words.
- The student writes their explanation. Append-only.
- After explaining the required number of passages, the student sees encouragement to move to the Peer step. They can also continue.

#### Peer Step

- The student indicates they are ready for peer discussion.
- The app shows how peers in their group explained the same passages:
  - **Organized by passage** — each passage shows all peers' explanations together.
  - What cognitive or social forces peers identified.
  - Whether peers connected cognitive and social forces (the interaction).
  - **Difference highlighting** — passages where peers offered different types of explanations (one cognitive, one social) are marked as discussion opportunities.
- Students discuss in person.
- The student can add more to their explanations after seeing peers' perspectives. Append-only.
- When ready, the student clicks to move to the AI step.

#### AI Step

- The app shows the **Explain AI perspective** for each passage. This is the `ai_perspective_explain` block from the expert analysis:
  - An explanatory note introducing formal vocabulary as perspective: "A cognitive scientist might call this confirmation bias — when someone only looks for information that supports what they already believe."
  - A cognitive connection: how a thinking pattern accounts for what was observed.
  - A social connection: how a group dynamic accounts for what was observed.
  - An interaction note: how cognitive and social forces worked together — "Notice how her tunnel vision persisted because nobody in the group pushed back — the group's conflict avoidance made it easier for her to stay focused on just one thing."
- The student sees a **passage-specific reflection prompt** (from `scaffolding.yaml`): e.g., "The AI called this confirmation bias. Does that match what you were trying to say, or do you see it differently?"
- The student writes a brief response. Required to complete the phase — even one sentence. Append-only.

---

### Session Completion

- After the Explain AI step, the student sees a brief summary:
  - Which passages they evaluated and explained.
  - Which lens they used in the Evaluate phase.
  - A note encouraging continued growth: "You evaluated 3 passages through the Evidence lens. Next time, try looking through the Logic lens to see different things."
- The student can return to any passage to add more thoughts (append-only) until the teacher closes the session.

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
| Student sees Evaluate AI perspective | `analysis.yaml` | `ai_perspective_evaluate` (per-lens observations, `what_to_notice`) |
| Student sees Evaluate AI reflection prompt | `scaffolding.yaml` | `passage_scaffolding[].evaluate.ai_reflection_prompts` per lens |
| Student sees bridge prompt | `scaffolding.yaml` | `passage_scaffolding[].explain.bridge_prompts` per lens (app selects by student's Evaluate lens) |
| Student sees generic sentence starters | `session.yaml` | `explain_phase.individual.sentence_starters` |
| Student sees passage-specific starters | `scaffolding.yaml` | `passage_scaffolding[].explain.passage_sentence_starters` |
| Student sees reference lists | `session.yaml` | `explain_phase.reference_lists` |
| Student sees Explain AI perspective | `analysis.yaml` | `ai_perspective_explain` (explanatory note, connections, interaction) |
| Student sees Explain AI reflection prompt | `scaffolding.yaml` | `passage_scaffolding[].explain.ai_reflection_prompt` |
| Teacher sees facilitation guide | `facilitation.yaml` | `overview`, `passage_guides` (per phase and step) |
| Teacher sees what's structurally present | `facilitation.yaml` | `passage_guides.whats_here` (facet language) |
| Teacher sees likely observations | `facilitation.yaml` | `passage_guides.likely_observations` per lens |
| Teacher sees discussion starters | `facilitation.yaml` | `passage_guides[].evaluate.peer.productive_questions`, `passage_guides[].explain.peer.productive_questions` (enriched by scaffolding instructional designer) |
| Teacher sees scaffolding materials | `scaffolding.yaml` | Full artifact (for review and understanding of what students see) |
| Teacher configures session | `session.yaml` | `evaluate_phase`, `explain_phase`, `passages`, `lens_definitions` |
| Assessment: articulation matching | `scaffolding.yaml` | `passage_scaffolding[].observation_rubric` (per lens, basic/developing/differentiated) |
| Assessment: explanation matching | `scaffolding.yaml` | `passage_scaffolding[].explanation_rubric` (per category: cognitive/social/interaction, with levels) |
| Assessment: articulation ground truth | `analysis.yaml` | `facet_annotations`, `diversity_potential.likely_student_observations` |
| Assessment: explanatory depth | `analysis.yaml` | `ai_perspective_explain` (ground truth for cognitive/social/interaction) |

### Design Decisions Reflected

1. **Partial hints, not complete observations.** The v1 design had full observations as hints ("They only used one source to back up a big claim") copied into the articulation box. The revised design uses partial hints ("Something about the sources...") displayed as prompts above the box. This preserves the framework's articulation-as-learning principle: the hint gives direction, the student does the cognitive work of articulating. The app should track hint usage — a student who relies on hints across multiple sessions isn't developing evaluative differentiation.

2. **Lens assignment scopes to Evaluate only.** The Evaluate phase assigns (or lets students choose) a lens. The Explain phase is lens-independent — it asks "why did they think this way?" which draws on cognitive and social variables, not lenses. A student who evaluated through Evidence should still be able to explain using any cognitive pattern or social dynamic.

3. **Cross-lens peer visibility.** In the Peer step, students see what peers saw through *different* lenses on the same passage. This is where the framework's perspectival diversity becomes visible — a student who looked through Evidence encounters a peer's Logic observation on the same passage. Without cross-lens visibility, students in a group with assigned lenses would only see agreement or disagreement within the same lens.

4. **Required AI response.** The AI step requires a brief written response (even one sentence) before the phase is complete. This forces engagement with the AI perspective rather than passive consumption. The response can be minimal ("I noticed something different" or "That matches what I saw") — the purpose is the moment of consideration, not the length of the response.

5. **Observation rubric enables runtime assessment.** The app matches student articulations against rubric entries at three levels (basic, developing, differentiated) to track growth over time without LLM access. This is approximate matching, not grading. A student who writes something valid that the rubric doesn't anticipate should be recognized, not penalized.

6. **Session close is a teacher action.** The teacher explicitly closes the session. This prevents indefinite open sessions, signals to students that the work is complete, and creates a clean boundary for data analysis. Late students can be accommodated before close.
