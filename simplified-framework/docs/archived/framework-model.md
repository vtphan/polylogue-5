# Simplified Framework Model (archived)

> **Archived — historical reference only.** Superseded by `simplified-framework/docs/instructional-design.md`, which is the current source of truth for the conceptual framework and the instructional approach as implemented in the app.

This document defines the conceptual framework and the instructional approach for the simplified system. Artifact shapes and runtime contract live in `technical-spec.md`; app product and interaction design live in `app-design.md`.

## 1. Conceptual Model

The framework teaches a single student-facing layer: **reasoning flaws**, named in plain language.

The canonical flaw set is:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

These labels stay plain, concrete, and teachable. Richer analytic structure may exist for authoring, review, or analytics, but students never need it.

Each episode primarily teaches **one main flaw**. Supporting flaws are used sparingly; repetition on one flaw is more valuable than covering many.

## 2. Instructional Setting

The framework is designed for middle-school classrooms where students work in small groups of 3–5, spend 15–20 minutes per session, and use discussion — not just app completion — as part of the learning. Verbal peer explanation in plain language is the preferred proof of understanding.

## 3. Learning Goals

By the end of an episode, a student should be able to:

1. notice a weak reasoning move inside a specific turn
2. name the flaw in plain language
3. explain to peers, out loud, why the move is weak
4. recognize the same flaw again in a later turn
5. leave with one transferable habit of mind

The goal is usable reasoning practice, not taxonomy mastery.

## 4. Episode Loop

Every episode runs a fixed staged loop:

1. **Read** — the student reads the full transcript: a peer dialogue in which the target flaw appears naturally, unlabeled.
2. **Modeled warm-up** — the app walks the student through one turn: what to notice → how the reasoning chain works → the takeaway. The answer is shown before the student acts.
3. **Guided warm-up** — the same flaw surfaces in a different turn. The student chooses from multiple-choice options with an optional hint, then sees an explanation.
4. **Levels (~4)** — the student independently identifies the same flaw in new turns, with per-option feedback and one bounded retry per level.
5. **Wrap** — a final takeaway reinforces the habit; badges acknowledge completion.

The loop is deterministic. Lesson content is authored upstream; the runtime does not call a model.

## 5. Teaching Mechanics

The loop operationalizes six instructional moves:

1. **Worked example first.** The modeled warm-up traces the reasoning chain step by step before the student is asked to act.
2. **Signal-phrase noticing.** Students are trained to hear concrete cues ("so… so… so", "definitely", "has to be", "that proves it") as markers of a flaw.
3. **Graduated hints that redirect, not reveal.** Hints point attention ("count the sos; compare start and end") rather than give the answer.
4. **Per-option contrastive feedback.** Every answer choice — right or wrong — gets tailored feedback explaining why it fits or why it is tempting but incomplete.
5. **Retrieval across contexts.** One episode surfaces the main flaw in multiple turns, speakers, and framings, training recognition over memorization.
6. **Low-stakes retry.** A wrong first answer returns feedback and one bounded second attempt. Errors are data, not failure.

## 6. Authoring Constraints

A flaw moment is suitable for beginner instruction when an ordinary reader can see that something is off, the flaw can be named in plain language and explained in one or two sentences, and the turn supports a short app interaction plus follow-on discussion.

Feedback on any answer should be short, specific, tied to the actual turn, and explanatory rather than judgmental. The final takeaway should reinforce a habit of mind, not summarize the plot.

## 7. Related Docs

- `simplified-framework/docs/technical-spec.md`
- `simplified-framework/docs/app-design.md`
