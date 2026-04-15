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
- `instructional-design.md`
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
- the app reveals differences
- students discuss face-to-face
- the app offers support and optional prepared perspective
- students revise or continue

This flow should be treated as the backbone for early implementation.

### Backbone Steps

1. Start or resume session
2. Confirm group / active student
3. Enter episode
4. Read and focus on a focal turn
5. Make initial student response
6. Hand off to next active student
7. Reveal comparison once all initial responses are complete
8. Discuss face-to-face with discussion cues
9. Open support or deeper prompts if needed
10. Optionally view prepared outside perspective
11. Revise or continue

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

### State / Data Needed

- recent local sessions from browser storage
- config/session label for each saved session

### Transition

- `Start new` -> Group Setup or directly to Episode Landing if config is complete
- `Resume` -> Restored working screen

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
- progress indicator for the current stage

### Main Actions

- select focal turn
- open first prompt
- switch active student

### State / Data Needed

- transcript content
- focal turn metadata
- active student
- stage/progress state

### Transition

- selecting a focal turn -> First Response View

---

## 3.5 First Response View

### Purpose

Let the active student make a low-floor first move tied to a focal turn.

### Main UI Regions

- focal turn display
- response prompt area
- low-floor participation options
- support access
- save / continue action

### Must Show

- active student identity prominently
- focal turn text
- initial prompt
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
- current response draft

### Transition

- `Save response` -> Handoff / next student or Comparison View if all complete
- `Need help` -> Support Panel

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
  - attention prompt
  - sentence frame
  - modeled example
  - transfer example
  - redirect
  - deeper prompt when available

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
- `Save revised response` -> Handoff or Comparison View

---

## 3.7 Comparison View

### Purpose

Show all student responses side by side and make differences visible enough to spark discussion.

### Main UI Regions

- focal turn summary
- per-student response cards
- difference highlight area
- discussion cue area

### Must Show

- all student responses for the focal turn
- who said what
- highlighted differences in response or interpretation
- one discussion cue or prompt

### Main Actions

- open another discussion cue
- award peer recognition
- open deeper prompt
- open prepared perspective later

### State / Data Needed

- per-student saved responses
- derived comparison state
- cue state

### Transition

- `Discuss` happens face-to-face at the table
- app remains on comparison/discussion support state until group is ready

---

## 3.8 Discussion / Deepening View

### Purpose

Support face-to-face discussion with optional deeper prompts and recognitions.

### Main UI Regions

- discussion cue panel
- optional deeper prompt area
- peer recognition actions
- revision action

### Must Show

- current discussion cue
- optional deeper prompt if unlocked
- simple peer recognition controls

### Main Actions

- mark a peer recognition
- open deeper prompt
- move to prepared perspective
- revise response

### State / Data Needed

- cue shown
- deeper prompt availability
- recognition state

### Transition

- `Revise` -> Revision View
- `See perspective` -> Prepared Perspective View

---

## 3.9 Prepared Perspective View

### Purpose

Show the prepared outside perspective after students have already had a chance to think and discuss.

### Main UI Regions

- focal turn / context reminder
- prepared perspective content
- comparison or reflection prompt

### Must Show

- prepared outside perspective
- clear framing that this is not the final authority
- prompt to compare with the group’s thinking

### Main Actions

- return to revise
- continue forward

### State / Data Needed

- prepared perspective content
- whether it has been viewed

### Transition

- `Revise` -> Revision View
- `Continue` -> Next focal turn or progress state

---

## 3.10 Revision / Continue View

### Purpose

Let students revise their thinking or move on.

### Main UI Regions

- prior response
- current editable response
- save/update action
- continue action

### Must Show

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

## 4. Shared Persistent UI Elements

These should likely remain visible across most of the experience:

- active student indicator
- group student chips
- current episode/session label
- lightweight progress indicator
- way to switch active student

These are especially important because the app is shared across multiple students on one device.

---

## 5. Key State Model Visible to Wireframes

At minimum, the wireframes should assume the app tracks:

- session config
- local session ID
- roster
- active student
- selected focal turn
- per-student response for the current focal turn
- scaffold/support usage
- comparison state
- recognition/progress state

---

## 6. Open Questions

Questions still open at the wireframe level:

- How much of the episode is visible while a student is responding?
- Does the response area sit beside the transcript or replace it temporarily?
- How prominent should the active student handoff control be?
- When should the prepared perspective button appear visually?
- How visible should badges/recognitions be during the core flow?

---

## 7. Suggested Implementation Slices

1. Start / resume shell
2. Group setup and active student switching
3. Episode reading and focal turn selection
4. First response flow
5. Support panel
6. Comparison and discussion cue view
7. Prepared perspective
8. Revision / continue flow
9. Progress and recognition layer
