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

Researcher collaborators may be new to the conceptual framework and the pipeline process. The app should make both legible, not just expose raw data. Three tools — a framework explorer, a pipeline walkthrough, and an annotated artifact viewer — turn the Researcher section into an onboarding tool, not just a data dashboard.

##### Framework Explorer

The framework explorer is the primary tool for helping new researchers understand and buy into the perspectival learning model. It reveals the framework through three progressively deeper levels: the conceptual architecture, a concrete illustrative example, and the full reference inventory. Each level is always accessible — the researcher can drill deeper or step back at any time.

The data source is `configs/reference/` (lenses.yaml, facet_inventory.yaml, explanatory_variables.yaml), imported into the database alongside scenarios.

###### Level 1 — Core Essence

The opening view. Communicates the three elements of the framework and their interaction with **zero enumeration** — no facet names, no pattern lists. Just the structural logic.

**Visual: A single directional flow diagram**

```
  OBSERVE ──────────────────────────────────► EXPLAIN

    Lens           reveals         Facet          explained by       Explanatory Variable
    (perspective)  ───────────►   (dimension)     ───────────────►   (cause)

    "How are you     "What specific      "Why did they
     looking?"        thing do you        think this way?"
                      see?"
```

**Three key relationships, presented as brief annotations beneath the diagram:**

1. **Lens → Facet:** A lens is a perspective for looking at reasoning. Each lens reveals specific facets — concrete dimensions of reasoning quality. Some facets are visible through more than one lens. That cross-visibility is what makes peer discussion productive: students with different lenses see the same issue from different angles.

2. **Facet → Explanatory Variable:** A facet is *what* you observe. An explanatory variable is *why* it happened. Explanatory variables come in two kinds: cognitive patterns (individual thinking tendencies) and social dynamics (group interaction patterns). Every facet connects to at least one of each — there are no dead ends.

3. **The hidden layer:** Students never see facets by name. They observe through lenses (Evaluate phase) and explain using cognitive/social vocabulary (Explain phase). Facets are the structural layer that connects the two — the scaffolding behind the wall. This is what makes the framework teachable without being reductive.

**The diagram is not just an illustration — it is an interactive entry point.** Clicking "Lens," "Facet," or "Explanatory Variable" in the diagram transitions to Level 2, which grounds the clicked element in a concrete example. Clicking "See the full framework" transitions to Level 3.

The researcher should be able to sketch this diagram on a napkin after seeing it once. If they can, they understand the framework.

###### Level 2 — Illustrative Example

One concrete example that traces the full Lens → Facet → Explanatory Variable chain. The example is designed to make every element feel intuitive and inevitable — not academic.

**The passage (3 turns of a student discussion):**

> **Alex:** My cousin went to the science museum and said it was boring. Let's do the amusement park for our field trip instead.
> **Sam:** Yeah, that makes sense. The amusement park is way more fun.
> **Alex:** So it's settled then.

**Three lenses, three observations:**

The passage appears at the top. Three lens buttons (colored) sit below. The researcher clicks each lens. As they do, the passage stays the same but a lens-specific observation appears — what a student looking through this lens would notice:

| Lens | What you notice |
|---|---|
| **Evidence** | "Alex's only source is one cousin's opinion. That's pretty thin evidence for a whole class decision." |
| **Logic** | "Even if the museum *is* boring, how does that mean the amusement park is better? That's a jump." |
| **Scope** | "They're only thinking about fun. What about cost, what they'd learn, what the teacher wants?" |

*The core insight lands here: three different observations, all valid, from the same three lines of dialog.*

**The facets revealed:**

Below the lens observations, the facets appear — connecting each observation to a named dimension:

- Evidence sees **weak sufficiency** — one opinion supporting a big conclusion
- Logic sees **weak inferential validity** — "museum is boring" does not lead to "amusement park is better"
- Scope sees **weak perspective breadth** — only the "fun" dimension considered

A brief annotation highlights the cross-lens moment: *"Notice that sufficiency is visible through both Evidence and Logic. 'The conclusion is bigger than the evidence supports' is both an evidence quantity problem and a reasoning gap. When two students with different lenses both notice this, that overlap is what makes their conversation productive."*

**Why did they reason this way?**

The explanatory variables appear, connecting the facets to causes:

- **Overgeneralization** (cognitive pattern) — Alex heard one opinion and treated it as settled fact
- **Conformity** (social dynamic) — Sam went along immediately without questioning

Annotation: *"This is the Evaluate → Explain arc. The lenses tell you what's wrong. The explanatory variables tell you why it happened. In a session, students do this same two-phase progression — first observing through their lens, then explaining using cognitive and social vocabulary."*

**Interactive elements:**

- Each facet name is clickable → expands to show definition, quality range (strong ↔ weak), and which other lenses can reveal it
- Each explanatory variable is clickable → expands to show description and which other facets it connects to
- "See the full framework" button → transitions to Level 3
- "See this in a real scenario" link → jumps to the artifact viewer for a published scenario, with a passage highlighted that demonstrates the same facet

###### Level 3 — Reference

The full inventory of all framework elements and their connections. This is the lookup tool for researchers who understand the architecture (Level 1) and the intuition (Level 2) and now want to see the complete picture.

**Layout:** A tabbed reference page, not a spatial graph. At this level, clarity and scannability matter more than visual metaphor.

**Tab 1 — Facets** (the central reference, organized by primary lens)

Three sections (Evidence, Logic, Scope), each listing its primary facets. Each facet is an expandable row:

| Facet | Definition | Weak signal | Strong signal | Cross-lens | Cognitive patterns | Social dynamics | Tier |
|---|---|---|---|---|---|---|---|
| Sufficiency | Whether evidence is proportional to the conclusion | One anecdote supporting a sweeping claim | Evidence matches the scope and confidence of the conclusion | Logic, Scope | Overgeneralization, False certainty | Conformity, Authority deference | Core |

Collapsed view shows: facet name, one-line definition, primary lens color, tier badge. Expanding a row reveals the full detail: quality range anchors, cross-lens visibility, connected explanatory variables (clickable), and a "See in a scenario" link.

**Tab 2 — Lenses**

Three cards, one per lens:
- Name, guiding question, description
- Primary facets listed (clickable → jumps to facet detail in Tab 1)
- Count of cross-visible facets from other lenses

**Tab 3 — Explanatory Variables**

Two sections: Cognitive Patterns (8) and Social Dynamics (4). Each is an expandable row:
- Name, description (6th-grade accessible language), connected facets (clickable)

**Tab 4 — Connections**

A compact matrix view showing the full web of relationships at a glance:
- Rows: 11 facets
- Columns: 3 lenses (primary + cross-lens), 8 cognitive patterns, 4 social dynamics
- Cells: filled dot (primary connection), hollow dot (cross-lens visibility), empty (no connection)

This is the "see everything at once" view — dense but complete. A researcher who wants to verify that there are no coverage gaps or wants to see which explanatory variable has the broadest reach can scan this in seconds.

**Navigation between levels:**

The three levels are always accessible via tabs or breadcrumbs at the top of the explorer. The researcher can move freely: Level 1 (architecture) ↔ Level 2 (example) ↔ Level 3 (reference). Deep links work — clicking a facet name anywhere in the explorer jumps to its detail row in Level 3, Tab 1.

**Visual design principles:**
- **Color encodes lenses** throughout — Logic, Evidence, and Scope each have a distinct color carried consistently across the entire app (explorer, artifact viewer, student views)
- **Progressive density** — Level 1 is a single diagram; Level 2 is one example with expandable detail; Level 3 is the full inventory. The researcher controls how deep they go
- **Concrete grounding at every level** — Level 2 is a worked example; Level 3 has "See in a scenario" links on every facet. The framework never floats as pure abstraction

##### Pipeline Walkthrough

For any published scenario, a visual representation of the 5-stage pipeline showing what went in, what came out, and how the information barrier works.

**Layout: Horizontal stage flow**

```
┌──────────┐    ┌──────────────┐   ║   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Stage 1 │───▶│   Stage 2    │   ║   │   Stage 3    │───▶│   Stage 4    │───▶│   Stage 5    │
│ Scenario │    │  Transcript  │   ║   │   Analysis   │    │  Scaffolding │    │   Session    │
│          │    │              │   ║   │              │    │              │    │              │
│ Planning │    │ Dialog writer│   ║   │  Evaluator   │    │ Scaffolding  │    │  Configure   │
│ Validate │    │ Transcript ID│   ║   │              │    │    ID        │    │              │
└──────────┘    └──────────────┘   ║   └──────────────┘    └──────────────┘    └──────────────┘
                                   ║
                          INFORMATION BARRIER
```

**The information barrier** is rendered as a visual divider between Stage 1 and Stage 2. It is the most important concept for a new collaborator to understand: the dialog writer in Stage 2 never sees facet IDs, lens names, cognitive patterns, or social dynamics. The barrier is clickable — expanding it shows:
- What was **stripped** from the scenario plan before passing to the dialog writer (target_facets, discussion_dynamic fields)
- What the dialog writer **did** see (persona descriptions in natural language, topic, context)
- **Why**: so the discussion reads as natural conversation, not a pedagogical exercise

**Stage cards** are clickable. Clicking a stage expands it to show:

- **Agents involved** — which of the 9 pipeline agents ran at this stage, with brief role descriptions
- **Input** — what artifacts or data entered this stage (with links to view the actual content)
- **Output** — what artifacts were produced (with links to the artifact viewer)
- **Key decisions** — for this specific scenario, what happened at this stage. E.g., Stage 1 might show "Targeted facets: sufficiency (weak), perspective_breadth (weak). Signal mechanisms: Maya uses single source, both students plan from own viewpoint only."

**Stage-to-stage flow** shows how artifacts transform: the scenario plan becomes a transcript becomes analysis becomes scaffolding becomes session config. Arrows between stages indicate data flow. A collaborator can trace the full lineage of any element — "this hint in the scaffolding exists because this facet was targeted in the scenario plan."

##### Artifact Viewer with Annotations

When viewing a scenario's artifacts (from the Scenarios section of the researcher dashboard), the viewer overlays explanations on top of the structured data. This is not raw YAML — it is a rendered, annotated view.

**Transcript view:**
- The discussion renders as a chat-style conversation (same format students see)
- Passage boundaries are marked with labels (Passage 1, Passage 2, etc.)
- **Facet annotations** appear as colored margin markers: click a turn to see which facets are present, their quality level (strong/weak), and which lens reveals them. Source: `analysis.yaml -> passage_analyses[].facet_annotations`
- **Design intent overlay** (toggle on/off): shows *why* each signal was designed — "Maya's reliance on a single website was designed as a weak sufficiency signal, intended to be visible through the Evidence lens." Source: scenario plan + analysis

**Analysis view:**
- Per-passage analysis renders as structured cards, not raw YAML
- AI perspective blocks (evaluate + explain) are shown as the student will eventually see them
- Facet annotations are cross-linked: click a facet annotation to jump to the transcript turn where the signal appears
- Diversity predictions (what students will likely see/miss per lens) are shown alongside the analysis

**Scaffolding view:**
- Per-passage scaffolding renders with visual groupings: hints, rubrics, bridge prompts, sentence starters, misreading redirects
- **Rubric cards** show the three differentiation levels (basic → developing → differentiated) with example articulations
- **Hint rationale overlay** (toggle): shows how each hint directs attention to a facet without naming it — "This hint ('Something about the sources...') points toward source_credibility without using framework vocabulary"
- **Misreading redirects** show the trigger condition and the redirect text, with an annotation explaining what misreading pattern it catches

**Facilitation guide view:**
- Renders the same content the teacher sees in the Discussion Briefing and facilitation guide panel, but with an additional layer: facet vocabulary is visible (since this is the researcher view, not the teacher view). The researcher can see both what the teacher sees and the framework language behind it.

**Cross-artifact navigation:** Each view has cross-links to related content in other artifacts. A facet annotation in the analysis links to the passage in the transcript, the hint in the scaffolding, and the rubric that assesses student observation of that facet. A collaborator can follow any thread across the full artifact set.

### Teacher

The teacher manages classes, configures sessions, facilitates the activity, and monitors student progress.

- Authenticates with username and password (created by researcher).
- Creates classes, batch-creates student accounts, assigns groups, creates and configures sessions.
- Monitors live sessions, views facilitation guides, reviews post-session data.
- Can export session data.

### Student

The student evaluates discussions, discusses with peers, and encounters expert perspectives.

- Authenticates by entering a **session join code** (short alphanumeric, displayed on the teacher's monitoring dashboard) and then **selecting their name** from the roster of students assigned to that session. No password — low-friction, low-stakes, but prevents impersonation since the student can only select from the session roster.
- Enters active sessions, reads transcripts, evaluates passages, writes explanations, responds to AI perspectives.
- Views own dashboard: sessions completed, lenses used, qualitative growth indicator.
- Cannot configure anything.

---

## Data Model

All IDs are UUIDs. All entities have `created_at` timestamps. Scenario IDs are text (matching `scenario_id` from pipeline YAML).

### Core Entities

**Student** (top-level, not scoped to a class)
- `id` UUID, PK
- `full_name` text, not null
- `created_by_role` enum: researcher | teacher
- `created_by_id` UUID
- `created_at` timestamp

A student can appear in multiple classes across multiple teachers (e.g., co-teaching). When batch-creating students, the system checks for existing students by name to avoid duplicates, with a confirmation flow for ambiguous matches.

**Teacher**
- `id` UUID, PK
- `full_name` text, not null
- `username` text, unique, not null
- `password_hash` text, not null
- `created_by` UUID -> Researcher
- `created_at` timestamp

**Researcher**
- `id` UUID, PK
- `username` text, unique, not null
- `password_hash` text, not null
- `created_at` timestamp

**Class**
- `id` UUID, PK
- `name` text, not null
- `section` text
- `teacher_id` UUID -> Teacher, not null
- `created_at` timestamp

**ClassEnrollment** (many-to-many: student <-> class)
- `student_id` UUID -> Student
- `class_id` UUID -> Class
- PK: (student_id, class_id)
- `enrolled_at` timestamp

**Group** (lives on the class — the working/default state)
- `id` UUID, PK
- `class_id` UUID -> Class, not null
- `label` text, not null
- `created_at` timestamp

**GroupMembership** (current working state, teacher edits this)
- `student_id` UUID -> Student
- `group_id` UUID -> Group
- PK: (student_id, group_id)

**Scenario** (imported from registry into the database)
- `id` text, PK — matches `scenario_id` from pipeline YAML
- `status` enum: available | hidden
- `published_by` UUID -> Researcher
- `topic` text, not null — denormalized for display in scenario lists
- `artifacts` jsonb — the 6 pipeline YAML files stored as structured data
- `published_at` timestamp

The researcher configures source locations (registry path, configs path). The app imports scenario artifacts into the database on publish. After import, scenarios are self-contained — no external file dependencies at runtime.

**Session**
- `id` UUID, PK
- `class_id` UUID -> Class, not null
- `scenario_id` text -> Scenario, not null
- `created_by` UUID -> Teacher, not null
- `status` enum: draft | active | closed
- `join_code` text, unique among active sessions — generated on creation (draft), so the teacher can share it during prep
- `lens_assignment_mode` enum: assign | choice
- `selected_passages` text[] — passage IDs, ordered by difficulty
- `scaffolding_sentence_starters` boolean, default true
- `scaffolding_reference_lists` boolean, default true
- `threshold_evaluate` integer — min passages for evaluate phase
- `threshold_explain` integer — min passages for explain phase
- `created_at` timestamp
- `activated_at` timestamp
- `closed_at` timestamp

**SessionGroup** (frozen snapshot of groups at session activation)
- `id` UUID, PK
- `session_id` UUID -> Session, not null
- `label` text, not null

**SessionGroupMembership** (frozen snapshot of group members)
- `session_group_id` UUID -> SessionGroup
- `student_id` UUID -> Student
- PK: (session_group_id, student_id)

**LensAssignment** (per session x student)
- `session_id` UUID -> Session
- `student_id` UUID -> Student
- `lens_id` text: logic | evidence | scope
- PK: (session_id, student_id)

### Response Entities

Two tables, split by phase. No nullable fields for phase-specific data.

**EvaluateResponse** (append-only)
- `id` UUID, PK
- `session_id` UUID -> Session, not null
- `student_id` UUID -> Student, not null
- `passage_id` text, not null
- `step` enum: individual | peer | ai
- `lens_id` text, not null — logic | evidence | scope
- `rating` enum: strong | weak — individual step only; null for peer/ai appended observations
- `content` text, not null
- `hint_used` boolean, default false — individual step only
- `redirect_triggered` boolean, default false — individual step only
- `created_at` timestamp

**ExplainResponse** (append-only)
- `id` UUID, PK
- `session_id` UUID -> Session, not null
- `student_id` UUID -> Student, not null
- `passage_id` text, not null
- `step` enum: individual | peer | ai
- `content` text, not null
- `hint_used` boolean, default false — individual step only
- `created_at` timestamp

### Group Consensus Entity

**GroupConsensus** (one per group × passage × phase)
- `id` UUID, PK
- `session_id` UUID -> Session, not null
- `session_group_id` UUID -> SessionGroup, not null
- `passage_id` text, not null
- `phase` enum: evaluate | explain
- `position` enum: agree | disagree
- `rationale` text, not null
- `submitted_by` UUID -> Student — the group member who physically submitted
- `created_at` timestamp
- Unique: (session_id, session_group_id, passage_id, phase)

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
      |-- snapshots --> SessionGroup (frozen)
      |    |-- members --> Student (many:many via SessionGroupMembership)
      |    |-- produces --> GroupConsensus (per passage × phase)
      |-- has --> LensAssignment (per student)
      |-- has --> EvaluateResponse (append-only, per student × passage)
      |-- has --> ExplainResponse (append-only, per student × passage)
```

### Group Snapshot Model

Groups live on the class as the standing default. When a teacher creates a session:

1. The app copies current `GroupMembership` into `SessionGroup` + `SessionGroupMembership`.
2. While the session is in **draft** status, the teacher can edit the snapshot: add new groups, delete groups, rename groups, move students between groups. These edits only affect the session — class-level groups are untouched.
3. Validation: every student must be in a group; every group must have at least 2 students.
4. When the teacher **activates** the session, the snapshot freezes.
5. The peer and consensus steps read from the frozen snapshot, not from `GroupMembership`.

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

Teachers need to understand the pedagogy and be briefed about each discussion before they can facilitate effectively. The app supports this through a pedagogy primer (one-time onboarding + persistent reference) and a discussion briefing (per-scenario preparation integrated into the session setup wizard).

##### Pedagogy Primer

A short, scannable introduction to the perspectival learning model. Not a manual — a 2-minute orientation that answers: what is this app, and why does the session work the way it does?

**Content (5 sections, each 2-3 sentences):**

1. **What students will do** — Students read a scripted group discussion, then evaluate the reasoning through different lenses, then explain why the group thought the way they did.
2. **Lenses** — Three ways of looking at reasoning (Logic, Evidence, Scope). Each student gets one lens, so the group sees the discussion from multiple angles.
3. **The four steps** — Individual thinking first, then peer discussion (face-to-face), then an expert perspective, then group consensus on whether they agree with the expert. Each step builds on the last.
4. **Why peer discussion matters** — Students with different lenses notice different things. The peer step makes those differences visible and productive. Discussion happens face-to-face; the app just makes thinking persistent.
5. **Why the expert perspective is not the answer** — The AI perspective is framed as one more voice, not the correct answer. The consensus step is where students decide whether they buy it. Disagreeing is legitimate.

**Presentation:** A paginated card sequence (swipe or click through). Each card has a heading, 2-3 sentences, and a simple illustration or icon. No scrolling walls of text.

**When it appears:**
- **First login:** The primer appears automatically after the teacher's first login. The teacher can skip it but is encouraged to read through. Skipping does not block access to any features.
- **Always available:** A "How it works" link in the teacher dashboard header opens the primer at any time. No completion tracking — the teacher can revisit any card.

##### Discussion Briefing

When a teacher selects a scenario during session setup, the app presents a structured walkthrough of that specific discussion *before* configuration begins. This is the facilitation guide's `overview` + `passage_guides` repurposed as a preparation experience.

**Presentation:** A wizard step (step 2 of the session setup flow — see below). The briefing is a scrollable page within the wizard, not a separate paginated sequence. The teacher reads top to bottom, then clicks "Continue to Configure."

**Sections on the briefing page:**

1. **Topic & context** (from `overview.topic`)
   - The discussion question and why it matters to students
   - 2-3 sentences, prominent placement

2. **Meet the personas** (from scenario plan)
   - Character cards: name, brief perspective, what they bring to the discussion
   - Same cards students will see during onboarding, so the teacher knows what students know

3. **What's designed into this discussion** (from `overview.targeted_facets_summary`)
   - Plain language only: "Maya relies heavily on one source" not "sufficiency is weak"
   - 1-2 paragraphs explaining the reasoning patterns the scenario was built to surface

4. **Passage-by-passage preview** (from `passage_guides`)
   - For each passage: a brief summary (`passage_guides[].summary`) and what students will likely notice vs. miss (`likely_observations` per lens)
   - Collapsible — the teacher can expand passages they want to preview in detail or skip ones they'll review later in the facilitation guide panel

5. **What the AI will say** (from `passage_guides[].evaluate.ai` and `explain.ai`)
   - Summary of the expert's key observations and explanations, so the teacher isn't surprised by student reactions during the AI and consensus steps
   - Also collapsible per passage

**Scope lens note:** When a scenario targets Scope facets, the briefing includes a callout: "This discussion has strong Scope observations if students look for them. Scope is the hardest lens to use — students with other lenses rarely stumble onto Scope observations accidentally. Make sure your Scope-lens students are heard during peer discussion." This surfaces the framework's insight that Scope requires active attention without requiring the teacher to know the underlying theory.

The briefing page is read-only. Its purpose is to ensure the teacher understands the scenario before making configuration decisions. The same content is available later in the facilitation guide panel during the live session, but the briefing is the moment where the teacher absorbs it without time pressure.

##### Session Setup Wizard

A step-by-step wizard with a progress indicator. Each step is a full page. The teacher can navigate back to any completed step to revise.

```
Step 1: Select Scenario
  -> Scenario list (from researcher-published scenarios)
  -> Each card shows: topic, persona count, passage count, brief description
  -> Click to select -> proceed to Step 2

Step 2: Discussion Briefing
  -> Scrollable briefing page (described above)
  -> "Continue to Configure" button at the bottom
  -> Teacher can return to this step later from the draft

Step 3: Configure Session
  -> Lens assignment mode:
       "Assign lenses" (auto-distribute across groups) | "Student choice"
       Annotation: "Assigning lenses ensures each group sees the discussion
       from multiple angles — this is what makes the peer step productive."
  -> Passage selection:
       Checkboxes, ordered by difficulty (from scaffolding.yaml)
       Default: all selected
       Annotation: "Passages are ordered from most accessible to most subtle.
       For a first session, consider starting with fewer passages."
  -> Scaffolding options:
       Sentence starters: on/off (default on)
       Annotation: "Sentence starters help students who struggle to begin writing.
       Turn off for experienced groups."
       Reference lists: on/off (default on)
       Annotation: "Reference lists show cognitive patterns and social dynamics
       as a browsable reference — students still write in their own words."
  -> Completion thresholds:
       Min passages for Evaluate phase (default: all selected)
       Min passages for Explain phase (default: all selected)
       Annotation: "Thresholds are soft gates — students are encouraged to continue
       but can move to peer discussion once they meet the minimum."

Step 4: Review Groups
  -> Visual card layout (same as the Groups tab on the class page)
  -> Editable snapshot of class groups for this session only
  -> Drag-and-drop students between groups
  -> "New Group" / delete group
  -> Validation: warning if any student is ungrouped, error if any group < 2 students
  -> Annotation: "These groups are a snapshot for this session only.
     Changes here don't affect your class groups."

Step 5: Review & Save
  -> Summary: scenario topic, config choices, group count, student count
  -> "Save as Draft" -> returns to session list
  -> Draft is fully editable — teacher can return to any step
```

**"Why this matters" annotations** appear as small contextual notes beneath each configuration option (as shown above). They are always visible — not tooltips or expandable — because the teacher may not think to hover or click. Each annotation is one sentence explaining the pedagogical rationale for that option. The annotations are static content, not generated per scenario.

##### Session Lifecycle

- **Draft:** all wizard steps are revisitable and editable. The teacher can re-read the discussion briefing, change config, and rearrange groups.
- **Active:** the teacher clicks "Activate Session" from the draft. Config and groups freeze. The join code is displayed. Students can enter. Monitoring dashboard and facilitation guide panel become available.
- **Closed:** the teacher clicks "Close Session." No new responses. All data preserved. Review page available.

Teacher explicitly activates and closes. Reopen is possible but flagged as unusual.

#### During Active Session

**Monitoring dashboard:**
- **Session join code** displayed prominently at the top (teacher projects or reads aloud)
- Left panel: group list, each showing per-student status icons
  - Per student: not started | in progress | completed (for each phase/step)
- Right panel: click a student -> see their responses in real time
- Flags: students idle beyond configurable threshold
- **Group advancement:** teacher can manually advance a group past the peer gate or consensus gate (e.g., disengaged student blocking the group)
- **Facilitation guide panel** — see Facilitation Guide Display below

#### After Session (Closed)

**Review page:**
- **By passage:** all student articulations grouped by lens, plus group consensus positions (shows perspectival diversity and how groups responded to the expert)
- **By student:** individual student's full response trail across all passages and steps — the four-step trajectory from initial observation through consensus
- **By group:** group consensus positions across passages, with the individual reflections that preceded them
- **Engagement snapshot:** per-student behavioral signals (see Assessment and Growth Tracking below)
- **Export:** postponed (see `app-design-todo.md`)

### Student

**Login -> Student Dashboard**

The dashboard is designed for tablet, touch-first, and gamified to motivate 6th graders without introducing competition or scores.

**Active session** — prominent card at the top with one-tap entry. If no session is active, this area shows an encouraging "no session right now" state.

**Journey map** — a visual timeline of past sessions (topic, date, lens icon). Each session is a node on a path, giving a sense of progression. Tapping a past session shows: which lens they used, how many passages they explored, and whether their group agreed or disagreed with the expert.

**Growth indicators** (gamified, see Assessment section for detail):

- **Lens collection** — three lens icons that fill in as the student uses each lens across sessions. All three filled = a milestone badge. Encourages trying different perspectives.
- **Curiosity trail** — a visual that grows when the student evaluates more passages than required. Not a number — a qualitative progression (e.g., a path that extends, a plant that grows). Rewards engagement without making the threshold feel like "the real target."
- **Voice marker** — lights up for sessions where the student appended observations after seeing peers. Acknowledges engaging with others' thinking.
- **Team marker** — lights up for sessions where the student's group completed consensus. Group-level, not individual.

**Teacher's note** — a qualitative growth note written by the teacher, read-only to the student. Displayed as a personal message, not a grade.

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
- **Disagreement highlighting:** passages where peers gave different ratings (strong vs. weak) on the same passage, or where two peers with the same lens noticed different things, are visually marked as "interesting differences" — these are the most productive topics for face-to-face discussion. Different-lens observations on the same passage are the expected state and are not highlighted as surprising.
- Cross-lens visibility: a student who looked through Evidence sees their peer's Logic observation on the same passage

Discussion happens face-to-face in the classroom. The app makes perspectives visible and persistent, not a chat interface.

After seeing peers' responses, the student can append new observations to any evaluated passage. When done discussing, they move to the AI step individually.

**Minimum group size:** Every group must have at least 2 students. This constraint is enforced during session draft validation — the teacher cannot activate a session with a group of 1. If an absence drops a group below 2, the teacher must reassign the student to another group before activating.

**Teacher override:** The teacher can manually advance a group past the peer gate from the monitoring dashboard.

#### AI Step

For each evaluated passage, the app shows the AI perspective from `analysis.yaml -> ai_perspective_evaluate`:
- Per-lens observations: "Looking through the Evidence lens, I notice that both sources come from the same organization..."
- `what_to_notice` prompt: "Something interesting to think about: did anyone in the group push back on this?"

Framed as one more voice, not the answer: "Here's what an expert noticed when looking through each lens."

The student sees a passage-specific reflection prompt (from `scaffolding.yaml -> ai_reflection_prompts`). A written response is **required** (even one sentence). Append-only.

After responding to all evaluated passages, the student enters the consensus waiting area.

#### Consensus Step

When all group members finish their AI reflections, the consensus step opens. (Teacher can manually advance past this gate from the monitoring dashboard.)

For each evaluated passage, the group sees:
- The AI perspective (same content from the AI step)
- Each group member's individual AI reflection (read-only)

The group discusses face-to-face — debating whether the expert's observations match what they saw. The app provides structure, not a chat interface. Then the group submits a single consensus response per passage:

- **Position:** Agree or Disagree with the AI perspective
- **Rationale:** A short written explanation (1-3 sentences) of why the group agrees or disagrees

One group member submits on behalf of the group. After submission, any group member can append additional thoughts (same append-only pattern).

The agree/disagree decision is deliberately binary — it gives 6th graders a concrete anchor for discussion rather than an open-ended prompt. Disagreeing is explicitly legitimate: "The expert noticed X, but we think Y matters more because..."

After completing consensus for all passages, the group transitions to the Explain phase.

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
- Teacher can manually advance groups

#### AI Step

For each passage, shows `analysis.yaml -> ai_perspective_explain`:
- Explanatory note introducing formal vocabulary as perspective: "A cognitive scientist might call this confirmation bias..."
- Cognitive connection, social connection, interaction note
- Passage-specific reflection prompt (from `scaffolding.yaml`)
- Required response (even one sentence)

After responding to all passages, the student enters the consensus waiting area.

#### Consensus Step

Same structure as the Evaluate consensus. When all group members finish their AI reflections:

For each passage, the group sees:
- The AI perspective (explanatory vocabulary, cognitive/social/interaction connections)
- Each group member's individual AI reflection (read-only)

The group discusses face-to-face, then submits a single consensus response per passage:
- **Position:** Agree or Disagree with the AI's explanation
- **Rationale:** Why the group agrees or disagrees (1-3 sentences)

Same submission model: one member submits, others can append. The question here is richer than Evaluate — "The expert called this confirmation bias. Does that match what you see, or is something else going on?"

After completing consensus for all passages -> **Session Complete** screen with summary and encouragement.

### Phase Navigation

The session flow is **linear**: students complete the full Evaluate phase (Individual → Peer → AI → Consensus) before the Explain phase unlocks. There is no toggling between phases. Within each phase, individual responses remain append-only until the teacher closes the session.

```
Read Transcript -> Lens Assignment -> EVALUATE (Ind -> Peer -> AI -> Consensus) -> EXPLAIN (Ind -> Peer -> AI -> Consensus) -> Complete
                                        |         |               |                   |         |               |
                                   soft gate  progressive     hard gate           soft gate  progressive     hard gate
                                   at threshold  peer reveal  (all finish AI)     at threshold  peer reveal  (all finish AI)
```

Each phase has four steps:

| Step | Mode | Gate | App captures |
|---|---|---|---|
| **Individual** | Solo | Soft gate at passage threshold | Articulations, ratings (Evaluate only), hints |
| **Peer** | Face-to-face, app shows perspectives | Progressive reveal (no all-ready gate) | Optional appended observations |
| **AI** | Solo | Individual (each student proceeds independently) | Required reflection per passage |
| **Consensus** | Face-to-face, app captures group position | Hard gate (all members finish AI) | Required agree/disagree + rationale per passage |

### Whole-Class Debrief

After both phases complete, the teacher leads a whole-class debrief. The consensus positions provide a natural starting point — the teacher can see which groups agreed and disagreed with the expert on each passage, and use that as a springboard for cross-group discussion.

Materials from the facilitation guide's `debrief` section:
- **Key takeaways** — 2-3 main insights (in teacher/facet language)
- **Cross-group prompts** — questions to surface cross-group patterns: "Two groups disagreed with the expert on passage 2 — what did you see that the expert missed?"
- **Connection to next** — bridge to future sessions

The debrief is teacher-led, not app-mediated. The facilitation guide provides the materials. The app does not track whether a debrief occurred or capture teacher notes — this is intentionally offline to keep the debrief conversational.

### Session Close

- Teacher explicitly closes the session.
- Closing prevents new responses but preserves all data.
- Late students can be given additional time before close (teacher's discretion).
- A closed session can be reopened (rare).

---

## Facilitation Guide Display

The facilitation guide (`facilitation.yaml`) is the teacher's companion throughout a session. It contains an `overview` (session-level context), `passage_guides` (per-passage scaffolding organized by phase and step), and a `debrief` section. The teacher uses it at three distinct moments — preparation, live facilitation, and debrief — and the display adapts to each.

### Pre-Session: Discussion Briefing

Already covered in the Session Setup Flow. When the teacher selects a scenario, the app presents the guide's `overview` and `passage_guides` as a structured walkthrough: topic, personas, what's designed into the discussion, what students will likely notice and miss, and what the AI will say. The teacher reads this *before* configuring session parameters.

This is a reading experience — linear, one-time, focused on preparation. No interactivity beyond scrolling.

### During Session: Guide Panel

The facilitation guide appears as a **collapsible side panel** on the monitoring dashboard. The teacher can expand/collapse it without leaving the monitoring view — both are visible simultaneously on a laptop or tablet screen.

#### Panel Layout

**Top bar:** Passage selector (tabs or dropdown) + phase indicator (Evaluate / Explain / Debrief). The passage selector shows passage labels from the guide. The phase indicator reflects where most students currently are (auto-detected from student progress data) but the teacher can override to view any phase.

**Content area:** Shows the guide content for the selected passage and current phase. What appears depends on the pedagogical moment:

**During Individual step:**
- `whats_here` — what facets are present, through which lenses, how strong or weak each signal is in this passage, and why (teacher-facing language, uses facet vocabulary openly). Quality level is shown prominently (e.g., "Sufficiency: weak — Maya bases a confident conclusion on a single website")
- `likely_observations` — per-lens predictions: what students looking through each lens will likely see and what they might miss
- `if_students_are_stuck` — lens-based redirects the teacher can use when circulating ("For Evidence-lens students: What do we know about where Maya got her information?")

**During Peer step:**
- `likely_disagreements` — where lens groups will diverge on this passage
- `productive_questions` — discussion-starter questions the teacher can pose to groups (base questions from Stage 3 + enriched questions from Stage 4)
- `watch_for` — signs of productive vs. stalled discussion

**During AI step:**
- `what_the_ai_will_say` — summary of the AI's observations for this passage, so the teacher isn't surprised by student reactions
- `likely_student_reactions` — how students typically respond
- `follow_up` — bridge to the next step

**During Consensus step:**
- The AI step content remains visible (the group is responding to the AI perspective)
- The teacher watches for groups that are stuck on consensus and can prompt with the `productive_questions` from the peer step

The step-level content transitions automatically based on where the majority of students are, but the teacher can manually select any step to look ahead or review.

#### Interaction with Monitoring

When the teacher clicks a **group** in the monitoring panel, the guide panel can optionally highlight the passages that group has reached — making it easy to find the right scaffolding for the group the teacher is about to visit. This is a convenience, not a requirement — the teacher can always navigate the guide manually.

When the teacher clicks a **student** in the monitoring panel (to see their responses), the guide panel remains on its current view. The student's responses and the guide's scaffolding are side by side — the teacher can compare what the student wrote against `likely_observations` and `if_students_are_stuck` to decide whether to intervene.

#### Compact Mode

On smaller screens (tablet), the guide panel can switch to a **compact mode** that shows only the current step's key content: `if_students_are_stuck` during Individual, `productive_questions` during Peer, `what_the_ai_will_say` during AI. The teacher taps to expand any section. This prioritizes the most actionable content — the thing the teacher is most likely to need while standing next to a group.

### Post-Session: Debrief View

When the teacher is ready for the whole-class debrief, a "Debrief" button (or the phase selector) switches the guide panel to show:

- `key_takeaways` — 2-3 main insights in teacher/facet language
- `cross_group_prompts` — questions that surface cross-group patterns, now informed by actual consensus data: "Groups A and C disagreed with the expert on passage 2 — what did you see that the expert missed?"
- `connection_to_next` — bridge to future sessions

The cross-group prompts from the guide are supplemented by live data: which groups agreed/disagreed on which passages. The teacher can glance at the consensus summary alongside the prepared prompts.

### Guide Caching

The facilitation guide is loaded from the scenario's stored artifacts when the session is activated and cached in localStorage (same offline resilience model as other session artifacts). The guide is fully available even if connectivity drops during the session.

---

## Connectivity & Offline Resilience

School networks are unreliable. The app must degrade gracefully rather than fail. The offline strategy uses **localStorage** — simple, reliable, and sufficient for a pilot.

**Local storage queue:** Student responses are saved to localStorage immediately on submission, then synced to the server when connectivity is available. The student sees their own responses instantly regardless of network state. If the browser is closed before sync completes, queued responses are recovered on next login.

**Polling under degraded connectivity:** The client polls for updates (peer responses, consensus status, monitoring data) every 2-3 seconds. When connectivity drops, the display shows the last-known state with a "last updated" timestamp. When connectivity returns, polling resumes and new data appears automatically. No data is lost — only visibility is delayed.

**Monitoring dashboard:** Same degraded-mode behavior. The teacher sees stale status indicators with timestamps rather than a broken page. A banner indicates when the dashboard is not receiving live updates.

**Session artifacts:** The transcript, scaffolding hints, and AI perspectives are loaded at session entry and cached in localStorage. A student who loses connectivity mid-session can continue evaluating and writing — their responses queue locally and sync later. Only the peer and consensus steps require connectivity for their core function.

---

## Assessment and Growth Tracking

### Design Principle

No LLM at runtime. Assessment is based on **objective behavioral signals** — counts, timestamps, binary decisions, word counts, and keyword overlap — all computable from `EvaluateResponse`, `ExplainResponse`, and `GroupConsensus` data. Rubrics from `scaffolding.yaml` remain a **teacher-facing reference** for qualitative review, not an automated scoring system.

The four-step flow (Individual → Peer → AI → Consensus) creates a trajectory per student per passage with observable data at each point. The things we value — engagement, participation, reasoning, discussing, collaborating — have measurable proxies that don't require understanding what the student wrote.

### Behavioral Signals (Within a Session)

#### Engagement

How much did the student invest beyond the minimum?

| Signal | Source | Computation |
|---|---|---|
| Passages beyond threshold | `EvaluateResponse`, `ExplainResponse` | Count distinct passage_ids per student vs. session threshold |
| Time on transcript | Client-side (reading screen) | Duration between transcript load and proceed |
| Time per passage | Client-side (passage modal) | Duration modal is open per passage |
| Voluntary hint usage | `EvaluateResponse.hint_used`, `ExplainResponse.hint_used` | Count of hint_used=true (curiosity signal, not failure) |
| Continued evaluating while waiting | `EvaluateResponse.created_at` | Responses submitted after "Ready for Peer Discussion" clicked |

#### Participation

Did the student show up at each step?

| Signal | Source | Computation |
|---|---|---|
| Response count per step | `EvaluateResponse`, `ExplainResponse` | Count by step (individual, peer, ai) |
| Post-peer additions | Responses where step=peer | Count > 0 means the student added thinking after seeing peers |
| AI reflection length | Responses where step=ai | Word count (beyond-minimum effort) |
| Consensus contribution | `GroupConsensus.submitted_by` | Whether the student was the submitter (partial signal — verbal contribution is not captured) |

#### Reasoning (Individual)

Does the student's individual thinking show depth?

| Signal | Source | Computation |
|---|---|---|
| Articulation length trajectory | Responses where step=individual | Word count across passages in submission order (within-session growth) |
| Rating alignment with expert | `EvaluateResponse.rating` vs. `analysis.yaml` facet quality_level | Not "correctness" — a pattern signal. Consistent misalignment may indicate the student is seeing something the expert framed differently |
| Redirect trigger rate | `EvaluateResponse.redirect_triggered` | Lower rate across passages suggests sharper initial observation |
| Transcript reference | Responses where step=individual | Keyword overlap with passage text (does the student cite specific details vs. generalize?) |

#### Discussing (Peer Step)

Did peer perspectives change the student's thinking?

| Signal | Source | Computation |
|---|---|---|
| Post-peer addition rate | Responses where step=peer | Proportion of passages where the student added observations after seeing peers |
| Peer-influenced content | Responses where step=peer | Keyword overlap between the student's addition and peers' responses (did they engage with what peers said?) |
| Time in peer step | Client-side | Duration between entering peer step and clicking "move on" |

#### Collaborating (Consensus Step)

Did the group engage critically with the expert perspective?

| Signal | Source | Computation |
|---|---|---|
| Agree/disagree decision | `GroupConsensus.position` | Structured data — the decision itself is trackable across sessions |
| Rationale quality | `GroupConsensus.rationale` | Word count; whether rationale references both the AI view and the group's prior observations (keyword overlap with AI perspective text and group members' responses) |
| Individual-to-group divergence | `GroupConsensus.position` vs. individual AI reflections | Did the student's personal reflection suggest a different stance than the group decided? (Healthy independent thinking signal, not a problem) |

### Growth Tracking (Across Sessions)

Growth indicators are computed at query time from response data across a student's session history. No pre-computed scores or separate storage.

**Perspectival range:** Which lenses has the student used across sessions? Simple count from `LensAssignment`. Visualized on the student dashboard as a "lenses explored" indicator.

**Articulation depth:** Average word count trend for individual-step responses across sessions. Crude but objective. Upward trend suggests growing comfort with articulation.

**Independence:** Hint usage rate and redirect trigger rate trends across sessions. Decreasing rates suggest the student is developing sharper initial observations.

**Engagement trend:** Passages-beyond-threshold trend across sessions. Consistent above-threshold engagement suggests intrinsic motivation.

**Collaborative stance:** Consensus rationale word count trends. Group-level, not individual — but a student who participates in groups that produce richer rationales over time is developing collaborative reasoning skills.

### What the Teacher Sees

**During session (monitoring dashboard):** Per-student status icons now reflect four steps, not three. The teacher sees which students are in which step and can identify bottlenecks (e.g., one student blocking the consensus gate).

**After session (review page):** The engagement snapshot shows behavioral signals as simple indicators — not scores or grades, but patterns. E.g., "3 passages beyond threshold," "added observations after peers on 2/3 passages," "group disagreed with expert on passage 2." The teacher interprets these against the rubrics from `scaffolding.yaml`, which remain the qualitative reference.

**Across sessions (student profile):** Growth trend lines for the dimensions above. The "qualitative growth note" on the student dashboard is a teacher-authored field — the teacher writes it after reviewing the data, not the app.

### What the Student Sees

The student dashboard uses **gamified growth indicators** that reward the behaviors the pedagogy values — exploration, engagement, peer responsiveness, and collaboration — without introducing scores, rankings, or competition.

| Indicator | What it shows | Mechanic | Behavioral signal it rewards |
|---|---|---|---|
| **Lens collection** | Which of the three lenses the student has used across sessions | Three icons that fill in; all three = milestone badge | Perspectival range — trying different lenses |
| **Curiosity trail** | Whether the student explores beyond the minimum | A visual that grows (path, plant, etc.) based on passages-beyond-threshold | Engagement — intrinsic motivation to explore |
| **Voice marker** | Whether the student added thinking after seeing peers | Lights up per session where post-peer additions occurred | Discussing — responding to peers' perspectives |
| **Team marker** | Whether the student's group completed consensus | Lights up per session where GroupConsensus was submitted | Collaborating — participating in group deliberation |
| **Journey map** | Session history as a visual timeline | Nodes on a path, each showing topic + lens + group outcome | Sense of progression across the semester |
| **Teacher's note** | Qualitative growth message | Personal message, read-only | Teacher-authored encouragement |

**What students do NOT see:**
- Behavioral signal breakdowns or numeric scores
- Rubric level matches (basic/developing/differentiated)
- Speed or time metrics — deliberation is valued, not speed
- Comparison to other students — no leaderboards, no class rankings
- AI agreement rate — disagreeing with the expert is legitimate

**Visual language:** The gamification metaphor should feel like exploration and growth, not competition. Think: a garden that grows, a map that reveals new territory, a collection that fills in. The metaphor is consistent across all indicators. The overall tone is encouraging and low-stakes.

---

## Device Strategy

Three roles, three device contexts. The app is a responsive web app (PWA) with separate layout shells per role — shared components underneath, different page structures above.

| Role | Primary device | Screen | Input | Design constraints |
|---|---|---|---|---|
| **Researcher** | Desktop | Large | Mouse + keyboard | Rich layouts — framework explorer, side-by-side artifact viewer, matrix views. Hover states available. Generous whitespace. |
| **Teacher** | Desktop (primary), tablet (circulating) | Large / medium | Mouse or touch | Monitoring dashboard + guide panel must work at both sizes. Compact mode for tablet when walking around the classroom. |
| **Student** | Tablet | Medium | Touch only | **No hover states.** Large tap targets. Swipe navigation. Designed to be glanced at, not stared at. |

### Student Tablet Design Principles

The student tablet is the most constrained and most important context. During peer and consensus steps, the tablet sits on the table between 2-4 students. They look at it, talk, look back. The UI shares attention with face-to-face conversation.

- **Touch-first.** Minimum 44px tap targets. Swipe between passages. No drag-and-drop (that's teacher/researcher only). Passage modals are near-fullscreen on tablet, not floating dialogs.
- **Readable at arm's length.** High contrast, clear type hierarchy, minimal visual noise. Status indicators use size and color, not fine detail.
- **Minimal text entry friction.** Students write in text boxes, but the app never requires long-form writing. Sentence starters reduce blank-page anxiety. The "submit" action is prominent and satisfying.
- **Orientation-tolerant.** Works in both portrait and landscape. Students will prop tablets in whatever orientation is comfortable for group viewing.

### Teacher Dual-Mode

The teacher uses a desktop at their desk (large monitoring dashboard + full guide panel) and a tablet when circulating (compact mode showing the most actionable content per step). The transition should be seamless — same session, same data, different layout density.

### Researcher Desktop-Only

The framework explorer, pipeline walkthrough, and artifact viewer are desktop experiences. No need to optimize for tablet or mobile — researchers use these for onboarding and analysis, not live classroom facilitation.

---

## Tech Stack

**Next.js (App Router) + SQLite + TypeScript.** One full-stack project for API and UI.

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js (App Router) | Full-stack in one codebase. Server components reduce client bundle. Well-suited for AI-assisted development. |
| **Language** | TypeScript | Type safety across API and UI. Prisma generates a fully typed client from the schema. |
| **Database** | SQLite via Prisma ORM | Zero infrastructure. File-based. Handles a single-school pilot easily. Prisma's declarative relations suit the complex data model (many-to-many joins, group snapshots, append-only tables). Prisma Studio provides a browser-based data inspector useful during pilot development. |
| **UI components** | shadcn/ui + dnd-kit | shadcn/ui provides accessible, touch-friendly primitives (Dialog, Tabs, Accordion, Card, Table) that work natively with Next.js + Tailwind. Components are copied into the project — fully customizable, no runtime dependency. dnd-kit handles drag-and-drop for teacher group management, with touch support. |
| **Real-time** | Short-interval polling | Progressive peer reveal, monitoring dashboard, consensus gating. Students submit via normal POST; the client polls every 2-3 seconds for updates. For one classroom (~30 students), polling is simple, reliable, and sufficient. Upgrade to SSE if scale demands it. |
| **Offline** | localStorage response queue | Student responses are saved to localStorage immediately on submission, then synced to the server when connectivity is available. Session artifacts (transcript, scaffolding, AI perspectives) are cached in localStorage at session entry. Simpler and more reliable than a full Service Worker + IndexedDB approach — appropriate for a pilot. The peer and consensus steps require connectivity for their core function. |
| **Auth** | Cookie-based sessions (iron-session) | Simple. No external auth provider. Session join codes are a DB lookup. |
| **Styling** | Tailwind CSS | Fast development cycle. Responsive design utilities for the three device contexts. |

### Privacy (COPPA/FERPA)

Single-school pilot with minimal PII:
- No student data sent to third-party services (no external analytics, no external auth)
- SQLite file stays on the server the school controls
- Student auth is name-only — no email, no password, no persistent identifiers beyond full name
- No parental consent flow needed if the school/district approves under the "school official" exception (common for pilot research under IRB approval)
- Confirm with IRB and school administration before deployment

---

## Remaining Design Topics

The following topics are not yet covered and will be added:

- **Data export** — export formats and audiences (teacher vs. researcher), file format(s). Postponed.
