import { z } from "zod";

// --------------------------------------------------------------------------
// transcript.yaml — polarity-free source dialogue.
// Structurally identical to v4.
// --------------------------------------------------------------------------

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

export const transcriptSchema = z
  .object({
    story_id: z.string().min(1),
    episode_id: z.string().min(1),
    title: z.string().min(1),
    characters: z.array(z.string().min(1)).min(1),
    scenes: z.array(transcriptSceneSchema).min(3),
  })
  .superRefine((transcript, ctx) => {
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

// --------------------------------------------------------------------------
// lesson_package.yaml — v5 three-step quiz per level.
// --------------------------------------------------------------------------

const answerOptionSchema = z.object({
  option_id: z.string().min(1),
  text: z.string().min(1),
});

export type AnswerOption = z.infer<typeof answerOptionSchema>;

const stepFeedbackSchema = z.object({
  correct: z.object({
    option_ids: z.array(z.string().min(1)).min(1),
    text: z.string().min(1),
  }),
  by_option: z.record(z.string().min(1), z.string().min(1)),
});

export type StepFeedback = z.infer<typeof stepFeedbackSchema>;

function checkOptionFeedbackIntegrity(
  ctx: z.RefinementCtx,
  basePath: (string | number)[],
  options: AnswerOption[],
  feedback: StepFeedback,
) {
  const optionIds = new Set(options.map((option) => option.option_id));
  const correctIds = new Set(feedback.correct.option_ids);

  for (const cid of feedback.correct.option_ids) {
    if (!optionIds.has(cid)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "feedback", "correct", "option_ids"],
        message: `correct option_id '${cid}' is not in options[]`,
      });
    }
  }

  // by_option must key on wrong options only.
  for (const key of Object.keys(feedback.by_option)) {
    if (!optionIds.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "feedback", "by_option", key],
        message: `by_option key '${key}' is not in options[]`,
      });
    } else if (correctIds.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "feedback", "by_option", key],
        message: `by_option key '${key}' is a correct option; by_option is wrong-answer-only`,
      });
    }
  }

  // Every wrong option must have a by_option entry so the UI can render feedback for it.
  for (const option of options) {
    if (correctIds.has(option.option_id)) {
      continue;
    }
    if (!(option.option_id in feedback.by_option)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [...basePath, "feedback", "by_option", option.option_id],
        message: `missing by_option entry for wrong option_id '${option.option_id}'`,
      });
    }
  }
}

const step1ClaimSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(answerOptionSchema).min(2),
  feedback: stepFeedbackSchema,
});

const step2JudgmentSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(answerOptionSchema).length(2),
  routing_text: z.string().min(1).optional(),
});

const step3BranchSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(answerOptionSchema).min(2),
  feedback: stepFeedbackSchema,
});

const step3Schema = z.object({
  why_yes: step3BranchSchema,
  why_no: step3BranchSchema,
});

const lessonLevelSchema = z
  .object({
    level_id: z.string().regex(/^l\d{2,}$/, "level_id must match lNN"),
    sequence_index: z.number().int().positive(),
    turn_id: z.string().regex(/^t\d{2,}$/, "turn_id must match tNN"),
    reasoning_item_id: z.string().min(1),
    polarity: z.enum(["weak", "strong"]),
    intended_claim: z.string().min(1),
    step_1_claim: step1ClaimSchema,
    step_2_judgment: step2JudgmentSchema,
    step_3: step3Schema,
    hint: z.string().min(1).optional(),
    takeaway: z.string().min(1),
  })
  .superRefine((level, ctx) => {
    // Step 1 feedback cross-checks.
    checkOptionFeedbackIntegrity(
      ctx,
      ["step_1_claim"],
      level.step_1_claim.options,
      level.step_1_claim.feedback,
    );

    // Step 2 fixed option ids.
    const step2OptionIds = level.step_2_judgment.options.map((o) => o.option_id);
    const requiredStep2Ids = ["yes_strong", "no_unsure"];
    for (const required of requiredStep2Ids) {
      if (!step2OptionIds.includes(required)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["step_2_judgment", "options"],
          message: `step_2_judgment.options must include '${required}'`,
        });
      }
    }

    // Step 3 feedback cross-checks on both branches.
    checkOptionFeedbackIntegrity(
      ctx,
      ["step_3", "why_yes"],
      level.step_3.why_yes.options,
      level.step_3.why_yes.feedback,
    );
    checkOptionFeedbackIntegrity(
      ctx,
      ["step_3", "why_no"],
      level.step_3.why_no.options,
      level.step_3.why_no.feedback,
    );
  });

export type LessonLevel = z.infer<typeof lessonLevelSchema>;

export const lessonPackageSchema = z
  .object({
    package_meta: z.object({
      story_id: z.string().min(1),
      episode_id: z.string().min(1),
      episode_number: z.number().int().positive(),
      schema_version: z.literal("v5"),
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
    // previously gating: required iff episode_number > 1.
    const episodeNumber = lessonPackage.package_meta.episode_number;
    const hasPreviously = typeof lessonPackage.episode.previously === "string";
    if (episodeNumber === 1 && hasPreviously) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["episode", "previously"],
        message: "previously must not be set on episode 1",
      });
    }
    if (episodeNumber > 1 && !hasPreviously) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["episode", "previously"],
        message: `previously is required on episode ${episodeNumber}`,
      });
    }

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
  });

export type LessonPackage = z.infer<typeof lessonPackageSchema>;
