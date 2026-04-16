import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  assistivePackageSchema,
  loaderBundleSchema,
  manifestSchema,
  sessionConfigSchema,
  transcriptSchema,
  type AssistivePackage,
  type LoaderBundle,
  type Manifest,
  type SessionConfig,
  type Transcript,
} from "@/lib/types/content";
import { appKeyToTranscriptTurnId, transcriptTurnIdToAppKey } from "@/lib/content/turn-ids";

function repoRoot(): string {
  return path.resolve(process.cwd(), "..", "..");
}

function appRoot(): string {
  return process.cwd();
}

async function readJsonFile<T>(filePath: string, schema: { parse: (data: unknown) => T }): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

async function readYamlFile<T>(filePath: string, schema: { parse: (data: unknown) => T }): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(yaml.load(raw));
}

export async function loadManifest(): Promise<Manifest> {
  const manifestPath = path.join(appRoot(), "configs", "lens", "manifest.json");
  return readJsonFile(manifestPath, manifestSchema);
}

export async function loadSessionConfig(configId: string): Promise<SessionConfig> {
  const manifest = await loadManifest();
  const manifestEntry = manifest.sessions.find((entry) => entry.config_id === configId);

  if (!manifestEntry) {
    throw new Error(`Unknown session config "${configId}"`);
  }

  return readJsonFile(path.join(appRoot(), manifestEntry.config_path), sessionConfigSchema);
}

export async function loadTranscript(episodeSource: string): Promise<Transcript> {
  return readYamlFile(
    path.join(repoRoot(), episodeSource, "transcript.yaml"),
    transcriptSchema,
  );
}

export async function loadAssistivePackage(episodeSource: string): Promise<AssistivePackage> {
  return readYamlFile(
    path.join(repoRoot(), episodeSource, "assistive_package.yaml"),
    assistivePackageSchema,
  );
}

export function buildTranscriptTurnIndex(transcript: Transcript): Map<string, Transcript["turns"][number]> {
  return new Map(
    transcript.turns.map((turn) => [transcriptTurnIdToAppKey(turn.turn_id), turn]),
  );
}

export function buildTurnNormalizationPreview(transcript: Transcript, assistivePackage: AssistivePackage) {
  const transcriptTurnKeys = transcript.turns.map((turn) => ({
    transcriptId: turn.turn_id,
    turnKey: transcriptTurnIdToAppKey(turn.turn_id),
  }));

  const packageTurnKeys =
    assistivePackage.analytic_core.passages[0]?.target_turn_ids.map((turnKey) => ({
      turnKey,
      transcriptId: appKeyToTranscriptTurnId(turnKey),
    })) ?? [];

  return {
    transcriptTurnKeys,
    packageTurnKeys,
  };
}

export async function loadSessionBundle(configId: string): Promise<LoaderBundle> {
  const manifest = await loadManifest();
  const sessionConfig = await loadSessionConfig(configId);
  const transcript = await loadTranscript(sessionConfig.episode.source);
  const assistivePackage = await loadAssistivePackage(sessionConfig.episode.source);

  return loaderBundleSchema.parse({
    manifest,
    sessionConfig,
    transcript,
    assistivePackage,
  });
}
