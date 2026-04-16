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
  })
  .passthrough();

export type LessonPackage = z.infer<typeof lessonPackageSchema>;

export const runStatusSchema = z.enum(["in_progress", "complete"]);
export const runPhaseSchema = z.enum(["read", "warmup", "level", "complete"]);

export type RunStatus = z.infer<typeof runStatusSchema>;
export type RunPhase = z.infer<typeof runPhaseSchema>;
