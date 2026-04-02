# Perspectives App Design

This document describes the design of the Perspectives app — the student-facing application that consumes pipeline-generated artifacts to teach critical thinking through evaluation of AI-generated group discussions.

**Companion documents:**
- `user-stories.md` — Role interactions and pipeline artifact requirements
- `polylogue-v5-4.md` — Conceptual framework (lenses, facets, explanatory variables)
- `pipeline-spec.md` — Pipeline technical specification (6 artifacts, 5 stages)

---

## Roles

Three roles with distinct access, capabilities, and management scope.

### Researcher (System Admin)

The researcher is the system administrator who manages the app, teacher accounts, and scenario availability.

- Authenticates with username and password.
- Creates and manages teacher accounts (username + password).
- Imports scenarios from the pipeline registry and publishes them for teacher use. Can hide/unpublish scenarios — hidden scenarios are unavailable for new sessions but don't affect existing sessions.
- Has read-only access to all teachers, classes, sessions, and student data. Cannot edit teacher resources.
- Can update reference materials when the framework evolves.

#### Framework & Pipeline Exploration

Researcher collaborators may be new to the conceptual framework and the pipeline process. The app should make both legible, not just expose raw data.

**Framework explorer:** Interactive visualization of lenses -> facets -> explanatory variables (cognitive patterns, social dynamics). A collaborator clicks a facet (e.g., "sufficiency") and sees: what it means, which lens it's primarily visible through, what a weak signal looks like in a discussion, what cognitive patterns explain it. This is the `configs/reference/` data made navigable.

**Pipeline walkthrough:** For any scenario, show the 5-stage pipeline as a visual flow. Click a stage to see what went in, what came out, which agents were involved, what the information barrier hid from the dialog writer. A collaborator can trace how an operator prompt became a discussion transcript became scaffolding materials.

**Artifact viewer with annotations:** When viewing a scenario's artifacts, overlay explanations — not just raw YAML. Show *why* this passage was highlighted, *why* this hint was written this way, *how* the facet signal was designed to be subtle.

This turns the Researcher section of the app into an onboarding tool for new collaborators, not just a data dashboard.

### Teacher

The teacher manages classes, configures sessions, facilitates the activity, and monitors student progress.

- Authenticates with username and password (created by researcher).
- Creates classes, batch-creates student accounts, assigns groups, creates and configures sessions.
- Monitors live sessions, views facilitation guides, reviews post-session data.
- Can export session data.

### Student

The student evaluates discussions, discusses with peers, and encounters expert perspectives.

- Authenticates with full name only (no password — low-friction, low-stakes by design).
- Enters active sessions, reads transcripts, evaluates passages, writes explanations, responds to AI perspectives.
- Views own dashboard: sessions completed, lenses used, qualitative growth indicator.
- Cannot configure anything.

---

## Data Model

### Core Entities

**Student** (top-level, not scoped to a class)
- `id`
- `full_name`
- `created_by` — researcher or teacher who first created the account

A student can appear in multiple classes across multiple teachers (e.g., co-teaching). When batch-creating students, the system checks for existing students by name to avoid duplicates, with a confirmation flow for ambiguous matches.

**Teacher**
- `id`
- `username`
- `password_hash`
- `created_by` — researcher

**Researcher**
- `id`
- `username`
- `password_hash`

**Class**
- `id`
- `name`
- `section`
- `teacher_id` — owner

**ClassEnrollment** (many-to-many: student <-> class)
- `student_id`
- `class_id`

**Group** (lives on the class — the working/default state)
- `id`
- `class_id`
- `label`

**GroupMembership** (current working state, teacher edits this)
- `student_id`
- `group_id`

**Scenario** (imported from registry)
- `id` — matches `scenario_id` from YAML
- `status` — available | hidden
- `published_by` — researcher
- Artifacts: paths/blobs for the 6 YAML files

**Session**
- `id`
- `class_id`
- `scenario_id`
- `created_by` — teacher
- `status` — draft | active | closed
- Config: `lens_assignment_mode`, `selected_passages`, `scaffolding_options`, `completion_thresholds`

**SessionGroup** (frozen snapshot of groups at session creation)
- `session_id`
- `group_label`
- `student_ids[]`

**LensAssignment** (per session x student)
- `session_id`
- `student_id`
- `lens_id`

**StudentResponse** (append-only)
- `id`
- `session_id`
- `student_id`
- `passage_id`
- `phase` — evaluate | explain
- `step` — individual | peer | ai
- `content` — the written text
- `lens_id` — for evaluate phase; null for explain
- `rating` — strong | weak; evaluate phase only
- `hint_used` — boolean
- `redirect_triggered` — boolean
- `timestamp`

### Entity Relationships

```
Researcher
 |-- manages --> Teacher (1:many)
 |-- publishes --> Scenario (1:many)

Teacher
 |-- owns --> Class (1:many)
 |    |-- enrolls --> Student (many:many via ClassEnrollment)
 |    |-- has --> Group (1:many)
 |         |-- contains --> Student (many:many via GroupMembership)
 |-- creates --> Session (1:many)
      |-- uses --> Scenario
      |-- targets --> Class
      |-- snapshots --> SessionGroup (frozen copy of groups)
      |-- has --> LensAssignment (per student)
      |-- has --> StudentResponse (per student x passage x phase, append-only)
```

### Group Snapshot Model

Groups live on the class as the standing default. When a teacher creates a session:

1. The app copies current `GroupMembership` into `SessionGroup`.
2. While the session is in **draft** status, the teacher can edit the snapshot: add new groups, delete groups, rename groups, move students between groups. These edits only affect the session — class-level groups are untouched.
3. When the teacher **activates** the session, the snapshot freezes.
4. The peer step reads from the frozen `SessionGroup`, not from `GroupMembership`.

This handles the common case (groups carry forward from class defaults) and the edge case (one-off rearrangement for an absence or special activity) without requiring the teacher to edit and restore class-level groups.

---

## Management UI Flows

### Researcher

**Login -> Admin Dashboard** with three sections:

**Teachers**
- List of all teacher accounts (name, username, number of classes)
- "Create Teacher" -> form: full name, username, password
- Click a teacher -> read-only view of their classes, sessions, student data

**Scenarios**
- List of all scenarios in the registry: topic, status (available/hidden), date published
- "Import Scenario" -> select from registry directory, preview topic + personas + passage count -> publish
- Toggle availability (available <-> hidden)
- Click a scenario -> read-only view of all 6 artifacts

**Observatory**
- Cross-teacher aggregate view: total sessions run, total students, activity over time
- Drill down: teacher -> class -> session -> student
- Everything read-only

### Teacher

**Login -> Teacher Dashboard** showing classes, recent session activity, quick counts.

#### Class Management

**Class detail page** has three tabs:

**Students tab**
- List of enrolled students (name, group assignment)
- "Add Students" -> batch entry (paste or type full names, one per line)
- System checks for existing students by name, confirms matches or creates new
- Remove student from class (unenroll, does not delete the student entity)

**Groups tab**
- Visual card layout: each group is a card showing its members
- Drag-and-drop students between groups
- "New Group" adds an empty card; delete group moves members to an "ungrouped" pool
- Warning: cannot create a session with ungrouped students

**Sessions tab**
- List of sessions for this class (status, scenario topic, date)
- "New Session" enters session setup flow
- Click a session -> monitoring (if active) or review (if closed)

#### Pedagogy Briefing & Session Preparation

Teachers need to understand the pedagogy and be briefed about each discussion before they can facilitate effectively. The app supports this through onboarding and a preparation step in the session setup flow.

**Pedagogy primer:** A short, scannable introduction to the perspectival learning model — what lenses are, why students evaluate then explain, why peer discussion matters, what the AI perspective adds. Not a manual — a 2-minute orientation. Available as a one-time onboarding for new teachers and as an always-available reference.

**Discussion briefing:** When a teacher selects a scenario, the app presents a structured walkthrough before configuration:
- What's the topic and why does it matter to students?
- Who are the personas and what perspectives do they bring?
- What's designed into this discussion? (In plain language — "Maya relies heavily on one source" not "sufficiency is weak")
- What will students likely notice, and what will they likely miss?
- What will the AI say, so the teacher isn't surprised?

This is the facilitation guide `overview` + `passage_guides` presented as a preparation experience rather than a reference document. The teacher reads through this *before* configuring session parameters.

**"Why this matters" annotations:** Throughout the session config, brief contextual notes explain the pedagogical rationale. E.g., next to "lens assignment mode": "Assigning lenses ensures each group sees the discussion from multiple angles — this is what makes the peer step productive."

#### Session Setup Flow

```
New Session
  -> Select Scenario (from researcher-published list)
  -> Discussion Briefing (structured walkthrough of the scenario)
  -> Configure:
       Lens assignment: assign (auto-distribute) or student choice
       Passages: checkboxes, default all, ordered by difficulty
       Scaffolding: sentence starters on/off, reference lists on/off
       Completion thresholds: min passages for evaluate, min for explain
  -> Review Groups (editable snapshot of class groups)
       Add/delete/rename groups, drag students between them
       Warning if any student is ungrouped
  -> Save as Draft
```

**Session lifecycle:**
- **Draft:** everything editable (config, groups, passages)
- **Active:** session is live, students can enter, config locked, monitoring available
- **Closed:** no new responses, all data preserved, reviewable

Teacher explicitly activates and closes. Reopen is possible but flagged as unusual.

#### During Active Session

**Monitoring dashboard:**
- Left panel: group list, each showing per-student status icons
  - Per student: not started | in progress | completed (for each phase/step)
- Right panel: click a student -> see their responses in real time
- Flags: students idle beyond configurable threshold
- **Group advancement:** teacher can manually advance a group past the peer gate (e.g., absent or disengaged student)
- Facilitation guide: accessible as a side panel, organized by passage

#### After Session (Closed)

**Review page:**
- **By passage:** all student articulations grouped by lens (shows perspectival diversity)
- **By student:** individual student's full response trail across all passages
- **Statistics:** per-student trends over time (articulation quality, perspectival range, explanatory depth)
- **Export:** download session data

### Student

**Login -> Student Dashboard**
- Active session (prominent, one-click entry)
- Past sessions (topic, date, lens used)
- Personal stats: sessions completed, lenses used (visual indicator), qualitative growth note

Session entry leads to the session experience flow (below).

---

## Session Experience Flow

### Entering the Session

Three screens in sequence:

**1. Onboarding screen**
- Topic and context (from `session.yaml -> onboarding`)
- Character cards: name + brief perspective for each persona
- Instruction: "Read the discussion, then we'll look at it together through different lenses."

**2. Reading screen**
- Full transcript displayed as a chat-style conversation (speaker name + speech bubbles)
- App tracks scroll position — student must scroll through the entire transcript before proceeding
- No passage highlights yet — pure reading

**3. Lens assignment screen**
- If teacher chose "assign": student sees their assigned lens with its question
- If teacher chose "student choice": student picks from the three lenses
- Lens persists visually throughout the Evaluate phase (sticky header or badge)

### Evaluate Phase — "What do you see in the reasoning?"

#### Individual Step

The transcript reappears with numbered passage icons at the end of the most prominent turn in each evaluable passage. Passages are suggested in difficulty order (from `scaffolding.yaml`) but the student can tap any.

**Passage modal contents:**
- The passage (1-3 turns in context)
- Lens-specific entry prompt (from `scaffolding.yaml -> lens_entry_prompts`)
- Rating: Strong or Weak (student commits to a position)
- Articulation text box
- Optional "I need a hint" button -> partial hint appears above the text box as a directional nudge (e.g., "Something about the sources...")
- Submit -> response saved, appears below as a timestamped entry
- Can add more (append-only) — new text box, previous responses read-only

**Misreading redirect:** After submission, the app matches against `scaffolding.yaml -> common_misreadings`. If triggered, a gentle redirect appears inline: "You noticed there's a lot of evidence — now look more closely at *where* it comes from." A new text box appears for the student to add to their thinking. Redirect usage is tracked.

**Progress:** Transcript view shows complete (filled icon) vs. remaining (outline icon) passages. Banner shows progress against the completion threshold.

**Threshold met -> soft gate:** Prompt appears: "You've evaluated enough passages to move to peer discussion. You can keep evaluating or move on when ready." A "Ready for Peer Discussion" button appears; evaluating more passages remains available.

#### Peer Step

**Progressive reveal model:** As each peer clicks "Ready for Peer Discussion," their responses become visible to everyone already waiting. No all-ready gate — respects async pacing (constraint #5). Fast students start seeing and discussing as peers trickle in.

**Waiting screen:** Shows group members and their ready/still-evaluating status. While waiting, the student can continue evaluating more passages.

**Peer visibility display** (organized by passage):
- For each passage: each peer's lens, rating (strong/weak), and articulation
- **Disagreement highlighting:** passages where peers gave different ratings or used different lenses are visually marked as "interesting differences" — these are the most productive topics for face-to-face discussion
- Cross-lens visibility: a student who looked through Evidence sees their peer's Logic observation on the same passage

Discussion happens face-to-face in the classroom. The app makes perspectives visible and persistent, not a chat interface.

After seeing peers' responses, the student can append new observations to any evaluated passage. When done discussing, they move to the AI step individually.

**Solo student:** If a student is alone in their group (e.g., absences), the peer step is skipped entirely — they move directly to the AI step.

**Teacher override:** The teacher can manually advance a group past the peer gate from the monitoring dashboard.

#### AI Step

For each evaluated passage, the app shows the AI perspective from `analysis.yaml -> ai_perspective_evaluate`:
- Per-lens observations: "Looking through the Evidence lens, I notice that both sources come from the same organization..."
- `what_to_notice` prompt: "Something interesting to think about: did anyone in the group push back on this?"

Framed as one more voice, not the answer: "Here's what an expert noticed when looking through each lens."

The student sees a passage-specific reflection prompt (from `scaffolding.yaml -> ai_reflection_prompts`). A written response is **required** (even one sentence) to complete the phase. Append-only.

After responding to all evaluated passages, the student transitions to the Explain phase.

### Explain Phase — "Why did they think this way?"

Lens assignment no longer applies. The question is now lens-independent, drawing on cognitive patterns and social dynamics.

#### Individual Step

The transcript reappears with the same passage icons. Tapping a passage opens a modal:

- The passage (same turns)
- **Evaluate responses** (read-only) — visible at the top so the student sees what they already observed
- **Bridge prompt** (from `scaffolding.yaml -> bridge_prompts`) — connects the Evaluate observation to the Explain task, personalized to the lens the student used. E.g., "You noticed something about the evidence. Now think about *why* — what was going on in the group when this happened?"
- Explanation prompt: "Why do you think they reasoned this way?"
- **Sentence starters** (if enabled by teacher):
  - Generic session-level starters always visible:
    - "I think they reasoned this way because they were focused on..." (cognitive)
    - "I think the group..." (social)
    - "The group made it easier/harder for this kind of thinking because..." (interaction)
  - **Passage-specific starters** behind "I need more help" (from `scaffolding.yaml`)
- **Reference lists** (if enabled by teacher) — browsable cognitive patterns and social dynamics with descriptions. Reference, not a menu — the student writes in their own words.

Same append-only pattern. Same threshold + soft gate as Evaluate.

#### Peer Step

Same progressive reveal model as Evaluate. Display organized by passage:
- Each peer's explanation
- **Difference highlighting:** flags where one peer identified a cognitive pattern and another a social dynamic
- Append-only additions after discussion
- Solo student skips; teacher can manually advance groups

#### AI Step

For each passage, shows `analysis.yaml -> ai_perspective_explain`:
- Explanatory note introducing formal vocabulary as perspective: "A cognitive scientist might call this confirmation bias..."
- Cognitive connection, social connection, interaction note
- Passage-specific reflection prompt (from `scaffolding.yaml`)
- Required response (even one sentence)

After completing all passages -> **Session Complete** screen with summary and encouragement.

### Phase Navigation

Students can toggle between Evaluate and Explain views at any time. Both phases remain open for append-only additions until the teacher closes the session. The transition is forward-encouraging but not hard-locked.

```
Read Transcript -> Lens Assignment -> EVALUATE (Ind -> Peer -> AI) -> EXPLAIN (Ind -> Peer -> AI) -> Complete
                                           |                              |
                                      soft gate at                   soft gate at
                                      threshold                      threshold
                                           |                              |
                                      progressive                    progressive
                                      peer reveal                    peer reveal
```

### Whole-Class Debrief

After both phases complete, the teacher leads a whole-class debrief using the facilitation guide's `debrief` section:
- **Key takeaways** — 2-3 main insights (in teacher/facet language)
- **Cross-group prompts** — questions to surface cross-group patterns: "Did any group have members who saw the same passage very differently?"
- **Connection to next** — bridge to future sessions

The debrief is teacher-led, not app-mediated. The facilitation guide provides the materials.

### Session Close

- Teacher explicitly closes the session.
- Closing prevents new responses but preserves all data.
- Late students can be given additional time before close (teacher's discretion).
- A closed session can be reopened (rare).

---

## Remaining Design Topics

The following topics are not yet covered and will be added:

- **Assessment and growth tracking** — rubric matching at runtime (no LLM), qualitative growth indicators, trend computation across sessions
- **Facilitation guide display** — how the teacher navigates the guide during a live session
- **Tech stack and deployment** — hosting, offline considerations, data privacy (COPPA/FERPA)
- **Data model finalization** — full schema with types and constraints
