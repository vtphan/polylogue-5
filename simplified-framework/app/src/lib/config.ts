import fs from "node:fs/promises";
import path from "node:path";
import { activeConfigSchema, type ActiveConfig, type ConfigGroup } from "@/lib/domain";
import { simplifiedFrameworkRoot } from "@/lib/paths";

// For v1 / Milestone 1 we load exactly one active config per runtime instance.
// Default path is simplified-framework/configs/episode.json, overridable via
// POLYLOGUE_CONFIG_PATH (absolute or simplified-framework-relative). The active
// episode is identified by `episode.source` inside the file, not the filename.
const DEFAULT_CONFIG_RELATIVE = "configs/episode.json";

function resolveConfigPath(): string {
  const override = process.env.POLYLOGUE_CONFIG_PATH;
  const candidate = override && override.length > 0 ? override : DEFAULT_CONFIG_RELATIVE;

  if (path.isAbsolute(candidate)) {
    return candidate;
  }
  return path.join(simplifiedFrameworkRoot(), candidate);
}

let cached: ActiveConfig | null = null;

export async function loadActiveConfig(): Promise<ActiveConfig> {
  if (cached) {
    return cached;
  }

  const configPath = resolveConfigPath();
  const raw = await fs.readFile(configPath, "utf8");
  cached = activeConfigSchema.parse(JSON.parse(raw));
  return cached;
}

export async function getGroup(groupId: string): Promise<ConfigGroup | null> {
  const config = await loadActiveConfig();
  return config.groups.find((group) => group.group_id === groupId) ?? null;
}

export async function getStudent(groupId: string, studentId: string) {
  const group = await getGroup(groupId);
  if (!group) {
    return null;
  }
  const student = group.students.find((entry) => entry.student_id === studentId);
  if (!student) {
    return null;
  }
  return { group, student };
}
