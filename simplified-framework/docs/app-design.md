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
10. [Milestone Implementation Briefs](#10-milestone-implementation-briefs)
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

> **Revised in §14.1 (2026-04-16).** The visible reward set was narrowed to a single category (`correct_answer`), with a completion-time doubling bonus driven by a new lifelines mechanic. The six categories above remain valid as *tracked* events in persisted state but are no longer surfaced to the student. See §14 for the current contract.

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
- `Milestone 2`, `Milestone 3`, and `Milestone 4` now have approved implementation contracts and should be treated as frozen except for explicit follow-up revisions
- later milestone work should build on the frozen earlier contracts rather than quietly redefining them
- `Milestone 5` is now the next active documentation target and should be specified concretely enough for implementation

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
- the detailed implementation contract for this milestone is defined in §10.27–10.38

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
- the detailed implementation contract for this milestone is defined in §10.41–10.53

Must resolve:

- completion layout
- takeaway presentation
- what the student can do next

Approval gate:

- user approves the session close before polish and cleanup

### Milestone 5: Bounded Level Retry

Goal:

- add one bounded retry opportunity on eligible challenge levels after a wrong first answer
- the detailed implementation contract for this milestone is defined in §10.54–10.66

Must resolve:

- which activity types permit retry
- what feedback appears after a wrong first answer
- what persists between the first and second submissions
- when a level becomes locked and advances again
- how `Changed My Mind` becomes visible on the completion surface

Approval gate:

- user approves bounded retry as the default interaction for eligible challenge levels before broader polish work begins

### Milestone 6: End-To-End Refinement

Goal:

- refine the full end-to-end flow after the core product increments are approved

Scope:

- improve clarity, visual consistency, transitions, and small interaction details
- fix friction revealed only after the full session can be run end to end

This milestone should not reopen core structural questions unless a prior milestone proved fundamentally wrong.

## 10. Milestone Implementation Briefs

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

### 10.27 Milestone 3 Scope

This section is the implementation contract for the next approved build increment.

Milestone 3 covers:

- active level-question UI for each authored `levels[]` entry
- deterministic hint access for levels when `hint` is present
- deterministic feedback reveal after answer submission
- durable level-response persistence
- reload and resume behavior during level work
- deterministic advancement from one level to the next
- transition from the final level into the saved completion state

Milestone 3 does not cover:

- the final completion screen presentation
- multi-step scaffold sequences beyond the authored level `hint`
- post-submit answer revision
- reward or badge presentation
- teacher review tools

### 10.28 Product Goal

By the end of Milestone 3, a student should be able to:

1. arrive at the first authored level from Milestone 2
2. answer a level with a clear prompt, options, and quiet progress cue
3. optionally open a deterministic hint without leaving the level flow
4. submit one answer and read deterministic feedback
5. continue through the remaining levels with durable saved state
6. finish the last level and leave the run in the correct saved completion state

The implementation is successful if this repeatable level pattern works end to end without route confusion or progress loss.

### 10.29 Required UI States

Milestone 3 should implement exactly these user-visible states:

1. active level question
2. active level question with hint open
3. level feedback reveal
4. transition to the next level
5. transition from the final level into saved completion state

Recommended routing model:

- one level route may render all level states
- internal state may be derived from persisted `session_runs`, `level_responses`, and `scaffold_events`
- routing details may vary, but the student-facing sequence must remain deterministic
- the level route should trust `session_runs.current_level_id` as the active authored level while `current_phase = level`

### 10.30 State A: Active Level Question

Purpose:

- let the student independently apply the taught flaw to a new turn

Visible UI must include:

- level title
- quiet level-progress cue such as `Level 2 of 4`
- targeted turn with nearby transcript context
- prompt
- answer options
- one primary action to submit an answer

Visible UI may include:

- a secondary hint affordance when `lesson_package.levels[].hint` is present
- a quiet phase indicator consistent with §6.11

Visible UI should not include:

- completion-screen content
- peer-progress UI that competes with the active question
- runtime-generated explanation outside the authored feedback contract

Required data:

- the current level object resolved from `session_runs.current_level_id`
- `lesson_package.levels[].level_id`
- `lesson_package.levels[].sequence_index`
- `lesson_package.levels[].turn_id`
- `lesson_package.levels[].title`
- `lesson_package.levels[].focus_move`
- `lesson_package.levels[].prompt`
- `lesson_package.levels[].answer_options`
- `lesson_package.levels[].best_answer_id`
- optional `lesson_package.levels[].hint`
- `lesson_package.levels[].feedback`
- transcript context around `turn_id`

System behavior:

- resolve the active level by matching `session_runs.current_level_id` against `lesson_package.levels[].level_id`
- load the targeted turn plus one adjacent turn before and after when available from `transcript.yaml`
- reuse the same nearby-context rule used by warm-ups so first-turn and last-turn edge cases stay consistent
- allow local answer selection before submission
- do not persist partial answer choice before the first accepted submit
- treat `focus_move` as planning metadata unless the implementation chooses to surface it explicitly
- treat `best_answer_id` as authored package metadata rather than the runtime source of truth for feedback resolution in Milestone 3

Persistence behavior:

- no `level_responses` write is required while the student is only selecting an answer
- keep `session_runs.current_phase = level`
- keep `session_runs.current_level_id` on the current authored level

### 10.31 State B: Level Question With Hint Open

Purpose:

- support the student during a level without replacing the main question flow

Visible UI must include:

- the full active-level question state
- the authored hint content in a clearly secondary treatment

Visible UI should not include:

- auto-advance behavior
- answer correctness labels before submission
- a hint treatment that visually overpowers the level prompt

Required data:

- all State A inputs
- `lesson_package.levels[].hint` when present

System behavior:

- reveal the authored hint inline or adjacent to the question area
- keep the student on the same level and preserve any local selection if possible
- treat a single level `hint` as the Milestone 3 support surface

Persistence behavior:

- opening the level hint should durably mark hint usage for the active `run_id + level_id`
- opening the level hint should immediately create durable scaffold state before answer submission, so reload cannot lose the hint-open fact
- Milestone 3 should therefore persist pre-submit level hint usage in `scaffold_events`
- write one event for the viewed hint with a stable `step_key` such as `hint`
- `level_responses.used_hint` should be set to `true` when the level response is later written if a matching hint-open scaffold event exists for that `run_id + level_id`

### 10.32 State C: Level Feedback Reveal

Purpose:

- show deterministic feedback after the student's one submitted level answer

Visible UI must include:

- level title
- quiet level-progress cue
- the selected answer in read-only form
- deterministic authored feedback for that submission
- one primary action: `Continue`

Visible UI may include:

- targeted turn with nearby transcript context
- the authored hint in read-only form if it was previously opened

Visible UI should not include:

- a second answer submission step in Milestone 3
- runtime-generated commentary beyond the authored feedback text
- reward or badge presentation

Required data:

- the active level object from `lesson_package.levels[]`
- the persisted level-response state for the active `run_id + level_id`
- the authored feedback block for the active level

System behavior:

- reopen this state when the active level already has a completed persisted response and the run is still on that level
- reconstruct the selected answer from `level_responses.initial_answer`
- resolve feedback deterministically from the lesson package:
- use `feedback.correct.text` when the submitted answer is in `feedback.correct.option_ids`
- otherwise use `feedback.by_option.{option_id}` for the submitted answer
- do not consult `best_answer_id` for feedback resolution in Milestone 3
- lock the submitted answer in read-only form after the first accepted submission
- if a later submit arrives for a level that already has a completed persisted response, return the existing response without changing `initial_answer` or `final_answer`
- keep the tone brief, specific, and calm consistent with §7.4

Persistence behavior:

- on the first accepted submit, write one durable level response for the active `run_id + level_id`
- set `level_responses.initial_answer` to the submitted option id
- set `level_responses.final_answer` to the same submitted option id in Milestone 3's first-pass single-submit flow
- set `level_responses.answer_changed = false` in Milestone 3's first-pass single-submit flow
- persist whether help was used before completion
- persist `completed_at` for the level response so reload can reopen the feedback state
- keep `session_runs.current_phase = level`
- keep `session_runs.current_level_id` on the current level until the student presses `Continue`

### 10.33 State D: Continue To Next Level

Purpose:

- move the student from the completed current level into the next authored level

Trigger:

- student presses `Continue` after the level feedback has been revealed

System behavior:

- find the next level by ascending `sequence_index`
- move the run to that next level when one exists
- persist the updated run state

Persistence behavior:

- keep `session_runs.current_phase = level`
- set `session_runs.current_level_id` to the next level's `level_id`
- update `updated_at`

Postcondition:

- the next level question is now ready to render on reload or resume

### 10.34 State E: Finish Levels

Purpose:

- leave the last level cleanly and hand off to the completion phase

Trigger:

- student presses `Continue` after the final level feedback has been revealed

System behavior:

- detect that no authored level remains after the current one
- move the run from `level` to `complete`
- persist the updated run state

Persistence behavior:

- set `session_runs.current_phase = complete`
- set `session_runs.status = complete`
- clear `session_runs.current_level_id`
- set `completed_at`
- update `updated_at`

Postcondition:

- the session is now ready for Milestone 4 work
- Milestone 3 does not need to implement the full completion screen, but it must leave the run in the correct saved state

### 10.35 Data Contract For Milestone 3

Milestone 3 implementation requires these data sources:

- active episode `lesson_package.yaml`
- active episode `transcript.yaml`
- persisted `session_runs`
- persisted `level_responses`
- persisted `scaffold_events`

Milestone 3 may also read:

- persisted `warmup_progress` for handoff sanity checks or resume logic

Level-response contract note:

- the first Milestone 3 implementation is a single-submit level flow
- `initial_answer` and `final_answer` should therefore match in the first pass
- `answer_changed` remains available for a later revision-capable milestone and should stay `false` in the first pass
- reload should reconstruct the read-only submitted choice from `level_responses.initial_answer`
- duplicate level submits after the first accepted completed response should be treated as idempotent no-ops that return the existing saved response

Runtime validation note:

- Milestone 3 implementation should strictly validate each level's runtime fields, including `prompt`, `answer_options`, optional `hint`, and `feedback.{correct,by_option}`, rather than relying on permissive passthrough parsing alone

Milestone 3 does not require:

- multi-step scaffold orchestration
- reward issuance
- rich peer-progress displays on level screens
- completion-screen layout work

Required persisted level fields:

- `session_runs.current_level_id`
- `level_responses.level_id`
- `level_responses.initial_answer`
- `level_responses.final_answer`
- `level_responses.used_hint`
- `level_responses.answer_changed`
- `level_responses.completed_at`

Required persisted scaffold fields:

- `scaffold_events.run_id`
- `scaffold_events.level_id`
- `scaffold_events.step_key`
- `scaffold_events.created_at`

### 10.36 Server Responsibilities For Milestone 3

The server layer should support:

- loading the active level payload for the run
- loading the current level-response state for the active level
- loading scaffold state for the active level when relevant
- saving level hint access
- saving the first accepted level submission
- reopening the feedback state after reload
- saving the transition to the next level
- saving the transition from the final level to `complete`

Recommended minimal server actions or route handlers:

- `getLevel(runId)`
- `openLevelHint(runId)`
- `submitLevelAnswer(runId, answerId)`
- `continueFromLevelFeedback(runId)`

Names may vary in implementation, but the responsibilities should remain the same.

### 10.37 Client Responsibilities For Milestone 3

The client layer should support:

- rendering the active level question state
- rendering the hint-open state without leaving the active level
- rendering the feedback-reveal state
- locking the submitted answer after the first accepted submit
- triggering the continue transition to the next level or completion
- showing quiet authored progress such as current sequence position
- gracefully rendering the saved-complete handoff state on the level route when `current_phase = complete` and `current_level_id` is null, until Milestone 4 replaces that placeholder

The client should not treat transient component state as the primary source of truth for level completion or reload behavior.

### 10.38 Acceptance Criteria

Milestone 3 is ready for approval when all of the following are true:

- a student arriving at `current_phase = level` sees the active authored level rather than a placeholder
- the active level is resolved from `session_runs.current_level_id`
- the level question shows the targeted turn and nearby context, prompt, answer options, and a quiet progress cue
- opening a level hint keeps the student on the same level and durably records hint usage in `scaffold_events` before the level is submitted
- the first accepted level submission persists a durable `level_responses` record for that level
- feedback is revealed deterministically from the authored package rather than generated at runtime
- reloading after level submission reopens the feedback-reveal state for the same level instead of losing progress
- pressing `Continue` after a non-final level moves the run to the next authored `level_id` deterministically
- pressing `Continue` after the final level moves the run to `current_phase = complete` with `status = complete`
- the repeatable level pattern feels coherent across all authored levels rather than like one-off pages

### 10.39 Explicit Non-Goals

Milestone 3 should not attempt to solve:

- multi-step scaffold trees or teach-and-retry workflows
- post-submit answer revision
- visible reward or badge presentation
- completion-page visual design
- teacher analytics or review dashboards
- live peer-progress updates on level screens

Failure and empty-state note:

- Milestone 3 is primarily specified for the happy path
- missing level content, malformed feedback maps, or unresolved `current_level_id` cases may be deferred using the same rule described in §11.16 unless implementation reveals a blocker

### 10.40 Handoff To Milestone 4

When Milestone 3 is approved, Milestone 4 should be able to assume:

- the reusable level pattern is implemented
- completed levels create durable `level_responses`
- hint usage is durably tracked for completed levels
- the run can reliably move from the final level to `current_phase = complete`
- `session_runs.status = complete` and `completed_at` are set when the final level is finished

Milestone 4 should build on these pieces rather than replacing them.

### 10.41 Milestone 4 Scope

This section is the implementation contract for the next approved build increment.

Milestone 4 covers:

- a dedicated saved-complete completion surface
- final takeaway presentation
- quiet earned-accomplishment or badge presentation derived from persisted runtime state
- simple next-step actions after completion
- reload and resume behavior for completed runs

Milestone 4 does not cover:

- cross-episode progression
- badge galleries or reward-history dashboards
- teacher analytics or teacher-facing completion views
- replaying the same run in place by mutating saved completed state

### 10.42 Product Goal

By the end of Milestone 4, a student should be able to:

1. arrive at a clear completion screen after the final level
2. understand that the episode is finished
3. read the final takeaway as the closing idea of the lesson
4. see quiet earned accomplishments derived from their saved work
5. choose a simple next action without confusion
6. reload later and return to the same saved-complete surface instead of dropping back into an earlier phase

The implementation is successful if the completion state feels clearly finished, calm, and durable.

### 10.43 Required UI States

Milestone 4 should implement exactly one user-visible state:

1. completion summary, with earned badges rendered inline as a visually secondary block

Reload or resume for an already-finished run reopens this same state from persisted data; it is not a separate rendered state.

Recommended routing model:

- Milestone 4 should continue to render completion at `/runs/{runId}/level`, replacing the Milestone 3 saved-complete handoff placeholder in place
- Milestone 4 should not introduce a dedicated completion route — `routeForRun` already points completed runs at `/level` and the Milestone 3 phase gate already renders a placeholder there
- a run with `current_phase = complete` should reopen the completion surface deterministically from persisted data
- completion routing should not depend on browser-local state

### 10.44 State A: Completion Summary

Purpose:

- close the episode clearly and reinforce the lesson's final takeaway

Visible UI must include:

- clear completion heading or equivalent end-state signal
- the episode title
- the final takeaway from `lesson_package.episode.final_takeaway`, rendered as a visually prominent closing element (callout or pull-quote treatment; it is the last teaching moment of the episode)
- a concise summary that the episode is finished
- the earned-badges block per §10.45, rendered inline and visually secondary to the final takeaway
- at least one clear next-step action

Visible UI may include:

- a subdued recap of completed progress such as all levels finished
- a coarse peer-progress summary for the student's group

Visible UI should not include:

- the full active level UI
- answer-editing controls
- loud celebration, leaderboard treatment, or competitive comparison
- reveal or unlock interactions that gate the earned-badges block behind an extra click

Required data:

- `session_runs.status`
- `session_runs.current_phase`
- `session_runs.completed_at`
- `lesson_package.episode.title`
- `lesson_package.episode.final_takeaway`

System behavior:

- treat `status = complete` and `current_phase = complete` as the source of truth for the saved-complete state
- render the completion surface without requiring any further mutation
- keep the tone slightly more celebratory than intermediate states, but still restrained per §8.6
- completed runs that visit `/runs/{runId}/read` should continue to see the Milestone 3 read-only treatment (transcript readable; Continue replaced with a link back to the completion surface); Milestone 4 must not regress that behavior

Persistence behavior:

- no additional write is required to view the completion summary; the completed run is terminal and must not be mutated on render per the Milestone 3 terminal-state invariant

### 10.45 Earned-Badges Block (Within State A)

Purpose:

- acknowledge meaningful progress without overpowering the lesson close
- produce as many concrete, feel-good markers as the persisted state actually supports, rather than collapsing related events into one aggregate

This is not a separate user-visible state; it is the badges panel rendered inline within the State A completion summary per §10.44.

Visible UI must include:

- every badge earned by the student per the predicate mapping below, with a short label explaining why it was earned
- a small completion-specific acknowledgement for finishing the episode (the `Episode Complete` badge below satisfies this)

Visible UI should not include:

- a persistent badge dashboard
- cross-student badge comparison
- badges that require subjective or runtime-generated judgment
- a reveal or unlock gate in front of the badges block

Required data:

- `session_runs`
- `warmup_progress`
- `level_responses`
- `scaffold_events`
- `lesson_package.levels[]` (for the authored level set used when computing per-level badges)

Predicate mapping — the v1 visible badge set derived from the frozen categories in §8.5 and §8.10:

- `Read The Episode` — one badge per run, earned when `session_runs.reading_complete = true` (always true for a completed run)
- `Finished Warm-Up` — one badge per run, earned when `warmup_progress.guided_complete = true`
- `Level Complete` — one badge **per authored level** that has a completed `level_responses` row (`completed_at` set). An N-level episode completed in full therefore yields N `Level Complete` badges
- `Used Help And Kept Going` — one badge per support-used-and-still-completed moment:
  - one instance for the warm-up when `warmup_progress.guided_used_hint = true` AND `warmup_progress.guided_complete = true`
  - one instance per level where a matching `scaffold_events` row exists (or `level_responses.used_hint = true`) AND `level_responses.completed_at` is set
- `Changed My Mind` — Milestone 4 omits this category because the single-submit flow cannot produce `level_responses.answer_changed = true`. Milestone 5 activates the category once bounded retry is implemented; the predicate defined in §10.60 supersedes this entry from Milestone 5 onward
- `Episode Complete` — one badge per run, earned when `session_runs.status = complete` AND `session_runs.completed_at` is set

> **Revised in §14.1–§14.3 (2026-04-16).** The predicate mapping above is superseded by a single `correct_answer` predicate plus the lifelines/bonus mechanic documented in §14. The older categories still map cleanly onto persisted state if the reward surface is ever broadened back, but the runtime no longer emits them.

Each earned badge should carry a short label that names the moment (e.g. for `Level Complete`: "Finished Level 2: Priya's leap"; for `Used Help And Kept Going`: "Used a hint on Level 3 and kept going"). Labels should draw from authored fields (`lesson_package.levels[].title`) rather than runtime-generated text.

System behavior:

- compute earned badges deterministically from saved runtime state rather than from a new runtime model call
- use the predicate mapping above; do not invent additional categories in Milestone 4
- keep badge presentation visually secondary to the final takeaway

Persistence behavior:

- Milestone 4 does not require a separate rewards table
- the earned-badges block may be computed on read from persisted runtime state
- if the implementation caches derived badge data later, that should be treated as an optimization rather than the source of truth

### 10.46 Reload And Resume Semantics

Resuming a completed run reopens the same State A completion surface described in §10.44. It is not a separate rendered state.

System behavior:

- reopen the completion surface whenever the selected run has `status = complete`
- do not require `current_level_id` to be present for completion rendering (Milestone 3 clears it on final-level transition)
- the `/runs/{runId}/level` path must render the completion surface for complete runs rather than 404 or redirect — the Milestone 3 terminal-state invariant requires that completed runs never redirect out of `/level` (otherwise `routeForRun`'s status-first rule produces a loop)

Persistence behavior:

- no write is required to resume the completion state
- the saved-complete surface should be fully reconstructable from persisted data

### 10.47 Completion Actions

Purpose:

- give the student simple, low-confusion options after the episode ends

Visible UI must include:

- one clear route back to a neutral starting point such as the home screen or student-selection flow

Visible UI may include:

- a secondary action to reread the transcript — this should link to `/runs/{runId}/read`, which Milestone 3 already renders in read-only form for completed runs (transcript is shown, the Continue button is replaced with a link back to the completion surface)

Visible UI should not include:

- destructive reset actions by default
- ambiguous controls that appear to reopen progress on the same completed run

System behavior:

- leaving the completion screen for a neutral starting point should not mutate the completed run
- the re-read action must not rewind `current_phase` or `reading_complete` on a completed run; the Milestone 3 terminal-state guards in `markReadingComplete` and the read-page UI enforce this
- any future "start again" flow should create a new run rather than rewrite the saved completed one (the partial unique index on `session_runs` added in the Milestone 3 followup already permits unbounded completed rows per student)

Persistence behavior:

- completion actions in Milestone 4 do not mutate the completed run

### 10.48 Data Contract For Milestone 4

Milestone 4 implementation requires these data sources:

- active episode `lesson_package.yaml`
- persisted `session_runs`
- persisted `warmup_progress`
- persisted `level_responses`
- persisted `scaffold_events`

Milestone 4 may also read:

- active session config for labels or return actions
- coarse peer-progress summaries when the UI chooses to show them

Completion contract note:

- the final takeaway should come from `lesson_package.episode.final_takeaway`
- earned-badge display should be derived from persisted runtime state per the §10.45 predicate mapping, rather than newly persisted completion-only records
- peer visibility, if present on the completion screen, must remain status-based and must not include badge information

Milestone 4 does not require:

- a new rewards or badges table
- historical reward timelines
- cross-episode summaries
- editable post-completion reflection workflows

### 10.49 Server Responsibilities For Milestone 4

The server layer should support:

- loading the saved-complete run state
- loading the final takeaway from the active package
- deriving the earned-badge set from persisted runtime state per §10.45
- returning coarse peer-progress summaries when requested by the completion UI
- reopening completed runs deterministically

Recommended minimal server actions or route handlers:

- `getCompletion(runId)`
- `listEarnedBadges(runId)`

Names may vary in implementation, but the responsibilities should remain the same.

### 10.50 Client Responsibilities For Milestone 4

The client layer should support:

- rendering the completion summary
- rendering quiet earned badges inline within the summary
- rendering simple next-step actions
- reopening the saved-complete state without depending on transient client state

The client should not treat locally remembered celebration state as the primary source of truth for whether a run is complete.

### 10.51 Acceptance Criteria

Milestone 4 is ready for approval when all of the following are true:

- a student arriving at a completed run sees a true completion surface rather than the Milestone 3 placeholder
- the completion surface renders at `/runs/{runId}/level` (the Milestone 3 handoff route), not at a new dedicated completion route
- the final takeaway from `lesson_package.episode.final_takeaway` is presented as a visually prominent closing element
- the earned-badge block is rendered inline with the summary (no reveal/unlock gate) and stays visually secondary to the final takeaway
- every badge earned by the student per the §10.45 predicate mapping is visible, including per-level `Level Complete` badges (one per completed authored level) and per-moment `Used Help And Kept Going` badges (warm-up + per level where applicable)
- the `Changed My Mind` category is omitted from v1 rather than displayed as perpetually empty
- badges are derived deterministically from persisted runtime state with no real-time model call
- reloading or resuming a completed run reopens the same completion surface from persisted data alone
- visiting `/runs/{runId}/read` on a completed run still shows the Milestone 3 read-only treatment (transcript readable; the Continue form is replaced with a link back to the completion surface)
- the completion surface offers at least one clear next action (switch-student or equivalent) that does not mutate the completed run
- any peer-progress shown on completion remains coarse and status-based, not badge-based

### 10.52 Explicit Non-Goals

Milestone 4 should not attempt to solve:

- cross-episode progression or next-episode recommendations
- replaying a completed run by rewriting saved state in place
- badge galleries, reward archives, or achievement dashboards
- teacher-facing completion analytics
- competitive reward comparisons

Failure and empty-state note:

- Milestone 4 is primarily specified for the happy path
- missing final-takeaway content or malformed derived badge inputs may be deferred using the same rule described in §11.16 unless implementation reveals a blocker

### 10.53 Handoff To Milestone 5

When Milestone 4 is approved, Milestone 5 should be able to assume:

- the full end-to-end flow is playable: identity selection → read → modeled warm-up → guided warm-up → per-level flow → completion surface
- the completion surface renders deterministically from persisted state and reopens on reload
- the current level runtime is still the Milestone 3 single-submit pattern: completed levels store matching `initial_answer` and `final_answer`, and `answer_changed` remains false
- the earned-badge predicate mapping in §10.45 is the v1 baseline; the completion surface exists, but the `Changed My Mind` category is still omitted because no retry-capable level flow has been implemented yet
- all four route shells (`/entry`, `/read`, `/warmup`, `/level`) handle completed runs without redirect loops per the Milestone 3 terminal-state invariant

Milestone 5 should build on these pieces rather than replacing them.

### 10.54 Milestone 5 Scope

This section is the implementation contract for the next approved build increment.

Milestone 5 covers:

- one bounded retry opportunity on eligible challenge levels after a wrong first answer
- durable persistence and reload/resume behavior for retry-in-progress levels
- deterministic locking of the level after the second accepted submission or the first correct submission
- activation of the `Changed My Mind` reward category on the completion surface when a student corrects an answer on retry

Milestone 5 does not cover:

- retries on the guided warm-up
- unlimited retries or open-ended answer revision
- multi-step remediation trees or adaptive tutoring
- changing the authored lesson-package format beyond what is needed to support the runtime contract

### 10.55 Product Goal

By the end of Milestone 5, a student should be able to:

1. answer a challenge level once as usual
2. get one more try on an eligible challenge level when the first answer is wrong
3. reload during that retry state and return to the same saved retry opportunity
4. finalize the level after the second try and reach the same locked-feedback state a single-submit level would reach
5. see `Changed My Mind` on the completion surface when they corrected an answer on retry

The implementation is successful if bounded retry feels supportive and calm rather than punitive or game-like.

### 10.56 Required UI States

Milestone 5 should implement exactly three user-visible level states:

1. active level question
2. retry opportunity after a wrong first submission on an eligible level
3. final level feedback after the level is locked

State 1 and State 3 already exist from Milestone 3. Milestone 5 adds State 2 and updates the persistence contract so reload can reopen it.

### 10.57 Retry Eligibility Rule

Milestone 5 should permit retry only when all of the following are true:

- the activity is a challenge level, not the guided warm-up
- the level has at least 3 answer options
- the level has exactly 1 correct answer id in `feedback.correct.option_ids`
- the student's first accepted submission for that level is wrong

If any of these conditions are false, the level should preserve the Milestone 3 single-submit behavior.

Rationale:

- challenge levels are independent practice and are the right place for one additional try
- the guided warm-up is still a coached "one supported attempt" interaction and should remain that way
- multi-correct or two-choice items are more likely to feel like elimination puzzles if retry is added without further design work

### 10.58 State A: Wrong First Submission On An Eligible Level

Purpose:

- let the student recover from a wrong first answer without erasing the original attempt

Entry condition:

- the run is on an eligible challenge level per §10.57
- no completed level response exists yet for the active `run_id + level_id`
- the student's first accepted submission is not in `feedback.correct.option_ids`

Visible UI must include:

- the same transcript-first level layout from Milestone 3
- the targeted turn and prompt
- a clear indication of the student's first submitted answer
- brief deterministic corrective feedback for that first wrong answer, using the authored `feedback.by_option.{option_id}` text for the submitted option
- a clear second-try action surface that keeps the student on the same level
- optional hint access when the authored level still exposes a hint and the level is not yet complete
- the first-picked answer option rendered as disabled (non-selectable) with a short "already tried" affordance, so the retry is framed as reconsideration rather than re-submission

Visible UI should not include:

- full completion-style feedback as if the level were already finalized
- a third-attempt affordance
- language that frames the first wrong answer as failure
- the first-picked option as an available choice on the second submission

System behavior:

- persist the student's first wrong submitted answer
- keep the run on the same `current_level_id`
- reopen this retry state on reload or resume until the level is finalized
- allow one more accepted submission from this state, provided it differs from the first accepted answer
- relax the Milestone 3 hint-lock-on-submit rule for retry-eligible levels: the level hint may be opened between the first and second submissions even if it was not opened before the first submission, as long as the level is not yet finalized
- on the server, reject a second submission that equals `initial_answer`: the retry-open row is returned unchanged and the level stays in retry-open state. The disabled client control is the happy-path guard; the server is the boundary guard against client bypass

Persistence behavior:

- write or update one durable `level_responses` row for the active `run_id + level_id`
- set `initial_answer` to the first accepted submitted option id
- leave `completed_at` unset while the retry opportunity is still open
- leave `final_answer` unset while the retry opportunity is still open
- keep `answer_changed = false` while the retry opportunity is still open
- keep `session_runs.current_phase = level`
- keep `session_runs.current_level_id` on the same authored level

### 10.59 State B: Finalize A Retry-Capable Level

Purpose:

- lock the level after the first correct answer or after the second accepted submission

Entry condition:

- the student is on a challenge level
- either:
  - the first accepted submission is correct, or
  - the level is in the retry state and the student is making the second accepted submission

Visible UI must include:

- the same final feedback state style used in Milestone 3
- the locked submitted answer rendered read-only
- deterministic authored feedback for the locked answer
- the continue action into the next level or completion

Visible UI may include:

- a subdued acknowledgement when the second accepted submission differs from the first AND is correct, such as "You changed your mind and landed it"

When the second accepted submission is also wrong, the locked feedback should be the authored `feedback.by_option.{option_id}` text for that final answer, with no acknowledgement copy. The interaction does not reframe the second wrong answer as failure; it is the same calm locked-feedback state used for any single-submit wrong answer.

System behavior:

- if the first accepted submission is correct, finalize immediately with no retry state
- if the retry state exists, accept exactly one more submission and then finalize the level
- once finalized, later submits remain idempotent no-ops that return the existing saved response
- feedback resolution continues to be deterministic from the authored lesson package rather than generated at runtime

Persistence behavior:

- `initial_answer` remains the first accepted submitted option id and never changes
- on finalization, set `final_answer` to the locked answer
- set `answer_changed = true` when `final_answer != initial_answer`, otherwise `false`
- set `completed_at` when the level becomes locked
- set `used_hint = true` when a matching level-hint scaffold event exists before completion, including hints opened between the first and second submissions
- keep `session_runs.current_phase = level`
- keep `session_runs.current_level_id` on the current authored level until the student presses `Continue`

### 10.60 Completion Integration For `Changed My Mind`

Purpose:

- activate the existing reward category once the runtime can actually support it

System behavior:

- extend the Milestone 4 completion summary so the `Changed My Mind` category is rendered when earned
- derive the category deterministically from persisted runtime state with no new model call

Predicate mapping for Milestone 5:

- `Changed My Mind` — one badge per level where:
  - `level_responses.answer_changed = true`
  - `level_responses.final_answer` is in the level's `feedback.correct.option_ids`
  - `level_responses.completed_at` is set

Rationale:

- the badge recognizes productive revision — the student reconsidered and reached the correct answer — rather than answer-switching in general
- a wrong-then-different-wrong sequence does not earn the badge; the level still records `answer_changed = true` for completeness, but the badge predicate gates on correctness of the final answer
- this preserves the meaning of the badge as a signal of corrected reasoning and avoids creating a gameable revision-without-thought reward

Labeling rule:

- labels should use authored level titles, for example: "Changed My Mind on Level 2: Priya's leap"

Milestone 5 should not add a new rewards table for this category.

### 10.61 Data Contract For Milestone 5

Milestone 5 implementation requires these data sources:

- active episode `lesson_package.yaml`
- persisted `session_runs`
- persisted `level_responses`
- persisted `scaffold_events`

Milestone 5 may also read:

- persisted `warmup_progress` for completion-summary badge derivation continuity

Level-response contract changes for Milestone 5:

- `level_responses` should now represent durable per-level response state, not only completed levels
- `initial_answer` stores the first accepted submitted option id
- `final_answer` stores the locked answer after the level is finalized
- `completed_at` remains unset while a retry opportunity is still open
- `answer_changed` becomes meaningful in this milestone and should be true only when the locked answer differs from the first accepted answer

Implementation note:

- the current Milestone 3 contract (§10.32) writes `final_answer` and `completed_at` on the first accepted submit and treats `completed_at` as the reload key. Milestone 5 must migrate that shape so a retry-in-progress level can persist durably before completion. The §10.32 persistence rules are superseded for retry-eligible levels by §10.58 and §10.59
- the `/level` route's reload logic currently keys on `level_responses.completed_at` per §10.32; Milestone 5 should extend that to recognize three reload targets: active question, retry-open, and locked feedback

Milestone 5 does not require:

- a new authored retry-feedback field
- a separate attempts table
- a third submission path

### 10.62 Server Responsibilities For Milestone 5

The server layer should support:

- determining whether the active level is retry-eligible per §10.57
- saving a wrong first submission into a durable retry state
- saving the final accepted submission that locks the level
- reopening retry-in-progress levels on reload
- deriving `Changed My Mind` badges from persisted state for the completion surface

Recommended minimal server actions or route handlers:

- `submitLevelAnswer(runId, answerId)` with branching behavior for first-submit, retry-open, and finalization states
- `continueFromLevelFeedback(runId)` unchanged after the level is finalized
- `listEarnedBadges(runId)` updated to include `Changed My Mind` when earned

Names may vary in implementation, but the responsibilities should remain the same.

Concurrency requirement:

- accepted submits must remain deterministic and race-safe
- while no `level_responses` row exists for the active level, the first submit to land becomes `initial_answer`; concurrent first-submits do not create a second row, and any later first-submit returns the existing retry-open response without changing `initial_answer`
- while the level is retry-open, the first second-submit to land becomes `final_answer` and locks the level; concurrent second-submits return the existing locked response rather than overwriting `final_answer`
- once a level has a finalized response (`completed_at` set), later submits are idempotent no-ops that return the existing saved response

### 10.63 Client Responsibilities For Milestone 5

The client layer should support:

- rendering the retry opportunity state without leaving the active level route
- rendering the first accepted wrong answer as saved state, not transient local state
- reopening the retry state after reload or resume
- rendering the final feedback state from the locked answer
- rendering `Changed My Mind` on the completion surface when earned

The client should not:

- treat retry availability as browser-local state
- offer more than one additional submission on the same level
- reopen the guided warm-up as a retryable interaction

### 10.64 Acceptance Criteria

Milestone 5 is ready for approval when all of the following are true:

- an eligible challenge level with a wrong first answer reopens into a clear retry state instead of locking immediately
- the retry state persists across reload and resume without losing the first accepted wrong answer
- the guided warm-up remains a single-submit supported attempt
- levels that are not retry-eligible preserve the Milestone 3 single-submit behavior
- the first accepted correct answer on an eligible level still finalizes the level immediately
- the second accepted submission on a retry-eligible level finalizes the level and reopens into the normal locked feedback state on reload
- `level_responses.initial_answer` preserves the first accepted answer and `final_answer` preserves the locked answer
- `level_responses.answer_changed` is true only when the student finalized a different answer from their first accepted answer
- completed runs that include corrected-on-retry levels show `Changed My Mind` on the completion surface with deterministic labels derived from authored level titles
- no new redirect loops or terminal-state regressions are introduced on `/level` or `/read`

### 10.65 Explicit Non-Goals

Milestone 5 should not attempt to solve:

- retry on the guided warm-up
- more than one retry on a level
- free answer switching before first submission
- adaptive remediation trees, extra scaffold branches, or AI-generated coaching
- teacher analytics about first-vs-final answer changes

Failure and empty-state note:

- Milestone 5 is primarily specified for the happy path
- malformed authored levels that do not meet the retry-eligibility rule should fall back to the Milestone 3 single-submit flow rather than guessing at retry behavior

### 10.66 Handoff To Milestone 6

When Milestone 5 is approved, Milestone 6 should be able to assume:

- the full end-to-end flow is playable, including bounded retry on eligible challenge levels
- retry-in-progress levels reopen deterministically from persisted state
- `answer_changed` is now a meaningful persisted field rather than a permanently-false placeholder
- the completion surface can render `Changed My Mind` when earned
- the frozen reward set in §8 is still intact; Milestone 6 may refine visuals, copy, and micro-interactions but should not reopen the reward categories or retry eligibility rule without an explicit design revision

Milestone 6 should build on these pieces rather than replacing them.

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
- `level_responses` should contain at most one durable row for a given `run_id + level_id`
- `initial_answer` should store the first accepted submitted option id for a level
- `final_answer` should equal `initial_answer` in the Milestone 3 and Milestone 4 single-submit flow, and should store the locked answer once a retry-capable level is finalized in Milestone 5
- `used_hint` should be true when the level hint was opened before that level was completed
- `answer_changed` should remain false in the Milestone 3 and Milestone 4 single-submit flow, and should become meaningful only when Milestone 5 bounded retry is implemented
- `completed_at` on `level_responses` should remain unset while a retry-capable level is still open and should mean the level has been locked and can reopen directly into feedback on reload
- `session_runs.current_level_id` should point to the active unfinished level while `current_phase = level`
- `session_runs.current_level_id` should be cleared when the run moves to `complete`
- if `scaffold_events` is used for level hints in Milestone 3, a single viewed level hint may use a stable `step_key` such as `hint`
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

## 14. Post-Milestone-5 Refinements (2026-04-16)

This section records the design revisions made after Milestone 5 shipped, based on iterative student-experience feedback. Where §14 conflicts with earlier sections (notably §8 Engagement and Reward Strategy, §10.45 Earned-Badges Block, and portions of the Milestone 3 level states), §14 is the current contract. The "frozen for v1" language in §8.5 is explicitly unfrozen for the items listed here.

The spirit of §8.1–§8.4 is preserved: rewards remain calm, supportive, deterministic, and secondary to the lesson. What changed is which behaviors surface to the student.

### 14.1 Reward Surface Reduction

The visible reward set is narrowed from six categories to one. The remaining category — `correct_answer` — is the only reward the session bar and completion page surface to the student.

Rationale: the six-category set (Read, Warm-up, Level Complete, Used Help And Kept Going, Changed My Mind, Episode Complete) was visually accurate but pedagogically mushy. Several categories fired on every run regardless of effort (reading, warm-up, episode complete), and `Level Complete` counted completion even when the final locked answer was wrong. Students had no clear "I got that right" signal.

New predicate:

- `correct_answer` — one medal per authored level where `level_responses.final_answer` is included in `lesson_package.levels[].feedback.correct.option_ids`. A level locked on a wrong final answer (retry-ineligible levels, or bounded-retry levels that lock on a second wrong answer) earns nothing from this predicate.

Categories still tracked in persisted state but not surfaced:

- `Read The Episode`, `Finished Warm-Up`, `Used Help And Kept Going`, `Changed My Mind`, `Episode Complete` — retained as implicit session structure but no longer emitted as visible medals. They can be reintroduced without a schema change if future design calls for them.

Implementation pointers:

- `deriveEarnedBadges(inputs, pkg, options)` in `simplified-framework/app/src/lib/completion.ts`
- `BadgeCategory` is narrowed to the string literal `"correct_answer"`
- `groupBadgesByCategory` and `countBadgesByCategory` still exist for future expansion

### 14.2 Lifelines Mechanic

A help-token budget (lifelines) is introduced alongside the correct-answer medals. Lifelines give the student a visible, finite-feeling help allowance without creating a points economy.

Lifeline contract:

- starting count: `max(1, lesson_package.levels.length - 1)` — intentionally grants some slack so a single hint never forfeits the bonus, with a floor of 1 so the mechanic is always visible
- a lifeline is spent when the student opens a **level** hint. Each authored level contributes at most one spent lifeline, matching the `(run_id, level_id, step_key="hint")` uniqueness on `scaffold_events`
- warm-up hints do **not** spend a lifeline. The warm-up hint is scaffolded practice, not a challenge signal, and it writes to `warmup_progress.guided_used_hint` rather than `scaffold_events`
- `remaining = max(0, initial - distinct_level_ids_with_hint_opened)`

Rationale: replaces the earlier `used_help_and_kept_going` medal with a resource-visible model. The prior medal was supportive but hard to understand; lifelines give students a reason to think before asking for help while preserving the "help is OK" stance — hints remain available, and using them never blocks progress.

Deviation from §8.2 "no points economies": lifelines are a minimal, non-accumulating, reset-per-episode allowance. No score, no cross-episode carry-over, no public comparison. The explicit design intent is *signal*, not scoring.

Implementation pointers:

- `deriveLifelineState(inputs, pkg)` in `simplified-framework/app/src/lib/completion.ts`
- Exposed via `SessionChromeData.lifelines` in `simplified-framework/app/src/lib/session-chrome.ts`

### 14.3 Completion Doubling Bonus

At episode completion, if `lifelines.remaining > 0`, every `correct_answer` medal is doubled on the completion surface. A student with three correct answers who ended with one lifeline remaining sees six medals on the completion page.

Rules:

- the bonus is applied **only at episode completion** (`session_runs.status = complete`). During play, the session bar shows the raw correct-answer count and the remaining hearts — no speculative doubling
- the completion page renders a short "Bonus" note alongside the doubled medal set explaining why it doubled
- if `lifelines.remaining = 0`, medals render at their base count with no bonus note

Rationale: the doubling is a completion-time reveal, not a live counter, so the run-time display stays stable and calm per §8.6. The reveal gives students a reason to be thoughtful about hint use without punishing help-seeking: the worst case is "normal medal count," not "lost reward."

Implementation pointers:

- `deriveEarnedBadges(inputs, pkg, { bonusMedals: true })` doubles `correct_answer` entries
- Called only from the `status === "complete"` branch of `simplified-framework/app/src/app/runs/[runId]/level/page.tsx`
- Completion bonus copy lives in `CompletionSurface` in the same file; `.completion-bonus` styles in `globals.css`

### 14.4 Session-Bar Visual Treatment

The session bar's middle column renders two medal groups in a single horizontal row:

- **hearts** (`FaHeart`, `#c1432c`) on the left — one icon per lifeline slot; the first `remaining` are filled at full opacity, the rest are faded to `opacity: 0.35` as hints are used
- **stars** (`FaStar`, `#e0a419`) on the right — one icon per `correct_answer` medal earned so far

Treatment rules:

- no row labels — icons + hover tooltips carry the meaning; the visual hierarchy is self-teaching after one cycle
- column-gap of ~1.25rem separates hearts from stars
- hearts always render from the beginning of the run (not gated by phase). The heart row is the only non-phase-specific chrome element; warm-up pages show the full heart allowance, levels fade individual hearts as they're spent
- the prior "N badges" aggregate pill and per-category chip labels were removed

Implementation pointers:

- `BADGE_CHIPS` in `simplified-framework/app/src/app/runs/[runId]/_components/LessonWorkspace.tsx`
- `.session-bar__medals`, `.session-medal-group`, `.session-medal--heart*`, `.session-medal--star` in `globals.css`

### 14.5 Flash Messaging Narrowing

The top-right flash banner fires only on a **correct answer**. Previous flash triggers (arriving at warm-up, arriving at level, retry-open, wrong-locked) no longer surface a banner; those states rely on in-drawer feedback instead.

Retained flash cases:

- guided warm-up answered with the best option
- level locked correct on first submission
- level locked correct after a retry (different copy: "Nice recovery…")

Implementation pointers:

- `actions.ts` drops `?flash=read-badge`, `?flash=warmup-badge`, and `?flash=retry-open` query parameters
- `warmup/page.tsx` and `level/page.tsx` interpret only the correct-answer branches

### 14.6 Level Phase Pill Removed

The top-right phase pill in `LessonWorkspace` is no longer rendered on level pages (previously "Level", "Level · feedback", "Level · one more try"). The `progressLabel` ("Level 2 of 4") already carries the phase context, and the pill was redundant.

Warm-up pages still render their phase pill ("Walkthrough", "Practice question", "Practice · look together") because warm-up progress is not obvious from `progressLabel` alone.

Implementation: `phaseLabel` is now optional on `LessonWorkspaceProps`. When absent, the pill is not rendered and the session-bar headline trims the trailing ` · {phaseLabel}` segment.

### 14.7 Viewport-Bounded Workspace Layout

On desktop (`min-width: 900px`, i.e. iPad 11" landscape and wider), the lesson workspace is bounded to the viewport rather than allowed to page-scroll:

- `.lesson-workspace` height = `calc(100dvh - 2.5rem - var(--session-bar-reserve))`
- `--session-bar-reserve` (default `8rem`) is the bottom clearance for the fixed session bar plus breathing room
- `.transcript-canvas` and `.work-drawer` each get `overflow-y: auto` and `min-height: 0`, so both panels scroll independently inside the bounded workspace
- Mobile (`< 900px`) keeps the earlier page-scroll layout with `padding-bottom: 5.8rem`

Rationale: on short viewports like iPad 11" landscape (834 px tall), the previous sticky-drawer layout let the transcript and drawer slide under the fixed session bar during scroll. Bounding the workspace gives each panel its own scroll and guarantees the session bar is never occluded.

Primary tuning knobs:

- `--session-bar-reserve` in `.lesson-workspace` media block — vertical gap between panels and session bar
- `.lesson-workspace { gap: 1.5rem; }` — gap between the workspace header row and the panel row
- `.session-bar { padding: ...; gap: ...; }` — session-bar internal padding and inter-column gaps

### 14.8 Files Changed

Code changes landed alongside this doc revision:

- `simplified-framework/app/src/lib/completion.ts`
- `simplified-framework/app/src/lib/session-chrome.ts`
- `simplified-framework/app/src/app/runs/[runId]/_components/LessonWorkspace.tsx`
- `simplified-framework/app/src/app/runs/[runId]/level/page.tsx`
- `simplified-framework/app/src/app/runs/[runId]/warmup/page.tsx`
- `simplified-framework/app/src/app/actions.ts`
- `simplified-framework/app/src/app/globals.css`

`npm run lint` and `npm run build` pass on the `simplified-framework/app/` workspace.
