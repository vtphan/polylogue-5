# Lens v1 Implementation Readiness

This document closes the remaining gaps between the Lens v1 design docs and a code-ready implementation plan.

It is intentionally practical. It does not reopen product design. It records the implementation defaults that unblock schema work, loader work, state modeling, and slice planning.

This document should be read alongside:

- `technical-specs-v1.md`
- `wireframes-v1.md`
- `pipeline-spec.md`
- `framework/schemas/assistive_package.yaml`

---

## 1. Readiness Verdict

Lens v1 is ready for implementation planning and slice execution after adopting the defaults in this document.

No blocking design decision is required from the user before work starts.

There are still future editorial and visual-design choices to make, but they do not block the first implementation slices.

Implementation target note:

- the Lens v1 app should be built as a new Next.js app under `apps/lens/`
- `lens-app/` should be treated as legacy reference material, not as the implementation base

---

## 2. Runtime Contract Defaults

### 2.1 Schema Sources of Truth

For implementation, the app should use the following schema ownership model:

- `assistive_package.yaml`
  - normative shape source: `framework/schemas/assistive_package.yaml`
  - verification source: checked-in pilot artifacts under `artifacts/{story_id}/episodes/episode_{NN}/assistive_package.yaml`
  - planning note: `apps/lens/docs/pipeline-spec.md` describes the contract and field families, but it is not the only shape source

- `transcript.yaml`
  - normative shape source: checked-in transcript artifacts under `artifacts/{story_id}/episodes/episode_{NN}/transcript.yaml`
  - implementation note: Lens should define an app-local Zod schema matching the transcript fields it actually consumes

- session config
  - normative shape source: Lens app-local schema
  - design constraints source: `technical-specs-v1.md` § 2.5 and § 3.2.1

- browser persistence records
  - normative shape source: Lens app-local schema
  - design constraints source: `technical-specs-v1.md` § 6.3 and `wireframes-v1.md` § 5

### 2.2 Turn-ID Normalization

The checked-in runtime artifacts currently use two turn-ID forms:

- `transcript.yaml` uses `turn_02`-style IDs
- `assistive_package.yaml` uses `t02`-style IDs

Lens v1 should treat this as an explicit normalization boundary in the content loader.

Default rule:

- transcript canonical source ID: `turn_02`
- package canonical source ID: `t02`
- app-normalized turn key: `t02`

Normalization functions should be deterministic:

- transcript -> app key: `turn_02` -> `t02`
- app key -> transcript key: `t02` -> `turn_02`

The app should normalize once at load time rather than mixing both forms across UI state.

### 2.3 Primitive-to-UI Contract Check

The pilot `assistive_package.yaml` contains all primitive families currently required by the v1 surfaces:

- `front_door_support.attention_targets`
- `front_door_support.sentence_frame_seeds`
- `front_door_support.modeled_episode_examples`
- `front_door_support.transfer_examples`
- `diagnostic_support.probes`
- `diagnostic_support.interventions`
- `diagnostic_support.struggle_calibration`
- `discussion_support.discussion_cues`
- `discussion_support.talk_moves`
- `discussion_support.consensus_checks`

For v1 implementation, any missing UI data after load should be treated as:

- a schema-validation failure for required runtime fields, or
- an explicit app-owned derived field that is documented in code

The app should not silently invent support content when required package content is absent.

---

## 3. Session Config Default

For v1, the session-config loading mechanism should default to:

1. bundled manifest discovery for normal demo use
2. optional direct-open query parameter for a specific config
3. manual recovery path only when no bundled config resolves

This keeps the normal path simple while still allowing direct links.

Recommended implementation shape:

- bundled manifest file listing available session configs
- each config includes:
  - `config_id`
  - `episode.source`
  - optional `group`
  - optional `ui.starting_student_id`
  - optional `ui.pacing`

### 3.1 Bundled Manifest Shape

For v1, the bundled manifest should be app-owned and minimal.

One reasonable shape:

```json
{
  "manifest_version": 1,
  "sessions": [
    {
      "config_id": "forest-ep01-table-a",
      "label": "Strangers in the Old Forest · Episode 1 · Table A",
      "config_path": "configs/lens/forest-ep01-table-a.json",
      "story_id": "strangers-in-the-old-forest",
      "episode_number": 1,
      "sequence_index": 0,
      "next_config_id": "forest-ep02-table-a"
    }
  ]
}
```

Required manifest fields:

- `manifest_version`
- `sessions[]`
- `sessions[].config_id`
- `sessions[].label`
- `sessions[].config_path`
- `sessions[].story_id`
- `sessions[].episode_number`

Optional manifest sequencing fields:

- `sessions[].sequence_index`
- `sessions[].next_config_id`

Recommended direct-open query parameter:

- `?config=<config_id>`

The app should not require raw YAML paste or arbitrary file upload in v1 slice 1.

### 3.2 Multi-Episode Sequencing Rule

For v1, `session config` remains singular and episode-local.

That means:

- one session config points to one episode source
- multi-episode continuation is owned by the bundled manifest, not by an array inside the session config
- the completion flow may offer `next episode` only when the manifest resolves a valid next config for the current config

If no manifest sequencing metadata is present, the app should treat the current session as a single-episode session and omit `next episode`.

---

## 4. Persistence Defaults

### 4.1 Key Strategy

Use namespaced `localStorage` keys:

- `lens:v1:session-index`
- `lens:v1:session:<local_session_id>`
- `lens:v1:ui:last-session`

### 4.2 Record Strategy

Use one persisted record per local session.

That record should include:

- `local_session_id`
- `config_id`
- `episode_source`
- `roster`
- `roster_order`
- `active_student_id`
- `next_responder_id`
- `current_focal_turn_id`
- `current_backbone_stage`
- `pacing_policy`
- `responses`
- `evaluative_judgments`
- `cohort_response_state`
- `scaffold_usage`
- `comparison_state`
- `discussion_state`
- `recognition_state`
- `progress_state`
- `transfer_takeaway`
- `updated_at`

The session index should hold only summary metadata needed for the Start / Resume screen.

### 4.3 Persistence Rule

Persist at these checkpoints:

- roster confirmed
- active student changed
- response saved
- revision saved
- discussion milestone changed
- recognition awarded
- stopping point reached
- explicit pause selected

For v1, `discussion milestone changed` should mean coarse checkpoints rather than every small interaction. Persist when:

- the first discussion cue for the focal turn is opened
- a consensus check is completed
- the group exits discussion into revision

---

## 5. Backbone and Stage Defaults

### 5.1 Student-Facing Stage Enum

Use this stage enum in app state and the persistent stage indicator:

- `read`
- `respond`
- `compare`
- `discuss`
- `revise`

### 5.2 Evaluate Mapping

The design docs include a distinct evaluative move, but the persistent stage indicator should not add a separate `evaluate` stage in v1.

Default:

- the evaluative move is part of `respond`
- `respond` includes:
  - initial response
  - basic evaluative judgment
  - immediate support access before cohort comparison

This preserves the five-stage wireframe indicator while keeping the evaluative prompt explicit in the response UI.

### 5.3 Stopping-Point Rules

The activity engine should surface stopping-point prompts only at the three checkpoints already implied by the upstream Lens docs:

1. after all first responses for the current focal turn are saved
2. after the group reaches revision for the current focal turn
3. after episode completion / transfer prompt

For `guided` pacing, the app surfaces stopping-point prompts at those checkpoints.

For `open` pacing, the app records the same checkpoints but does not interrupt with a dedicated prompt unless the user explicitly pauses.

The app may still persist silently at other structural checkpoints such as roster confirmation or focal-turn selection, but those should not surface as `good stopping point` prompts in v1.

### 5.4 Validation Failure Behavior

If required content fails schema validation, the app should not degrade silently.

Default behavior:

- fail the current load
- show the corresponding empty/error state
- offer recovery actions such as retry, choose another session, or return to start

Missing required keys and malformed values should be treated as load failures.

Present-but-empty optional collections may still be valid when allowed by the schema and should not be treated as equivalent to missing required keys.

---

## 6. Audience-Fit Editorial Default

Do not block implementation on the audience-fit editorial pass.

Default:

- implement against current package-authored support strings
- keep app-owned chrome labels concise and neutral
- track wording polish as a follow-up editorial pass

If a string is clearly placeholder-like or inconsistent, note it during implementation, but do not stop schema, loader, or flow work on that basis.

---

## 7. Slice Order and Dependencies

Use this implementation order rather than the raw wireframe numbering:

1. Scaffold the greenfield Next.js app in `apps/lens/`
2. Zod schemas for package, transcript, session config, manifest, and persistence records
3. Content loader and turn-ID normalization
4. Bundled manifest loading and session-config discovery
5. Session store, persistence layer, and resume bootstrap
6. Activity engine foundation
7. Start / Resume, Group Setup, and Episode Landing shell
8. Episode Reading View and focal-turn selection
9. First Response View with evaluative judgment inside `respond`
10. Support Panel backed by front-door and diagnostic primitives
11. Comparison View
12. Discussion / Deepening View
13. Revision / Continue flow and stopping-point prompts
14. Episode completion, transfer prompt, and next-session handoff
15. Progress / recognition layer
16. Empty and error states hardening

Key dependency note:

- slice 1 should establish the new app shell, folder structure, and baseline tooling without inheriting old `lens-app/` architecture
- slice 6 should define stage ownership, support-availability rules, and surfaced stopping-point detection before slices 8-13 expand UI behavior
- baseline error handling should ship with slices 3-7 for failed loads and missing session resolution, even if the full error-state polish lands later

---

## 8. Definition of Implementation Readiness

Lens v1 is implementation-ready when the team agrees to the defaults above and treats the following as mandatory:

- every runtime field consumed by the UI has a schema source
- transcript/package turn-ID normalization is implemented intentionally
- the activity engine uses a fixed stage enum
- stopping-point predicates are enumerated rather than implied
- browser persistence shape is app-owned and versioned
- session-config loading has one default path for v1

At this point, implementation can begin without waiting for another design round.
