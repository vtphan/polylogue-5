# Polylogue — Research Overview

Polylogue teaches critical thinking to middle school students (grades 6-8) through evaluation of AI-generated group discussions. Students read a scripted conversation between fictional peers, then articulate what they see in the reasoning — where it is sound and where it is weak — and consider why the characters reasoned the way they did.

## The Framework

Students examine reasoning through three **lenses**: Evidence (is the claim supported?), Logic (does the reasoning hold?), and Scope (is the analysis thorough?). These direct attention without constraining what students see.

Behind the lenses, a hidden layer of **facets** gives reasoning its internal complexity — specific dimensions like source credibility, inferential validity, or perspective engagement. Students discover facets through their own articulation without being taught them. The pipeline uses facets as generation targets; teachers use them as scaffolding vocabulary; students never see the taxonomy.

When students consider *why* the characters reasoned the way they did, they draw on **cognitive patterns** (individual thinking tendencies like confirmation bias, tunnel vision, overgeneralization) and **social dynamics** (group forces like group pressure, conflict avoidance, authority deference). These interact — "she had tunnel vision, and nobody pushed back, so she just kept going" — and that interaction is the framework's deepest learning objective.

For the full ontology — lenses, facets, explanatory variables, and how they relate — see `framework/docs/conceptual-framework.md`.

## What Students Learn

**Evaluative differentiation** — Moving from "that's bad reasoning" to pinpointing specific dimensions of strength and weakness.

**Perspectival engagement** — Moving from "I'm right and you're wrong" to "we saw different things, and both are there."

**Explanatory reasoning as perspective taking** — Considering why people reason the way they do, connecting cognitive patterns and social dynamics.

## The Pipeline

An AI pipeline generates all session materials from authored stories with recurring casts. Each episode produces a scripted discussion, an analytical ground truth, diagnostic interventions (probes, intervention ladders), prose (openings, starters, closure questions), and group discussion cues. The pipeline has LLM access; the student-facing app does not — everything it needs at runtime is precomputed into a single `assistive_package.yaml` per episode.

See `framework/docs/pipeline-architecture.md` for the full specification.
