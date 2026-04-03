# Perspectives App — Implementation Plan

This plan phases the build of the Perspectives app based on the design in `app-design.md`. Each phase produces a usable increment. Dependencies flow downward — later phases build on earlier ones.

**Tech stack:** Next.js (App Router) + SQLite/Prisma + TypeScript + shadcn/ui + Tailwind + dnd-kit

**Guiding principle:** Build the student session experience first (it's the core value), wrap teacher and researcher tools around it. Defer polish and edge cases until the core flow works end-to-end.

**Review gates:** Three review checkpoints (R1, R2, R3) are placed after Phases 2, 3, and 5. Each is an external agent review that verifies alignment between the implemented code and the design documents (`app-design.md`, `user-stories.md`). Reviews catch misalignment before it compounds — fixing a schema error after Phase 2 is cheap; discovering it after Phase 5 is expensive.

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
- **Session entities:** Session (with join_code, config fields, lifecycle timestamps incl. updated_at), SessionGroup, SessionGroupMembership, LensAssignment (with assigned_at)
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
  - Batch student creation (paste names, deduplication scoped to teacher's classes first then global)
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

## Review Gate R1 — Data Foundation

External agent reviews the implemented schema, management flows, and scenario import against the design documents.

**Verify:**
- Prisma schema matches all entity definitions in `app-design.md` (fields, types, constraints, relationships)
- Session wizard produces valid draft sessions with all config fields populated
- Scenario import stores all 6 pipeline YAML artifacts correctly and they're queryable
- Group snapshot model works: class groups copy into session groups, edits during draft don't affect class-level groups, activation freezes the snapshot
- Session lifecycle transitions (draft → active → closed) enforce the right constraints (config locked on activate, no new responses on close)
- Student deduplication scopes to teacher's classes first, then global
- Auth: all three role types can log in; student join code + name selection works

**Why here:** The data foundation — everything after this assumes the schema and management flows are right. A modeling error caught now costs hours to fix; caught after Phase 5, it could require rewriting queries across the entire assessment layer.

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
- Teacher can manually advance past gate (needed when student leaves mid-session)
- Monitoring flags groups blocked at consensus gate with an idle member
- Per passage:
  - AI perspective (same as AI step)
  - Each group member's AI reflection (read-only)
- Group submits per passage: Agree/Disagree + rationale
- One member submits; others can append
- After all passages → transition to Explain phase (per-group, not per-session — fast groups start Explain while slow groups finish Evaluate)

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
- Consensus step: same structure, adjusted framing for causal claims ("The expert called this confirmation bias — does that match what you see, or is something else going on?")

### 3.8 Session Completion
- Summary screen: passages evaluated/explained, lens used, group consensus outcomes
- Encouragement note

**Phase 3 milestone:** A student can complete an entire session end-to-end — both phases, all four steps. This is the core product.

---

## Review Gate R2 — Core Session Flow

External agent reviews the complete student session experience against the design doc and user stories. This is the most critical review — the core product must be right before building monitoring, assessment, and researcher tools on top of it.

**Verify:**
- Full session flow matches `app-design.md` Session Experience Flow section and `user-stories.md` Student section
- Both phases (Evaluate, Explain) with all four steps (Individual → Peer → AI → Consensus) work end-to-end
- Evaluate phase: lens-specific entry prompts, Strong/Weak rating, hints, misreading redirects, progress tracking, soft gate at threshold
- Peer step: progressive reveal (no all-ready gate), disagreement highlighting criteria match design (different ratings or same-lens different observations), cross-lens visibility, append-only additions
- AI step: per-passage perspectives displayed correctly, required reflection enforced, framing as "one more voice"
- Consensus step: hard gate (all members finish AI), teacher override works, group submits Agree/Disagree + rationale per passage, Explain consensus uses adjusted causal-claim framing
- Phase transition is per-group (fast groups start Explain independently)
- Append-only semantics enforced everywhere (no edits, only additions)
- Response data structure: EvaluateResponse and ExplainResponse tables capture all fields needed for Phase 5 behavioral signals (step, hint_used, redirect_triggered, timestamps, content)
- Error states: session close mid-passage, browser refresh during consensus, shared tablet data isolation

**Why here:** The core product. If the session flow is wrong, Phases 4-7 build on a broken foundation. Also the last chance to verify that response data will support the assessment computations before they're built.

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

## Review Gate R3 — Cross-Cutting Verification

External agent reviews assessment, monitoring, facilitation guide, and student dashboard together — these all depend on the same response data and must be consistent with each other and with the design doc.

**Verify:**
- Behavioral signals compute correctly from real response data (not mocked):
  - Engagement: passages beyond threshold, hint usage counts
  - Participation: response counts per step, post-peer addition detection
  - Reasoning: word count trajectories, redirect trigger rates, transcript keyword overlap
  - Discussing: post-peer addition rates, peer-influenced content detection
  - Collaborating: consensus positions, rationale lengths, individual-to-group divergence
- Growth tracking across sessions: perspectival range, articulation depth trends, independence trends, engagement trends
- Session review page views (by passage, by student, by group) show correct data from actual session responses
- Monitoring dashboard (Phase 4) shows accurate per-student status across all four steps
- Facilitation guide panel (Phase 4) shows correct content per step (whats_here with quality levels during Individual, productive_questions during Peer, etc.)
- Student dashboard: gamified indicators (lens collection, curiosity trail, voice marker, team marker) reflect actual behavioral data
- Teacher's qualitative growth note flows correctly (teacher writes → student sees read-only)
- Students do NOT see: scores, rubric levels, speed metrics, peer comparisons, AI agreement rates

**Why here:** Cross-cutting verification — assessment, monitoring, and the student dashboard all depend on the same data flowing through different views. This is where subtle misalignments between phases surface (e.g., a behavioral signal defined in the design doc but not actually computable from the response schema, or a dashboard indicator that doesn't match the underlying query).

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
- Clickable stage cards: agents involved, input/output artifacts, key decisions (derived from stored artifacts, not process logs)
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
- Save responses to localStorage immediately on submission (client-generated UUID for idempotent sync)
- Background sync to server when connectivity available
- Recovery on next login if browser closed before sync
- Visual indicator: "saved locally" vs. "synced"
- Idempotent writes: server deduplicates by client UUID (handles multi-device login before sync)

### 7.2 Artifact Caching
- On session entry, cache transcript + scaffolding + AI perspectives in localStorage
- Cache eviction: only current session cached; previous session data cleared on new session entry
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

### 7.6 Error States
- Student submits while server is down: saves locally, "syncing..." indicator, auto-syncs on reconnect
- Teacher closes session while student is mid-passage: student finishes current response, sees "session closed" on next poll
- Browser refresh during consensus: server-side state preserved, student re-enters current step
- Shared tablet: session cookie replaced on login, localStorage keyed by student ID

### 7.7 Accessibility
- Lens colors use color + shape/icon combinations (color-blind safe)
- Disagreement highlighting uses pattern (dashed border) in addition to color
- Keyboard navigation for teacher/researcher desktop views (shadcn/ui built-in + custom components)
- Semantic HTML and ARIA landmarks
- 16px minimum font on tablet passage modals
- Conscious pilot scoping: full WCAG 2.1 AA audit deferred to production

**Phase 7 milestone:** App is classroom-ready. Handles connectivity drops, works well on tablets, onboards teachers smoothly, and handles common error states gracefully.

---

## Phase Summary

| Phase | What it delivers | Key dependency |
|---|---|---|
| **1. Foundation** | Project, schema, auth | — |
| **2. Scenario + Management** | Researcher imports scenarios, teacher manages classes/sessions | Phase 1 |
| **R1** | **Review: data foundation** | Phase 2 |
| **3. Student Session** | Complete student flow (both phases, all four steps) | R1 passed |
| **R2** | **Review: core session flow** | Phase 3 |
| **4. Teacher Live Tools** | Monitoring dashboard + facilitation guide panel | R2 passed |
| **5. Review + Assessment** | Post-session review, behavioral signals, gamified dashboard | R2 passed |
| **R3** | **Review: cross-cutting verification** | Phases 4 + 5 |
| **6. Researcher Tools** | Framework explorer, pipeline walkthrough, artifact viewer | R1 passed (needs scenario data) |
| **7. Offline + Polish** | localStorage resilience, tablet optimization, primer, error states, accessibility | R2 passed (hardens existing features) |

Phases 4, 5, and 6 are independent of each other and can be developed in any order after R2. Phase 6 only depends on R1 (scenario data), not on the student session flow. R3 runs after both Phases 4 and 5 are complete.

---

## What's Deferred

- **Data export** (formats, audiences) — postponed, see `app-design-todo.md`
- **Deployment** — hosting, infrastructure, production setup — deferred until pilot date approaches
- **Consensus scaffolding in facilitation guide** — the pipeline's facilitation guide schema doesn't yet have a consensus-step section per passage. During consensus, the guide panel falls back to AI step content + peer step questions. Pipeline update can happen in parallel.
