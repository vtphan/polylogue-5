# Polylogue — Research Overview

Polylogue teaches critical thinking to middle school students (grades 6-8) through evaluation of AI-generated group discussions. Students read a scripted conversation between fictional peers, then articulate what they see in the reasoning — both where it is sound and where it is weak — and consider why the characters reasoned the way they did.

*For the full conceptual framework with justifications, see `docs/polylogue-v5-6.md`.*

---

## The Framework

Students examine reasoning through three **lenses**: Evidence (is the claim supported?), Logic (does the reasoning hold?), and Scope (is the analysis thorough?). These direct attention without constraining what students see.

Behind the lenses, a hidden layer of **facets** gives the reasoning its internal complexity — specific dimensions like source credibility, inferential validity, or perspective engagement. Students discover facets through their own articulation without ever being taught them. The pipeline uses facets as generation targets; teachers use them as scaffolding vocabulary; students never see the taxonomy.

When students consider *why* the characters reasoned the way they did, they draw on **cognitive patterns** (individual thinking tendencies like confirmation bias, tunnel vision, overgeneralization) and **social dynamics** (group forces like group pressure, conflict avoidance, authority deference). These interact — "she had tunnel vision, and nobody pushed back, so she just kept going" — and that interaction is the framework's deepest learning objective.

---

## The Session

Students sit together in groups of 2-4 with a shared screen. They read a scripted discussion, then work through highlighted passages ordered from most accessible to most subtle. Each passage moves through a state machine:

**Diagnose** — Each student writes their own diagnosis of the passage and tags it with a lens. You can't see peers' diagnoses until you've submitted your own. Students talk at the table while working — writing is the gate, not silence.

**Discuss** — All diagnoses become visible. The group discusses face-to-face and produces an **assessment** — their collaborative reading of the passage.

**Reviewing AI** — The AI perspective becomes available: either by spending a lifeline (before submitting an assessment) or free (after submitting). The AI offers integrated observations and explanations — what it notices and why the characters may have reasoned this way. It's one more voice, not the answer.

**Submit Assessment** — The group records their assessment. It's always revisable. They can update any previous passage at any time.

Passages progress asynchronously — groups work at their own pace. Each AI reveal calibrates how students approach the next passage.

After all groups finish, the **teacher** leads a whole-class debrief — synthesizing across groups, surfacing what different groups saw, introducing formal vocabulary where it adds precision. The teacher is the real expert. The teacher records an assessment note in the app.

---

## Scaffolding

Each passage has a **graduated scaffold sequence**: one or more hints (each costing a lifeline from a shared pool) leading to the AI perspective as the final entry. Hints direct attention to *where* to look, not *what* to see. Even the last hint doesn't give away the answer.

Three automatic mechanisms fire without student action: misreading redirects (catch common errors after submission), deepening probes (push students further), and difficulty ordering (sequence passages easy to hard).

---

## Interaction

All student work happens in **chat-style threads** — messages appended, never edited. Individual diagnoses, group discussion, assessments, reactions to scaffolds, and reactions to the AI perspective are all messages in the passage thread. This captures the deliberation trace naturally and rewards engagement.

Students learn through two complementary modes: **articulation** (written, precise, committed) and **brainstorming** (verbal, generative, exploratory). The app captures articulation. The classroom enables brainstorming. Both are essential.

---

## What Students Learn

**Evaluative differentiation** — Moving from "that's bad reasoning" to pinpointing specific dimensions of strength and weakness.

**Perspectival engagement** — Moving from "I'm right and you're wrong" to "we saw different things, and both are there."

**Explanatory reasoning as perspective taking** — Considering why people reason the way they do, connecting cognitive patterns and social dynamics.

---

## The Pipeline

An AI pipeline generates all session materials: a scripted discussion (predominantly weak reasoning with genuine sound moments), an expert analysis, scaffolding materials (hints, probes, redirects, rubrics), a facilitation guide for the teacher, and a session configuration. The pipeline has LLM access; the app does not. Everything the app needs at runtime is baked into the artifacts.

---

## What the System Captures

- Individual diagnoses and lens tags
- Group discussion messages and assessments
- Scaffold consumption (which hints, when)
- Post-AI-voice responses and assessment revisions
- Engagement metrics (message count, participation distribution)
- Teacher assessment notes
