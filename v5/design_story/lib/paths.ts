import { join } from "node:path";

const APP_ROOT = process.cwd();
const V5_ROOT = join(APP_ROOT, "..");
const STORIES_ROOT = join(V5_ROOT, "stories");

export function v5Path(rel: string): string {
  return join(V5_ROOT, rel);
}

export function storyDir(storyId: string): string {
  return join(STORIES_ROOT, storyId);
}

export function storyYamlPath(storyId: string): string {
  return join(storyDir(storyId), "story.yaml");
}

export function reviewPath(storyId: string): string {
  return join(storyDir(storyId), "story-design-review.md");
}
