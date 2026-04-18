# Lens v1 Redesign Spec

This document is the canonical product spec for the current Lens v1 redesign.

It supersedes any older Lens documentation that assumes:

- shared-device round robin participation
- peer discussion as a required runtime stage
- student writing as the core interaction
- consensus-building as a core student task
- student lens selection as a required entry move

When another Lens doc conflicts with this one, this document wins for the v1 student experience.

Relevant older docs should link here rather than restating competing flow assumptions.

For the app-facing assistive package contract used by the redesigned runtime, also see:

- `assistive-package-v1_1.md`

---

## 1. Product Decision Summary

Lens v1 is now defined as:

- a single-student experience on one device
- a no-writing experience
- a no-discussion experience
- a level-based episode analysis flow
- a runtime that uses only precomputed assistive-package content

The app should help a student:

1. read a full episode
2. complete one or two warm-up examples
3. move through a sequence of challenge levels
4. answer using multiple choice and similar constrained interactions
5. request support when needed
6. earn completion markers or badges as progress feedback

The app should not ask the student to:

- write open responses
- coordinate with peers through the app
- complete consensus tasks
- choose a lens before they have a foothold

---

## 2. Episode Flow

Each episode should follow this flow:

1. Enter episode
2. Read the full transcript
3. Complete Warm-Up 1
4. Optionally complete Warm-Up 2
5. Start challenge levels
6. Progress through levels with support as needed
7. Reach episode completion

### 2.1 Enter Episode

The student sees:

- episode title
- short context/setup
- a brief instruction that the student will first read, then begin challenges

Primary action:

- `Start reading`

### 2.2 Read the Full Episode

The student reads the transcript before analysis begins.

This stage should:

- support straightforward reading and review
- avoid interrupting the student with challenge prompts
- end with one clear action such as `Start challenges`

### 2.3 Warm-Up 1

Warm-Up 1 is required.

It should:

- show one short focal turn or passage
- show a worked explanation of what is problematic or notable
- model the type of thinking the app expects

Warm-Up 1 is instructional, not evaluative.

### 2.4 Warm-Up 2

Warm-Up 2 is optional but recommended.

It should:

- show another short focal turn
- ask a simple multiple-choice question
- reveal the explanation after the student answers

Warm-Up 2 bridges the student from demonstration to independent play.

### 2.5 Challenge Levels

After warm-ups, the student enters the level sequence.

Each level contains:

- one focal turn or short passage
- one challenge
- a constrained response format
- optional support
- completion feedback

### 2.6 Episode Completion

The student sees:

- completed levels
- badges or completion markers earned
- a short summary of progress
- a replay or continue option if available

---

## 3. Level Model

Each level should feel like a small, self-contained reasoning challenge.

Each level includes:

- focal content
- challenge prompt
- response options
- support affordance
- success/completion state

### 3.1 Core Level Structure

For each level, the student can:

- read the focal turn in context
- answer a multiple-choice question
- choose `I'm not sure yet`
- open support
- review scaffold steps
- retry or confirm an answer

### 3.2 Level Difficulty Progression

Levels should rise in cognitive demand over the course of the episode.

A default progression is:

1. Notice
2. Identify
3. Evaluate
4. Explain
5. Extend

Definitions:

- `Notice`: spot what stands out in the turn
- `Identify`: choose the best description of the reasoning issue or strength
- `Evaluate`: judge what is weak, strong, incomplete, or questionable
- `Explain`: choose why the speaker or group reasoned this way
- `Extend`: connect the pattern to another moment or broader lesson

Not every episode must use every stage, but this is the default arc.

---

## 4. Interaction Types

Lens v1 should use constrained, no-writing interactions only.

Allowed student interactions:

- single-select multiple choice
- two-step multiple choice
- `I'm not sure yet`
- confidence check
- request support
- reveal next scaffold step
- retry answer
- keep or change answer

The app should not require:

- free response
- fill-in-the-blank writing
- typed justification
- typed reflection

### 4.1 Default Interaction Pattern

The default pattern for a level is:

1. show turn and question
2. student selects an option
3. student may request support
4. student confirms or revises
5. level completes

---

## 5. Support Model

Support should be progressive and lightweight.

The student should never be dropped immediately into a long explanation unless they request deeper help or exhaust simpler support.

### 5.1 Support Layers

The support ladder may include:

1. attention nudge
2. focused question
3. hint
4. worked example
5. redirect

### 5.2 Support Rules

- `attention_targets` are orientation nudges, not the main instructional move
- `diagnostic_support.probes` provide the core challenge questions
- `diagnostic_support.interventions` provide the core support ladder
- `worked_example` content is a model answer/model interpretation aligned to the hidden answer key

---

## 6. What Gets Recorded

The app should preserve student work without collecting writing.

Per level, the app should be able to record:

- episode ID
- level ID
- focal turn or passage ID
- question shown
- options shown
- initial answer selected
- final answer selected
- confidence state if used
- whether support was requested
- support depth reached
- whether the student changed their answer
- completion state
- badge or completion marker earned
- timestamps or duration

This is the minimum learning record for v1.

---

## 7. Assistive Package Mapping

The app-facing design requirements for that package are defined in:

- `assistive-package-v1_1.md`

The v1 student flow should use the assistive package this way:

- `analytic_core.passages`
  - defines focal units and level targets

- `analytic_core.passages[].facets_present`
  - acts as the hidden answer key

- `front_door_support.attention_targets`
  - provides initial orientation nudges

- `diagnostic_support.probes`
  - provides challenge questions and answer options

- `diagnostic_support.interventions`
  - provides scaffold ladders and worked examples

- `front_door_support.modeled_episode_examples`
  - optional richer examples if populated

- `front_door_support.transfer_examples`
  - optional extension material for later levels if populated

The following should be deferred or non-core for v1:

- `discussion_support.discussion_cues`
- `discussion_support.talk_moves`
- `discussion_support.consensus_checks`
- teacher-facing runtime support beyond minimal future-proofing

---

## 8. Conceptual Framework Usage

The conceptual framework remains useful, but not all of it should be equally visible to students.

### 8.1 Lens

For v1, lens is mostly hidden instructional structure.

Lens may appear lightly in challenge labeling, but students should not be required to choose a lens as an entry move.

### 8.2 Facet

Facet is the hidden conceptual target for a level.

The UI should usually show plain-language student prompts rather than raw facet IDs.

### 8.3 Cognitive and Social Patterns

These belong mainly in higher-level explanation tasks.

They should appear after the student has already identified the core reasoning issue.

---

## 9. Out of Scope for This v1

The following are intentionally out of scope for the current v1 student flow:

- peer discussion as a required stage
- consensus capture
- shared-device round robin participation
- open-response writing
- networked group orchestration
- runtime LLM behavior

---

## 10. Document Governance

This document should be referenced by:

- `technical-specs-v1.md`
- `wireframes-v1.md`
- `implementation-readiness-v1.md`
- `app-background.md` where relevant

If a future Lens document proposes a different v1 student flow, it should either:

- update this document directly, or
- explicitly state that it is proposing a post-v1 design

The repo should not maintain multiple competing definitions of Lens v1 without an explicit supersession note.
