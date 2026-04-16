# Simplified Framework Model

This document defines the conceptual framework, pedagogical assumptions, and instructional model for the simplified system.

It is framework-facing, not app-specific. It assumes a dedicated Lens-like app is one delivery vehicle for the system, but it does not prescribe product or UI design.

This document distinguishes between:

- the intended instructional setting and long-term learning goals
- the narrower instructional scope currently operationalized by the app-facing artifact contract

## 1. Instructional Setting

The framework assumes a middle-school instructional setting where students work in small groups rather than alone.

Typical use should look like:

- groups of 3 to 5 students
- about 15 to 20 minutes of critical-thinking work per session or episode
- students interacting with the app and with one another
- discussion serving as part of the learning, not just individual app completion
- critical-thinking practice strengthening project-based learning work such as planning, research, evidence use, and group decision-making

The framework should not assume written explanation as the primary proof of understanding. Verbal peer explanation in plain language is the preferred mode.

This is the intended classroom setting for the framework. The current app-facing package contract does not yet fully operationalize this small-group verbal model.

## 2. Core Commitment

The simplified framework teaches one student-facing layer: reasoning flaws.

Students should work with plain-language critical-thinking moves rather than a multi-layer hidden ontology.

## 3. Student-Facing Flaw Set

The current student-facing flaw set is:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

These labels should stay plain, concrete, and teachable.

## 4. Hidden Complexity Rule

The framework may keep richer analytic structure for authoring, review, or analytics, but students should not need that structure in order to participate successfully.

The teaching experience should not depend on:

- hidden lens/facet terminology
- technical analytic labels
- implicit reconstruction of reasoning targets from metadata

## 5. What Students Should Learn

By the end of an episode, students should be able to:

1. notice a weak or incomplete reasoning move in a turn
2. explain to peers verbally, in plain language, why that move is weak
3. recognize the same move again in a later turn
4. leave with one transferable critical-thinking habit

The goal is usable reasoning practice for discussion and project work, not taxonomy mastery.

In the current scope, the lesson package primarily operationalizes explicit flaw recognition and explanation inside a deterministic app flow. Richer support for peer discussion and project-based transfer remains future work.

## 6. Pedagogical Shape

The framework assumes a short, explicit, discussion-centered teaching loop:

1. encounter a discussion episode
2. see one flaw made explicit
3. explain to peers, out loud, why the move is weak
4. practice identifying related flaws in additional turns
5. receive short explanatory feedback
6. leave with one memorable takeaway they can use in later discussions and projects

Worked examples, guided practice, and transfer matter because the framework is trying to teach recognition and explanation, not just classification.

For the current scope, this should be read as a design direction for the dedicated app and broader instructional model, not as a claim that every element is already encoded in the current lesson-package artifact.

## 7. Episode-Level Teaching Principle

Each episode should primarily teach one main flaw.

Supporting flaws are allowed, but they should not muddy the main lesson. Repetition around one main flaw is more valuable than packing many flaw types into one episode.

## 8. Beginner-Teachable Flaw Moments

A flaw moment is suitable for beginner instruction when:

- an ordinary reader can see that something is off
- the flaw can be named in plain language
- the flaw can be explained in one or two short sentences
- the turn can support a short app interaction plus follow-on group discussion

If adults would need to debate whether the flaw is really present, it is too subtle for the simplified framework’s lower levels.

## 9. Student Experience Principles

The student experience should feel:

- collaborative rather than solitary
- discussion-forward rather than writing-heavy
- explicit rather than inferential
- finishable rather than sprawling
- instructional rather than evaluative
- plain-language rather than analytic

Students should feel coached through how to notice and explain weak reasoning, not like they are operating a workflow engine.

## 10. Feedback Principles

Feedback should be:

- short
- specific
- tied to the actual turn
- explanatory, not just judgmental

Strong feedback helps the student see why the best answer fits and why weaker answers are tempting but incomplete.

## 11. Transfer Principle

Each episode should end with one takeaway that can travel beyond the specific story.

Examples:

- check whether the reason really supports the conclusion
- ask whether there is enough evidence
- check whether the source deserves trust

The takeaway should reinforce a habit of mind, not just summarize the plot.

Connecting that takeaway directly back into students' project-based learning work is desirable, but it is not yet a required part of the current app-facing package contract.

## 12. Current Scope And Future Work

The current package and runtime contract are intentionally narrower than the full instructional ambition of this framework.

Current operational scope:

- explicit teaching of one main reasoning flaw per episode
- app-playable warm-ups and levels
- plain-language explanations and feedback
- one transferable takeaway at the end of the episode

Future work:

- fuller support for small-group verbal explanation and peer discussion
- teacher or facilitator supports for classroom orchestration
- downstream app design for pacing and activity flow within the 15 to 20 minute session window
- stronger connections from episode takeaways into project-based learning practice

## 13. Related Docs

For artifact shapes, pipeline rules, validators, and runtime contract details, see:

- `simplified-framework/docs/technical-spec.md`

For dedicated app product and interaction design, see:

- `simplified-framework/docs/app-design.md`
