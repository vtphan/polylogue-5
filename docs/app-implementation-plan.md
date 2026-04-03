# Perspectives App — Implementation Plan

This plan phases the build of the Perspectives app based on the design in `app-design.md`. Each phase produces a usable increment. Dependencies flow downward — later phases build on earlier ones.

**Tech stack:** Next.js (App Router) + SQLite/Prisma + TypeScript + shadcn/ui + Tailwind + dnd-kit

**Guiding principle:** Build the student session experience first (it's the core value), wrap teacher and researcher tools around it. Defer polish and edge cases until the core flow works end-to-end.

---

## Phase 1 — Foundation

Set up the project, database schema, and authentication. Nothing is user-facing yet except login.

### 1.1 Project Setup
- Initialize Next.js project with App Router, TypeScript, Tailwind
- Install and configure: Prisma (SQLite), shadcn/ui, iron-session
- Set up project structure: `/app` (routes), `/components`, `/lib` (db, auth, utils)
- Seed script for development data (one researcher, one teacher, a few students)

### 1.2 Prisma Schema
All entities from the data model:
- **User entities:** Researcher, Teacher, Student
- **Class entities:** Class, ClassEnrollment, Group, GroupMembership
- **Scenario:** Scenario (with jsonb artifacts field)
- **Session entities:** Session (with join_code, config fields, lifecycle timestamps), SessionGroup, SessionGroupMembership, LensAssignment
- **Response entities:** EvaluateResponse, ExplainResponse (append-only, separate tables)
- **Consensus:** GroupConsensus
- Run initial migration

### 1.3 Authentication
- Researcher/Teacher login: username + password → cookie session
- Student login: join code → roster lookup → name selection → cookie session
- Auth middleware: role-based route protection (researcher, teacher, student)
- `/api/auth/login`, `/api/auth/student-login`, `/api/auth/logout`, `/api/auth/me`

**Phase 1 milestone:** Can log in as researcher, teacher, or student. Database schema is complete.

---

## Phase 2 — Scenario Import + Teacher Management

The researcher can import scenarios. The teacher can manage classes, students, groups, and create session drafts.

### 2.1 Scenario Import (Researcher)
- `POST /api/scenarios/import` — reads YAML files from registry path, stores as jsonb in Scenario table
- `GET /api/scenarios` — list scenarios (topic, status, date)
- `PATCH /api/scenarios/:id` — toggle available/hidden
- `GET /api/scenarios/:id` — view scenario artifacts (raw, no annotations yet)
- Researcher dashboard: scenario list with import button and status toggle

### 2.2 Teacher Account Management (Researcher)
- `POST /api/teachers` — create teacher account
- `GET /api/teachers` — list teachers
- Researcher dashboard: teacher list with create form

### 2.3 Class & Student Management (Teacher)
- Teacher dashboard: class list with create button
- Class detail page with Students tab:
  - Batch student creation (paste names, deduplication check)
  - Enroll/unenroll students
- Class detail page with Groups tab:
  - Group CRUD (create, rename, delete)
  - Drag-and-drop student assignment between groups (dnd-kit)
  - Ungrouped student pool
- Class detail page with Sessions tab:
  - Session list (status, topic, date)

### 2.4 Session Setup Wizard (Teacher)
- Step 1: Select scenario (cards with topic, persona count, passage count)
- Step 2: Discussion briefing (scrollable page from facilitation guide overview + passage previews)
- Step 3: Configure (lens mode, passages, scaffolding toggles, thresholds — with inline annotations)
- Step 4: Review groups (editable snapshot, validation: no ungrouped students, min 2 per group)
- Step 5: Review and save as draft
- Session activation: freeze config/groups, generate join code
- Session close/reopen

**Phase 2 milestone:** Full management flow works. Researcher imports scenarios, teacher creates classes/groups and configures sessions through the wizard. Sessions can be activated.

---

## Phase 3 — Student Session Experience (Core)

The critical path. Students can enter a session and complete the full Evaluate → Explain flow with all four steps.

### 3.1 Session Entry
- Student login via join code + name selection
- Onboarding screen: topic, context, persona cards
- Reading screen: chat-style transcript rendering, scroll tracking
- Lens assignment screen: assigned lens display or choice selector

### 3.2 Evaluate Phase — Individual Step
- Transcript view with numbered passage icons (ordered by difficulty)
- Passage modal (near-fullscreen on tablet):
  - Passage text (1-3 turns)
  - Lens-specific entry prompt
  - Strong/Weak rating
  - Articulation text box
  - Hint button (directional hint appears above text box)
  - Submit → timestamped entry, append-only
- Misreading redirect: after submission, check against common_misreadings, show redirect + new text box if triggered
- Progress tracking: completed vs. remaining passages, threshold banner
- Soft gate: "Ready for Peer Discussion" button appears at threshold

### 3.3 Evaluate Phase — Peer Step
- "Ready" button click → student enters peer area
- Progressive reveal: peers' responses appear as each peer enters (polling, 2-3s interval)
- Waiting state: shows group members + ready/evaluating status; student can continue evaluating
- Peer visibility display (organized by passage):
  - Each peer's lens, rating, articulation
  - Disagreement highlighting (different ratings on same passage, or same-lens different observations)
  - Cross-lens visibility
- Append-only additions after seeing peers
- "Move to AI step" button

### 3.4 Evaluate Phase — AI Step
- Per passage: AI perspective from analysis.yaml (per-lens observations, what_to_notice)
- Passage-specific reflection prompt
- Required response (even one sentence), append-only
- After all passages → enters consensus waiting area

### 3.5 Evaluate Phase — Consensus Step
- Hard gate: all group members must finish AI step (polling for readiness)
- Teacher can manually advance past gate
- Per passage:
  - AI perspective (same as AI step)
  - Each group member's AI reflection (read-only)
- Group submits per passage: Agree/Disagree + rationale
- One member submits; others can append
- After all passages → transition to Explain phase

### 3.6 Explain Phase — Individual Step
- Passage modal:
  - Passage text + Evaluate responses (read-only) at top
  - Bridge prompt (personalized to student's Evaluate lens)
  - Explanation text box
  - Sentence starters (if enabled): generic always visible, passage-specific behind "I need more help"
  - Reference lists (if enabled): browsable cognitive patterns + social dynamics
- Same threshold + soft gate pattern

### 3.7 Explain Phase — Peer, AI, Consensus Steps
- Peer step: same progressive reveal model, difference highlighting (cognitive vs. social)
- AI step: explanatory vocabulary perspective, required reflection
- Consensus step: same structure, richer question ("Does 'confirmation bias' match what you see?")

### 3.8 Session Completion
- Summary screen: passages evaluated/explained, lens used, group consensus outcomes
- Encouragement note

**Phase 3 milestone:** A student can complete an entire session end-to-end — both phases, all four steps. This is the core product.

---

## Phase 4 — Teacher Live Session Tools

The teacher can monitor and facilitate a live session.

### 4.1 Monitoring Dashboard
- Session join code displayed prominently
- Left panel: group list with per-student status icons (phase × step)
- Right panel: click student → real-time response trail
- Polling for live updates (2-3s)
- Idle flags (configurable threshold)
- Group advancement: manually advance past peer or consensus gate

### 4.2 Facilitation Guide Panel
- Collapsible side panel on monitoring dashboard
- Top bar: passage selector + phase indicator (auto-detected from student progress, teacher-overridable)
- Content area adapts to current step:
  - Individual: whats_here (with quality levels), likely_observations, if_students_are_stuck
  - Peer: likely_disagreements, productive_questions, watch_for
  - AI: what_the_ai_will_say, likely_student_reactions, follow_up
  - Consensus: AI content + productive questions
- Click group in monitoring → guide highlights that group's passages
- Compact mode for tablet

### 4.3 Debrief View
- Switches guide panel to debrief section
- Key takeaways, cross-group prompts (supplemented by live consensus data), connection to next

**Phase 4 milestone:** Teacher can monitor a live session, access the facilitation guide in context, and lead a debrief using consensus data. The classroom experience is complete.

---

## Phase 5 — Post-Session Review + Assessment

The teacher can review session data and track student growth.

### 5.1 Session Review Page
- By passage: articulations grouped by lens + group consensus positions
- By student: full four-step response trail per passage
- By group: consensus positions + preceding individual reflections
- Engagement snapshot: behavioral signals per student

### 5.2 Behavioral Signal Computation
- Engagement: passages beyond threshold, voluntary hint usage
- Participation: response count per step, post-peer additions
- Reasoning: articulation word count trajectory, redirect trigger rate, transcript reference (keyword overlap)
- Discussing: post-peer addition rate, peer-influenced content (keyword overlap)
- Collaborating: consensus position, rationale length, individual-to-group divergence
- All computed at query time from EvaluateResponse, ExplainResponse, GroupConsensus

### 5.3 Growth Tracking (Across Sessions)
- Perspectival range: lenses used across sessions (from LensAssignment)
- Articulation depth: word count trends
- Independence: hint usage and redirect trigger rate trends
- Engagement trend: passages-beyond-threshold across sessions
- Teacher-authored qualitative growth note (per student)

### 5.4 Student Dashboard (Gamified)
- Journey map: past sessions as visual timeline nodes
- Lens collection: three icons filling in across sessions
- Curiosity trail: grows with passages-beyond-threshold
- Voice marker: lights up for post-peer additions
- Team marker: lights up for completed consensus
- Teacher's note (read-only)
- Touch-first, tablet-optimized

**Phase 5 milestone:** Complete assessment and growth tracking loop. Teacher reviews data, writes growth notes, tracks trends. Students see gamified dashboard.

---

## Phase 6 — Researcher Tools

Framework exploration, pipeline transparency, and annotated artifact viewing.

### 6.1 Framework Explorer
- **Level 1 — Core Essence:** Directional flow diagram (Lens → Facet → Explanatory Variable). Clickable elements transition to Level 2. SVG or CSS layout.
- **Level 2 — Illustrative Example:** Museum/amusement park passage. Three lens buttons reveal different observations. Facets appear with quality ranges and cross-lens annotation. Explanatory variables with cognitive/social distinction. All elements clickable to expand.
- **Level 3 — Reference:** Tabbed page (Facets by lens, Lenses, Explanatory Variables, Connections matrix). Expandable rows with full detail. "See in a scenario" links to artifact viewer.
- Navigation: tabs/breadcrumbs between levels, deep links

### 6.2 Pipeline Walkthrough
- Horizontal 5-stage flow diagram
- Information barrier as visual divider (clickable: shows what was stripped/kept and why)
- Clickable stage cards: agents involved, input/output artifacts, key decisions
- Links to artifact viewer for input/output

### 6.3 Artifact Viewer with Annotations
- **Transcript view:** chat-style rendering, passage boundaries, facet annotation markers (colored margins), design intent toggle
- **Analysis view:** per-passage cards, AI perspective blocks, facet cross-links, diversity predictions
- **Scaffolding view:** grouped by type (hints, rubrics, bridges, starters, misreadings), rubric cards with differentiation levels, hint rationale toggle
- **Facilitation view:** teacher view + facet vocabulary overlay
- Cross-artifact navigation: facet annotations link across views

### 6.4 Observatory
- Cross-teacher aggregate view: total sessions, total students, activity over time
- Drill down: teacher → class → session → student
- Read-only

**Phase 6 milestone:** Researcher can onboard new collaborators using the framework explorer, trace any scenario through the pipeline, and inspect artifacts with annotations.

---

## Phase 7 — Offline Resilience + Polish

Harden the app for real classroom conditions.

### 7.1 Offline Response Queuing
- Save responses to localStorage immediately on submission
- Background sync to server when connectivity available
- Recovery on next login if browser closed before sync
- Visual indicator: "saved locally" vs. "synced"

### 7.2 Artifact Caching
- On session entry, cache transcript + scaffolding + AI perspectives in localStorage
- Student can continue Individual step work offline
- Peer and Consensus steps show "last updated" timestamp when stale

### 7.3 Degraded-Mode UI
- Monitoring dashboard: stale indicators with timestamps, "not receiving live updates" banner
- Peer reveal: shows last-known state, resumes automatically on reconnect

### 7.4 Tablet Optimization
- Touch-first student layouts: 44px+ tap targets, swipe navigation, near-fullscreen modals
- Teacher compact mode: facilitation guide panel shows only most actionable content per step
- Orientation-tolerant layouts (portrait + landscape)
- High-contrast type hierarchy for arm's-length readability

### 7.5 Pedagogy Primer
- 5-card paginated sequence for teacher first login
- Always accessible via "How it works" link
- No completion tracking

**Phase 7 milestone:** App is classroom-ready. Handles connectivity drops, works well on tablets, and onboards teachers smoothly.

---

## Phase Summary

| Phase | What it delivers | Key dependency |
|---|---|---|
| **1. Foundation** | Project, schema, auth | — |
| **2. Scenario + Management** | Researcher imports scenarios, teacher manages classes/sessions | Phase 1 |
| **3. Student Session** | Complete student flow (both phases, all four steps) | Phase 2 (needs scenarios + sessions) |
| **4. Teacher Live Tools** | Monitoring dashboard + facilitation guide panel | Phase 3 (needs live student data) |
| **5. Review + Assessment** | Post-session review, behavioral signals, gamified dashboard | Phase 3 (needs response data) |
| **6. Researcher Tools** | Framework explorer, pipeline walkthrough, artifact viewer | Phase 2 (needs scenario data) |
| **7. Offline + Polish** | localStorage resilience, tablet optimization, primer | Phase 3+ (hardens existing features) |

Phases 4, 5, and 6 are independent of each other and can be developed in any order after Phase 3.

---

## What's Deferred

- **Data export** (formats, audiences) — postponed, see `app-design-todo.md`
- **Deployment** — hosting, infrastructure, production setup — deferred until pilot date approaches
- **Consensus scaffolding in facilitation guide** — the pipeline's facilitation guide schema doesn't yet have a consensus-step section per passage. During consensus, the guide panel falls back to AI step content + peer step questions. Pipeline update can happen in parallel.
