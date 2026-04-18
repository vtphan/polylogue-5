import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { simplifiedFrameworkRoot } from "@/lib/paths";

export type PracticeExercise = {
  exerciseId: string;
  flawId: string;
  title: string;
  scenario: string;
  prompt: string;
  options: Array<{
    optionId: string;
    text: string;
    kind?: string;
  }>;
  hint: string;
  feedback: {
    correct: {
      optionIds: string[];
      text: string;
    };
    byOption: Record<string, string>;
  };
  workedExplanation: string;
  takeaway: string;
};

const PRACTICE_PACKAGE_PATH = path.join(
  simplifiedFrameworkRoot(),
  "artifacts",
  "practice",
  "practice_package.yaml",
);

type RawPracticePackage = {
  exercises?: Record<
    string,
    {
      exercise_id?: unknown;
      flaw_id?: unknown;
      title?: unknown;
      scenario?: unknown;
      prompt?: unknown;
      options?: Array<{
        option_id?: unknown;
        text?: unknown;
        kind?: unknown;
      }>;
      hint?: unknown;
      feedback?: {
        correct?: {
          option_ids?: unknown;
          text?: unknown;
        };
        by_option?: Record<string, unknown>;
      };
      worked_explanation?: unknown;
      takeaway?: unknown;
    }
  >;
};

async function readPracticePackage(): Promise<RawPracticePackage> {
  const raw = await fs.readFile(PRACTICE_PACKAGE_PATH, "utf8");
  return (yaml.load(raw) as RawPracticePackage) ?? {};
}

export async function loadPracticeExercises(): Promise<PracticeExercise[]> {
  const parsed = await readPracticePackage();
  const exercises = parsed.exercises ?? {};

  return Object.entries(exercises).map(([flawId, entry], index) => ({
    exerciseId:
      typeof entry.exercise_id === "string" ? entry.exercise_id : `practice_${index + 1}`,
    flawId: typeof entry.flaw_id === "string" ? entry.flaw_id : flawId,
    title: typeof entry.title === "string" ? entry.title : flawId,
    scenario: typeof entry.scenario === "string" ? entry.scenario : "",
    prompt: typeof entry.prompt === "string" ? entry.prompt : "",
    options: Array.isArray(entry.options)
      ? entry.options
          .filter((option) => typeof option?.option_id === "string")
          .map((option) => ({
            optionId: option.option_id as string,
            text: typeof option.text === "string" ? option.text : option.option_id as string,
            kind: typeof option.kind === "string" ? option.kind : undefined,
          }))
      : [],
    hint: typeof entry.hint === "string" ? entry.hint : "",
    feedback: {
      correct: {
        optionIds: Array.isArray(entry.feedback?.correct?.option_ids)
          ? entry.feedback.correct.option_ids.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        text: typeof entry.feedback?.correct?.text === "string" ? entry.feedback.correct.text : "",
      },
      byOption:
        entry.feedback?.by_option && typeof entry.feedback.by_option === "object"
          ? Object.fromEntries(
              Object.entries(entry.feedback.by_option).filter(
                (entry): entry is [string, string] => typeof entry[1] === "string",
              ),
            )
          : {},
    },
    workedExplanation:
      typeof entry.worked_explanation === "string" ? entry.worked_explanation : "",
    takeaway: typeof entry.takeaway === "string" ? entry.takeaway : "",
  }));
}

export async function getPracticeExercise(flawId: string): Promise<PracticeExercise | null> {
  const exercises = await loadPracticeExercises();
  return exercises.find((exercise) => exercise.flawId === flawId) ?? null;
}
