import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { lessonPackageSchema, transcriptSchema, type LessonPackage, type Transcript } from "@/lib/domain";
import { resolveEpisodeSource } from "@/lib/paths";

async function readYaml<T>(filePath: string, schema: { parse: (data: unknown) => T }): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(yaml.load(raw));
}

export async function loadTranscript(episodeSource: string): Promise<Transcript> {
  const resolved = resolveEpisodeSource(episodeSource);
  return readYaml(path.join(resolved, "transcript.yaml"), transcriptSchema);
}

export async function loadLessonPackage(episodeSource: string): Promise<LessonPackage> {
  const resolved = resolveEpisodeSource(episodeSource);
  return readYaml(path.join(resolved, "lesson_package.yaml"), lessonPackageSchema);
}
