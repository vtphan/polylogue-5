# Lens Wireframes v1

Supersession note:

- `v1-redesign-spec.md` is now the canonical source of truth for the current Lens v1 episode flow.
- If this document conflicts with `v1-redesign-spec.md`, follow `v1-redesign-spec.md`.
- Older wireframe assumptions about shared-browser round robin flow, peer discussion stages, and student writing should be treated as superseded for the current v1 direction.

This document translates the current Lens instructional and technical decisions into screen-level product flow for v1.

It is not a visual design comp. It is a wireframe/planning document intended to define:

- the main student-facing screens
- the order in which students encounter them
- what each screen must do
- what state must be visible
- what transitions connect the experience

This document should be read alongside:

- `app-background.md`
- `v1-redesign-spec.md`
- `technical-specs-v1.md`

---

## 1. Purpose

The purpose of this document is to move Lens from:

- goals
- scope
- features
- user stories

to:

- concrete product flow
- screen-level structure
- implementation-ready UI slices

For v1, the goal is not to design every edge case. It is to define a coherent, buildable student experience for shared-browser, table-based episode analysis.
For the current redesign, that means a single-student, no-writing, level-based flow.

---

## 2. Canonical v1 Flow

The first canonical v1 flow should cover the most common use case:

- one student opens an assigned episode
- the student reads the full episode
- the student completes one or two warm-ups
- the student starts a sequence of challenge levels
- the student answers with multiple-choice and similar constrained actions
- the app offers support
- the student confirms or revises
- the student completes the episode with visible progress and badges

This flow should be treated as the backbone for early implementation.

The same flow should also support different pacing conditions. The wireframes should preserve clear stage boundaries and good stopping points without requiring live teacher control or smart runtime inference.

### Backbone Steps

1. Start or resume session
2. Enter episode
3. Read full transcript
4. Complete Warm-Up 1
5. Optionally complete Warm-Up 2
6. Start challenge levels
7. Answer a constrained challenge
8. Open support or deeper prompts if needed
9. Confirm or revise
10. Complete the level
11. Continue through remaining levels
12. End with an episode completion summary

At each major step, the app should be able to signal either:

- `good place to pause`
- `continue now`

In v1, those signals should come from deterministic stage and completion rules, not from inferred judgment about how well the group is pacing itself.

Implementation note: backbone steps 5 and 6 both live inside the single persistent `respond` stage indicator used elsewhere in v1. They are separate actions in flow, not separate top-level stage labels in persistent UI.

---

## 3. Screen-by-Screen Wireframe Outline

## 3.1 Start / Resume Screen

### Purpose

Let the group begin a new local session or resume a recent one quickly.

### Main UI Regions

- page header / Lens identity
- primary action area
- recent local sessions list

### Must Show

- start new session
- resume recent session(s)
- basic local session labels:
  - group/table name if available
  - episode/session label
  - last updated time

### Main Actions

- start new session
- resume selected session
- select a bundled session when multiple discoverable sessions are available
- provide or choose a session config when no resolved session is available

### State / Data Needed

- recent local sessions from browser storage
- config/session label for each saved session

### Transition

- `Start new` -> Group Setup or directly to Episode Landing if config is complete
- `Resume` -> Restored working screen
- `Choose session` -> Group Setup or Episode Landing depending on whether roster setup is still needed

If multiple bundled sessions are discoverable, show a selection list here. If exactly one bundled session is discoverable, skip selection and proceed. If none are discoverable, prompt for a session config or show a recovery path.

---

## 3.2 Episode Landing Screen

### Purpose

Orient the group before reading begins.

### Main UI Regions

- episode title / short setup
- primary entry action

### Must Show

- episode/session title
- short context or setup text

### Main Actions

- begin reading

### State / Data Needed

- episode metadata
- pacing policy (loaded from session config; not surfaced as a student-facing label)

### Transition

- `Begin` -> Episode Reading View

---

## 3.3 Episode Reading View

### Purpose

Show the episode in a readable way while making focal turns visible and selectable.

### Main UI Regions

- top bar:
  progress indicator, exit/resume affordance
- main reading column:
  episode transcript
- side or bottom panel:
  reading instruction and challenge entry affordance

### Must Show

- the whole episode in readable form
- optional focal-turn marking or subtle highlights if useful
- a clear `Start challenges` action after reading
- progress indicator for the current episode phase

### Main Actions

- continue reading
- start challenges

### State / Data Needed

- transcript content
- stage/progress state

### Transition

- `Start challenges` -> Warm-Up 1

---

## 3.4 Warm-Up 1 View

### Purpose

Teach the student how the app expects them to reason about a focal turn.

### Main UI Regions

- focal turn display
- worked explanation panel
- continue action

### Must Show

- focal turn text
- plain-language explanation of what is problematic or notable
- highlight of the key words or reasoning move
- clear statement of the takeaway

### Main Actions

- continue to next warm-up or levels

### State / Data Needed

- focal turn
- worked-example content

### Transition

- `Continue` -> Warm-Up 2 or Level Start

---

## 3.5 Warm-Up 2 View

### Purpose

Bridge the student from a modeled example to independent challenge play.

### Main UI Regions

- focal turn display
- simple challenge question
- answer choices
- explanation reveal
- continue action

### Must Show

- focal turn text
- one simple multiple-choice question
- answer options
- revealed explanation after answer submission

### Main Actions

- answer question
- continue to level sequence

### State / Data Needed

- question and answer options
- explanation content

### Transition

- `Continue` -> Level Start

---

## 3.6 Level Start / Level Hub

### Purpose

Orient the student to the next challenge level before they answer.

### Main UI Regions

- level number and badge state
- focal turn or passage summary
- challenge title
- start action

### Must Show

- level title
- focal turn or passage preview
- challenge type such as notice, identify, evaluate, explain, or extend
- current progress through the episode

### Main Actions

- start level

### State / Data Needed

- level metadata
- completion state

### Transition

- `Start level` -> Challenge Level View

---

## 3.7 Challenge Level View

### Purpose

Let the student answer one challenge for one focal turn or short passage.

### Main UI Regions

- focal turn display
- challenge prompt
- answer choices
- `I'm not sure yet` path
- support affordance
- submit action

### Must Show

- focal turn text in context
- one prompt
- constrained answer choices
- support access
- visible progress within the episode

### Main Actions

- select an answer
- choose `I'm not sure yet`
- open support
- submit answer

### State / Data Needed

- focal turn metadata
- question definition
- answer options
- answer state
- support-availability state

### Transition

- `Submit` -> Support Resolution or Level Resolution View

---

## 3.8 Support View

### Purpose

Provide scaffolded help without breaking the level structure.

### Main UI Regions

- support ladder
- current focal turn reminder
- back to challenge action

### Must Show

- relevant support types such as:
  - attention nudge
  - focused question
  - hint
  - worked example
  - redirect

### Main Actions

- reveal next support step
- return to challenge

### State / Data Needed

- available support items
- support depth state
- answer state

### Transition

- `Back to challenge` -> Challenge Level View

---

## 3.9 Level Resolution View

### Purpose

Let the student confirm or revise an answer after support or after an initial attempt.

### Main UI Regions

- answer summary
- optional explanation reveal
- keep/change action
- continue action

### Must Show

- the student's current answer
- whether support was used
- a clear choice to keep or change the answer when appropriate
- completion feedback for the level

### Main Actions

- keep answer
- change answer
- continue to next level

### State / Data Needed

- initial answer
- final answer
- support usage
- level completion state
- badge delta

### Transition

- `Continue` -> Level Start / Level Hub or Episode Completion

---

## 3.10 Episode Completion View

### Purpose

Show the student what they completed and provide a clear exit or continuation path.

### Main UI Regions

- completion summary
- badges earned this episode
- return / continue actions

### Must Show

- completed episode label
- summary of levels completed
- badges earned during the episode
- a clear `pause here` / `continue` choice when more content remains
- a `next episode` action when another episode is available
- clear next actions such as return to start or continue to next episode if applicable

### Main Actions

- pause here
- return to start
- continue to next episode when available

### State / Data Needed

- completion state
- per-episode progress summary
- badges summary
- pacing policy

### Transition

- `Return to start` -> Start / Resume Screen
- `Next episode` -> Episode Landing or Group Setup depending on session structure

---

## 3.11 Empty / Error States

### Purpose

Provide recovery paths when required local state or bundled content is unavailable.

### Must Show

- no recent local sessions on the Start / Resume Screen, with a clear `Start new` action
- session config missing or malformed, with a recovery affordance to choose another session or provide a valid config
- assistive package missing or failing validation, with a recovery affordance to return to session selection or start
- episode content missing, with a recovery affordance to return to session selection or start

### Main Actions

- start new session
- choose another session
- retry loading
- return to start

### State / Data Needed

- load error type
- recovery path availability

### Transition

- `Retry` -> Current loading step
- `Choose another session` -> Start / Resume Screen
- `Return to start` -> Start / Resume Screen

---

## 3.12 Badges Surface

### Purpose

Make momentum and badges visible as a durable part of the experience rather than only as transient deltas.

### Main UI Regions

- current progress snapshot
- earned badges list

### Must Show

- current progress/momentum
- badges earned so far

### Main Actions

- open from persistent UI
- dismiss back to current screen

### State / Data Needed

- progress state
- badge state

### Transition

- `Open badges` -> Badges Surface
- `Close` -> Return to current working screen

---

## 3.13 Stopping-Point Prompt

### Purpose

Let the student pause or continue without losing progress when the app reaches a natural stopping point.

### Main UI Regions

- stopping-point message
- progress snapshot
- pause / continue actions

### Must Show

- a message such as `Good stopping point`
- the current level and phase

For v1, this prompt should be triggered by deterministic structure such as completing Warm-Up 1, completing a level, or finishing an episode.

### Main Actions

- pause for now
- continue

### State / Data Needed

- current level
- current phase
- pacing policy

### Transition

- `Pause for now` -> Save session and return to Start / Resume
- `Continue` -> Next enabled working screen

---

## 4. Shared Persistent UI Elements

These should likely remain visible across most of the experience:

- current episode/session label
- current level
- current phase indicator (`read` / `warmup` / `level` / `support` / `complete`)
- lightweight progress indicator
- scaffold-available indicator
- badges entry point

---

## 5. Key State Model Visible to Wireframes

At minimum, the wireframes should assume the app tracks:

- session config
- local session ID
- current_level_id
- current_turn_id
- current_phase
- pacing_policy
- reading_complete (`bool`)
- warmup_state
- response for the current level
- initial_answer
- final_answer
- scaffold/support usage
- badge/progress state
- stopping_point_available

---

## 6. Open Questions

Questions still open at the wireframe level:

- How much of the episode is visible while a student is responding?
- Does the challenge area sit beside the transcript or replace it temporarily?
- How much support should be visible before the student explicitly asks for help?
- Where on screen should persistent badges live without competing with primary content?

---

## 7. Suggested Implementation Slices

1. Start / resume / landing shell
2. Episode reading
3. Warm-Up 1 and Warm-Up 2 flow
4. Level hub and challenge level flow
5. Support panel
6. Level resolution flow
7. Episode completion
9. Empty and error states
10. Stopping-point and resume behavior
11. Progress and badges layer
