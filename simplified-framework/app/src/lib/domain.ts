import { z } from "zod";

const transcriptTurnSchema = z.object({
  turn_id: z.string().min(1),
  speaker: z.string().min(1).optional(),
  text: z.string().min(1),
  kind: z.enum(["dialog", "action"]).default("dialog"),
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
  characters: z.array(z.string().min(1)).optional(),
  scenes: z.array(transcriptSceneSchema).min(3),
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
      schema_version: z.literal("simplified_v2"),
    }),
    episode: z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      previously: z.string().min(1).optional(),
      final_takeaway: z.string().min(1).optional(),
    }),
    levels: z.array(lessonLevelSchema).length(3),
  })
  .passthrough();

export type LessonPackage = z.infer<typeof lessonPackageSchema>;
