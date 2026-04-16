# Lens Wireframes v1

This document translates the current Lens instructional and technical decisions into screen-level product flow for v1.

It is not a visual design comp. It is a wireframe/planning document intended to define:

- the main student-facing screens
- the order in which students encounter them
- what each screen must do
- what state must be visible
- what transitions connect the experience

This document should be read alongside:

- `app-background.md`
- `instructional-design-v1.md`
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

---

## 2. Canonical v1 Flow

The first canonical v1 flow should cover the most common use case:

- a group of students sits down at one device
- the app loads the assigned session
- students read an episode
- students make initial individual responses
- students make a basic evaluative judgment
- the app reveals differences
- students discuss face-to-face
- the app offers support
- students revise or continue
- students end with a lightweight transfer move back to PBL discussion

This flow should be treated as the backbone for early implementation.

The same flow should also support different pacing conditions. Some classrooms may want more app structure, while others may let groups self-pace more freely. The wireframes should therefore preserve clear stage boundaries and good stopping points without requiring live teacher control or smart runtime inference.

### Backbone Steps

1. Start or resume session
2. Confirm group / active student
3. Enter episode
4. Read and focus on a focal turn
5. Make initial student response
6. Make a basic evaluative judgment
7. Hand off to next active student
8. Reveal comparison once all initial responses are complete
9. Discuss face-to-face with discussion cues and stance-taking moves
10. Open support or deeper prompts if needed
11. Revise or continue
12. End with a lightweight transfer prompt

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

## 3.2 Group Setup Screen

### Purpose

Confirm or enter the student roster for the shared device.

### Main UI Regions

- session header
- roster list
- add/edit names area
- continue action

### Must Show

- students preloaded from session config if available
- ability to add/edit/remove names lightly
- clear indication that this is one shared-device group

### Main Actions

- edit roster
- confirm group

### State / Data Needed

- session config roster if present
- local editable group state

### Transition

- `Continue` -> Episode Landing

---

## 3.3 Episode Landing Screen

### Purpose

Orient the group before reading begins.

### Main UI Regions

- episode title / short setup
- group roster strip
- active student indicator
- primary entry action

### Must Show

- episode/session title
- short context or setup text
- visible student chips for the group
- clearly marked active student

### Main Actions

- begin reading
- switch active student if needed

### State / Data Needed

- episode metadata
- roster
- active student ID
- pacing policy (loaded from session config; not surfaced as a student-facing label)

### Transition

- `Begin` -> Episode Reading View

---

## 3.4 Episode Reading View

### Purpose

Show the episode in a readable way while making focal turns visible and selectable.

### Main UI Regions

- top bar:
  active student, group chips, progress indicator
- main reading column:
  episode transcript
- side or bottom panel:
  focal turn card / current prompt access

### Must Show

- the whole episode in readable form
- focal turns clearly marked
- ability to select or jump to a focal turn
- a clear way to reopen the focal turn in whole-discussion context after comparison or revision
- a visible "what to notice" affordance for the current focal turn
- progress indicator for the current stage

### Main Actions

- select focal turn for the group
- open first prompt
- switch active student

Focal-turn selection follows the round-robin active-student rotation. The v1 interaction model does not require a separate group-override control here.

### State / Data Needed

- transcript content
- focal turn metadata
- immediate attention targets for the current focal turn
- active student
- stage/progress state

### Transition

- selecting a focal turn -> First Response View

The focal-turn selection is a **group action** taken once per round. The active student selects on behalf of the group, and that focal turn then locks for the cohort until all students have submitted an initial response for that round.

---

## 3.5 First Response View

### Purpose

Let the active student make a low-floor first move tied to a focal turn.

### Main UI Regions

- focal turn display
- response prompt area
- immediate noticing support
- low-floor participation options
- support access
- save / continue action

### Must Show

- active student identity prominently
- focal turn text
- initial prompt
- a labeled evaluation prompt such as "What seems strong, weak, or questionable here?"
- immediate "what to notice" support without opening the Support Panel
- one or more low-floor participation options such as:
  - choose interpretation
  - sentence frame
  - short response box
  - “I need help” / support button

### Main Actions

- submit initial response
- open support
- switch active student only if appropriate

### State / Data Needed

- active student
- focal turn
- prompt definition
- current evaluative judgment
- current response draft

### Transition

- `Save response` -> Handoff to next student in roster; when the last student in the cohort saves, auto-advance to Comparison View
- `Need help` -> Support Panel

The first-response flow is explicitly **round-robin within the cohort**. All students in the group respond to the same focal turn before comparison is revealed.

---

## 3.6 Support Panel

### Purpose

Provide scaffolded help without breaking the main flow.

### Main UI Regions

- support type tabs or stacked cards
- current focal turn reminder
- apply / return action

### Must Show

- relevant support types such as:
  - sentence frame
  - modeled example
  - transfer example
  - redirect
  - deeper prompt, visible only after the active student has saved an initial response for the current focal turn

### Main Actions

- open a support item
- return to response
- save revised response

### State / Data Needed

- support items available for the current turn
- support timing state
- student response state

### Transition

- `Back to response` -> First Response View
- `Save revised response` -> Handoff to next student in roster; when the last student in the cohort saves, auto-advance to Comparison View

---

## 3.7 Comparison View

### Purpose

Show all student responses for the current focal-turn cohort side by side, make differences visible enough to spark discussion, and open the first discussion cue.

### Main UI Regions

- focal turn summary
- per-student response cards
- difference highlight area
- discussion cue area

### Must Show

- all student responses for the current focal turn
- who said what
- cohort completion state for the current focal turn
- highlighted differences in response or interpretation
- one discussion cue or prompt
- a lightweight stance-taking affordance such as `Agree`, `Disagree`, `Add on`, or `Challenge`

### Main Actions

- open another discussion cue
- take a stance toward a peer response
- award peer recognition
- open deeper prompt
- move into the repeatable discussion/deepening loop

### State / Data Needed

- per-student saved responses
- cohort completion state
- derived comparison state
- cue state
- stance-taking state

### Transition

- `Discuss` happens face-to-face at the table
- `Continue discussion` -> Discussion / Deepening View

---

## 3.8 Discussion / Deepening View

### Purpose

Support the repeatable face-to-face discussion loop after the initial reveal, including additional cues, talk stems, continuing stance-taking, recognitions, deeper prompts, and consensus check.

### Main UI Regions

- discussion cue panel
- talk stems affordance
- optional deeper prompt area
- peer recognition actions
- consensus-check card
- revision action

### Must Show

- current discussion cue
- lightweight talk stems derived from `discussion_support.talk_moves`
- optional deeper prompt if unlocked
- ability to continue or revise a stance toward peer ideas
- simple peer recognition controls
- a post-discussion consensus check before revision
- a visible path back to the focal turn in transcript context

### Main Actions

- take or revise a stance toward a peer response
- mark a peer recognition
- open deeper prompt
- revise response

### State / Data Needed

- cue shown
- deeper prompt availability
- stance-taking state
- recognition state
- talk stems availability
- consensus-check state

### Transition

- `Revise` -> Revision View

---

## 3.9 Revision / Continue View

### Purpose

Let students revise their thinking or move on.

### Main UI Regions

- consensus-check confirmation
- prior response
- current editable response
- save/update action
- continue action

### Must Show

- a post-discussion confirmation step that reuses the earlier consensus-check primitive, now framed as "Before you revise: did the group reach a shared reading?"
- ability to confirm or revise
- indication of progress update or recognition if triggered

### Main Actions

- save revision
- continue to next focal turn

### State / Data Needed

- latest response
- prior response
- progress state
- badge/recognition deltas

### Transition

- `Save` -> Episode Reading View for next focal turn or completed state

---

## 3.10 Episode Completion / End-of-Round View

### Purpose

Show the group what they completed after the last focal turn and provide a clear exit or continuation path.

### Main UI Regions

- completion summary
- cohort progress recap
- badges and recognitions earned this episode
- return / continue actions

### Must Show

- completed episode or round label
- summary of focal turns completed
- badges and recognitions earned during the episode
- a lightweight transfer prompt such as "What could your group carry into your own PBL discussion?"
- a clear `pause here` / `continue` choice when more content remains
- a `next episode` action when another episode is available
- clear next actions such as return to start or continue to next episode if applicable

### Main Actions

- save transfer takeaway
- pause here
- return to start
- continue to next episode when available

### State / Data Needed

- completion state
- per-episode progress summary
- badges/recognitions summary
- optional transfer takeaway
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

## 3.12 Badges / Recognitions Surface

### Purpose

Make momentum, badges, and recognitions visible as a durable part of the experience rather than only as transient deltas.

### Main UI Regions

- current progress snapshot
- earned badges list
- peer recognitions received

### Must Show

- current progress/momentum
- badges earned so far
- peer recognitions received so far

### Main Actions

- open from persistent UI
- dismiss back to current screen

### State / Data Needed

- progress state
- badge state
- recognition state

### Transition

- `Open recognitions` -> Badges / Recognitions Surface
- `Close` -> Return to current working screen

---

## 3.13 Stopping-Point Prompt

### Purpose

Let the group pause or continue without losing progress when the app reaches a natural stopping point.

### Main UI Regions

- stopping-point message
- progress snapshot
- pause / continue actions

### Must Show

- a message such as `Good stopping point`
- the current focal turn and stage

For v1, this prompt should be triggered by deterministic structure such as completing a round, reaching revision, or finishing an episode.

### Main Actions

- pause for now
- continue

### State / Data Needed

- current focal turn
- current backbone stage
- pacing policy

### Transition

- `Pause for now` -> Save session and return to Start / Resume
- `Continue` -> Next enabled working screen

---

## 4. Shared Persistent UI Elements

These should likely remain visible across most of the experience:

- active student indicator
- group student chips
- current episode/session label
- current focal turn
- current backbone stage indicator (`read` / `respond` / `compare` / `discuss` / `revise`)
- lightweight progress indicator
- scaffold-available indicator
- recognition entry point
- way to switch active student

These are especially important because the app is shared across multiple students on one device.

For v1, `respond` should include both the initial response and the basic evaluative move. The persistent stage indicator should stay at five stages rather than adding a separate `evaluate` label.

---

## 5. Key State Model Visible to Wireframes

At minimum, the wireframes should assume the app tracks:

- session config
- local session ID
- roster
- active student
- current_focal_turn_id
- current_backbone_stage
- pacing_policy
- per-student response for the current focal turn
- evaluative_judgment for each student for the current focal turn
- cohort_response_state for each student (`pending` / `saved`)
- cohort_complete (`bool`)
- initial_response_saved for each student for the current focal turn
- discussion_cue_opened for the current focal turn (`bool`)
- peer_stance data for the current focal turn
- scaffold/support usage
- comparison state
- recognition/progress state
- optional transfer takeaway
- stopping_point_available

---

## 6. Open Questions

Questions still open at the wireframe level:

- How much of the episode is visible while a student is responding?
- Does the response area sit beside the transcript or replace it temporarily?
- How prominent should the active student handoff control be?
- Where on screen should persistent recognitions live without competing with primary content?

---

## 7. Suggested Implementation Slices

1. Start / resume / landing shell
2. Group setup and active student switching
3. Episode reading and focal turn selection
4. First response flow
5. Support panel
6. Comparison reveal and discussion/deepening loop
7. Revision / continue flow
8. Episode completion and transfer prompt
9. Empty and error states
10. Stopping-point and resume behavior
11. Progress and recognition layer
