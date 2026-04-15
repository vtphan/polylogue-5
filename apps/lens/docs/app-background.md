# Lens App Background and Product Constraints

This document records the stable background, purpose, and operating constraints of the **Lens** app. It is not an instructional-design specification and it is not tied to any one generation pipeline format.

Its purpose is to preserve what should remain fixed even as instructional designs, assistive-package schemas, UI flows, and pedagogical strategies evolve.

---

## Purpose

Lens is a classroom application for helping middle-school students practice **critical thinking about group reasoning**.

Students do this by working with AI-generated discussion episodes and associated assistive materials prepared in advance by the pipeline. The app itself does **not** generate content at runtime. Its role is to present prepared materials, structure student interaction around them, and support classroom use.

The core educational object is not a quiz item or a chatbot exchange. It is an **episode**: a short, authored discussion that students analyze as an example of how people reason together.

---

## Target Classroom Context

Lens is designed for a specific instructional setting:

- Students are in **middle school**.
- Sessions happen during a **Friday period** within a broader school schedule.
- Students are working in **project-based learning (PBL)** contexts.
- They typically work in **groups of 3-5 students**.
- Students access Lens on **laptops or tablets** while seated in those groups.
- Lens is used during a limited number of class periods allocated to critical-thinking work, not as a full daily curriculum.

This context matters because the app is not optimizing for solitary long-form study, open-ended tutoring, or individualized adaptive instruction as its primary mode. It is optimizing for short, structured classroom sessions that sit alongside ongoing PBL work.

---

## Educational Setting Within PBL

Lens is not the PBL project itself. It is a mechanism for helping students practice habits of critical thought that should transfer back into their project discussions, decisions, and collaborative reasoning.

The intended transfer is from:

- analyzing a discussion episode created by the pipeline

to:

- noticing the quality of reasoning in students' own project conversations
- discussing disagreements more carefully
- giving better reasons, using better evidence, and considering wider perspectives

In other words, Lens is a **supporting critical-thinking environment** attached to PBL, not a replacement for PBL.

---

## Core Learning Medium: Episodes

The main content students encounter in Lens is a set of AI-generated **episodes**. These episodes function as worked examples or discussion cases.

An episode is a short discussion that students can inspect, interpret, and debate. It is designed so that the reasoning within it is rich enough to analyze and discuss.

The current product vision assumes that students will review episodes such as those in `artifacts/strangers-in-the-old-forest/`, including the first two episodes, as exemplars of the kind of material Lens is built to support.

This means Lens should be designed around:

- reading and revisiting a shared episode
- examining specific moments or passages within that episode
- comparing interpretations
- discussing why the participants in the episode reasoned as they did

The app is therefore episode-centered, not tool-centered.

---

## Role of Assistive Packages

Lens receives **assistive packages** prepared upstream by an LLM-enabled pipeline. These packages provide the structured support students and teachers need in order to work with an episode.

The exact schema of an assistive package may change over time. That is an implementation detail, not a product constant.

What remains constant is that assistive packages exist to make episode analysis possible without requiring live model calls in the classroom. They may support things such as:

- passage selection
- prompts and scaffolds
- explanatory support at different levels of cognitive load
- teacher-facing facilitation support
- student-facing guidance for noticing and explaining reasoning

The app should be designed to consume such precomputed support, even if the packaging format changes.

---

## Runtime Constraint: Lens Is Non-LLM

A core product constraint is that **Lens is non-LLM at runtime**.

That means:

- the app does not rely on a live model during class
- student interaction is not a chatbot interaction
- instructional support must come from precomputed artifacts
- the classroom experience should remain stable, deterministic, and reviewable

This constraint is fundamental to the app's identity and should not be treated as a temporary implementation shortcut.

---

## Stable Pedagogical Commitments

The detailed instructional design can change, but several pedagogical commitments are core to the current product direction:

- students first work **individually** with the materials
- students then **discuss with peers**
- support can be offered at **different levels of cognitive load**
- those differentiated supports are mediated by the **assistive packages**

These commitments should be treated as stable unless the product vision itself changes.

They imply that Lens should support both:

- private sense-making
- collaborative sense-making

The app should not collapse the experience into only individual work or only group discussion.

---

## What Is Fixed vs. What Can Change

### Fixed

The following are product-level constraints for Lens:

- middle-school audience
- small-group classroom use
- laptop/tablet classroom use during group activity
- Friday-period / limited-session instructional setting
- attachment to PBL contexts
- episodes as the primary learning medium
- assistive packages generated upstream
- no LLM at runtime
- individual work followed by peer discussion
- differentiated support for different cognitive loads

### Changeable

The following should be treated as design variables:

- the exact instructional sequence within a session
- the specific pedagogical stance taken toward guidance, struggle, and reflection
- the schema and organization of assistive packages
- how passages, prompts, and supports are surfaced in the UI
- assessment and progression mechanics
- teacher facilitation patterns
- visual design, interaction design, and navigation structure

This distinction is important. Future design work should feel free to revise instructional design documents and runtime UX without reopening the basic purpose of the app.

---

## Product Implications

Because of the context above, Lens should generally be designed as:

- a shared classroom discussion environment, not a personalized AI tutor
- a structured analysis tool, not an open sandbox
- a bridge from exemplar discussions to students' own project reasoning
- a system that helps teachers orchestrate critical-thinking practice in limited time

Lens should also assume that teachers can require students to begin the activity, but that the app itself must help sustain engagement once students are seated with devices. Teacher authority may initiate participation, but it should not be the primary mechanism that keeps students involved from moment to moment.

Design choices should be evaluated against that reality.

If a proposed feature fits individual tutoring but not small-group classroom analysis, it is probably misaligned. If a feature depends on live model generation, it is misaligned. If a flow ignores transfer back into PBL discussion, it is incomplete.

---

## Relationship to Other Lens Documents

This document should be read as the stable background layer for Lens documentation.

- Use this file for product context and non-negotiable constraints.
- Use `instructional-design.md` for the current pedagogical design, knowing that it may evolve.
- Use `pipeline-spec.md` for the current artifact and pipeline contract.
- Use `teacher-overview.md` for a concise audience-facing summary of the project.

When instructional design changes, this document should usually remain stable unless the product vision itself changes.
