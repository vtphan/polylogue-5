import "server-only";

import fs from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { prisma } from "./db";
import {
  lessonPackageSchema,
  transcriptSchema,
  type LessonPackage,
  type Transcript,
} from "./domain";
import { v5Root } from "./paths";

type StoryFile = {
  story_id?: unknown;
  title?: unknown;
  premise?: unknown;
};

type CatalogStoryRecord = {
  storyId: string;
  title: string;
  premise: string;
};

export type CatalogEpisodeRecord = {
  storyId: string;
  episodeId: string;
  episodeTitle: string;
  lessonPackagePath: string;
  transcriptPath: string;
  isAvailable: boolean;
};

export type CatalogEpisodeListItem = CatalogEpisodeRecord & {
  story: CatalogStoryRecord;
};

const ARTIFACTS_ROOT = path.join(v5Root(), "artifacts");
const STORIES_ROOT = path.join(v5Root(), "stories");

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

async function loadStoryMetadata(): Promise<Map<string, CatalogStoryRecord>> {
  const stories = new Map<string, CatalogStoryRecord>();
  let entries: string[] = [];

  try {
    entries = await fs.readdir(STORIES_ROOT);
  } catch {
    return stories;
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
      const premise =
        typeof data.premise === "string" && data.premise.trim().length > 0
          ? data.premise.trim()
          : "";

      const record: CatalogStoryRecord = {
        storyId: canonicalId,
        title,
        premise,
      };

      stories.set(canonicalId, record);
      if (canonicalId !== storyId) {
        stories.set(storyId, record);
      }
    }),
  );

  return stories;
}

function parseEligibleLessonPackage(rawLessonPackage: unknown): LessonPackage | null {
  const parsed = lessonPackageSchema.safeParse(rawLessonPackage);
  return parsed.success ? parsed.data : null;
}

function parseEligibleTranscript(rawTranscript: unknown): Transcript | null {
  const parsed = transcriptSchema.safeParse(rawTranscript);
  return parsed.success ? parsed.data : null;
}

function isEligibleEpisodePair(
  lessonPackage: LessonPackage,
  transcript: Transcript,
): boolean {
  const turnIds = new Set<string>();

  for (const scene of transcript.scenes) {
    for (const turn of scene.turns) {
      turnIds.add(turn.turn_id);
    }
  }

  for (const level of lessonPackage.levels) {
    if (!turnIds.has(level.turn_id)) {
      return false;
    }
  }

  return true;
}

async function discoverEligibleEpisodes(): Promise<CatalogEpisodeRecord[]> {
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
          const lessonPackage =
            rawLessonPackage ? parseEligibleLessonPackage(rawLessonPackage) : null;
          const transcript =
            rawTranscript ? parseEligibleTranscript(rawTranscript) : null;

          if (!lessonPackage || !transcript || !isEligibleEpisodePair(lessonPackage, transcript)) {
            return null;
          }

          const record: CatalogEpisodeRecord = {
            storyId,
            episodeId,
            episodeTitle: lessonPackage.episode.title.trim(),
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

async function applyCatalogSnapshot(
  stories: CatalogStoryRecord[],
  episodes: CatalogEpisodeRecord[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const story of stories) {
      await tx.catalogStory.upsert({
        where: { storyId: story.storyId },
        update: {
          title: story.title,
          premise: story.premise,
        },
        create: story,
      });
    }

    if (stories.length === 0) {
      await tx.catalogStory.deleteMany({});
    } else {
      await tx.catalogStory.deleteMany({
        where: {
          storyId: {
            notIn: stories.map((story) => story.storyId),
          },
        },
      });
    }

    await tx.catalogEpisode.updateMany({
      data: { isAvailable: false },
    });

    for (const record of episodes) {
      await tx.catalogEpisode.upsert({
        where: {
          storyId_episodeId: {
            storyId: record.storyId,
            episodeId: record.episodeId,
          },
        },
        update: {
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
    const [storyMetadata, episodes] = await Promise.all([
      loadStoryMetadata(),
      discoverEligibleEpisodes(),
    ]);
    const stories = Array.from(
      new Map(
        Array.from(storyMetadata.values()).map((story) => [story.storyId, story]),
      ).values(),
    ).sort((a, b) => a.storyId.localeCompare(b.storyId));
    await applyCatalogSnapshot(stories, episodes);
  })();

  try {
    await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export async function listCatalogEpisodes(): Promise<CatalogEpisodeListItem[]> {
  registerCatalogWatcher();
  await syncCatalogFromFilesystem();
  const [episodes, stories] = await Promise.all([
    prisma.catalogEpisode.findMany({
      where: { isAvailable: true },
      orderBy: [{ storyId: "asc" }, { episodeId: "asc" }],
    }),
    prisma.catalogStory.findMany(),
  ]);

  const storiesById = new Map(stories.map((story) => [story.storyId, story]));

  return episodes.map((episode) => ({
    ...episode,
    story: storiesById.get(episode.storyId) ?? {
      storyId: episode.storyId,
      title: episode.storyId,
      premise: "",
    },
  }));
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
