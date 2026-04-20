import { z } from "zod";

const transcriptTurnSchema = z.object({
  turn_id: z.string().min(1),
  speaker: z.string().min(1),
  text: z.string().min(1),
});

const transcriptSceneSchema = z.object({
  scene_id: z.string().min(1),
  summary: z.string().min(1),
  turns: z.array(transcriptTurnSchema).min(1),
});

export const transcriptSchema = z.object({
  story_id: z.string().min(1),
  episode_id: z.string().min(1),
  title: z.string().min(1),
  characters: z.array(z.string().min(1)).min(1),
  scenes: z.array(transcriptSceneSchema).min(3),
}).superRefine((transcript, ctx) => {
  const seenTurnIds = new Set<string>();

  for (const [sceneIndex, scene] of transcript.scenes.entries()) {
    for (const [turnIndex, turn] of scene.turns.entries()) {
      if (seenTurnIds.has(turn.turn_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scenes", sceneIndex, "turns", turnIndex, "turn_id"],
          message: `duplicate turn_id '${turn.turn_id}'`,
        });
        continue;
      }
      seenTurnIds.add(turn.turn_id);
    }
  }
});

export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;
export type TranscriptScene = z.infer<typeof transcriptSceneSchema>;
export type Transcript = z.infer<typeof transcriptSchema>;

const answerOptionSchema = z.object({
  option_id: z.string().min(1),
  text: z.string().min(1),
  kind: z.string().min(1).optional(),
});

export type AnswerOption = z.infer<typeof answerOptionSchema>;

const levelFeedbackSchema = z.object({
  correct: z.object({
    option_ids: z.array(z.string().min(1)).min(1),
    text: z.string().min(1),
  }),
  by_option: z.record(z.string().min(1), z.string().min(1)),
});

export type LevelFeedback = z.infer<typeof levelFeedbackSchema>;

const lessonLevelSchema = z
  .object({
    level_id: z.string().min(1),
    sequence_index: z.number().int().positive(),
    turn_id: z.string().min(1),
    title: z.string().min(1),
    focus_flaw: z.string().min(1),
    prompt: z.string().min(1),
    answer_options: z.array(answerOptionSchema).min(2),
    hint: z.string().min(1).optional(),
    feedback: levelFeedbackSchema,
    takeaway: z.string().min(1),
  })
  .superRefine((level, ctx) => {
    const correctIds = new Set(level.feedback.correct.option_ids);
    for (const option of level.answer_options) {
      if (correctIds.has(option.option_id)) {
        continue;
      }
      if (!(option.option_id in level.feedback.by_option)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["feedback", "by_option", option.option_id],
          message: `feedback.by_option is missing entry for option_id '${option.option_id}'`,
        });
      }
    }
  });

export type LessonLevel = z.infer<typeof lessonLevelSchema>;

export const lessonPackageSchema = z
  .object({
    package_meta: z.object({
      schema_version: z.literal("simplified_v4"),
    }),
    episode: z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      previously: z.string().min(1).optional(),
      final_takeaway: z.string().min(1),
    }),
    levels: z.array(lessonLevelSchema),
  })
  .superRefine((lessonPackage, ctx) => {
    const seenLevelIds = new Set<string>();
    const seenTurnIds = new Set<string>();
    const seenSequenceIndexes = new Set<number>();

    for (const [index, level] of lessonPackage.levels.entries()) {
      if (seenLevelIds.has(level.level_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["levels", index, "level_id"],
          message: `duplicate level_id '${level.level_id}'`,
        });
      }
      seenLevelIds.add(level.level_id);

      if (seenTurnIds.has(level.turn_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["levels", index, "turn_id"],
          message: `duplicate turn_id '${level.turn_id}'`,
        });
      }
      seenTurnIds.add(level.turn_id);

      if (seenSequenceIndexes.has(level.sequence_index)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["levels", index, "sequence_index"],
          message: `duplicate sequence_index '${level.sequence_index}'`,
        });
      }
      seenSequenceIndexes.add(level.sequence_index);

      if (level.sequence_index !== index + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["levels", index, "sequence_index"],
          message: `sequence_index must be ${index + 1}`,
        });
      }
    }
  })
  .passthrough();

export type LessonPackage = z.infer<typeof lessonPackageSchema>;
