# Lens Technical Specs v1

This document defines a practical technical target for the first redesigned version of Lens.

It is intentionally narrower than the broader product and instructional-design vision. The goal of v1 is to build a convincing, usable foundation that supports demos, instructional exploration, and early student-facing analysis work without overcommitting to a larger architecture too early.

This document should be read alongside:

- `app-background.md`
- `instructional-design.md`
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

Lens v1 does not need to fully implement every instructional ambition in `instructional-design.md`. It should implement enough of the model to support:

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
- Support for multiple students sharing one browser on one device
- Local persistence of student names and lightweight in-browser history
- Use of precomputed episode assets and assistive-package content
- Individual and peer-facing interaction flows
- Lightweight progress and engagement mechanisms
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

## 2.4 Shared-Browser Assumption

A key v1 assumption is that multiple students may participate on the **same device in the same browser session**.

That makes v1 closer to a table-use tool than a personal account-based app.

The app should therefore support:

- entering or selecting student names locally
- maintaining lightweight local state for multiple students
- recording who contributed what within the shared browser session
- preserving enough history to continue a discussion flow during the activity

For v1, browser-local storage is an acceptable solution if it keeps the app simple and reliable.

## 2.5 Session Config

For v1, Lens should support loading a **session config** rather than only a raw episode reference.

A session config should minimally define:

- which episode/session content to load
- which students are in the group using the shared device

This allows Lens to:

- open directly into the intended episode
- know which students belong to the current group
- show the current active student clearly
- reduce setup friction for demos and classroom use

The app does not need real authentication for this. In v1, the important concept is not a logged-in user in the account sense, but the **active student** or **current responder** inside a shared-device session.

One reasonable v1 shape:

```json
{
  "config_id": "forest-ep01-table-a",
  "episode": {
    "source": "artifacts/strangers-in-the-old-forest/episodes/episode_01"
  },
  "group": {
    "name": "Table A",
    "students": [
      { "id": "s1", "name": "Ava" },
      { "id": "s2", "name": "Noah" },
      { "id": "s3", "name": "Mia" }
    ]
  },
  "ui": {
    "starting_student_id": "s1"
  }
}
```

The app should be able to derive or store locally:

- current active student
- per-student response history
- per-student progress during the session
- any later local revisions to the session state

### 2.5.1 v1 Decision

For v1, the session config should be treated as:

- the primary way to identify which episode/session to load
- an optional way to preload the student roster for the table

If the roster is included in the config, the app should allow light editing before the session begins. If the roster is not included, manual entry is the fallback.

For v1, the minimum required fields should be:

- `config_id`
- `episode.source`

Student roster is required before activity begins, but not required inside the config itself.

---

## 3. Features

Lens v1 should stay focused on a small set of core features that directly support the instructional goals and the classroom use case.

### 3.0 Core Feature Set for v1

The core v1 feature set should be:

1. **Shared-device session setup**  
   A group can quickly enter student names and start a local session on one browser.

2. **Episode reading and navigation**  
   Students can read an episode, revisit it, and focus on specific turns or passages.

3. **Low-floor individual participation**  
   Each student can make an initial response without needing advanced writing immediately.

4. **Guided interpretation and optional support**  
   Students can make an initial interpretation and then receive scaffolds, models, or deeper prompts when needed.

5. **Peer comparison and discussion support**  
   The group can compare individual responses and identify meaningful differences worth discussing.

6. **Prepared AI perspective**  
   Lens can show precomputed AI-authored support or perspective without behaving like a live tutor.

7. **Progress and engagement system**  
   Lens can show momentum, participation, and badges or recognitions that reinforce engagement.

8. **Browser-local persistence**  
   The app can preserve lightweight group/session history in one browser for continuity and demo use.

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

One package-reading detail remains intentionally open for v1: the exact field contract for the prepared outside perspective. The app is expected to render a prepared perspective from package-backed content, but that final mapping should be settled during implementation planning rather than assumed here.

## 3.2 Student Session Setup

The app should support a lightweight setup flow for a shared device:

- enter student names for the group
- create a local session for those students
- store the group locally in browser storage
- allow resuming recent local sessions if appropriate

This should be fast and low-friction. Setup should not feel like account creation.

## 3.3 Low-Floor Participation Moves

Lens v1 should support participation moves that do not require advanced writing immediately.

Examples:

- select a focal turn or moment worth discussing
- react to a prompt about a turn
- choose between a small number of plausible interpretations
- complete or extend a sentence frame
- record a short initial judgment

These moves should map to the lower parts of the current taxonomy and help students get into the activity without blank-page failure.

## 3.4 Guided Interpretation and Deepening

The assistive package currently supports a small number of meaningful activity types especially well. Lens v1 should align with that instead of inventing a large activity catalog.

Lens v1 should therefore be structured as **one guided experience** with a small number of clearly recognizable **core stages** plus smaller **embedded support moves** inside those stages.

The most natural v1 core stage flow is:

1. notice a focal turn or moment
2. make an initial interpretation
3. receive support if needed
4. compare with peers
5. deepen through discussion or explanation
6. optionally view a prepared outside perspective

This should not be interpreted as six rigid, separately branded activity modes. It is better understood as a guided backbone for the experience.

Within that backbone, Lens can offer embedded support moves such as:

- selecting a focal turn
- reacting to a prompt
- choosing between interpretations
- extending a sentence frame
- opening a modeled example
- receiving a redirect
- answering a deeper explanation prompt
- awarding a peer recognition

Some of these moves may be optional, conditional, or skippable depending on student readiness and how the group is progressing. The app should feel guided, but not mechanically rigid.

At minimum, Lens v1 should allow students to:

- make an individual response tied to a focal turn, passage, or prompt
- choose between plausible interpretations when appropriate
- receive deeper prompts after an initial response
- return to or revise their interpretation during the session

The goal is not to enforce long-form writing. The goal is to support a guided path from noticing toward interpretation, evaluation, and explanation.

### 3.4.1 v1 Decision: Minimum Backbone

For v1, the minimum required backbone should be:

1. read / focus on a focal turn
2. make an initial response
3. compare with peers
4. discuss face-to-face
5. revise or continue

Supports, deeper prompts, and prepared perspective should sit around this backbone as optional or conditional steps.

## 3.5 Peer Discussion Support

Lens v1 should support peer comparison and discussion without needing networked multi-device synchronization.

An important design assumption for v1 is that peer discussion happens **face-to-face at the table**, not through an in-app chat system. Students can ask each other questions, challenge one another, and discuss the episode verbally while sharing one device.

Possible v1 support:

- reveal side-by-side student responses on one device
- highlight differences in how students responded
- provide discussion prompts or turn-based cues
- make it easy for the group to recognize disagreement worth discussing

The app does not need to capture full live discussion transcripts in v1. Its job is to make face-to-face discussion easier to start and sustain.

## 3.6 Scaffolds and Hints

Lens v1 should support differentiated scaffolds derived from the assistive package.

At minimum, it should be able to surface:

- attention prompts
- sentence frames
- modeled examples
- transfer examples
- redirects when students are focused in the wrong place
- deeper prompts after an initial response

The exact timing rules can remain simple in v1, but the app should be structured so that different scaffold types can appear at different points in the activity sequence.

The reviewed assistive package suggests that v1 should especially support:

- recognition/noticing prompts
- sentence-frame-based articulation
- modeled and transfer examples
- explanation prompts tied to why reasoning may have happened
- discussion cues for peer comparison and deepening

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
  -> sentence-frame scaffold drawer

- `front_door_support.modeled_episode_examples`
  -> modeled-example support card

- `front_door_support.transfer_examples`
  -> transfer-example support card

- `diagnostic_support.probes`
  -> initial interpretation prompt / guided-choice prompt

- `diagnostic_support.interventions`
  -> conditional support panel after request or weak first move

- `discussion_support.discussion_cues`
  -> discussion cue panel for face-to-face group talk

- `discussion_support.talk_moves`
  -> lightweight discussion help / talk stems

- `discussion_support.consensus_checks`
  -> post-discussion reflection or confirmation prompt

- `diagnostic_support.struggle_calibration`
  -> deferred in v1 unless needed internally by the activity engine; not a direct UI surface in the first implementation

- `teacher_support`
  -> deferred in v1 because teacher-facing functionality is out of scope

Any assistive-package field not rendered in v1 should be treated as intentionally deferred rather than silently ignored.

### 3.6.1 v1 Decision: Support Timing

For v1, support timing should follow a simple hybrid rule set:

- **attention prompts** are available immediately
- **sentence frames, modeled examples, and transfer examples** are available on demand
- **deeper prompts** appear only after an initial response is saved
- **redirects** appear when a student explicitly asks for help, chooses an "I'm not sure" path, or opens the support panel after a weak first move
- **prepared perspective** appears only after initial response and peer comparison/discussion, and remains optional

This keeps the flow simple while still supporting different readiness levels.

## 3.7 AI/Prepared Perspective

Lens v1 should be able to display precomputed AI-authored perspective/support content from the package when appropriate.

This content should be framed as:

- prepared support
- prepared outside perspective

not as:

- the final authority
- a live AI tutor

### 3.7.1 v1 Decision: Perspective Timing

For v1, the prepared outside perspective should appear only after:

- a student has made an initial response
- peer comparison has occurred
- the group has had a chance to discuss or at least view a discussion cue

This keeps the prepared perspective in a comparative role rather than letting it replace student thinking.

## 3.8 Progress and Gamification

Lens v1 should include lightweight progress signals and meaningful gamification.

At minimum, it should support:

- visible progress through an episode activity
- app-awarded badges or markers for participation and movement
- peer-awarded badges or recognitions for helpfulness or strong discussion contributions

This system should reinforce engagement and growth, not reduce the experience to right-answer hunting.

### 3.8.1 v1 Decision: Recognition Rules

For v1, Lens should support two recognition types:

- **app-awarded badges**
- **peer-awarded recognitions**

App-awarded badges should be triggered automatically by actions such as:

- submitting a first response
- revising a response
- using a scaffold
- reaching comparison/discussion stages
- completing a deeper prompt

Peer-awarded recognitions should be limited and lightweight. Suggested categories:

- `Helpful`
- `Good Point`
- `Good Question`
- `Changed My Thinking`

For v1:

- peer recognitions should be visible to the group
- there should be no public leaderboard
- correctness should not be the main reward signal

## 3.8.2 Engagement Layer for Middle School Students

Because Lens must help sustain engagement on student devices, v1 should include a lightweight engagement layer designed for middle-school use.

This layer should not rely only on correctness or task completion. It should make the experience feel active, social, and rewarding through:

- **visible momentum**  
  Students can tell that they and their group are moving forward through the activity.

- **recognition**  
  Different kinds of participation can be noticed and rewarded, including noticing something important, helping a peer, revising a response, or making a strong discussion contribution.

- **social energy**  
  The app should make differences, discussion-worthy moments, and group progress visible enough that the activity feels shared rather than solitary.

- **lightweight delight**  
  Small reveal moments, progress changes, or badge/recognition feedback should make the experience feel lively without turning it into a game detached from the learning goals.

The v1 engagement layer should avoid:

- public correctness ranking
- speed-first reward systems
- heavy leaderboard mechanics
- anything that makes slower or less verbal students feel punished

## 3.9 Local Persistence

Lens v1 should persist the following in local browser storage:

- group/student names
- current episode/session context
- individual student responses
- lightweight progress state
- earned badges or recognitions, if implemented

Persistence should be treated as session continuity and demo support, not as durable institutional record-keeping.

---

## 4. User Stories

These user stories are written for the v1 scope: student-only, shared-device, browser-local, and episode-centered.

## 4.1 Session Setup

- As a small group of students sharing one device, we want to enter our names quickly so that we can start the activity without friction.
- As a returning group on the same browser, we want Lens to remember enough local history that we can resume without re-entering everything from scratch.
- As a group, we want the app to open directly into our assigned session when a session config is provided so that startup is fast and clear.

## 4.2 Episode Reading

- As a student, I want to read the episode clearly so that I can understand what is happening in the discussion.
- As a student, I want to revisit specific turns or moments so that I can point to something concrete when responding.
- As a student, I want the episode view to feel readable and not overwhelming so that I stay engaged.

## 4.3 Low-Floor Participation

- As a student who is not ready to write a full explanation, I want to make a valid first move anyway so that I can participate without getting stuck.
- As a student, I want to select a turn, react to a prompt, or build on a sentence frame so that I can begin thinking before writing something more complete.
- As a student, I want my initial response to feel low-risk so that I am willing to try.

## 4.4 Guided Interpretation and Deepening

- As a student, I want to give my own initial reading before seeing others' responses so that I can think for myself first.
- As a student, I want my response to be saved locally under my name so that I can return to it or revise it later in the session.
- As a student, I want optional support after my first move so that I can deepen my thinking without getting shut down.
- As a student, I want deeper prompts that help me move from basic interpretation toward stronger evaluation or explanation when I am ready.
- As a student, I want to revise my response after support or discussion so that I can show how my thinking changed.

## 4.5 Peer Comparison and Discussion

- As a group, we want to compare our responses on one device so that we can quickly see where we agree or disagree.
- As a student, I want Lens to make differences between responses visible so that discussion has somewhere to begin.
- As a student, I want prompts or cues that help us discuss the episode face-to-face instead of getting stuck in silence.

## 4.6 Scaffolds and Supports

- As a student who cannot get started, I want a scaffold that helps me notice something meaningful without just giving me the answer.
- As a student with a weak or partial first idea, I want support that helps me deepen it.
- As a student focused on the wrong thing, I want a redirect that helps me attend to a more relevant moment.
- As a student working at a higher level, I want deeper prompts that push me beyond a basic response.

## 4.7 Prepared AI Perspective

- As a student, I want to see a prepared outside perspective when it is useful so that I can compare my thinking with another reading.
- As a student, I want the prepared perspective to appear after I have had a chance to think first so that it supports comparison rather than replacing my own reading.
- As a student, I do not want the AI perspective to feel like the final authority that ends discussion.

## 4.8 Progress and Recognition

- As a student, I want to feel that I am making progress through the activity so that I stay engaged.
- As a student, I want badges or recognitions that reflect participation, growth, or helpful discussion moves so that the activity feels rewarding.
- As a student, I want recognitions to feel meaningful rather than random or purely competitive.
- As a student, I want to see when my progress or badges change so that the activity feels responsive to what I do.
- As a student, I want the app to feel lively and rewarding rather than flat so that I want to keep participating.
- As a student, I want different kinds of smart participation to count, not just getting something "right."

## 4.8.1 Social Energy and Excitement

- As a student, I want to see when my group notices different things so that discussion feels interesting.
- As a student, I want the activity to feel like something we are doing together, not just taking turns filling things out.
- As a student, I want small moments of surprise, recognition, or unlock-like progress so that the experience feels exciting.

## 4.9 Shared-Browser Use

- As a group using one device, we want Lens to keep track of who said what so that individual participation does not disappear into a single shared response.
- As a group, we want the shared-browser experience to feel natural rather than like a workaround for a single-user tool.
- As a student, I want it to be clear when it is my turn to respond so that the shared device does not become confusing.
- As a group, we want to hand off the active student smoothly so that turn-taking feels easy.

---

## 5. Journey-to-Implementation Mapping

This section translates the core user journeys into concrete UI surfaces, state transitions, and stored data for v1.

## 5.1 Journey A: First-Time Group Starting a Session

### Screens / Views

- **Start screen**
  Option to begin a session, optionally resume a recent local session.

- **Group setup screen**
  Enter or select student names for the current group.

- **Episode landing screen**
  Show episode title, short setup text, and clear entry into the discussion.

- **Episode reading view**
  Show the episode in a readable whole-discussion format with focal turns or moments visibly marked.

- **First-response view**
  Prompt each student to make an initial low-floor move on a focal turn or moment.

- **Comparison view**
  Reveal side-by-side student responses once each student has completed the required initial move.

### State Transitions

1. `app_opened`
2. `session_start_requested`
3. `group_created_locally`
4. `episode_loaded`
5. `episode_viewed`
6. `initial_prompt_opened`
7. `student_response_saved` repeated per student
8. `all_required_initial_responses_complete`
9. `comparison_view_opened`

### Stored Data

- local session ID
- episode/session config reference
- student roster for current group
- active focal turn or prompt
- per-student initial responses
- completion flags for required first-response step

## 5.2 Journey B: Student Requests Support Early

### Screens / Views

- **Focal turn / prompt view**
  Show the selected turn or moment and the first response prompt.

- **Scaffold drawer / support panel**
  Surface attention prompts, sentence frames, modeled examples, transfer examples, or redirects without leaving the main flow.

- **Response revision view**
  Let the student revise or extend their response after receiving support.

### State Transitions

1. `initial_prompt_opened`
2. `support_requested`
3. `scaffold_opened`
4. `support_type_viewed`
5. `student_response_saved`
6. optional `deeper_prompt_opened`
7. optional `student_response_revised`

### Stored Data

- per-student scaffold usage
- support type used
- prompt/turn associated with the support
- original and latest response state
- whether a deeper prompt was shown

## 5.3 Journey C: Group Reaches Disagreement

### Screens / Views

- **Comparison view**
  Show student responses side by side and make meaningful differences visible.

- **Discussion cue panel**
  Surface one or more prompts that help the group discuss the disagreement face-to-face.

- **Deepening prompt view**
  Offer optional explanation or reasoning-deepening prompts after discussion begins.

- **Prepared perspective view**
  Optionally show the prepared outside perspective after students have already had a chance to think and discuss.

- **Revision / confirmation view**
  Let students update or confirm their interpretations after discussion.

- **Progress / recognition feedback**
  Show updated progress state or recognitions when the interaction warrants it.

### State Transitions

1. `comparison_view_opened`
2. `difference_detected_or_highlighted`
3. `discussion_cue_opened`
4. optional `peer_recognition_awarded`
5. optional `deepening_prompt_opened`
6. optional `prepared_perspective_opened`
7. `student_response_revised` or `student_response_confirmed`
8. optional `progress_updated`

### Stored Data

- comparison-state data derived from student responses
- which discussion cue was shown
- optional peer recognitions awarded
- whether a deeper prompt was used
- whether prepared perspective was viewed
- revised response state per student
- progress/badge updates caused by the interaction

## 5.4 Cross-Journey Notes

For v1, these journeys should all operate within a **single local browser session**. No shared backend or cross-browser synchronization is assumed.

This means:

- one device/browser can support one table group well
- multiple browsers can each run their own separate local session
- cross-device classroom synchronization is not part of v1

The shared-browser model should therefore be treated as the primary operational mode for the first implementation.

For v1, the shared-device interaction model should assume:

- one **active student** at a time
- only the active student can submit or edit at that moment
- the active student can be switched with a simple handoff action
- prior student responses remain visible for comparison and revision

## 5.5 Journey D: Student Switch / Turn-Taking on Shared Device

### Screens / Views

- **Active student indicator**
  Clearly show which student is currently responding.

- **Turn handoff control**
  Allow the group to switch from one student to another without confusion.

- **Shared comparison view**
  Preserve visibility of what each student has already done while making it clear who is active now.

### State Transitions

1. `active_student_set`
2. `student_response_saved`
3. `handoff_requested`
4. `active_student_changed`
5. optional `student_response_opened_for_revision`

### Stored Data

- active student ID
- per-student completion state
- per-student latest response state
- handoff history if needed for local continuity

## 5.6 Journey E: Resume / Continue a Local Session

### Screens / Views

- **Resume screen**
  Show recent local sessions available in the browser.

- **Session summary view**
  Show which episode, which students, and how far the group has progressed.

- **Restored working view**
  Return the group to the relevant episode, prompt, comparison state, or progress point.

### State Transitions

1. `app_opened`
2. `recent_local_sessions_found`
3. `resume_selected`
4. `local_session_loaded`
5. `working_state_restored`

### Stored Data

- saved local session metadata
- episode/session config reference
- student roster
- per-student responses
- progress state
- scaffold usage history if relevant
- badge/recognition history if implemented

---

## 6. Technical Stack

## 6.1 App Architecture

Lens v1 should be implemented as a **simple SPA**.

Recommended v1 frontend stack:

- **React**
- **TypeScript**
- **Next.js** using the existing `lens-app/` codebase as the starting point
- **Tailwind CSS**
- **Zustand** for lightweight client state
- **Zod** for runtime validation of loaded content

Optional:

- **React Router** if the app benefits from a small number of explicit routes
- **Framer Motion** if used sparingly for presentation polish

The emphasis should be:

- fast iteration
- clean local state management
- attractive presentation
- easy demoability

The architecture should stay simple enough that instructional and UX experimentation is easy.

For v1, this does **not** imply using server-side persistence, Prisma-backed data storage, or account-based flows, even though `lens-app/` currently contains Next.js and Prisma infrastructure. The recommended path is to adapt the existing Next.js app shell for a client-heavy, browser-local v1 and leave Prisma/server persistence unused for this version.

Prisma artifacts that already exist in `lens-app/` should be treated as dormant in v1. V1 code should not import `@prisma/client` or depend on server-side persistence.

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

- `localStorage` is acceptable for names, history, recent local sessions, and lightweight session state
- an abstraction layer should still be used so persistence can later move to IndexedDB or a backend without rewriting the whole app

This suggests a simple storage module that owns:

- recent local session records in current browser
- active session record
- response history
- badge/progress history

## 6.3.1 Suggested Client Modules

To keep the app simple but maintainable, v1 should likely separate:

- **content loader**  
  Loads episode and assistive-package data from local or bundled sources.

- **content validation**  
  Validates loaded data with `Zod` before it enters the app.

- **session store**  
  Holds the current group, current student, active episode, progress state, and in-session responses.

- **persistence layer**  
  Reads/writes browser-local state through a thin wrapper around `localStorage`.

- **activity engine**  
  Determines what activity state the user is in and which supports, prompts, or progress markers should be shown.

- **UI layer**  
  Renders episode views, participation moves, discussion views, scaffold views, and progress/badge feedback.

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
- optimized for shared, in-class use on laptops/tablets
- fast to enter
- clear in progress
- discussion-friendly rather than form-heavy

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
  SPA shell, app bootstrap, top-level routing if used

- `src/features/session/`
  Student/group setup, active session state, local session resume

- `src/features/episode/`
  Episode reading UI, turn/passage focus UI

- `src/features/activity/`
  Individual response flow, peer comparison flow, scaffold display

- `src/features/progress/`
  Badges, progress markers, lightweight feedback

- `src/lib/content/`
  Episode/package loading and validation

- `src/lib/storage/`
  `localStorage` wrapper and persistence utilities

- `src/lib/types/`
  Shared TypeScript and Zod schema definitions used by the app

In the existing Next.js shell, `src/app/` should continue to own route segments and app entry points, while `src/features/` should hold domain modules and reusable product logic. These are complementary layers, not competing structures.

## 6.6 Suggested Technical Priorities

For v1, technical priorities should be:

1. Clear student-facing flow
2. Strong episode-reading and turn-focus UI
3. Good local-state model for multiple students in one browser
4. Flexible rendering of package-driven supports
5. Lightweight progression/gamification system
6. Visual quality suitable for demos and design iteration

## 6.7 Likely Evolution After v1

If Lens v1 succeeds, later versions may add:

- teacher-facing views
- networked persistence
- multi-device collaboration
- classroom orchestration
- richer analytics
- more adaptive support logic

These should be treated as future expansion, not as hidden requirements for v1.
