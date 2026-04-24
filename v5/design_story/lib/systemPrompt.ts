import { readFileSync } from "node:fs";
import { join } from "node:path";

const appRoot = process.cwd();
const v5Root = join(appRoot, "..");

function readApp(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf-8");
}

function readV5(rel: string): string {
  return readFileSync(join(v5Root, rel), "utf-8");
}

export function composeSystemPrompt(): string {
  const orchestrator = readApp("orchestrator-prompt.md");
  const doctrine = readV5("reference/story-design-doctrine.md");
  const taxonomy = readV5("reference/reasoning-taxonomy.yaml");
  const schema = readV5("schemas/story.yaml");

  return [
    "# Polylogue v5 — Story-Design Orchestrator",
    "",
    "You have been loaded with four documents below: the orchestrator system prompt, the canonical story-design doctrine, the reasoning taxonomy (for awareness only), and the `story.yaml` output schema. Follow them. If any guidance in a later document conflicts with this preamble, the doctrine wins over the orchestrator prompt, and this preamble wins over neither — the preamble only orders the documents, it adds no new rules.",
    "",
    "---",
    "",
    "## 1. Orchestrator system prompt",
    "",
    orchestrator,
    "",
    "---",
    "",
    "## 2. Story-design doctrine (canonical)",
    "",
    doctrine,
    "",
    "---",
    "",
    "## 3. Reasoning taxonomy (awareness only — do not author taxonomy labels into `story.yaml`)",
    "",
    "```yaml",
    taxonomy,
    "```",
    "",
    "---",
    "",
    "## 4. `story.yaml` schema (output contract)",
    "",
    "```yaml",
    schema,
    "```",
  ].join("\n");
}
