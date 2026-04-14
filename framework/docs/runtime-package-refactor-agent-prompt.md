Implement the runtime-package refactor using these documents as the source of truth:

- `framework/docs/runtime-package-refactor.md`
- `framework/docs/runtime-package-refactor-implementation-plan.md`
- `framework/docs/runtime-package-refactor-roadmap.md`

Treat the roadmap as the sequencing guide and begin with Phase 1 unless you
discover a concrete blocker that requires pulling a narrowly scoped Phase 2
change forward.

The key architectural rule is:

- keep the current four generated authoring artifacts
- refactor the merged `assistive_package.yaml` into a runtime-first package

Do not collapse the authoring artifacts into a single file. Do not make Lens or
other downstream apps read raw authoring files directly.

Phase 1 implementation target:

1. Refactor `assistive_package.yaml` so it has at least these top-level runtime
   sections:
   - `package_meta`
   - `analytic_core`
   - `front_door_support`
   - `diagnostic_support`
   - `discussion_support`
2. Add first-class `front_door_support` with exactly these four support types:
   - `attention_targets`
   - `sentence_frame_seeds`
   - `modeled_episode_examples`
   - `transfer_examples`
3. Update the relevant schemas, especially:
   - `framework/schemas/assistive_package.yaml`
   - `framework/schemas/prose.yaml`
4. Refactor `framework/pipeline/scripts/merge_assistive_package.py` so it acts
   as a runtime projection layer, not a simple merge layer.
5. Update:
   - `framework/pipeline/agents/prose_agent.md`
   - `framework/pipeline/agents/package_reviewer.md`
   - `.claude/commands/build_assistive_package.md`
6. Preserve existing diagnostic ladders and discussion supports as much as
   possible in Phase 1.
7. Validate the result against `the-field-trip` episodes 1-3 and report any
   gaps or blockers clearly.

Important design intent:

- startup support is the highest-leverage problem to solve first
- front-door support must help students begin without replacing the task
- every startup scaffold should hand students back to the episode
- keep student-facing language simple, specific, and free of hidden framework
  IDs or internal jargon

When making decisions, prioritize:

1. Lens's chance of success with novice students
2. clarity of the runtime contract for downstream apps
3. preservation of the authoring pipeline's modularity

If implementation forces a tradeoff, favor a cleaner runtime package over
backward compatibility, unless you find an active consumer that would break.
