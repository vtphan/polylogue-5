import { z } from "zod";

const studentSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
});

const groupSchema = z.object({
  group_id: z.string().min(1),
  name: z.string().min(1),
  students: z.array(studentSchema).min(1),
});

export const activeConfigSchema = z.object({
  config_id: z.string().min(1),
  episode: z.object({
    source: z.string().min(1),
  }),
  groups: z.array(groupSchema).min(1),
});

export type ActiveConfig = z.infer<typeof activeConfigSchema>;
export type ConfigGroup = z.infer<typeof groupSchema>;
export type ConfigStudent = z.infer<typeof studentSchema>;

const transcriptTurnSchema = z.object({
  turn_id: z.string().min(1),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

export const transcriptSchema = z.object({
  story_id: z.string().min(1),
  episode_id: z.string().min(1),
  title: z.string().min(1),
  characters: z.array(z.string().min(1)).optional(),
  setting_note: z.string().min(1).optional(),
  previously: z.string().min(1).optional(),
  turns: z.array(transcriptTurnSchema).min(1),
});

export type Transcript = z.infer<typeof transcriptSchema>;

const answerOptionSchema = z.object({
  option_id: z.string().min(1),
  text: z.string().min(1),
  kind: z.string().min(1).optional(),
});

export type AnswerOption = z.infer<typeof answerOptionSchema>;

const modeledWarmupSchema = z
  .object({
    warmup_id: z.string().min(1),
    turn_id: z.string().min(1),
    title: z.string().min(1),
    focus_move: z.string().min(1).optional(),
    prompt: z.string().min(1),
    best_answer_id: z.string().min(1).optional(),
    best_answer_text: z.string().min(1),
    worked_explanation: z.string().min(1),
    takeaway: z.string().min(1),
  })
  .passthrough();

export type ModeledWarmup = z.infer<typeof modeledWarmupSchema>;

const guidedWarmupSchema = z
  .object({
    warmup_id: z.string().min(1),
    turn_id: z.string().min(1),
    title: z.string().min(1),
    focus_move: z.string().min(1).optional(),
    prompt: z.string().min(1),
    answer_options: z.array(answerOptionSchema).min(2),
    best_answer_id: z.string().min(1),
    best_answer_text: z.string().min(1),
    worked_explanation: z.string().min(1),
    takeaway: z.string().min(1),
    hint: z.string().min(1).optional(),
  })
  .passthrough();

export type GuidedWarmup = z.infer<typeof guidedWarmupSchema>;

const levelFeedbackSchema = z.object({
  correct: z.object({
    option_ids: z.array(z.string().min(1)).min(1),
    text: z.string().min(1),
  }),
  by_option: z.record(z.string().min(1), z.string().min(1)).optional(),
});

const levelSchema = z
  .object({
    level_id: z.string().min(1),
    sequence_index: z.number().int().positive(),
    turn_id: z.string().min(1),
    title: z.string().min(1),
    focus_move: z.string().min(1).optional(),
    prompt: z.string().min(1),
    answer_options: z.array(answerOptionSchema).min(2),
    best_answer_id: z.string().min(1),
    hint: z.string().min(1).optional(),
    feedback: levelFeedbackSchema,
  })
  .passthrough();

export type LessonLevel = z.infer<typeof levelSchema>;
export type LevelFeedback = z.infer<typeof levelFeedbackSchema>;

export const lessonPackageSchema = z
  .object({
    package_meta: z.object({
      story_id: z.string().min(1),
      episode_number: z.number().int().positive(),
      schema_version: z.string().min(1),
    }),
    episode: z.object({
      title: z.string().min(1),
      student_intro: z.string().min(1),
      flaws: z.array(z.string().min(1)).optional(),
      final_takeaway: z.string().min(1),
    }),
    warmups: z.object({
      modeled: modeledWarmupSchema,
      guided: guidedWarmupSchema,
    }),
    levels: z.array(levelSchema).min(1),
  })
  .passthrough();

export type LessonPackage = z.infer<typeof lessonPackageSchema>;

// Deterministic first-level rule per technical-spec §9:
// choose the level with the lowest `sequence_index`.
export function firstLevelId(levels: LessonLevel[]): string {
  if (levels.length === 0) {
    throw new Error("Lesson package has no levels");
  }
  const sorted = [...levels].sort((a, b) => a.sequence_index - b.sequence_index);
  return sorted[0].level_id;
}

export const runStatusSchema = z.enum(["in_progress", "complete"]);
export const runPhaseSchema = z.enum(["read", "warmup", "level", "complete"]);

export type RunStatus = z.infer<typeof runStatusSchema>;
export type RunPhase = z.infer<typeof runPhaseSchema>;
