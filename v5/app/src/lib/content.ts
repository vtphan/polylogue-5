import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  lessonPackageSchema,
  transcriptSchema,
  type LessonLevel,
  type LessonPackage,
  type Transcript,
  type TranscriptScene,
  type TranscriptTurn,
} from "@/lib/domain";
import { resolveEpisodeSource } from "@/lib/paths";

async function readYaml<T>(
  filePath: string,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(yaml.load(raw));
}

export type ReaderTurn = TranscriptTurn;
export type ReaderScene = TranscriptScene;
export type ReaderTranscript = Transcript;
export type ReaderLevel = LessonLevel;

export type ReaderLessonPackage = {
  title: string;
  summary: string;
  previously?: string;
  finalTakeaway: string;
  levels: ReaderLevel[];
};

function toReaderLessonPackage(lessonPackage: LessonPackage): ReaderLessonPackage {
  return {
    title: lessonPackage.episode.title,
    summary: lessonPackage.episode.summary,
    previously: lessonPackage.episode.previously,
    finalTakeaway: lessonPackage.episode.final_takeaway,
    levels: lessonPackage.levels,
  };
}

export async function loadTranscript(episodeSource: string): Promise<Transcript> {
  const resolved = resolveEpisodeSource(episodeSource);
  return readYaml(path.join(resolved, "transcript.yaml"), transcriptSchema);
}

export async function loadLessonPackage(episodeSource: string): Promise<LessonPackage> {
  const resolved = resolveEpisodeSource(episodeSource);
  return readYaml(path.join(resolved, "lesson_package.yaml"), lessonPackageSchema);
}

export async function loadReaderTranscriptByPaths(
  transcriptPath: string,
): Promise<ReaderTranscript> {
  return readYaml(transcriptPath, transcriptSchema);
}

export async function loadReaderLessonPackageByPaths(
  lessonPackagePath: string,
): Promise<ReaderLessonPackage> {
  return toReaderLessonPackage(await readYaml(lessonPackagePath, lessonPackageSchema));
}
