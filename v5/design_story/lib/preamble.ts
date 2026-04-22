import { readFileSync, existsSync } from "node:fs";
import type { SessionState } from "./session";
import { storyYamlPath } from "./paths";

export function composePreamble(session: SessionState, userMessage: string): string {
  const storyYaml = readCurrentStoryYaml(session);
  const recentTurns = formatRecentTurns(session);

  return [
    "## Current state",
    "",
    `**Phase:** ${session.phase}`,
    "",
    "**story.yaml (in progress):**",
    "",
    storyYaml,
    "",
    "**Recent turns this phase:**",
    "",
    recentTurns,
    "",
    "## Message",
    "",
    userMessage,
  ].join("\n");
}

function readCurrentStoryYaml(session: SessionState): string {
  if (!session.storyId) {
    return "(not yet started — no `story.yaml` exists; next commit will create it)";
  }
  const path = storyYamlPath(session.storyId);
  if (!existsSync(path)) {
    return `(story_id is \`${session.storyId}\` but no story.yaml on disk yet)`;
  }
  const content = readFileSync(path, "utf-8");
  return ["```yaml", content.trimEnd(), "```"].join("\n");
}

function formatRecentTurns(session: SessionState): string {
  if (session.phaseBuffer.length === 0) {
    return "(none — this is turn 1 of the session)";
  }
  return session.phaseBuffer
    .map((t) => `- **${t.role}:** ${t.content}`)
    .join("\n");
}
