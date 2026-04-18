# Lens Technical Specs v1

Supersession note:

- `v1-redesign-spec.md` is now the canonical source of truth for the current Lens v1 student experience.
- If this document conflicts with `v1-redesign-spec.md` on flow, interaction model, or scope, follow `v1-redesign-spec.md`.
- In particular, older assumptions in this file about shared-device multi-student flow, peer discussion, and writing-first interaction should be treated as historical unless explicitly restated in the redesign spec.

This document defines a practical technical target for the first redesigned version of Lens.

It is intentionally narrower than the broader product and instructional-design vision. The goal of v1 is to build a convincing, usable foundation that supports demos, instructional exploration, and early student-facing analysis work without overcommitting to a larger architecture too early.

This document should be read alongside:

- `app-background.md`
- `v1-redesign-spec.md`
- `assistive-package-v1_1.md`
- `pipeline-spec.md`

---

## 1. Taxonomy and Instructional Design

Lens v1 should align with the current instructional-design direction rather than attempt to encode the full prior Lens design.

The key instructional commitments for v1 are:

- Lens helps students improve critical thinking in group discussions.
- The primary near-term goal is helping students notice and evaluate the quality of reasoning in discussion.
- The experience should support a low floor and a rising ceiling.
- The app should sustain engagement on student devices, not rely on constant teacher facilitation.
- Students should be able to participate at different points on the current Lens taxonomy:
  - Notice
  - Point
  - Interpret
  - Compare
  - Evaluate
  - Explain
  - Transfer

Lens v1 does not need to fully implement every instructional ambition in `instructional-design-v1.md`. It should implement enough of the model to support:

- meaningful student participation
- episode-based reasoning analysis
- differentiated entry points
- peer discussion
- visible progress and engagement

This document therefore treats the instructional-design doc as the pedagogical source of truth, while narrowing it into a buildable first version.

---

## 2. Scope

## 2.1 Product Scope for v1

Lens v1 should be:

- a **single-page application**
- visually polished enough for demos and classroom pilots
- focused on **student use only**
- usable for both:
  - demonstrating the Lens concept
  - supporting actual episode-analysis activities

The v1 goal is not full classroom platform completeness. It is a strong, coherent student-facing experience that shows how Lens can deliver instruction effectively while staying aligned with the instructional goals.

## 2.2 In Scope

- Student-facing episode reading and analysis experience
- Config-driven loading of an episode/session for demo or classroom use
- Single-student progress on one device
- Browser-local persistence of lightweight progress history
- Use of precomputed episode assets and assistive-package content
- Warm-up examples before challenge play
- Level-based constrained interaction flow
- Lightweight progress and badge mechanisms
- Demo-friendly visual polish

## 2.3 Out of Scope for v1

- Teacher dashboard
- Admin/operator tools
- Teacher-facing authoring UI
- Authentication or user accounts
- Server-side student persistence
- Real-time sync across devices
- Networked classroom orchestration
- Production-grade analytics backend
- Full roster management
- Advanced permissions or role systems
- Runtime LLM integration

## 2.4 Single-Student Runtime Assumption

The current v1 redesign assumes one student works through one episode on one device.

That means v1 should support:

- one active learner state per local session
- simple browser-local save and resume
- deterministic episode progression without peer orchestration

Browser-local storage remains acceptable for v1 because the primary goal is a coherent student runtime, not classroom account infrastructure.

## 2.5 Session Config

For v1, Lens should support loading a lightweight **session config** rather than only a raw episode reference.

A session config should minimally define:

- which episode content to load
- optional UI metadata useful for demo or sequencing

One reasonable v1 shape:

```json
{
  "config_id": "field-trip-ep01",
  "episode": {
    "source": "artifacts/the-field-trip/episodes/episode_01"
  },
  "ui": {
    "pacing": "guided"
  }
}
```

The app should be able to derive or store locally:

- current episode progress
- current warm-up or level state
- per-level answer history
- badge/completion state

### 2.5.1 v1 Decision

For v1, the session config should be treated as:

- the primary way to identify which episode/session to load
- an optional way to preload the student roster for the table

If the roster is included in the config, the app should allow light editing before the session begins. If the roster is not included, manual entry is the fallback.

For v1, the minimum required fields should be:

- `config_id`
- `episode.source`

Student roster is not required for the current v1 runtime.

The `ui.pacing` field is optional and defaults to `guided` when omitted.

---

## 3. Features

Lens v1 should stay focused on a small set of core features that directly support the instructional goals and the classroom use case.

### 3.0 Core Feature Set for v1

The core v1 feature set should be:

1. **Single-student session setup**  
   A student can quickly start or resume a local session in one browser.

2. **Episode reading and navigation**  
   Students can read an episode, revisit it, and focus on specific turns or passages.

3. **Warm-up onboarding**  
   The app teaches the task through one or two warm-up examples before independent play.

4. **Guided interpretation and optional support**  
   Students can answer constrained challenges and then receive scaffolds, models, or deeper prompts when needed.

5. **Level-based progression**  
   The episode is organized as a sequence of small reasoning challenges with escalating cognitive demand.

6. **Explicit evaluation and revision**  
   Lens should ask students to make a basic judgment and then keep or change the answer after support.

7. **Progress and engagement system**  
   Lens can show momentum and badges that reinforce engagement.

8. **Browser-local persistence**  
   The app can preserve lightweight session history in one browser for continuity and demo use.

9. **Flexible pacing and stopping points**  
   Lens should support student-paced progress through warm-ups and levels, with clear deterministic stopping points and places to pause and resume.

Anything beyond this should be treated skeptically for v1 unless it is necessary to make the core student experience coherent.

## 3.1 Episode Experience

Lens v1 should support a clear student-facing episode experience:

- load one episode/session from a simple config-driven setup
- load one episode and its associated assistive content
- display the discussion in a readable, appealing way
- allow students to revisit the whole episode
- allow attention to specific turns or focused moments

The episode view should support both:

- whole-discussion understanding
- close attention to selected reasoning moments

For v1, config-driven loading is sufficient. This can be implemented through bundled config, a local file, a query parameter, or another simple mechanism. It does not require a teacher-facing management interface.

### 3.1.1 v1 Decision: Primary Content Unit

For v1, the app should be **turn-first**, not passage-first.

That means:

- the primary interactive anchor in the UI is `turn_id`
- students mainly act on focal turns
- passages may still exist as background grouping or metadata
- the app does not need to make passage-level interaction the primary experience in v1

This matches the current assistive package better and keeps the UI and state model simpler.

### 3.1.2 v1 Decision: Content Source of Truth

For v1, the app should consume the current merged runtime artifact at:

- `artifacts/{story_id}/episodes/episode_{NN}/assistive_package.yaml`

alongside the episode transcript/content for the same episode directory.

V1 should treat the current merged `assistive_package.yaml` as the runtime contract. If the pipeline later migrates to a split such as `runtime_package.yaml` plus `authoring_trace.yaml`, Lens v1 should be updated explicitly; it should not assume that split today.

One package-reading detail remains intentionally open for later versions: the exact field contract for a standalone prepared outside perspective. V1 should not assume that contract exists yet.

## 3.2 Student Session Setup

The app should support a lightweight setup flow for one student:

- start a new episode session
- resume recent local progress if available
- begin without account creation

The goal is fast entry into the episode, not user management.

### 3.2.1 v1 Decision: Pacing Policy

For v1, the pacing policy is a **session-config decision**, not a student-facing runtime control. The config selects one supported mode, and the app applies it for the whole session. Students do not see the raw mode label; they see its effects (stopping-point prompts in `guided` mode; uninterrupted forward flow in `open` mode).

Supported modes:

- **open**
  The student advances whenever ready once local prerequisites are met.

- **guided**
  The app surfaces deterministic stopping-point cues based on current phase and level completion.

If `ui.pacing` is omitted from the session config, the app should default to `guided`.

V1 does not need live classroom orchestration, phase locking, or a real-time teacher dashboard to support this. A config-driven pacing policy plus clear stage boundaries is enough.

The app should not assume it can infer nuanced pacing advice at runtime. Lens v1 is non-LLM at runtime and should therefore base pacing support on explicit structural rules such as:

- current level
- current phase
- whether the current level is complete
- whether a natural stopping point has been reached

## 3.3 Low-Floor Participation Moves

Lens v1 should support participation moves that do not require writing.

Examples:

- choose between plausible interpretations
- choose `I'm not sure yet`
- open support
- reveal the next scaffold step
- confirm or revise an answer
- record confidence

These moves should help students get into the activity without blank-page failure.

## 3.4 Guided Interpretation and Deepening

The assistive package currently supports a small number of meaningful activity types especially well. Lens v1 should align with that instead of inventing a large activity catalog.

Lens v1 should therefore be structured as **one guided experience** with a small number of clearly recognizable **core stages** plus smaller **embedded support moves** inside those stages.

The most natural v1 core stage flow is:

1. read the episode
2. complete one or two warm-ups
3. enter challenge levels
4. answer a constrained question
5. receive support if needed
6. confirm or revise
7. complete the level and advance

This should not be interpreted as six rigid, separately branded activity modes. It is better understood as a guided backbone for the experience.

Each stage in this backbone should also be a **pacing-aware unit**. The app should know when a group has reached a reasonable stopping point and should preserve enough state to resume from that point later.

Within that backbone, Lens can offer embedded support moves such as:

- reacting to a prompt
- choosing between interpretations
- opening a modeled example
- receiving a redirect
- answering a deeper explanation prompt
- retrying after help
- keeping or changing an answer

Some of these moves may be optional, conditional, or skippable depending on student readiness and how the group is progressing. The app should feel guided, but not mechanically rigid.

At minimum, Lens v1 should allow students to:

- read the episode before analysis begins
- complete a modeled warm-up
- answer turn-based or passage-based challenge questions
- receive deeper prompts after an initial answer
- return to or revise their answer during the session

The goal is to support a guided path from noticing toward interpretation, evaluation, and explanation without writing.

### 3.4.1 v1 Decision: Minimum Backbone

For v1, the minimum required backbone should be:

1. read episode
2. warm-up
3. answer a challenge
4. request support if needed
5. confirm or revise
6. continue to next level

Supports and deeper prompts should sit around this backbone as optional or conditional steps.

For v1, each challenge level should be treated as a valid stopping unit. A student should be able to pause after a warm-up, after a completed level, or at episode completion and resume deterministically later.

## 3.5 Warm-Ups

Lens v1 should include one or two warm-up examples before the main level sequence.

Warm-Up 1 should be required and fully modeled.

Warm-Up 2 may be optional and should:

- ask a simple multiple-choice question
- reveal the explanation after the answer
- prepare the student for the independent levels

## 3.6 Scaffolds and Hints

Lens v1 should support differentiated scaffolds derived from the assistive package.

At minimum, it should be able to surface:

- attention prompts
- modeled examples
- transfer examples when available
- redirects when students are focused in the wrong place
- deeper prompts after an initial answer

The exact timing rules can remain simple in v1, but the app should be structured so that different scaffold types can appear at different points in the activity sequence.

The reviewed assistive package suggests that v1 should especially support:

- recognition/noticing prompts
- modeled and transfer examples
- explanation prompts tied to why reasoning may have happened
- intervention ladders with increasing depth

### 3.6.0 Primitive-to-UI Mapping

To reduce integration ambiguity, v1 should map current assistive-package primitives to UI surfaces roughly as follows:

- `analytic_core.passages`
  -> activity-engine metadata for focal-turn selection, grouping, and flow; not rendered directly as raw student-facing content

- `analytic_core.passages[].lens_visibility`
  -> optional lens-level framing or hidden activity-engine metadata; not required as a direct UI surface in v1

- `analytic_core.passages[].facets_present`
  -> hidden interpretive metadata used by the activity engine and support logic; not primary student-facing content in v1

- `front_door_support.attention_targets`
  -> focal-turn support panel / immediate noticing help

- `front_door_support.sentence_frame_seeds`
  -> optional support copy or hidden authoring residue; not a required student-facing interaction in no-writing v1

- `front_door_support.modeled_episode_examples`
  -> modeled-example support card

- `front_door_support.transfer_examples`
  -> transfer-example support card

- `diagnostic_support.probes`
  -> initial interpretation prompt / guided-choice prompt

- `diagnostic_support.interventions`
  -> conditional support panel after request or weak first move

- `discussion_support.discussion_cues`
  -> deferred in current v1

- `discussion_support.talk_moves`
  -> deferred in current v1

- `discussion_support.consensus_checks`
  -> deferred in current v1

- `diagnostic_support.struggle_calibration`
  -> deferred in v1 unless needed internally by the activity engine; not a direct UI surface in the first implementation

- `teacher_support`
  -> deferred in v1 because teacher-facing functionality is out of scope

Any assistive-package field not rendered in v1 should be treated as intentionally deferred rather than silently ignored.

### 3.6.1 v1 Decision: Support Timing

For v1, support timing should follow a simple hybrid rule set:

- **attention prompts** are available immediately
- **modeled examples and transfer examples** are available on demand when present
- **deeper prompts** appear only after an initial answer is recorded
- **redirects** appear when a student explicitly asks for help, chooses an "I'm not sure" path, or selects a weak first move
This keeps the flow simple while still supporting different readiness levels.

## 3.7 AI in v1

For v1, AI-authored content should appear through **embedded prepared supports** that are already covered by the assistive package contract, such as:

- modeled examples
- transfer examples
- deeper prompts

V1 should frame this content as prepared support, not as:

- the final authority
- a live AI tutor

A standalone prepared outside perspective view is deferred until the runtime field contract is explicit enough to build against safely.

## 3.8 Progress and Gamification

Lens v1 should include lightweight progress signals and meaningful gamification.

At minimum, it should support:

- visible progress through an episode activity
- app-awarded badges or markers for participation and movement

This system should reinforce engagement and growth, not reduce the experience to right-answer hunting.

For v1, rewards and recognitions should be treated as engagement support, not as the primary pacing mechanism.

### 3.8.1 v1 Decision: Recognition Rules

For v1, Lens should support app-awarded badges only.

Suggested triggers:

- completing Warm-Up 1
- completing Warm-Up 2
- finishing a level
- using support and then completing a level
- changing an answer after support
- completing the episode

For v1:

- there should be no public leaderboard
- correctness should not be the main reward signal

## 3.8.2 Engagement Layer for Middle School Students

Because Lens must help sustain engagement on student devices, v1 should include a lightweight engagement layer designed for middle-school use.

This layer should not rely only on correctness or task completion. It should make the experience feel active, social, and rewarding through:

- **visible momentum**  
  Students can tell they are moving forward through the activity.

- **recognition**  
  Different kinds of participation can be noticed and rewarded, including noticing something important, revising a response, or completing a difficult level with support.

- **lightweight delight**  
  Small reveal moments, progress changes, or badge feedback should make the experience feel lively without turning it into a game detached from the learning goals.

The v1 engagement layer should avoid:

- public correctness ranking
- speed-first reward systems
- heavy leaderboard mechanics
- anything that makes slower or less verbal students feel punished

## 3.9 Local Persistence

Lens v1 should persist the following in local browser storage:

- current episode/session context
- individual level responses
- lightweight progress state
- earned badges, if implemented

Persistence should be treated as session continuity and demo support, not as durable institutional record-keeping.

V1 persistence does not need to implement a full longitudinal progression model. Cross-session growth tracking, support fading over time, and durable student development history belong more naturally to v2.

For v1, persistence should also preserve:

- current level
- current phase
- current pacing policy
- whether the student stopped at a suggested stopping point

If later episodes are available in the current session or bundle, the app should also allow the student to continue forward after finishing an episode rather than forcing a hard stop.

---

## 4. User Stories

These user stories are written for the current v1 scope: student-only, single-student runtime, browser-local, and episode-centered.

## 4.1 Session Setup

- As a student, I want to open directly into my assigned episode when a session config is provided so that startup is fast and clear.
- As a returning student on the same browser, I want Lens to remember enough local history that I can resume without friction.
- As a session author, I want to set pacing in the session config so that Lens behavior fits the class period without requiring runtime setup.

## 4.2 Episode Reading

- As a student, I want to read the episode clearly before challenges begin so that I understand the discussion.
- As a student, I want the episode view to feel readable and not overwhelming so that I stay engaged.
- As a student, I want to revisit specific turns or moments while answering a level so that I can ground my choice in the text.

## 4.3 Warm-Ups and Challenges

- As a student, I want to see a worked example first so that I understand what kind of thinking the app expects.
- As a student, I want a simple guided warm-up before independent play so that I am not thrown directly into the harder levels.
- As a student, I want each level to feel like a small reasoning challenge so that progress feels clear.

## 4.4 Supports

- As a student who cannot get started, I want a scaffold that helps me notice something meaningful without immediately giving away the full answer.
- As a student with a weak or partial first idea, I want support that helps me deepen it.
- As a student focused on the wrong thing, I want a redirect that helps me attend to a more relevant issue.
- As a student, I want to keep or change my answer after support so that the app can capture whether my thinking changed.

## 4.5 Progress and Recognition

- As a student, I want to feel that I am making progress through the episode so that I stay engaged.
- As a student, I want badges or completion markers that reflect meaningful progress so that the activity feels rewarding.
- As a student, I want the app to feel lively and responsive without turning into a noisy game.

## 4.6 Pacing and Resume

- As a student, I want clear stopping points so that I can pause without losing the thread.
- As a returning student, I want to resume exactly where I left off so that stopping mid-episode does not break the experience.
- As a student who finishes early, I want to continue to the next available episode if one exists.

---

## 5. Journey-to-Implementation Mapping

This section translates the core user journeys into concrete UI surfaces, state transitions, and stored data for v1.

## 5.1 Journey A: First-Time Student Starting an Episode

### Screens / Views

- **Start screen**
  Option to begin a session or resume a recent local session.

- **Episode landing screen**
  Show episode title, short setup text, and clear entry into reading.

- **Episode reading view**
  Show the episode in a readable whole-discussion format.

- **Warm-Up 1 view**
  Show one fully modeled example.

- **Warm-Up 2 view**
  Show one guided multiple-choice example if enabled.

### State Transitions

1. `app_opened`
2. `session_start_requested`
3. `episode_loaded`
4. `episode_viewed`
5. `warmup_1_opened`
6. `warmup_1_completed`
7. optional `warmup_2_opened`
8. optional `warmup_2_completed`

### Stored Data

- local session ID
- episode/session config reference
- current phase
- reading completion state
- warm-up completion state

## 5.2 Journey B: Student Completes a Challenge Level

### Screens / Views

- **Level hub**
  Orient the student to the next challenge.

- **Challenge level view**
  Show the focal turn or passage, prompt, and answer choices.

- **Support view**
  Surface nudges, hints, redirects, and worked examples.

- **Level resolution view**
  Let the student keep or change the answer and then continue.

### State Transitions

1. `level_opened`
2. `answer_selected`
3. optional `support_requested`
4. optional `support_step_revealed`
5. optional `answer_changed`
6. `level_completed`
7. optional `badge_awarded`

### Stored Data

- level ID
- focal turn or passage
- question shown
- options shown
- initial answer
- final answer
- support usage
- level completion state

## 5.3 Journey C: Student Requests Support

### Screens / Views

- **Challenge level view**
  Show the level prompt and current answer state.

- **Support view**
  Reveal attention nudges, focused questions, hints, worked examples, or redirects.

- **Level resolution view**
  Let the student keep or change the answer after support.

### State Transitions

1. `support_requested`
2. `support_opened`
3. `support_step_revealed`
4. optional `answer_changed`
5. `level_completed`

### Stored Data

- support type used
- support depth reached
- whether the answer changed

## 5.4 Journey D: Resume / Continue a Local Session

### Screens / Views

- **Resume screen**
  Show recent local sessions available in the browser.

- **Session summary view**
  Show which episode and how far the student has progressed.

- **Restored working view**
  Return the student to the relevant episode phase or level.

### State Transitions

1. `app_opened`
2. `recent_local_sessions_found`
3. `resume_selected`
4. `local_session_loaded`
5. `working_state_restored`

### Stored Data

- saved local session metadata
- episode/session config reference
- current phase
- current level
- responses
- scaffold usage
- badge history

## 5.5 Journey E: Episode Completion

### Screens / Views

- **Episode completion view**
  Show completion, progress, and badges for the episode.

- **Next-episode continuation action**
  Allow the student to continue to another available episode when the current one is done.

### State Transitions

1. `episode_complete`
2. `completion_view_opened`
3. `session_return_or_continue_selected`

### Stored Data

- completion summary
- badge summary
- next-step selection

## 5.6 Journey F: Pause / Resume at a Natural Stopping Point

### Screens / Views

- **Stopping-point prompt**
  Show that the student has reached a structural stopping point where it is safe to pause or continue.

- **Resume screen**
  Restore the student to the same phase or level later.

### State Transitions

1. `stopping_point_reached`
2. optional `pause_selected`
3. `session_state_saved`
4. `resume_selected`
5. `working_state_restored`

### Stored Data

- phase at pause
- level at pause
- pacing policy
- whether the stop was app-suggested or user-selected

For v1, `app-suggested` should mean derived from deterministic structure, not from inferred struggle or open-ended runtime analysis.

---

## 6. Technical Stack

## 6.1 App Architecture

Lens v1 should be implemented as a **simple SPA**.

Recommended v1 frontend stack:

- **React**
- **TypeScript**
- **Next.js App Router** in a fresh app under `apps/lens/`
- **Tailwind CSS**
- **Zustand** for lightweight client state
- **Zod** for runtime validation of loaded content

Optional:

- **Framer Motion** if used sparingly for presentation polish

The emphasis should be:

- fast iteration
- clean local state management
- attractive presentation
- easy demoability

The architecture should stay simple enough that instructional and UX experimentation is easy.

For v1, routing should stay inside the Next.js App Router model. Do not introduce `React Router` or a second client-side routing layer inside the app.

For v1, this should be a greenfield app implementation under `apps/lens/`, not an adaptation of the older `lens-app/` codebase.

The older `lens-app/` should be treated as reference-only legacy material. V1 should not inherit its server-side persistence, Prisma-backed data model, account assumptions, or older evaluate/explain product flow unless a specific low-level utility is intentionally copied over.

V1 code should not import `@prisma/client` or depend on server-side persistence.

## 6.2 Data Sources

Lens v1 should consume:

- precomputed episode content
- precomputed assistive-package content

from checked-in or otherwise bundled artifacts under:

- `artifacts/{story_id}/episodes/episode_{NN}/`

For v1, static or locally bundled data is preferable to a more elaborate backend integration if that keeps the app easier to demo and evolve.

The app should use a simple discovery mechanism, such as:

- an explicit session config that points to one episode directory
- or a bundled manifest of available sessions for demo use

## 6.3 Persistence Model

Primary persistence for v1 should be browser-local:

- `localStorage` is acceptable for recent local sessions and lightweight episode state
- an abstraction layer should still be used so persistence can later move to IndexedDB or a backend without rewriting the whole app

This suggests a simple storage module that owns:

- recent local session records in current browser
- active session record
- response history
- badge/progress history
- pacing and phase restoration data

## 6.3.1 Suggested Client Modules

To keep the app simple but maintainable, v1 should likely separate:

- **content loader**  
  Loads episode and assistive-package data from local or bundled sources.

- **content validation**  
  Validates loaded data with `Zod` before it enters the app.

- **session store**  
  Holds the active episode, progress state, pacing policy, current phase, current level, and in-session responses.

- **persistence layer**  
  Reads/writes browser-local state through a thin wrapper around `localStorage`.

- **activity engine**  
  Determines what activity state the user is in, which supports, prompts, or progress markers should be shown, and when a structural stopping point has been reached.

- **UI layer**  
  Renders episode views, warm-ups, challenge levels, scaffold views, and progress/badge feedback.

## 6.4 Runtime Model

Lens v1 should remain non-LLM at runtime.

That means:

- no live model calls
- no chatbot interface
- all instructional support shown in the app must come from precomputed artifacts

This is both a product constraint and a simplifying technical choice for v1.

## 6.5 UI Direction

The v1 interface should be:

- visually polished enough for demo use
- readable for middle-school students
- optimized for in-class use on laptops/tablets
- fast to enter
- clear in progress
- challenge-friendly rather than form-heavy

The UI should not feel like an admin tool, worksheet, or debugging shell.

### 6.5.0 Minimum Accessibility / Input Bar

For v1, the minimum accessibility and input-mode bar should be:

- readable type sizes appropriate for middle-school students
- keyboard-reachable primary interactions
- basic screen-reader-friendly structure for primary content and controls
- touch-friendly controls for tablet/classroom use

V1 does not need full accessibility maturity, but it should not assume mouse-only or desktop-only interaction.

## 6.5.1 Suggested App Structure

One reasonable v1 structure:

- `src/app/`
  App Router entry points, route segments, and SPA shell bootstrap

- `src/features/session/`
  Session start, active session state, local session resume

- `src/features/episode/`
  Episode reading UI, turn/passage focus UI

- `src/features/activity/`
  Warm-up flow, challenge level flow, scaffold display

- `src/features/progress/`
  Badges, progress markers, lightweight feedback

- `src/lib/content/`
  Episode/package loading and validation

- `src/lib/storage/`
  `localStorage` wrapper and persistence utilities

- `src/lib/types/`
  Shared TypeScript and Zod schema definitions used by the app

In the new app under `apps/lens/`, `src/app/` should own App Router route segments and app entry points, while `src/features/` should hold domain modules and reusable product logic. These are complementary layers, not competing structures.

## 6.6 Suggested Technical Priorities

For v1, technical priorities should be:

1. Clear student-facing flow
2. Strong episode-reading and turn-focus UI
3. Good local-state model for single-student progression
4. Flexible rendering of package-driven supports
5. Lightweight progression/gamification system
6. Visual quality suitable for demos and design iteration

## 6.7 Likely Evolution After v1

If Lens v1 succeeds, later versions may add:

- a standalone prepared outside perspective view once the runtime contract is stable
- visible student-facing lens vocabulary and stronger reasoning-language instruction
- support fading based on prior use and readiness
- longitudinal progression tracking across sessions
- richer transfer back into students' own PBL work
- teacher-facing views
- networked persistence
- multi-device collaboration
- classroom orchestration
- richer analytics
- more adaptive support logic

These should be treated as future expansion, not as hidden requirements for v1.

---

## 7. Known v1 Limitations / Pilot Watchpoints

V1 deliberately does not address the items below. They are recorded here so they can be observed during pilot rather than rediscovered as surprises.

- **Warm-up calibration**
  One episode may need one warm-up while another may need two. Watch whether students enter the first real level with enough footing.

- **Support overexposure**
  If worked examples appear too quickly, the app may feel like answer reveal rather than guided analysis. Watch how often students jump directly to deep support.

- **Level difficulty sequencing**
  If difficulty rises too sharply, students may disengage after the first easy levels. Watch completion rates level by level.

- **Badge inflation**
  If badges fire too often, they will lose meaning. Watch whether badge moments still feel earned.

- **Pause/resume granularity**
  V1 supports pause/resume at deterministic checkpoints, but it may still feel coarse if students stop mid-level. Watch whether finer-grained resume is actually needed.
