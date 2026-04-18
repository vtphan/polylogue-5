import "server-only";

import fs from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { prisma } from "./db";
import { lessonPackageSchema, transcriptSchema } from "./domain";
import { simplifiedFrameworkRoot } from "./paths";

type StoryFile = {
  story_id?: unknown;
  title?: unknown;
};

export type CatalogEpisodeRecord = {
  storyId: string;
  episodeId: string;
  storyTitle: string;
  episodeTitle: string;
  lessonPackagePath: string;
  transcriptPath: string;
  isAvailable: boolean;
};

const ARTIFACTS_ROOT = path.join(simplifiedFrameworkRoot(), "artifacts");
const STORIES_ROOT = path.join(simplifiedFrameworkRoot(), "stories");

let syncPromise: Promise<void> | null = null;
let artifactWatcher: FSWatcher | null = null;
let storyWatcher: FSWatcher | null = null;
let resyncTimer: NodeJS.Timeout | null = null;

async function readYamlFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return yaml.load(raw) as T;
  } catch {
    return null;
  }
}

async function loadStoryTitles(): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  let entries: string[] = [];

  try {
    entries = await fs.readdir(STORIES_ROOT);
  } catch {
    return titles;
  }

  await Promise.all(
    entries.map(async (storyId) => {
      const storyPath = path.join(STORIES_ROOT, storyId, "story.yaml");
      const data = await readYamlFile<StoryFile>(storyPath);
      if (!data) return;

      const canonicalId =
        typeof data.story_id === "string" && data.story_id.trim().length > 0
          ? data.story_id.trim()
          : storyId;
      const title =
        typeof data.title === "string" && data.title.trim().length > 0
          ? data.title.trim()
          : canonicalId;

      titles.set(canonicalId, title);
      if (canonicalId !== storyId) {
        titles.set(storyId, title);
      }
    }),
  );

  return titles;
}

function getEligibleEpisodeTitle(rawLessonPackage: unknown): string | null {
  const parsed = lessonPackageSchema.safeParse(rawLessonPackage);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.episode.title.trim();
}

function hasEligibleTranscriptShape(rawTranscript: unknown): boolean {
  const parsed = transcriptSchema.safeParse(rawTranscript);
  if (!parsed.success) {
    return false;
  }
  return true;
}

async function discoverEligibleEpisodes(): Promise<CatalogEpisodeRecord[]> {
  const storyTitles = await loadStoryTitles();
  let storyDirs: string[] = [];

  try {
    storyDirs = await fs.readdir(ARTIFACTS_ROOT);
  } catch {
    return [];
  }

  const allEpisodes = await Promise.all(
    storyDirs.map(async (storyId) => {
      const storyRoot = path.join(ARTIFACTS_ROOT, storyId);
      let stat;
      try {
        stat = await fs.stat(storyRoot);
      } catch {
        return [] as CatalogEpisodeRecord[];
      }
      if (!stat.isDirectory()) {
        return [] as CatalogEpisodeRecord[];
      }

      let episodeDirs: string[] = [];
      try {
        episodeDirs = await fs.readdir(storyRoot);
      } catch {
        return [] as CatalogEpisodeRecord[];
      }

      const records = await Promise.all(
        episodeDirs.map(async (episodeId) => {
          const episodeRoot = path.join(storyRoot, episodeId);
          const lessonPackagePath = path.join(episodeRoot, "lesson_package.yaml");
          const transcriptPath = path.join(episodeRoot, "transcript.yaml");

          try {
            await Promise.all([fs.access(lessonPackagePath), fs.access(transcriptPath)]);
          } catch {
            return null;
          }

          const [rawLessonPackage, rawTranscript] = await Promise.all([
            readYamlFile<unknown>(lessonPackagePath),
            readYamlFile<unknown>(transcriptPath),
          ]);
          const episodeTitle =
            rawLessonPackage ? getEligibleEpisodeTitle(rawLessonPackage) : null;

          if (!episodeTitle || !rawTranscript || !hasEligibleTranscriptShape(rawTranscript)) {
            return null;
          }

          const record: CatalogEpisodeRecord = {
            storyId,
            episodeId,
            storyTitle: storyTitles.get(storyId) ?? storyId,
            episodeTitle,
            lessonPackagePath,
            transcriptPath,
            isAvailable: true,
          };

          return record;
        }),
      );

      return records.filter((entry): entry is CatalogEpisodeRecord => entry !== null);
    }),
  );

  return allEpisodes
    .flat()
    .sort(
      (a, b) =>
        a.storyId.localeCompare(b.storyId) || a.episodeId.localeCompare(b.episodeId),
    );
}

async function applyCatalogSnapshot(records: CatalogEpisodeRecord[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.catalogEpisode.updateMany({
      data: { isAvailable: false },
    });

    for (const record of records) {
      await tx.catalogEpisode.upsert({
        where: {
          storyId_episodeId: {
            storyId: record.storyId,
            episodeId: record.episodeId,
          },
        },
        update: {
          storyTitle: record.storyTitle,
          episodeTitle: record.episodeTitle,
          lessonPackagePath: record.lessonPackagePath,
          transcriptPath: record.transcriptPath,
          isAvailable: true,
        },
        create: record,
      });
    }
  });
}

export async function syncCatalogFromFilesystem(): Promise<void> {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const records = await discoverEligibleEpisodes();
    await applyCatalogSnapshot(records);
  })();

  try {
    await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export async function listCatalogEpisodes() {
  registerCatalogWatcher();
  await syncCatalogFromFilesystem();
  return prisma.catalogEpisode.findMany({
    where: { isAvailable: true },
    orderBy: [{ storyId: "asc" }, { episodeId: "asc" }],
  });
}

function scheduleResync() {
  if (resyncTimer) {
    clearTimeout(resyncTimer);
  }

  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    void syncCatalogFromFilesystem();
  }, 150);
}

export function registerCatalogWatcher(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  if (artifactWatcher || storyWatcher) {
    return;
  }

  try {
    artifactWatcher = watch(ARTIFACTS_ROOT, { recursive: true }, (_eventType, filename) => {
      const relative = filename?.toString() ?? "";
      if (
        relative.endsWith(`${path.sep}lesson_package.yaml`) ||
        relative.endsWith(`${path.sep}transcript.yaml`) ||
        relative === "lesson_package.yaml" ||
        relative === "transcript.yaml"
      ) {
        scheduleResync();
      }
    });
  } catch {
    artifactWatcher = null;
  }

  try {
    storyWatcher = watch(STORIES_ROOT, { recursive: true }, (_eventType, filename) => {
      const relative = filename?.toString() ?? "";
      if (relative.endsWith(`${path.sep}story.yaml`) || relative === "story.yaml") {
        scheduleResync();
      }
    });
  } catch {
    storyWatcher = null;
  }
}
