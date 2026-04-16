import { z } from "zod";

const TurnTokenSchema = z.string().regex(/^t\d+$/);
const TranscriptTurnTokenSchema = z.string().regex(/^turn_\d+$/);

export const manifestEntrySchema = z.object({
  config_id: z.string().min(1),
  label: z.string().min(1),
  config_path: z.string().min(1),
  story_id: z.string().min(1),
  episode_number: z.number().int().positive(),
  sequence_index: z.number().int().nonnegative().optional(),
  next_config_id: z.string().min(1).optional(),
});

export const manifestSchema = z.object({
  manifest_version: z.literal(1),
  sessions: z.array(manifestEntrySchema).min(1),
});

export const sessionConfigSchema = z.object({
  config_id: z.string().min(1),
  episode: z.object({
    source: z.string().min(1),
  }),
  group: z
    .object({
      name: z.string().min(1).optional(),
      students: z
        .array(
          z.object({
            id: z.string().min(1),
            name: z.string().min(1),
          }),
        )
        .min(1),
    })
    .optional(),
  ui: z
    .object({
      pacing: z.enum(["guided", "open"]).default("guided"),
      starting_student_id: z.string().min(1).optional(),
    })
    .optional(),
});

export const transcriptSchema = z.object({
  story_id: z.string().min(1),
  episode_number: z.number().int().positive(),
  scenario_id: z.string().min(1).optional(),
  personas: z.array(
    z.object({
      name: z.string().min(1),
      perspective: z.string().min(1),
    }),
  ),
  turns: z.array(
    z.object({
      speaker: z.string().min(1),
      turn_id: TranscriptTurnTokenSchema,
      sentences: z.array(
        z.object({
          text: z.string().min(1),
          sentence_id: z.string().min(1),
        }),
      ),
    }),
  ),
});

const packageMetaSchema = z.object({
  story_id: z.string().min(1),
  episode_number: z.number().int().positive(),
  scenario_id: z.string().min(1).optional(),
  schema_version: z.string().min(1),
  integrity: z.object({
    checks_passed: z.number().int().nonnegative(),
    checks_total: z.number().int().positive(),
    timestamp: z.string().min(1),
  }),
});

const analyticPassageSchema = z.object({
  passage_id: z.string().min(1),
  target_passage_id: z.string().min(1),
  target_turn_ids: z.array(TurnTokenSchema).min(1),
  target_character_ids: z.array(z.string().min(1)).min(1),
  turn_range: z.array(TurnTokenSchema).optional(),
  lens_visibility: z.record(z.string(), z.unknown()).optional(),
  facets_present: z.array(z.record(z.string(), z.unknown())).optional(),
});

const supportPrimitiveBaseSchema = z.object({
  passage_id: z.string().min(1),
  support_id: z.string().min(1),
  use_when: z.string().min(1),
});

const supportTextPrimitiveSchema = supportPrimitiveBaseSchema.extend({
  lens: z.string().min(1).optional(),
  source_turns: z.array(TurnTokenSchema).optional(),
});

export const interventionLadderStepSchema = z.object({
  type: z.string().min(1),
  text: z.string().min(1).optional(),
  reveals: z.number().int().nonnegative().optional(),
  cost: z.number().int().nonnegative().optional(),
  routes_to: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const assistivePackageSchema = z.object({
  package_meta: packageMetaSchema,
  analytic_core: z.object({
    passages: z.array(analyticPassageSchema).min(1),
    prior_exposure: z.array(z.record(z.string(), z.unknown())),
  }),
  front_door_support: z.object({
    attention_targets: z.array(
      supportTextPrimitiveSchema.extend({
        text: z.string().min(1),
      }),
    ),
    sentence_frame_seeds: z.array(
      supportTextPrimitiveSchema.extend({
        frame: z.string().min(1),
        seed: z.string().min(1),
      }),
    ),
    modeled_episode_examples: z.array(
      supportTextPrimitiveSchema.extend({
        model_text: z.string().min(1),
        why_this_counts: z.string().min(1),
        handoff_prompt: z.string().min(1),
      }),
    ),
    transfer_examples: z.array(
      supportTextPrimitiveSchema.extend({
        example_text: z.string().min(1),
        why_this_counts: z.string().min(1),
        handoff_prompt: z.string().min(1),
      }),
    ),
  }),
  diagnostic_support: z.object({
    probes: z.record(z.string(), z.unknown()),
    interventions: z.record(z.string(), z.unknown()),
    struggle_calibration: z.record(z.string(), z.unknown()),
  }),
  discussion_support: z.object({
    discussion_cues: z.record(z.string(), z.unknown()),
    talk_moves: z.array(z.string()),
    consensus_checks: z.array(z.string()),
  }),
  teacher_support: z.object({
    calibration_warnings: z.array(z.string()).optional(),
  }),
});

export const runtimePhaseSchema = z.enum(["read", "warmup", "level", "complete"]);

export const warmupStateSchema = z.object({
  modeled_complete: z.boolean(),
  guided_complete: z.boolean(),
});

export const levelResponseSchema = z.object({
  level_id: z.string().min(1),
  turn_id: TurnTokenSchema,
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(1),
  initial_answer: z.string().min(1),
  final_answer: z.string().min(1),
  support_requested: z.boolean(),
  support_steps_viewed: z.array(z.string().min(1)),
  answer_changed: z.boolean(),
  completed_at: z.string().min(1),
});

export const persistedSessionSchema = z.object({
  local_session_id: z.string().min(1),
  config_id: z.string().min(1),
  episode_source: z.string().min(1),
  current_phase: runtimePhaseSchema,
  pacing_policy: z.enum(["guided", "open"]),
  reading_complete: z.boolean(),
  warmup_state: warmupStateSchema,
  current_level_id: z.string().min(1).nullable(),
  current_turn_id: TurnTokenSchema.nullable(),
  level_order: z.array(z.string().min(1)).min(1),
  completed_level_ids: z.array(z.string().min(1)),
  responses: z.record(z.string(), levelResponseSchema),
  scaffold_usage: z.record(z.string(), z.array(z.string().min(1))),
  badge_state: z.object({
    earned: z.array(z.string().min(1)),
  }),
  progress_state: z.object({
    episode_complete: z.boolean(),
  }),
  updated_at: z.string().min(1),
});

export const sessionIndexEntrySchema = z.object({
  local_session_id: z.string().min(1),
  config_id: z.string().min(1),
  episode_source: z.string().min(1),
  updated_at: z.string().min(1),
  current_phase: runtimePhaseSchema,
  current_level_id: z.string().nullable(),
});

export const sessionIndexSchema = z.array(sessionIndexEntrySchema);

export const loaderBundleSchema = z.object({
  manifest: manifestSchema,
  sessionConfig: sessionConfigSchema,
  transcript: transcriptSchema,
  assistivePackage: assistivePackageSchema,
});

export type AssistivePackage = z.infer<typeof assistivePackageSchema>;
export type LoaderBundle = z.infer<typeof loaderBundleSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type PersistedSession = z.infer<typeof persistedSessionSchema>;
export type RuntimePhase = z.infer<typeof runtimePhaseSchema>;
export type SessionConfig = z.infer<typeof sessionConfigSchema>;
export type SessionIndex = z.infer<typeof sessionIndexSchema>;
export type SessionIndexEntry = z.infer<typeof sessionIndexEntrySchema>;
export type Transcript = z.infer<typeof transcriptSchema>;
export type LevelResponse = z.infer<typeof levelResponseSchema>;
