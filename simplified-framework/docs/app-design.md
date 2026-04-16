# Dedicated App Design

This document defines the product and interaction design for the dedicated app for the simplified framework.

It translates the framework model and technical spec into a concrete student experience for the current scope.

## Table Of Contents

1. [Design Boundary](#1-design-boundary)
2. [Working Method](#2-working-method)
3. [Primary Student Journey](#3-primary-student-journey)
4. [User Journey Format](#4-user-journey-format)
5. [Core User Journeys](#5-core-user-journeys)
6. [Visual Design Language For Milestone 1](#6-visual-design-language-for-milestone-1)
7. [Key UX Decisions For V1](#7-key-ux-decisions-for-v1)
8. [V1 Engagement And Reward Strategy](#8-v1-engagement-and-reward-strategy)
9. [Milestone-Based Implementation Plan](#9-milestone-based-implementation-plan)
10. [Milestone 1 And Milestone 2 Implementation Briefs](#10-milestone-1-and-milestone-2-implementation-briefs)
11. [Technical Architecture For V1](#11-technical-architecture-for-v1)
12. [Review Protocol For Future Implementation](#12-review-protocol-for-future-implementation)
13. [Source Of Truth For Implementation](#13-source-of-truth-for-implementation)

## 1. Design Boundary

The app should implement, not redefine:

- the framework model in `framework-model.md`
- the system contract in `technical-spec.md`

This document is intentionally focused on the current scope:

- one episode at a time
- one main flaw per episode
- deterministic rendering from `episode-plan.yaml`, `transcript.yaml`, and `lesson_package.yaml`
- clear student-facing reading, warm-up, level, feedback, and completion flow

Critical runtime boundary:

- the app does not invoke an LLM in real time
- the app consumes upstream-generated artifacts from the artifact-generation pipeline
- if a proposed feature assumes live LLM calls at runtime, that feature is out of scope and should be removed or redesigned

This document does not yet try to fully solve:

- small-group verbal orchestration inside the product
- teacher facilitation tools
- project-based learning transfer features
- upstream time estimation logic in the content package

Those remain future design work. The near-term priority is to finish an app that does the current scope well.

## 2. Working Method

The app should be designed and implemented incrementally.

The purpose of this method is to prevent a common failure mode:

- implementation races ahead
- unresolved UX decisions get buried in code
- the user first sees the full product too late
- later revisions require backing up into basic structure decisions

The right milestone is not one small screen at a time. It is one coherent product increment where both of these move forward together:

- technical capability
- visible UI/UX shape

The required working method is:

1. define the student journey and screen responsibilities before implementation of a feature area
2. implement one milestone at a time
3. stop at each critical milestone for user review and approval
4. revise that milestone if needed before moving to the next one
5. avoid too many tiny checkpoints that create overhead
6. avoid oversized deliveries that hide unresolved design decisions

For implementation work, "done" for a milestone means:

- the UI for that milestone is visible and usable
- the feature boundary is clear
- the milestone introduces one meaningful new user-facing capability
- the milestone resolves the main UX questions tied to that capability
- the open UX questions for that milestone have been answered or surfaced
- the user has explicitly approved moving forward

Do not assume later milestones will fix confusion introduced in earlier ones.

## 3. Primary Student Journey

For the current scope, the app should present a simple, linear session flow:

1. enter the episode
2. read the episode transcript
3. complete one modeled warm-up
4. complete one guided warm-up
5. complete 3 to 5 challenge levels
6. reach a completion screen with the final takeaway

The experience should feel:

- explicit
- finishable
- calm
- readable
- instructional rather than game-noisy

The app should be usable by one student at a device, while remaining compatible with students talking to one another around that device. The current product does not need to script group discussion in detail, but it also should not fight against it.

## 4. User Journey Format

User journeys are the primary design unit for implementation.

A good user journey must do both:

- describe what the system must technically support
- describe what the student should actually see and experience

Each journey in this document should specify:

- entry condition
- system behavior
- visible UI
- student action
- transition rule
- saved state
- optional peer-awareness behavior

Implementation should use these journeys as the basis for:

- UI structure
- server actions or API behavior
- database writes
- milestone approval reviews

## 5. Core User Journeys

### 5.1 Journey: Student Selects Identity And Enters The Episode

Purpose:

- let the student begin work with the least friction possible
- ensure the app knows which student, group, and episode this run belongs to

Entry condition:

- the app has loaded the active config
- the config includes one episode and one or more groups with student rosters

System behavior:

- load the available groups from config
- after group selection, load the students for that group
- after student selection, create or resume that student's run for the configured episode
- fetch any coarse peer-progress summary for the student's group

Visible UI:

- a simple group-selection step
- a simple student-name selection step
- no password field in v1
- a clear continue action after selection

Student experience:

- the student should feel like they are choosing their place in the activity, not creating an account
- the entry flow should be quick and low-stakes

Student action:

- select group
- select name
- continue into the session

Transition rule:

- after the student identity is resolved and the run is created or resumed, the app enters the episode-entry view

Saved state:

- create or resume `session_runs`
- associate `student_id`, `group_id`, `config_id`, and `episode_source`
- update `updated_at`

Peer-awareness behavior:

- the app may prepare a lightweight group-progress summary, but it does not need to foreground it yet on the login step

### 5.2 Journey: Student Enters The Episode And Reads The Transcript

Purpose:

- orient the student to the story situation
- establish the source conversation before analysis begins
- give the student a brief preview of the episode before full reading starts

Entry condition:

- the student has an active run in the read phase

System behavior:

- load episode title and `student_intro` from `lesson_package.yaml`
- load `episode_goal` from `episode-plan.yaml`
- load `setting_note` from `transcript.yaml` when available
- load transcript turns from `transcript.yaml`
- render all turns in order

Visible UI:

- episode title
- short learning-oriented intro
- concise episode-goal framing from `episode_goal`
- brief episode preview context from `setting_note` when available
- transcript displayed as ordered turns
- clear speaker labels
- readable turn text
- a clear primary action to move forward after reading

Student experience:

- the student should understand what the episode is about
- the transcript should feel like a real conversation, not raw data
- the reading surface should feel calm and readable

Student action:

- read the transcript
- choose to continue into warm-ups

Transition rule:

- when the student marks reading complete, the run moves from `read` to `warmup`

Saved state:

- update `session_runs.current_phase`
- set `reading_complete = true`
- update `updated_at`

Peer-awareness behavior:

- if peer progress is shown on this screen, it should be secondary and coarse

### 5.3 Journey: Student Completes The Modeled Warm-Up

Purpose:

- teach the target flaw explicitly before the student is asked to answer independently

Entry condition:

- the run is in the warm-up phase
- modeled warm-up is not yet complete

System behavior:

- load the modeled warm-up object from `lesson_package.yaml`
- load the targeted turn and nearby context from the transcript
- present explanation content directly, without waiting for an answer

Visible UI:

- warm-up title
- targeted turn with context
- prompt
- best-answer explanation
- worked explanation
- takeaway
- clear continue action

Student experience:

- this should feel like instruction, not a quiz
- the student should be shown exactly what to notice and why it matters

Student action:

- read the warm-up explanation
- continue to the guided warm-up

Transition rule:

- when the student continues, mark modeled warm-up complete
- if guided warm-up remains incomplete, stay in `warmup`

Saved state:

- update `warmup_progress.modeled_complete`
- update `session_runs.updated_at`

### 5.4 Journey: Student Completes The Guided Warm-Up

Purpose:

- give the student one supported attempt before the challenge levels

Entry condition:

- modeled warm-up is complete
- guided warm-up is not yet complete

System behavior:

- load guided warm-up prompt and answer options
- load the targeted turn and nearby context
- allow the student to choose an answer
- reveal explanation after answer submission

Visible UI:

- guided warm-up title
- targeted turn with context
- prompt
- answer options
- optional hint affordance
- revealed explanation and takeaway after submission
- clear continue action

Student experience:

- the student should feel supported and coached
- the question should feel answerable from what they just learned

Student action:

- choose an answer
- optionally request hint help
- submit
- continue into levels

Transition rule:

- after submission and explanation reveal, the student can continue
- once guided warm-up is complete, the run moves to `level`

Saved state:

- update `warmup_progress.guided_complete`
- optionally record hint usage
- update `session_runs.current_phase`
- update `updated_at`

### 5.5 Journey: Student Needs Help And Requests A Scaffold

Purpose:

- support the student when they are unsure without taking over the whole task

Entry condition:

- the student is on a guided warm-up or challenge level
- the current interaction supports hint or scaffold access

System behavior:

- reveal scaffold content on demand rather than by default
- attach the scaffold to the current question state
- record scaffold usage for the current run and level

Visible UI:

- a clear but secondary help affordance such as `Need a hint?`
- scaffold content near the question area, not embedded into the transcript body
- scaffold content that is brief, targeted, and clearly framed as help

Student experience:

- asking for help should feel normal and safe
- the scaffold should narrow attention without simply giving away the answer too early

Student action:

- request help
- read the scaffold
- return to the question

Transition rule:

- the student remains in the current warm-up or level after the scaffold is shown
- scaffold use does not auto-advance the student

Saved state:

- if the scaffold belongs to the guided warm-up, update `warmup_progress.guided_used_hint`
- if the scaffold belongs to a later challenge level, write scaffold usage for the current `run_id`
- associate later level scaffold usage to the active `level_id`
- update `updated_at`

Peer-awareness behavior:

- scaffold use should not be visible to peers in v1

### 5.6 Journey: Student Answers A Challenge Level Without Help

Purpose:

- let the student independently recognize the same flaw in a new turn

Entry condition:

- the run is in the `level` phase
- there is a current level to answer

System behavior:

- load current level prompt, options, hint affordance, and feedback content
- load the targeted turn and nearby context
- after submission, show feedback and determine the next level or completion state

Visible UI:

- level title
- targeted turn with context
- prompt
- answer options
- optional hint affordance
- feedback after submission
- continue action
- simple progress indicator

Student experience:

- the level should feel focused and finishable
- the app should make it obvious what the active turn is and what decision is being asked for

Student action:

- select an answer
- submit
- read feedback
- continue

Transition rule:

- after submission, the response is recorded
- if more levels remain, advance to the next level
- if no levels remain, advance to completion

Saved state:

- write a `level_responses` row
- update `session_runs.current_level_id`
- update `session_runs.updated_at`
- mark completion when the final level is done

### 5.7 Journey: Student Answers A Challenge Level After Using Help

Purpose:

- support a student through difficulty while preserving the level structure

Entry condition:

- the student is on a challenge level
- the student has requested at least one scaffold step

System behavior:

- persist scaffold usage
- allow answer submission after help
- store whether the answer changed after help if the UI supports answer revision

Visible UI:

- same core level layout as the no-help journey
- scaffold area remains visually secondary
- feedback remains the same style after submission

Student experience:

- the student should not feel punished for using help
- the level should still feel coherent after a scaffold is revealed

Student action:

- request help
- review scaffold
- answer or revise answer
- submit
- continue

Transition rule:

- use the same advancement rule as any other level
- scaffold access changes saved data, not the visible structure of the phase

Saved state:

- write scaffold usage
- write the final level response
- optionally store whether help was used and whether the answer changed

### 5.8 Journey: Student Reaches Completion

Purpose:

- close the session clearly and reinforce the final takeaway

Entry condition:

- all levels are complete

System behavior:

- mark the run complete
- load the final takeaway from `lesson_package.yaml`
- optionally load a lightweight group-progress summary

Visible UI:

- clear completion state
- final takeaway
- simple next-step options such as replay or return

Student experience:

- the student should feel done
- the takeaway should feel like the clean closing idea from the episode

Student action:

- read the final takeaway
- choose what to do next

Transition rule:

- the run remains complete unless the student explicitly starts again

Saved state:

- set `session_runs.status` to complete
- set `completed_at`
- update `updated_at`

Peer-awareness behavior:

- this is a reasonable place to show coarse group progress such as who is still reading, in warm-ups, in levels, or complete

## 6. Visual Design Language For Milestone 1

This section is the visual contract for the first implementation milestone.

It defines the visual rules that Milestone 1 should satisfy before approval. It is specific about hierarchy, layout, and component behavior, but it does not freeze final polish details such as exact spacing tokens or final hex values.

### 6.1 Overall Direction

Milestone 1 should follow a reading-first direction closest to:

- Reading Room as the primary tone
- Field Notes as a secondary source of atmosphere

The screen should feel:

- calm
- warm rather than clinical
- readable
- instructional rather than game-like

The app should not feel like:

- a chat app
- a mission dashboard
- a gamified quiz portal
- a noisy productivity tool

### 6.2 Visual Priorities

The dominant visual object on the screen should be the transcript.

The visual hierarchy for Milestone 1 should be:

1. episode title and intro
2. transcript reading surface
3. primary action
4. secondary information such as peer progress if present

If a visual choice competes with transcript readability, transcript readability wins.

### 6.3 Layout Contract

Milestone 1 should use a one-column reading-first layout.

Layout rules:

- one main content column should hold the episode entry content and transcript
- the main column should stay visually centered and readable on desktop
- on mobile, the same content should collapse naturally into a single vertical flow
- avoid split-screen or two-equal-column layouts in Milestone 1

Secondary information, if shown at all, should remain visually subordinate.

### 6.4 Episode Entry Contract

The entry view should be lightweight and directly connected to reading.

Required visual elements:

- episode title
- short student intro
- one clear primary action such as `Start Reading`

Visual rules:

- keep the entry view compact
- do not overload it with metadata
- do not show more than one dominant action
- the student should feel invited into reading, not stalled in setup

### 6.5 Transcript Surface Contract

The transcript should appear on a shared reading surface, not as a series of loud independent cards.

Recommended treatment:

- one restrained reading container or closely related stacked turn blocks
- subtle separation between turns
- generous line height and comfortable text width
- clear speaker-to-text association

Disallowed direction for Milestone 1:

- colorful chat bubbles
- messenger-style left-right dialogue layout
- exaggerated turn cards that compete for attention

### 6.6 Transcript Turn Anatomy

Each transcript turn should use one consistent structure.

Each turn should contain:

- speaker label
- turn text
- subtle turn separation from adjacent turns

Turn numbers may exist internally, but they should not be visually prominent for students in Milestone 1.

The turn component designed here should be reusable later for:

- passive reading state
- active targeted-turn state
- near-context state around a targeted turn

### 6.7 Speaker Label Contract

Speaker names should be clearly visible, but not loud.

Speaker label rules:

- the name should be easy to scan quickly
- the name should anchor the turn visually
- the name should not overpower the turn text
- the treatment should feel like a discussion transcript, not social messaging

Avatars are not required in Milestone 1.

### 6.8 Typography Contract

Typography should support reading before decoration.

Typography rules:

- the transcript body should be the most optimized text style on the page
- the episode title should be clearly larger than all other text
- the intro should read as supportive framing, not as transcript body copy
- speaker labels should be visually distinct from transcript body text
- button labels and progress labels should stay concise

Implementation note:

- exact font choice can remain provisional
- the typography hierarchy cannot remain provisional

### 6.9 Color And Surface Contract

Color should support calm orientation and readable contrast.

Color rules:

- use a warm or neutral-light background direction
- use restrained accent color for actions and active-state treatment
- do not rely on highly saturated colors for basic structure
- transcript text and speaker labels must maintain strong readability contrast

Surface rules:

- surfaces should feel layered enough to organize content
- surfaces should not feel like a dashboard of competing boxes

Implementation note:

- exact hex values can be finalized later
- role-based color use should be fixed now

### 6.10 Action Hierarchy Contract

Milestone 1 should show one dominant primary action at a time.

Action rules:

- the primary action must be visually unambiguous
- secondary actions must look secondary
- avoid multiple equal-weight buttons on the same screen
- the continue path should always be obvious

For Milestone 1, this primarily means:

- `Start Reading` on the entry state
- `Continue` after reading

### 6.11 Progress And Status Contract

Progress should be present but quiet.

Progress rules:

- show a simple phase indicator or small session-progress cue
- do not introduce a large dashboard-style progress module
- do not front-load badges, points, or celebration language

The student should feel guided through a lesson, not managed by a system.

### 6.12 Peer Progress Contract

Peer progress is optional in Milestone 1.

If omitted:

- that is acceptable for the first implementation pass

If included:

- it must be visually subdued
- it must show only coarse statuses
- it must not compete with the transcript reading area
- it must not feel like a live leaderboard

Recommended default:

- hide peer progress in the initial Milestone 1 pass unless it is needed to validate layout early

### 6.13 Milestone 1 Approval Checklist

Milestone 1 visual implementation should be reviewed against these questions:

1. Is the transcript clearly the dominant object on screen?
2. Does the screen avoid a chat-bubble or dashboard aesthetic?
3. Is the reading flow calm and easy to scan?
4. Is there only one dominant action at each state?
5. Are speaker labels clear without becoming visually noisy?
6. If peer progress is shown, is it clearly secondary?

If the answer to any of these is no, Milestone 1 is not ready for approval.

## 7. Key UX Decisions For V1

The current app design needs to answer these questions explicitly.

### 7.1 Transcript Presentation

Questions:

- Do students read the whole transcript before any interaction, or partially read and then analyze?
- How much neighboring context should be shown when a warm-up or level targets one turn?
- Should the targeted turn be visually highlighted, pinned, or isolated?

Default v1 direction:

- read the full episode first
- implement episode entry and transcript reading as separate screens
- show the targeted turn with some neighboring context during analysis
- visually distinguish the active turn without hiding the conversation entirely

### 7.2 Scaffold Placement

Questions:

- Where do hints appear?
- Are scaffolds collapsed by default or always visible?
- Are scaffolds attached to the turn, the question area, or both?

Default v1 direction:

- keep scaffolds secondary
- place them near the question area, not inside the transcript body
- reveal them only when requested or when the lesson format explicitly calls for explanation

### 7.3 Progress And Pacing

Questions:

- How visible should progress be?
- Should the student see the total number of levels up front?
- How much transition friction should exist between steps?

Default v1 direction:

- show simple progress
- keep transitions light
- avoid dashboard-like complexity
- if peer progress is shown in Milestone 1, keep it visible but subdued

### 7.4 Feedback Tone

Questions:

- How emphatic should correctness feedback be?
- How much text is too much?

Default v1 direction:

- feedback should be brief, specific, and calm
- the explanation should do more work than celebration

## 8. V1 Engagement And Reward Strategy

V1 should include gamification, but it should be restrained instructional gamification rather than a dominant game layer.

The purpose of the engagement layer is to:

- reinforce progress
- make effort feel recognized
- encourage persistence through the lesson flow
- support motivation without distracting from reading and reasoning

The engagement layer should not:

- overpower the transcript and teaching flow
- turn the app into a competitive leaderboard
- reward speed over thoughtfulness
- punish students for using scaffolds

### 8.1 Reward Design Principles

V1 rewards should be:

- calm rather than loud
- supportive rather than competitive
- tied to meaningful learning behaviors
- visually secondary to the lesson itself

Rewards should feel like acknowledgement, not like the main event.

### 8.2 Reward Types For V1

The preferred reward types for v1 are:

- badges
- quiet progress markers
- completion states
- small moments of acknowledgement after meaningful milestones

V1 should not depend on:

- points economies
- streak mechanics
- timed challenges
- public ranking
- noisy celebration animations

### 8.3 Behaviors Worth Rewarding

The app may reward these behaviors:

- finishing episode reading
- completing the modeled warm-up
- completing the guided warm-up
- completing a challenge level
- completing the episode
- revising an answer after reflection
- using help and still finishing

That last behavior is important. V1 should not teach students that using support is failure.

V1 default reward-event set:

- finished reading
- finished warm-up phase
- completed a level
- completed the episode
- used help and kept going
- changed an answer after reflection

Implementation note:

- the app may still track finer-grained internal events
- the visible v1 reward set should stay anchored to the six events above unless the design doc is revised

### 8.4 Behaviors That Should Not Be Rewarded

V1 should not reward:

- answering quickly
- never asking for help
- outperforming peers
- accumulating the most badges in a group

These incentives would distort the learning goal.

### 8.5 Badge Strategy

Badges are the clearest v1 reward unit.

Badge design rules:

- badge names should be short and readable
- badges should reflect meaningful progress or habits
- badges should not require hidden analytics or live model judgment
- badge logic must be deterministic from saved runtime data

Example badge categories:

- `Read The Episode`
- `Finished Warm-Up`
- `Level Complete`
- `Used Help And Kept Going`
- `Changed My Mind`
- `Episode Complete`

Final badge naming can be refined later, but the reward logic should stay simple.

V1 decision:

- the six badge/event categories above are the default visible reward set
- this set is frozen for v1 unless the design doc is explicitly revised

### 8.6 Visual Treatment Of Rewards

Rewards should fit the calm visual contract.

Visual rules:

- badges should appear as small acknowledgements, not dominant hero elements
- reward states should not interrupt reading flow unnecessarily
- completion feedback may be slightly more celebratory than intermediate states, but still restrained
- reward surfaces should use the same overall visual language as the lesson

V1 display decision:

- students may receive small in-session acknowledgement when a reward-worthy event happens
- students should also see earned badges or accomplishments on the completion screen
- intermediate reward moments should remain very quiet to moderate in visual strength, never dominant

Milestone 1 note:

- Milestone 1 does not need to fully implement the reward layer
- however, the UI should avoid a visual direction that would later conflict with calm badge and progress elements

### 8.7 Peer Relationship To Rewards

Rewards should primarily be personal progress markers in v1.

V1 should not expose:

- peer badge counts
- public comparison tables
- competitive rank ordering

If peer progress is visible, it should remain coarse and status-based rather than reward-based.

V1 decision:

- peer progress must not include reward information

### 8.8 Technical Requirements For Rewards

The reward system must remain deterministic and runtime-safe.

That means:

- rewards must be computed from saved runtime state
- rewards must not require real-time LLM calls
- rewards must not depend on subjective free-text evaluation in v1
- reward triggers should map cleanly onto persisted events such as phase completion, scaffold usage, and response revision

Likely data sources:

- `session_runs`
- `warmup_progress`
- `level_responses`
- `scaffold_events`

V1 deterministic trigger mapping should support at least:

- reading completion
- warm-up completion
- level completion
- episode completion
- scaffold use followed by continued progress
- answer revision after reflection where the interaction supports revision

### 8.9 Initial V1 Reward Scope

The recommended initial scope is:

- support badge earning in saved runtime state
- show lightweight acknowledgement when a badge-worthy event happens
- show earned badges or accomplishments on the completion screen

V1 decision:

- this recommended initial scope is accepted as the current reward scope
- persistent badge dashboards during the session are out of scope

This is enough for v1.

It is not necessary in v1 to build:

- a badge gallery
- reward history dashboards
- cross-episode progression systems

### 8.10 Guidance For Future Implementation

When implementation reaches the reward layer, it should answer these questions explicitly:

1. Which events create badges?
2. When does the student see the acknowledgement?
3. Where are earned badges visible during a session?
4. Where are earned badges visible after completion?
5. How does reward UI stay secondary to the lesson itself?

If the reward system starts to dominate the screen, it has gone too far.

Frozen reward decisions for v1:

1. reward moments should appear both during the session and on the completion screen
2. the default visible reward-event set is:
   - finished reading
   - finished warm-up phase
   - completed a level
   - completed the episode
   - used help and kept going
   - changed an answer after reflection
3. level completion may create a small acknowledgement, but not a large badge moment every time
4. `Used Help And Kept Going` should be explicitly rewarded
5. `Changed My Mind` should be explicitly rewarded when revision is supported
6. there should not be a persistent badge panel during the session
7. reward moments should stay very quiet to moderate in visual strength
8. peer progress must not include reward information

## 9. Milestone-Based Implementation Plan

Implementation should proceed in approval-gated milestones.

Detailing strategy:

- fully specify the current implementation target
- keep later milestones defined at a medium level until they become the next active target
- do not write full implementation briefs for all later milestones too early

Rationale:

- the first detailed milestone establishes the visual language, runtime behavior, and persistence foundation
- later milestones should be detailed after earlier milestones are approved, so the plan reflects validated decisions rather than premature guesses
- this document should avoid false precision in areas that depend on earlier implementation review

Current status:

- `Milestone 1` is now treated as frozen at the documentation level
- future revisions should not reopen its core scope or interaction structure unless a real contradiction or implementation blocker is found
- later milestone work should build on the frozen `Milestone 1` contract rather than quietly redefining it
- `Milestone 2` is now the active documentation target and should be specified concretely enough for implementation

### Milestone 0: Flow Agreement

Goal:

- align on the session flow and screen responsibilities before major UI work

Deliverable:

- this design document
- if needed, low-fidelity sketches or layout notes

Approval gate:

- confirm the overall journey
- confirm milestone order
- confirm unresolved questions to settle first

### Milestone 1: Episode Reading Experience

Goal:

- implement the first coherent student-facing experience
- include entering the episode
- include understanding what the lesson is about
- include reading the transcript
- include moving into the next phase

Must resolve:

- what the episode entry screen contains
- how turns are displayed
- how speakers are labeled
- what action moves the student from reading to warm-ups

Approval gate:

- user approves transcript readability, episode framing, and overall structure before warm-up work begins

### Milestone 2: Warm-Up Experience

Goal:

- implement the full warm-up phase as one coherent instructional increment
- include the modeled warm-up
- include the guided warm-up
- include the transition into challenge practice

Must resolve:

- where the target turn appears
- how explanation content is structured
- answer-option layout
- hint placement
- reveal pattern for explanation after answering
- where continue actions live across both warm-ups
- whether the two warm-up screens feel like one coherent teaching sequence

Approval gate:

- user approves the warm-up teaching pattern before challenge levels begin

### Milestone 3: Challenge-Level Experience

Goal:

- implement the full challenge phase as the main repeatable interaction pattern of the product

Must resolve:

- how the active turn is framed
- where scaffolds live
- when feedback appears
- how the student advances from one level to the next
- how progress is shown across the level sequence

Approval gate:

- user approves the level pattern before it is treated as the reusable default

### Milestone 4: Completion And Session Wrap

Goal:

- implement the ending state

Must resolve:

- completion layout
- takeaway presentation
- what the student can do next

Approval gate:

- user approves the session close before polish and cleanup

### Milestone 5: End-To-End Refinement

Goal:

- refine the full end-to-end flow after the core product increments are approved

Scope:

- improve clarity, visual consistency, transitions, and small interaction details
- fix friction revealed only after the full session can be run end to end

This milestone should not reopen core structural questions unless a prior milestone proved fundamentally wrong.

## 10. Milestone 1 And Milestone 2 Implementation Briefs

This section is the implementation contract for the first approved build increment.

Milestone 1 covers:

- student identity selection
- episode entry
- transcript reading
- transition into the warm-up phase

Milestone 1 does not cover:

- modeled warm-up UI
- guided warm-up UI
- challenge levels
- completion screen
- teacher tools
- detailed peer-progress UI

### 10.1 Product Goal

By the end of Milestone 1, a student should be able to:

1. open the app
2. select their group
3. select their name
4. enter the assigned episode
5. read the transcript in a calm, readable interface
6. press `Continue` to move into the warm-up phase

The implementation is successful if this flow works end to end with durable persistence and the UI satisfies the Milestone 1 visual contract.

### 10.2 Required UI States

Milestone 1 should implement exactly these user-visible states:

1. group selection
2. student selection
3. episode entry
4. transcript reading
5. transition action into warm-ups

Recommended routing model:

- one entry route for the active config
- internal state or route segments may control the current milestone state
- routing details may vary, but the student-facing flow must remain linear

### 10.3 State A: Group Selection

Purpose:

- identify the student's group with the least friction possible

Visible UI must include:

- page or panel title
- list of groups from the active config
- one clear way to select a group

Required data:

- `config_id`
- `groups[].group_id`
- `groups[].name`

System behavior:

- load active config
- render configured groups
- immediate-select is the default behavior for group choice
- once a group is selected, move directly to student selection without an extra confirmation step

Persistence behavior:

- no database write is required yet

Out of scope:

- password entry
- group creation or editing

### 10.4 State B: Student Selection

Purpose:

- identify the specific student within the selected group

Visible UI must include:

- selected group label
- list of student names for that group
- one clear way to select a student
- a back action to return to group selection

Required data:

- selected `group_id`
- `students[].student_id`
- `students[].name`

System behavior:

- filter students by selected group
- immediate-select is the default behavior for student choice
- after student selection, create or resume the student's run for the configured episode
- after the run is resolved, move directly to the episode-entry screen without an extra confirmation step

Persistence behavior:

- create or resume `session_runs`
- associate `config_id`, `episode_source`, `group_id`, `student_id`
- initialize `current_phase = read` if creating a new run
- update `updated_at`

Out of scope:

- student self-registration
- roster editing

### 10.5 State C: Episode Entry

Purpose:

- orient the student to the episode before reading begins
- give the student a brief preview of the episode before full transcript reading

Screen relationship:

- episode entry and transcript reading are separate screens in Milestone 1
- the episode entry screen frames the lesson briefly before the student reaches the full transcript

Visible UI must include:

- episode title
- `student_intro`
- `episode_goal`
- `setting_note` when available
- one primary action: `Start Reading`

Visible UI should not include:

- multiple competing actions
- large metadata blocks
- warm-up content

Required data:

- `lesson_package.episode.title`
- `lesson_package.episode.student_intro`
- `episode_plan.episode_goal`
- optional `transcript.setting_note`
- active student identity for optional header context

System behavior:

- load lesson package data for the selected episode
- load concise episode framing from `episode_goal`
- load transcript preview context from `setting_note` when present
- render episode framing content

Persistence behavior:

- no phase change yet
- `updated_at` may be refreshed if needed, but this state does not require a substantive progress write

Current preview rule:

- `episode_goal` is the current source for concise lesson-facing episode framing
- `setting_note` is the current source for scene-preview context
- if `setting_note` is absent, the entry screen should still work with title, `student_intro`, and `episode_goal`
- if `episode_goal` is absent, the episode plan is not app-ready for the dedicated runtime contract
- richer preview content may be added later through upstream pipeline changes, but Milestone 1 should not wait for that work beyond these inputs

### 10.6 State D: Transcript Reading

Purpose:

- let the student read the full transcript before analysis begins

Visible UI must include:

- transcript turns in order
- clear speaker labels
- readable text layout
- one primary action: `Continue`

Visible UI may include:

- a quiet phase indicator
- a subdued header showing student or group context
- a subdued peer-progress summary for the student's group

Visible UI should not include:

- warm-up questions
- answer options
- scaffold panels
- dominant peer-progress UI
- leaderboard-like peer comparison

Required data:

- `transcript.title`
- `transcript.turns[].turn_id`
- `transcript.turns[].speaker`
- `transcript.turns[].text`
- coarse peer-progress summary if peer progress is shown

System behavior:

- load transcript content from `transcript.yaml`
- render all turns in sequence
- maintain a deterministic reading state for the active run
- if peer progress is shown, load only coarse group statuses such as reading, warm-up, level, or complete

Persistence behavior:

- while the student is reading, the run remains in `current_phase = read`
- no per-turn read tracking is required in Milestone 1

### 10.7 State E: Continue To Warm-Ups

Purpose:

- move the student from reading into the next learning phase

Trigger:

- student presses `Continue` after reading

System behavior:

- mark reading complete
- move run phase from `read` to `warmup`
- persist the updated run state

Persistence behavior:

- set `reading_complete = true`
- set `current_phase = warmup`
- update `updated_at`

Postcondition:

- the session is now ready for Milestone 2 work
- Milestone 1 does not need to render the warm-up itself, but it must leave the run in the correct saved state

### 10.8 Data Contract For Milestone 1

Milestone 1 implementation requires these data sources:

- active session config
- active episode `episode-plan.yaml`
- active episode `lesson_package.yaml`
- active episode `transcript.yaml`
- persisted `session_runs`

Milestone 1 does not require:

- `warmup_progress`
- `level_responses`
- scaffold event reads

### 10.9 Server Responsibilities For Milestone 1

The server layer should support:

- loading the active config
- returning groups and students for the config
- creating or resuming a run for `config_id + group_id + student_id + episode_source`
- loading episode-plan metadata for the episode-entry state
- loading lesson package metadata for the episode-entry state
- loading transcript content for the reading state
- saving the transition from `read` to `warmup`

Milestone 1 config rule:

- v1 is single-tenant with one active config per deployment/runtime instance
- the active config is authored as a file and read directly from disk at runtime
- Milestone 1 should not seed or mirror roster/config data into database tables

Recommended minimal server actions or route handlers:

- `getActiveConfig()`
- `getRoster(configId)`
- `createOrResumeRun(configId, groupId, studentId)`
- `getEpisodeEntry(runId)`
- `getTranscript(runId)`
- `markReadingComplete(runId)`

Names may vary in implementation, but the responsibilities should remain the same.

Run identity rule:

- a run is unique over `(config_id, group_id, student_id, episode_source)`
- resume should reopen any matching run whose `status != complete`

### 10.10 Client Responsibilities For Milestone 1

The client layer should support:

- local selection state for group and student before run creation
- rendering the episode entry view
- rendering the transcript reading view
- triggering the continue transition into the warm-up phase

The client should not treat browser localStorage as the primary source of truth for run persistence.

### 10.11 Acceptance Criteria

Milestone 1 is ready for approval when all of the following are true:

- a student can complete the full flow from group selection to transcript reading without dead ends
- the selected student run is created or resumed correctly
- the episode entry screen uses the approved visual contract
- the transcript reading screen uses the approved visual contract
- group and student selection use immediate-select behavior without unnecessary confirmation steps
- episode entry and transcript reading are implemented as separate screens
- peer progress, if shown, is visible but clearly secondary to transcript reading
- pressing `Continue` updates persisted state from `read` to `warmup`
- reloading the app does not lose the student's run state
- the same student's in-progress run can be resumed on another device
- the UI does not introduce chat-bubble styling, split-screen reading layout, or noisy dashboard elements

### 10.12 Explicit Non-Goals

Milestone 1 should not attempt to solve:

- warm-up interaction design
- scaffold interaction design beyond reserving room for later extension
- challenge-level interaction design
- correctness feedback
- live peer-progress updates
- teacher-facing workflow

### 10.13 Handoff To Milestone 2

When Milestone 1 is approved, Milestone 2 should be able to assume:

- student identity selection works
- run creation and resume works
- episode entry content is implemented
- transcript rendering is implemented
- the run can reliably enter `current_phase = warmup`

Milestone 2 should build on these pieces rather than replacing them.

### 10.14 Milestone 2 Scope

This section is the implementation contract for the next approved build increment.

Milestone 2 covers:

- modeled warm-up UI
- guided warm-up UI
- durable warm-up progress persistence
- transition from warm-ups into the first challenge level

Milestone 2 does not cover:

- the full challenge-level interaction sequence
- completion screen
- teacher tools
- live peer-progress updates
- advanced scaffold analytics

### 10.15 Product Goal

By the end of Milestone 2, a student should be able to:

1. arrive at the warm-up phase after reading
2. complete one modeled warm-up that explicitly teaches the main flaw
3. complete one guided warm-up with answer selection and explanation reveal
4. continue into the first challenge level with durable saved state

The implementation is successful if this flow works end to end with durable persistence and the warm-up screens feel like one coherent instructional sequence.

### 10.16 Required UI States

Milestone 2 should implement exactly these user-visible states:

1. modeled warm-up
2. guided warm-up question
3. guided warm-up explanation reveal
4. transition into the first challenge level

Recommended routing model:

- one warm-up route may render all warm-up states
- internal state may be derived from persisted `warmup_progress`
- routing details may vary, but the student-facing sequence must remain deterministic
- warm-up screens may retain a quiet phase indicator consistent with §6.11
- Milestone 2 does not need peer-progress UI on warm-up screens and should not depend on live peer data there

### 10.17 State A: Modeled Warm-Up

Purpose:

- teach the target flaw explicitly before the student answers independently

Visible UI must include:

- warm-up title
- targeted turn with nearby transcript context
- prompt
- best-answer explanation
- worked explanation
- takeaway
- one primary action: `Continue`

Visible UI should not include:

- answer-option selection
- correctness scoring language
- challenge-level progress UI
- peer-progress summaries in the initial Milestone 2 pass

Required data:

- `lesson_package.warmups.modeled.warmup_id`
- `lesson_package.warmups.modeled.turn_id`
- `lesson_package.warmups.modeled.title`
- `lesson_package.warmups.modeled.focus_move`
- `lesson_package.warmups.modeled.prompt`
- `lesson_package.warmups.modeled.best_answer_text`
- `lesson_package.warmups.modeled.worked_explanation`
- `lesson_package.warmups.modeled.takeaway`
- transcript context around `turn_id`

System behavior:

- load the modeled warm-up object from `lesson_package.yaml`
- reopen this state when `session_runs.current_phase = warmup` and `modeled_complete = false`
- load the targeted turn plus one adjacent turn before and after when available from `transcript.yaml`
- present explanation content directly without waiting for an answer
- treat `focus_move` as planning metadata unless the implementation chooses to surface it explicitly

Persistence behavior:

- when the student presses `Continue`, set `warmup_progress.modeled_complete = true`
- keep `session_runs.current_phase = warmup`
- update `updated_at`

### 10.18 State B: Guided Warm-Up Question

Purpose:

- give the student one supported attempt before the challenge levels begin

Visible UI must include:

- guided warm-up title
- targeted turn with nearby transcript context
- prompt
- answer options
- one primary action to submit an answer

Visible UI may include:

- a secondary hint affordance when `lesson_package.warmups.guided.hint` is present

Visible UI should not include:

- the explanation block before submission
- challenge feedback for later levels
- multiple competing primary actions

Required data:

- `lesson_package.warmups.guided.warmup_id`
- `lesson_package.warmups.guided.turn_id`
- `lesson_package.warmups.guided.title`
- `lesson_package.warmups.guided.focus_move`
- `lesson_package.warmups.guided.prompt`
- `lesson_package.warmups.guided.answer_options`
- `lesson_package.warmups.guided.best_answer_id`
- optional `lesson_package.warmups.guided.hint`
- transcript context around `turn_id`

System behavior:

- load the guided warm-up object after modeled warm-up completion
- allow one answer selection and submission
- after submission, the selected answer becomes read-only for the first pass
- reveal explanation content only after submission
- if hint UI is present, it must remain clearly secondary to the answer task
- load the targeted turn plus one adjacent turn before and after when available from `transcript.yaml`
- treat `focus_move` as planning metadata unless the implementation chooses to surface it explicitly

Persistence behavior:

- on submission, persist enough state to reopen the reveal state after reload
- set `warmup_progress.guided_submitted = true`
- set `warmup_progress.guided_selected_answer_id` to the submitted `answer_options[].option_id`
- if a hint was opened, set `warmup_progress.guided_used_hint = true`
- keep `warmup_progress.guided_complete = false` until the student continues
- keep `session_runs.current_phase = warmup`
- update `updated_at`

### 10.19 State C: Guided Warm-Up Explanation Reveal

Purpose:

- show the student the teaching explanation after their supported attempt

Visible UI must include:

- guided warm-up title
- the selected answer in read-only form
- best-answer explanation
- worked explanation
- takeaway
- one primary action: `Continue`

Visible UI may include:

- targeted turn with nearby transcript context
- subdued answer-option review showing which option the student chose

Visible UI should not include:

- a second answer submission step
- challenge-level progress UI
- runtime-generated per-option feedback or corrective scoring labels

Required data:

- submitted guided warm-up state from `warmup_progress`
- `lesson_package.warmups.guided.answer_options`
- `lesson_package.warmups.guided.best_answer_id`
- `lesson_package.warmups.guided.best_answer_text`
- `lesson_package.warmups.guided.worked_explanation`
- `lesson_package.warmups.guided.takeaway`

System behavior:

- reopen this state when `guided_submitted = true` and `guided_complete = false`
- reconstruct the selected answer from `guided_selected_answer_id` and `answer_options`
- keep the explanation deterministic from the lesson package rather than generating runtime feedback
- keep the tone calm and selection-agnostic; the reveal does not need a separate correct/incorrect banner in Milestone 2

Persistence behavior:

- no additional answer write is required while the student is reading the explanation
- `updated_at` may be refreshed if needed, but the state should already be recoverable from saved data

### 10.20 State D: Continue To Levels

Purpose:

- leave the warm-up phase and enter the first challenge level cleanly

Trigger:

- student presses `Continue` after the guided explanation has been revealed

System behavior:

- mark the guided warm-up complete
- move the run from `warmup` to `level`
- initialize `current_level_id` to the `level_id` whose `sequence_index` is lowest
- persist the updated run state

Persistence behavior:

- set `warmup_progress.guided_complete = true`
- set `session_runs.current_phase = level`
- set `session_runs.current_level_id` to the `level_id` whose `sequence_index` is lowest
- update `updated_at`

Postcondition:

- the session is now ready for Milestone 3 work
- Milestone 2 does not need to implement the full level experience, but it must leave the run in the correct saved state

### 10.21 Data Contract For Milestone 2

Milestone 2 implementation requires these data sources:

- active episode `lesson_package.yaml`
- active episode `transcript.yaml`
- persisted `session_runs`
- persisted `warmup_progress`

Warm-up contract note:

- both warm-up objects still carry package-contract fields such as `focus_move`
- Milestone 2 does not need to render `focus_move` directly if the authored prompt and explanation already embody it

Milestone 2 does not require:

- full `level_responses`
- completion-state rewards
- live peer-presence updates

Required persisted warm-up fields:

- `warmup_progress.modeled_complete`
- `warmup_progress.guided_submitted`
- `warmup_progress.guided_selected_answer_id`, which stores the submitted guided `option_id`
- `warmup_progress.guided_used_hint`
- `warmup_progress.guided_complete`

### 10.22 Server Responsibilities For Milestone 2

The server layer should support:

- loading the modeled warm-up payload for the active run
- loading the guided warm-up payload for the active run
- creating `warmup_progress` on the first warm-up load or write if it does not yet exist
- saving modeled warm-up completion
- saving guided warm-up submission state
- saving whether the guided hint was used
- saving the transition from `warmup` to `level`
- initializing the first `current_level_id`

Recommended minimal server actions or route handlers:

- `getWarmup(runId)`
- `completeModeledWarmup(runId)`
- `submitGuidedWarmup(runId, answerId)`
- `continueFromGuidedWarmup(runId)`

Names may vary in implementation, but the responsibilities should remain the same.

### 10.23 Client Responsibilities For Milestone 2

The client layer should support:

- rendering the modeled warm-up state
- rendering the guided question state
- rendering the guided explanation-reveal state
- locking the guided answer after submission in the first pass
- triggering the continue transition into the first level

The client should not treat transient component state as the primary source of truth for warm-up progress.

### 10.24 Acceptance Criteria

Milestone 2 is ready for approval when all of the following are true:

- a student arriving at `current_phase = warmup` sees the modeled warm-up rather than a placeholder
- the modeled warm-up teaches from the targeted turn and nearby context in a calm, instructional format
- pressing `Continue` after the modeled warm-up persists progress and moves the student into the guided warm-up
- the guided warm-up allows answer selection and submission with a clear primary action
- explanation content is revealed only after guided submission
- reloading after guided submission reopens the explanation-reveal state instead of losing progress
- pressing `Continue` after the guided reveal persists `guided_complete` and moves the run to `current_phase = level`
- the first `current_level_id` is initialized deterministically
- the two warm-up screens feel like one coherent teaching sequence rather than two unrelated mini-pages
- the guided reveal can reconstruct and display the student's submitted answer after reload

### 10.25 Explicit Non-Goals

Milestone 2 should not attempt to solve:

- the full repeatable challenge-level pattern
- multi-step scaffold workflows
- teacher-facing warm-up review tools
- reward and badge presentation
- live peer-progress updates during warm-ups

Failure and empty-state note:

- Milestone 2 is primarily specified for the happy path
- missing warm-up content or malformed package fields may be deferred using the same rule described in §11.16 unless implementation reveals a blocker

### 10.26 Handoff To Milestone 3

When Milestone 2 is approved, Milestone 3 should be able to assume:

- `warmup_progress` exists and is durable
- modeled and guided warm-up flows are implemented
- the guided reveal state survives reload
- the run can reliably enter `current_phase = level`
- `current_level_id` is initialized to the first level deterministically

Milestone 3 should build on these pieces rather than replacing them.

## 11. Technical Architecture For V1

This section defines the intended technical shape of the first app version closely enough that a new implementation agent can begin building without guessing the core architecture.

### 11.1 V1 Stack Decision

The v1 stack decision is:

- Next.js
- React
- TypeScript
- SQLite
- Prisma as the database layer

Rationale:

- the current app scaffold is already in Next.js and TypeScript
- a one-language app stack reduces coordination overhead for implementation agents
- Milestone 1 is dominated by deterministic runtime flow, persistence, and UI work rather than Python-specific backend logic
- the main backend needs in v1 are content loading, create-or-resume run logic, and durable session persistence
- for the current scope, this stack is the safer choice for getting things right in the first few implementation attempts and for correcting mistakes quickly

V1 should therefore not split the runtime into a separate Python backend.

If a future version genuinely needs Python-specific backend services, those can be introduced later as a deliberate architectural change rather than as an early default.

### 11.2 Implementation Base Decision

The implementation base for v1 should be the existing `simplified-framework/app/` Next.js app.

However, it should be treated as:

- the starting workspace for implementation
- a refactor target where necessary
- not the source of truth for framework or product behavior

This means:

- reuse the current app directory and framework setup
- replace legacy assumptions that conflict with the canonical simplified-framework contract
- do not preserve outdated runtime structures just because they already exist

### 11.3 Server Pattern Decision

The preferred server pattern for v1 is:

- Next.js App Router
- server-side loading for config and content reads
- server actions for core mutations such as create-or-resume run and phase transitions
- route handlers only when an explicit JSON endpoint is materially cleaner, such as peer-progress polling if it is later needed

Default preference:

- do not introduce a separate backend service for v1
- do not introduce RPC/framework layering unless the current scope clearly requires it

### 11.4 Database Layer Decision

The preferred database layer for v1 is Prisma on top of SQLite.

Rationale:

- Prisma is a common and well-supported choice for Next.js plus SQLite
- it gives a clear schema and migration story for a relatively small app data model
- it is usually easier for implementation agents to evolve safely during early refactors than hand-rolled SQL wiring

If later performance or query-shape needs push the app elsewhere, that can be revisited, but Prisma is the v1 default.

### 11.5 Runtime Model

The v1 app should support one student using the app at a time on a device.

The app is not trying to implement full multi-user collaboration in real time. It should support:

- one active student session on screen
- saved progress for that student
- enough shared data to show coarse progress from other students in the same group
- resuming the same student's run on another device

The app runtime should also remain deterministic with respect to lesson content:

- no real-time LLM generation
- no runtime prompt construction for lesson logic
- no dependency on model availability in order to play a session

The app should not yet implement:

- password-based accounts
- free-form messaging between students
- detailed answer-sharing between peers
- live collaborative editing

Operational assumptions for v1:

- internet access is required during use
- the runtime should rely on database-backed state rather than device-local-only state
- the same student's run may be resumed on another device, so persistence must be server-readable and not tied to one browser session
- there is no privacy gate in v1 beyond the simple student-selection flow

### 11.6 Runtime LLM Boundary

The v1 app must not call an LLM during student use.

Lesson content should already be prepared by the upstream artifact-generation pipeline before the student opens the app.

Runtime lesson behavior should come from:

- `episode-plan.yaml`
- `transcript.yaml`
- `lesson_package.yaml`
- session config
- persisted database state

This rule applies to:

- prompts
- answer choices
- hints
- feedback
- progression logic
- completion content

If a feature proposal depends on real-time model inference, it should not be added to v1. It must either:

- be moved upstream into artifact generation, or
- be redesigned into deterministic runtime logic

### 11.7 Authentication And Entry Flow

The login flow should be as simple as possible for a classroom-controlled setting.

Default v1 approach:

1. student opens the app
2. student selects a group
3. student selects their own name from that group's roster
4. app creates or resumes that student's run for the configured episode
5. app enters the episode experience

V1 should not require passwords.

If the classroom later needs a small safeguard, a short student PIN can be added, but that is not a v1 requirement.

### 11.8 Static Config Versus Runtime Data

The app should clearly separate setup data from student-work data.

Config files should define:

- which episode is available
- which student groups exist
- which students belong to each group
- optional session-level UI settings if needed

The database should store:

- which student started work
- which group and episode that work belongs to
- progress through the flow
- answers and hint usage
- completion state
- timestamps
- coarse peer-visible status

This boundary matters:

- config is easy to author and revise
- runtime data is durable and queryable
- the app can be reset or reconfigured without rewriting student history

V1 config-storage rule:

- config remains file-authored in v1
- group and student roster data remain in the active config file in v1
- runtime progress and student work live in the database
- the app should not require config-to-database seeding for Milestone 1

### 11.9 Config Shape

The current prototype already has a config concept. For v1, the config should explicitly support one episode plus multiple groups.

Active-config rule:

- v1 assumes exactly one active config per deployment/runtime instance
- the runtime should load that config directly from disk
- switching between multiple configs is not required in v1

Minimum required fields:

- `config_id`
- `episode.source`
- `groups[]`

Each group entry should include:

- `group_id`
- `name`
- `students[]`

Each student entry should include:

- `student_id`
- `name`

Recommended example shape:

```json
{
  "config_id": "episode-01-a",
  "episode": {
    "source": "simplified-framework/artifacts/strangers-in-the-old-forest/episode_01"
  },
  "groups": [
    {
      "group_id": "group-1",
      "name": "Group 1",
      "students": [
        { "student_id": "ava", "name": "Ava" },
        { "student_id": "liam", "name": "Liam" }
      ]
    },
    {
      "group_id": "group-2",
      "name": "Group 2",
      "students": [
        { "student_id": "zoe", "name": "Zoe" }
      ]
    }
  ]
}
```

Implementation note:

- the current prototype schema only models one optional `group`
- v1 implementation should replace that with `groups[]`

`episode.source` resolution rule:

- `episode.source` is a repo-relative directory path
- the runtime should resolve lesson files as:
  - `{episode.source}/episode-plan.yaml`
  - `{episode.source}/transcript.yaml`
  - `{episode.source}/lesson_package.yaml`

### 11.10 Content Inputs

The dedicated app should read canonical simplified-framework artifacts, not legacy package formats.

V1 content inputs should be:

- `episode-plan.yaml`
- `transcript.yaml`
- `lesson_package.yaml`
- the selected session config

Implementation note:

- the current prototype still reads legacy `assistive_package.yaml` assumptions in places
- v1 implementation should migrate the runtime to the canonical simplified package contract defined in `technical-spec.md`

The app should not require any additional LLM-produced runtime payload beyond these canonical artifacts.

### 11.11 Persistence Layer

The v1 app should persist runtime state in SQLite.

Recommended use:

- SQLite for local development
- SQLite for small self-hosted or single-machine classroom use

Constraint:

- do not assume serverless hosting that discards local filesystem state
- do not assume device-local persistence is sufficient, because the same student may resume on another device

If deployment later changes, the persistence adapter can change, but SQLite is the intended starting point.

### 11.12 Database Responsibilities

The database should support these operations:

- create or resume a student's episode run
- save phase progress
- save warm-up progress
- save level responses
- save hint or scaffold usage
- mark completion
- read coarse progress for peers in the same group
- allow the same student's in-progress run to be resumed from another device

The database is the source of truth for student work history.

Browser local storage should not be the primary persistence layer in v1.

Implementation note:

- the current prototype stores session state in localStorage
- v1 should replace that with database-backed persistence

### 11.13 Recommended Database Schema

The schema should stay minimal.

Recommended tables:

- `session_runs`
  - `run_id`
  - `config_id`
  - `episode_source`
  - `group_id`
  - `student_id`
  - `status`
  - `current_phase`
  - `current_level_id`
  - `reading_complete`
  - `started_at`
  - `updated_at`
  - `completed_at`
- `warmup_progress`
  - `run_id`
  - `modeled_complete`
  - `guided_submitted`
  - `guided_selected_answer_id`
  - `guided_used_hint`
  - `guided_complete`
  - `updated_at`
- `level_responses`
  - `id`
  - `run_id`
  - `level_id`
  - `turn_id`
  - `initial_answer`
  - `final_answer`
  - `used_hint`
  - `support_steps_viewed`
  - `answer_changed`
  - `completed_at`
- `scaffold_events`
  - `id`
  - `run_id`
  - `level_id`
  - `step_key`
  - `created_at`

Notes:

- `run_id` should represent one student's work on one configured episode instance
- `session_runs.status` should use:
  - `in_progress`
  - `complete`
- `session_runs.current_phase` should use:
  - `read`
  - `warmup`
  - `level`
  - `complete`
- a newly created run should initialize with:
  - `status = in_progress`
  - `current_phase = read`
- if a student resumes work, the app should reopen the existing in-progress run when appropriate
- `session_runs` should enforce uniqueness over `(config_id, group_id, student_id, episode_source, status)` only insofar as there should be at most one `in_progress` run for a given tuple
- `warmup_progress` should be one-to-one with `session_runs`
- `warmup_progress.run_id` should be the primary key and foreign key to `session_runs.run_id`
- `guided_submitted` should mean the student has already answered the guided warm-up and should reopen the reveal state
- `guided_selected_answer_id` should store the submitted guided option so the reveal state can survive reload
- `guided_used_hint` should record whether the guided hint was opened in the first warm-up pass
- `support_steps_viewed` can be stored either as JSON text on `level_responses` or normalized into `scaffold_events`

### 11.14 Session Lifecycle

The session lifecycle should be deterministic.

When a student selects their name:

1. load the selected config
2. resolve the active episode from config
3. look for an in-progress run for that student, group, and episode
4. if found, resume it
5. if not found, create a new run starting at the episode-entry/read phase

Resume rule:

- the canonical run state lives in the database
- resuming on another device should reopen the same in-progress run rather than create a parallel browser-local copy

During runtime:

1. entering or leaving a phase updates `session_runs`
2. completing the modeled warm-up updates `warmup_progress`
3. submitting the guided warm-up updates `warmup_progress`
4. continuing out of the guided reveal updates both `warmup_progress` and `session_runs`
5. submitting a level answer writes a `level_responses` row and updates `session_runs`
6. requesting scaffolds writes scaffold usage
7. finishing the final level marks the run complete

Concurrency rule:

- if the same student opens the same in-progress run on multiple devices, v1 may use last-write-wins behavior
- v1 does not need locking or conflict-resolution beyond durable server-side persistence

### 11.15 Peer Progress Visibility

The app may show what other students in the same group are doing, but only at a coarse level in v1.

Recommended visible statuses:

- not started
- reading
- warm-up
- level 1
- level 2
- level 3
- level 4
- level 5
- complete

V1 should not show:

- other students' full answers
- answer correctness details
- hint history details
- private reflection text

The purpose of peer visibility in v1 is orientation, not comparison pressure and not answer leakage.

### 11.16 Suggested Server Responsibilities

For a Next.js implementation, server-side responsibilities should include:

- reading config and content artifacts from disk
- exposing the roster for the active config
- creating or resuming runs
- saving session progress
- returning peer-progress summaries for the student's group

Client-side responsibilities should include:

- rendering the active phase
- handling local interaction state before save
- submitting progress updates to the server
- rendering peer-progress summaries when requested by the UI

Failure and empty-state note:

- Milestone 1 is primarily specified for the happy path
- explicit failure-state design for missing config, invalid `episode.source`, or empty rosters may be deferred unless implementation reveals a blocker

### 11.17 V1 Non-Goals

To keep scope controlled, v1 should not attempt:

- full account management
- password reset flows
- teacher dashboards
- fine-grained analytics reporting
- cross-episode recommendation logic
- real-time sockets unless they become necessary later
- real-time LLM calls for lesson generation, hints, or feedback
- privacy-gate or permission systems beyond the current simple classroom login flow

The goal is a stable single-student runtime with durable persistence and light group awareness.

### 11.18 Implementation Guidance For A New Agent

If a new agent begins implementation from this document, it should treat these as the first technical tasks:

1. update the config schema from one optional group to `groups[]`
2. align the app loader with canonical `episode-plan.yaml`, `transcript.yaml`, and `lesson_package.yaml`
3. add Prisma plus SQLite-backed persistence
4. replace localStorage session persistence with database-backed run persistence
5. build the simple group-selection and student-selection entry flow
6. wire session resume behavior
7. expose coarse peer-progress summaries for the selected group

It should also preserve this runtime rule throughout implementation:

- no feature may require live LLM inference for the student session to function

Those tasks should be carried out while still following the milestone-approval process in this document.

## 12. Review Protocol For Future Implementation

For each milestone, implementation review should answer:

1. What exactly does the student see first?
2. What action can the student take?
3. What information is visible versus hidden?
4. Where is the active turn?
5. Where are the scaffolds?
6. What happens after the student answers?
7. What still feels ambiguous?

Each milestone handoff should include:

- a short statement of what was implemented
- the design decisions that were made
- the design decisions still open
- the exact questions requiring approval

The next milestone should not start until those questions are resolved.

## 13. Source Of Truth For Implementation

When implementation begins, this document should be treated as the source of truth for:

- the order of student-facing phases
- the purpose of each screen
- the milestone and approval process
- the v1 technical architecture boundary

If implementation reveals a mismatch, update this document first or alongside the code change. Do not let the codebase silently become the design source of truth.
