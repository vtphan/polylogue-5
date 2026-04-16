# Simplified Episode Composition Spec

This document defines how episodes should be composed in the simplified Lens framework.

It is a pipeline-facing document.

Its main purpose is to help story and episode-generation agents produce dialogue that is:

- natural enough to read like a real conversation
- structured enough to support the downstream app
- explicit enough to contain clear, teachable reasoning flaws

## 1. Core Principle

An episode should not try to make every turn instructionally dense.

That makes the conversation feel artificial.

Instead, each episode should contain a small number of deliberately embedded teachable flaw moments, with other turns providing:

- setup
- reaction
- clarification
- emotion
- pacing
- conversational flow

The app will only use selected turns as warm-ups and levels.

The transcript does not need to make every turn a lesson.

## 2. Teachable Flaw Moments

Each episode should contain a small set of designated teachable flaw moments.

The current preferred guideline is:

- about `2` warm-up flaw moments
- about `3` to `5` level flaw moments

This is not a hard rule.

The exact number should be part of episode design and operator judgment.

Some episodes may be simpler.
Some later episodes may reinforce prior flaws differently.

These are the turns the downstream app will use for:

- one modeled warm-up
- one guided warm-up
- the main challenge levels

## 3. Not Every Turn Needs a Flaw

This is a required design rule.

The episode should not force every turn to contain a reasoning flaw.

Allowed non-flaw turns include:

- opening setup
- clarification
- emotional reaction
- social response
- recap
- transition to a new idea
- ordinary agreement or uncertainty

These turns help the dialogue feel believable.

## 4. Flaw Quality Requirement

At the simplified lower levels, the designated flaw moments must be obvious as flaws.

That means:

- an ordinary reader can see that something is off
- the flaw can be named in plain language
- the flaw can be explained in one or two short sentences
- the turn does not depend on subtle inference or expert interpretation

If a flaw is too subtle, too contestable, or too dependent on hidden analysis, it should not be chosen as a beginner-level flaw moment.

## 5. Preferred Flaw Distribution

Each episode should be organized around:

- `1` primary reasoning flaw
- `1` optional secondary reasoning flaw

Most teachable moments should express the primary flaw.

The secondary flaw should appear only when it supports the episode without making the lesson muddy.

## 6. Turn Count Policy

The number of turns should stay flexible.

The conversation should be allowed to flow naturally.

### 6.1 Target Range

Preferred total episode length:

- `10` to `16` turns

This is a soft target, not a strict rule.

### 6.2 Hard Cap

Hard maximum:

- `20` turns

An episode should only exceed `20` turns with a strong reason, and that should be treated as unusual.

### 6.3 Why This Policy Exists

- Too few turns makes the conversation feel compressed and unnatural.
- Too many turns makes the episode diffuse and harder to use in the app.
- A soft target plus a hard cap gives agents room to write naturally without drifting.

## 7. Episode Design Template

Each episode should roughly contain:

1. opening setup turns
2. first obvious flaw moment
3. reaction or elaboration
4. second obvious flaw moment
5. connective turns
6. remaining designated flaw moments
7. closing or transition turns

The exact placement can vary.

The important constraint is the number and clarity of the designated flaw moments, not the exact transcript shape.

## 8. Designated Flaw Moment Requirements

Each designated flaw moment should be traceable to:

- a turn ID
- one primary reasoning flaw
- a plain-language explanation
- a candidate student question

This should be explicit in the episode plan and later reused by the lesson package generator.

## 9. What Agents Should Optimize For

Story and episode agents should optimize for:

- natural conversation
- clear primary flaw repetition
- obvious beginner-teachable flaw moments
- enough connective dialogue for realism
- downstream usability for warm-ups and levels

They should not optimize for:

- packing a flaw into every turn
- subtle analytic richness at the cost of clarity
- generating many different flaw types in one episode
- hidden interpretive complexity that only post-hoc analysis can recover

## 10. Review Questions

Each episode should be reviewable with these questions:

1. Does the episode provide enough strong flaw moments for warm-ups and levels?
2. Are the designated flaw moments obvious enough for beginner instruction?
3. Does the transcript still sound like a plausible conversation?
4. Is one primary flaw clearly repeated across the episode?
5. Are there enough non-flaw turns to make the episode feel natural?
6. Does the episode stay within the preferred turn range or at least under the hard cap?

These are operator-facing review questions, not strict automated pass/fail rules.

## 11. Relationship to the App

This composition spec is upstream of the app.

The app should assume:

- not every turn is playable
- only designated flaw turns become warm-ups or levels
- the rest of the transcript exists to make the episode coherent and readable

That separation is intentional.
