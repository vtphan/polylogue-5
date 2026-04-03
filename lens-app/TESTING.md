# Lens App — E2E Manual Testing Guide

This guide walks through setup and the full testing flow: Researcher imports scenarios, Teacher sets up a class and session, Students complete the session, Teacher reviews results.

**Prerequisite:** Node.js 18+ installed.

---

## 1. Setup

```bash
cd lens-app

# Install dependencies
npm install

# Initialize database and seed accounts
npx prisma migrate deploy
npm run db:seed
```

The seed creates:

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Researcher | `researcher` | `researcher123` | System admin |
| Teacher | `teacher` | `teacher123` | Ms. Rivera |
| Students | — | No password | 6 students (join code + name selection) |

Seed also creates **Period 3** (class), 6 enrolled students, and 2 groups (A, B).

### Start the dev server

```bash
npm run dev
```

App runs at **http://localhost:3000**. Open it in a browser.

---

## 2. Researcher Flow

### 2.1 Log in

Go to `/login`. Enter `researcher` / `researcher123`. You land on the researcher dashboard.

### 2.2 Import scenarios

In the **Scenarios** section, enter the registry path in the import field:

```
../registry
```

Click **Import**. Three scenarios should import (garden-water-supply-decision, ocean-vs-deforestation-project, recycling-sorted-vs-single-stream). Each appears in the scenario list with status "available".

### 2.3 Explore scenarios

- Click a scenario to view its details.
- Click **Artifacts** to open the annotated artifact viewer (Transcript, Analysis, Scaffolding, Facilitation tabs).
- Click **Pipeline** to see the 5-stage pipeline walkthrough with the information barrier.

### 2.4 Framework Explorer

Click **Explorer** in the navigation. Walk through:
- **Core Essence** — the Lens → Facet → Explanatory Variable flow diagram
- **Illustrative Example** — the museum/amusement park passage with three lenses
- **Reference** — tabbed inventory of all facets, lenses, explanatory variables, connections

### 2.5 Observatory

Click **Observatory**. Shows aggregate stats (teachers, classes, sessions, students). Will be empty until sessions are run.

### 2.6 Create a teacher account (optional)

In the **Teachers** section, create a second teacher account to verify the flow.

---

## 3. Teacher Flow

### 3.1 Log in

Log out, then log in as `teacher` / `teacher123`. On first login, the **pedagogy primer** appears (5-card walkthrough). Page through it or dismiss. It's always available via the "How it works" link in the header.

### 3.2 Verify class setup

The dashboard shows **Period 3** (seeded). Click it. Three tabs:

- **Students** — 6 students listed. Try batch-adding a new student (type a name, click Add). Try removing one.
- **Groups** — Group A (3 students), Group B (3 students), plus an Ungrouped pool. Drag students between groups using drag-and-drop.
- **Sessions** — empty for now.

### 3.3 Create a session (wizard)

Click **New Session** from the Sessions tab (or the class detail page).

| Step | What to do |
|------|------------|
| **1. Select Scenario** | Pick one of the imported scenarios (e.g., garden-water-supply-decision) |
| **2. Discussion Briefing** | Read through the scenario overview, personas, and facilitation guide. Scroll to the bottom. |
| **3. Configure** | Set lens mode to "Assign" or "Choice". Select passages (default: all). Toggle sentence starters and reference lists on. Set thresholds (e.g., 2 passages for Evaluate, 2 for Explain). |
| **4. Review Groups** | Verify groups have 2+ members each. Drag students if needed. |
| **5. Review & Activate** | Review the summary. Click **Activate Session**. A join code appears. |

Copy the **join code** — you'll need it for student login.

### 3.4 Monitor the session

After activation, you land on the monitoring dashboard:
- Join code displayed prominently at top.
- Left panel: groups with per-student status dots.
- Right: click a student name to see their response trail.
- Toggle the **Facilitation Guide** panel to see per-passage, per-step guidance.
- The guide auto-detects the current phase/step from student progress.

Leave this tab open — it polls every 3 seconds.

---

## 4. Student Flow

**Use a separate browser or incognito window for each student.** To test the full group flow, you need at least 2 students from the same group logged in simultaneously.

### 4.1 Log in

Go to `/student-login`. Enter the **join code** from step 3.3. Select a student name from the roster. You land on the student dashboard.

### 4.2 Enter the session

Click the active session card. Walk through:
1. **Onboarding** — topic, context, persona cards
2. **Reading** — chat-style transcript (scroll to the bottom to proceed)
3. **Lens Assignment** — assigned a lens (or choose one, depending on config)

### 4.3 Evaluate Phase — Individual

- Tap passage icons in the transcript to open the passage modal.
- For each passage: select Strong/Weak, write an observation, submit.
- Try the **hint button** — a directional prompt appears.
- If a misreading is detected, a redirect prompt appears after submission.
- After meeting the threshold, "Ready for Peer Discussion" appears.

### 4.4 Evaluate Phase — Peer

- Click "Ready for Peer Discussion".
- Peers' responses appear progressively as they arrive (poll every 3s).
- Disagreement highlighting shows dashed amber borders on interesting differences.
- Add post-peer observations in the append boxes.
- "Move to AI Step" is disabled until at least one peer has shared responses.

### 4.5 Evaluate Phase — AI

- AI perspective shown per passage.
- Write a reflection (required, even one sentence).

### 4.6 Evaluate Phase — Consensus

- Waits for all group members to finish AI step (or teacher overrides via monitoring dashboard).
- For each passage: review AI perspective + peer reflections, then submit Agree/Disagree + rationale.
- After one member submits, other members see an append box to add their thoughts.

### 4.7 Explain Phase

Same four-step cycle (Individual → Peer → AI → Consensus) adapted for "Why did they think this way?":
- Bridge prompt connects Evaluate observations to Explain task.
- Sentence starters and reference lists available (if enabled).
- AI perspective introduces cognitive/social vocabulary.

### 4.8 Session Complete

Summary screen shows passages evaluated/explained, lens used, and consensus outcomes.

---

## 5. Teacher Post-Session

### 5.1 Close the session

On the monitoring dashboard, click **Close Session**.

### 5.2 Review

Click **Review** (or navigate to the session review page). Five tabs:

| Tab | What it shows |
|-----|---------------|
| **By Passage** | Student articulations grouped by lens, plus consensus entries |
| **By Student** | Full response trail per student (eval + explain, sorted by time) |
| **By Group** | Group consensus positions with preceding AI reflections |
| **Engagement** | Behavioral signals per student (word count, hints, redirects, peer influence, etc.) |
| **Growth** | Cross-session trends: perspectival range, articulation depth, independence, engagement |

### 5.3 Write growth notes

In the Engagement tab, scroll to a student's card. Write a qualitative growth note in the textarea and save. This note is visible to the student on their dashboard.

### 5.4 Student dashboard

Log in as a student who completed the session. The dashboard shows:
- Journey map (session timeline)
- Lens collection (filled icons for lenses used)
- Curiosity trail (passages beyond threshold)
- Voice marker (sessions with peer additions)
- Team marker (sessions with consensus)
- Teacher's note (read-only)

---

## 6. Multi-Student Testing Tips

Testing the full peer + consensus flow requires **2+ students in the same group** logged in at the same time. Options:

- **Multiple browsers:** Use Chrome, Firefox, Safari, and/or incognito windows. Each gets its own session cookie.
- **Key timing:** The peer step shows responses progressively. The consensus step has a hard gate requiring all members to finish AI. Use the teacher's **Skip Gate** button on the monitoring dashboard to bypass waiting.
- **Offline testing:** Disconnect a student's browser from the network mid-session. The sync indicator should show "Saved locally". Reconnect — responses sync automatically.

---

## 7. Database Location and Reset

The database is a single SQLite file at:

```
lens-app/prisma/dev.db
```

You can delete it at any time to start completely from scratch. Nothing else depends on it — all schema information lives in the migration files, and seed data is re-creatable.

To reset:

```bash
cd lens-app

# Delete the database
rm prisma/dev.db

# Recreate schema and seed accounts
npx prisma migrate deploy
npm run db:seed
```

This gives you a clean database with the seeded researcher, teacher, 6 students, 1 class, and 2 groups. You'll need to re-import scenarios from the researcher dashboard.

If the dev server is running, restart it after resetting (`Ctrl+C`, then `npm run dev`).

---

## 8. Test Student Names for Batch Insert

Copy-paste this block into the batch student creation textarea (Students tab → Add Students). One name per line, 40 names:

```
Aiden Nakamura
Bella Santiago
Caleb Okonkwo
Diana Petrova
Elijah Moreau
Fatima Al-Rashid
Gabriel Johansson
Hannah Mwangi
Isaac Delgado
Jasmine Kaur
Kai Ramirez
Lena Ivanova
Mateo Ferreira
Nia Osei
Oscar Lindqvist
Priya Chatterjee
Quinn Mbeki
Rosa Takahashi
Sami Khoury
Talia Bergstrom
Uma Krishnamurthy
Victor Almeida
Wendy Zhao
Xavier Dembele
Yara Andersen
Zion Baptiste
Amara Volkov
Benicio Cruz-Reyes
Celeste Ndiaye
Declan O'Sullivan
Esme Fujimoto
Farid Hashemi
Greta Sundberg
Hugo Castellanos
Iris Papadopoulos
Jamal Eriksson
Kiera Tran-Nguyen
Luca De Rossi
Mika Jonasson
Noor El-Amin
```
