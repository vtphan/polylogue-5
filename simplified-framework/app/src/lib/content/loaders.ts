import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  assistivePackageSchema,
  loaderBundleSchema,
  manifestSchema,
  sessionConfigSchema,
  transcriptSchema,
  type LoaderBundle,
  type Manifest,
  type SessionConfig,
} from "@/lib/types/content";

function repoRoot(): string {
  return path.resolve(process.cwd(), "..");
}

function docsHubRoot(): string {
  return path.resolve(process.cwd(), "..");
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
  return readJsonFile(path.join(docsHubRoot(), "configs", "manifest.json"), manifestSchema);
}

export async function loadSessionConfig(configId: string): Promise<SessionConfig> {
  const manifest = await loadManifest();
  const manifestEntry = manifest.sessions.find((entry) => entry.config_id === configId);

  if (!manifestEntry) {
    throw new Error(`Unknown session config "${configId}"`);
  }

  return readJsonFile(
    path.join(docsHubRoot(), manifestEntry.config_path),
    sessionConfigSchema,
  );
}

export async function loadTranscript(episodeSource: string) {
  return readYamlFile(
    path.join(repoRoot(), episodeSource, "transcript.yaml"),
    transcriptSchema,
  );
}

export async function loadAssistivePackage(episodeSource: string) {
  return readYamlFile(
    path.join(repoRoot(), episodeSource, "assistive_package.yaml"),
    assistivePackageSchema,
  );
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
