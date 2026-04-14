import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import type {
  ArtifactFileName,
  EpisodeBundle,
  EpisodeStatus,
  EpisodeSummary,
  StorySummary,
} from "@/lib/artifacts/types";

const EPISODE_FILES: ArtifactFileName[] = [
  "episode.yaml",
  "transcript.yaml",
  "ground_truth.yaml",
  "diagnostic.yaml",
  "prose.yaml",
  "discussion.yaml",
  "assistive_package.yaml",
  "pipeline_log.yaml",
  "ground_truth_generated.yaml",
  "diagnostic_generated.yaml",
  "prose_generated.yaml",
  "discussion_generated.yaml",
];

function repoRoot() {
  return path.resolve(process.cwd(), "..", "..");
}

function artifactsRoot() {
  return path.join(repoRoot(), "artifacts");
}

function storyTitleFromId(storyId: string) {
  return storyId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readYamlFile(target: string) {
  const raw = await fs.readFile(target, "utf8");
  const docs = yaml.loadAll(raw);
  const parsed = docs.length <= 1 ? docs[0] ?? null : docs;
  return { raw, parsed };
}

async function safeReadYaml(target: string) {
  try {
    return await readYamlFile(target);
  } catch {
    return null;
  }
}

async function listDirectories(target: string) {
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function deriveStatus(fileNames: Set<string>): EpisodeStatus {
  if (fileNames.has("assistive_package.yaml")) {
    return "complete_v2";
  }
  if (
    fileNames.has("ground_truth.yaml") ||
    fileNames.has("diagnostic.yaml") ||
    fileNames.has("prose.yaml") ||
    fileNames.has("discussion.yaml")
  ) {
    return "partial_v2";
  }
  if (fileNames.has("transcript.yaml")) {
    return "transcript_ready";
  }
  return "planning_only";
}

function formatEpisodeId(episodeDir: string) {
  return episodeDir.replace("episode_", "");
}

function compactTurnId(turnId: string) {
  const match = turnId.match(/^turn_(\d+)$/);
  if (match) {
    return `t${match[1]}`;
  }
  return turnId;
}

function extractLastPipelineEvent(pipelineLog: unknown) {
  if (!Array.isArray(pipelineLog) || pipelineLog.length === 0) {
    return undefined;
  }
  const latest = pipelineLog[pipelineLog.length - 1] as Record<string, unknown>;
  const command = typeof latest.command === "string" ? latest.command : "unknown";
  const stage = typeof latest.stage === "string" ? latest.stage : "unknown";
  const verdict = typeof latest.verdict === "string" ? latest.verdict : "unknown";
  return `${command} · ${stage} · ${verdict}`;
}

function extractLastUpdated(stats: Array<{ mtimeMs: number }>) {
  const latest = stats.reduce((max, stat) => Math.max(max, stat.mtimeMs), 0);
  return latest > 0 ? new Date(latest).toISOString() : undefined;
}

async function summarizeEpisode(storyId: string, episodeDirName: string): Promise<EpisodeSummary> {
  const episodeDir = path.join(artifactsRoot(), storyId, "episodes", episodeDirName);
  const fileEntries = await fs.readdir(episodeDir, { withFileTypes: true });
  const fileNames = fileEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const knownFiles = fileNames.filter((name): name is ArtifactFileName =>
    EPISODE_FILES.includes(name as ArtifactFileName),
  );
  const availableFiles = Object.fromEntries(
    knownFiles.map((name) => [name, path.join(episodeDir, name)]),
  ) as Partial<Record<ArtifactFileName, string>>;
  const stats = await Promise.all(
    knownFiles.map((name) => fs.stat(path.join(episodeDir, name))),
  );

  const episodeYaml = availableFiles["episode.yaml"]
    ? await safeReadYaml(availableFiles["episode.yaml"])
    : null;
  const pipelineLogYaml = availableFiles["pipeline_log.yaml"]
    ? await safeReadYaml(availableFiles["pipeline_log.yaml"])
    : null;
  const topic =
    episodeYaml && typeof (episodeYaml.parsed as Record<string, unknown>)?.topic === "string"
      ? ((episodeYaml.parsed as Record<string, unknown>).topic as string).trim()
      : undefined;
  const episodeNumber = Number.parseInt(formatEpisodeId(episodeDirName), 10);

  return {
    storyId,
    episodeId: episodeDirName,
    episodeNumber,
    title: `Episode ${formatEpisodeId(episodeDirName)}`,
    status: deriveStatus(new Set(knownFiles)),
    topic,
    fileNames: knownFiles.sort(),
    availableFiles,
    lastUpdated: extractLastUpdated(stats),
    lastPipelineEvent: extractLastPipelineEvent(pipelineLogYaml?.parsed),
  };
}

export async function listStories(): Promise<StorySummary[]> {
  const root = artifactsRoot();
  const storyIds = await listDirectories(root);
  const stories = await Promise.all(
    storyIds.map(async (storyId) => {
      const episodesDir = path.join(root, storyId, "episodes");
      if (!(await pathExists(episodesDir))) {
        return null;
      }
      const episodeDirs = await listDirectories(episodesDir);
      const episodes = await Promise.all(
        episodeDirs
          .filter((episodeDir) => episodeDir.startsWith("episode_"))
          .map((episodeDir) => summarizeEpisode(storyId, episodeDir)),
      );
      const completedEpisodeCount = episodes.filter((episode) => episode.status === "complete_v2").length;
      const inProgressEpisodeCount = episodes.filter((episode) => episode.status !== "complete_v2").length;
      const lastUpdated = episodes
        .map((episode) => episode.lastUpdated)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1);

      return {
        storyId,
        title: storyTitleFromId(storyId),
        storyPath: path.join(root, storyId),
        episodeCount: episodes.length,
        completedEpisodeCount,
        inProgressEpisodeCount,
        lastUpdated,
        episodes: episodes.sort((a, b) => a.episodeNumber - b.episodeNumber),
      };
    }),
  );

  const definedStories = stories.filter(
    (story): story is NonNullable<typeof story> => story !== null,
  );
  return definedStories;
}

export async function loadStory(storyId: string): Promise<StorySummary | null> {
  const stories = await listStories();
  return stories.find((story) => story.storyId === storyId) ?? null;
}

function countProbeTurns(diagnostic: unknown, assistivePackage: unknown) {
  const packageSource = (assistivePackage as Record<string, unknown> | undefined)?.diagnostic;
  const source = (packageSource ?? diagnostic) as Record<string, unknown> | undefined;
  const probes = source?.probes as Record<string, unknown> | undefined;
  const facet = probes?.facet as Record<string, unknown> | undefined;
  const byTurn = facet?.by_turn as Record<string, unknown> | undefined;
  return byTurn ? Object.keys(byTurn).length : 0;
}

function countDiscussionCues(discussion: unknown, assistivePackage: unknown) {
  const packageSource = (assistivePackage as Record<string, unknown> | undefined)?.discussion;
  const source = (packageSource ?? discussion) as Record<string, unknown> | undefined;
  const cues = source?.discussion_cues as Record<string, unknown> | undefined;
  const byTurn = cues?.by_turn as Record<string, unknown> | undefined;
  const episodeScope = cues?.episode_scope;
  const byTurnCount = byTurn
    ? Object.values(byTurn).reduce<number>((count, value) => {
        return count + (Array.isArray(value) ? value.length : 0);
      }, 0)
    : 0;
  const episodeScopeCount = Array.isArray(episodeScope) ? episodeScope.length : 0;
  return byTurnCount + episodeScopeCount;
}

function countPassages(groundTruth: unknown, assistivePackage: unknown) {
  const packageSource = (assistivePackage as Record<string, unknown> | undefined)?.ground_truth;
  const source = (packageSource ?? groundTruth) as Record<string, unknown> | undefined;
  const passages = source?.passages;
  return Array.isArray(passages) ? passages.length : 0;
}

function countTurns(transcript: unknown) {
  const turns = (transcript as Record<string, unknown> | undefined)?.turns;
  return Array.isArray(turns) ? turns.length : 0;
}

export function getEpisodeTabHref(
  storyId: string,
  episodeId: string,
  tab: string,
  file?: string,
) {
  const params = new URLSearchParams({ tab });
  if (file) {
    params.set("file", file);
  }
  return `/stories/${storyId}/episodes/${episodeId}?${params.toString()}`;
}

export function normalizeTranscriptTurnId(turnId: string) {
  return compactTurnId(turnId);
}

export async function loadEpisode(
  storyId: string,
  episodeId: string,
): Promise<EpisodeBundle | null> {
  const story = await loadStory(storyId);
  if (!story) {
    return null;
  }
  const summary = story.episodes.find((episode) => episode.episodeId === episodeId);
  if (!summary) {
    return null;
  }
  const files = {} as Partial<Record<ArtifactFileName, unknown>>;
  const rawFiles = {} as Partial<Record<ArtifactFileName, string>>;

  await Promise.all(
    summary.fileNames.map(async (fileName) => {
      const filePath = summary.availableFiles[fileName];
      if (!filePath) {
        return;
      }
      const loaded = await safeReadYaml(filePath);
      if (!loaded) {
        return;
      }
      files[fileName] = loaded.parsed;
      rawFiles[fileName] = loaded.raw;
    }),
  );

  const turnCount = countTurns(files["transcript.yaml"]);
  const passageCount = countPassages(files["ground_truth.yaml"], files["assistive_package.yaml"]);
  const probeTurnCount = countProbeTurns(files["diagnostic.yaml"], files["assistive_package.yaml"]);
  const discussionCueCount = countDiscussionCues(
    files["discussion.yaml"],
    files["assistive_package.yaml"],
  );

  return {
    ...summary,
    files,
    rawFiles,
    derived: {
      turnCount,
      passageCount,
      probeTurnCount,
      discussionCueCount,
    },
  };
}
