// Minimal in-app validator for story.yaml. MVP only — the canonical validator
// is intended to live at v5/pipeline/scripts/validate_story.py (not yet
// written). When that ships, swap this for a subprocess call.

import { parse } from "yaml";

export type ValidationResult = { ok: boolean; errors: string[] };

const STORY_ID_RE = /^[a-z][a-z0-9_]*$/;

const REQUIRED_TOP = ["story_id", "title", "premise", "characters", "episodes"];
const REQUIRED_CHARACTER = ["character_id", "name", "voice_hook"];
const REQUIRED_EPISODE = [
  "episode_id",
  "title",
  "episode_synopsis",
  "reading_time_minutes",
  "word_count_range",
  "final_takeaway",
];

export function validateStory(yamlText: string): ValidationResult {
  const errors: string[] = [];
  let doc: unknown;
  try {
    doc = parse(yamlText);
  } catch (err) {
    return { ok: false, errors: [`YAML parse error: ${String(err)}`] };
  }

  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return { ok: false, errors: ["story.yaml must be a top-level mapping"] };
  }

  const story = doc as Record<string, unknown>;

  for (const f of REQUIRED_TOP) {
    if (!(f in story)) errors.push(`missing required top-level field: ${f}`);
  }

  if (typeof story.story_id === "string" && !STORY_ID_RE.test(story.story_id)) {
    errors.push(`story_id must be snake_case (got "${story.story_id}")`);
  }

  const characters = story.characters;
  if (Array.isArray(characters)) {
    if (characters.length === 0) errors.push("characters[] must not be empty");
    characters.forEach((c, i) => {
      if (!c || typeof c !== "object") {
        errors.push(`characters[${i}] must be a mapping`);
        return;
      }
      for (const f of REQUIRED_CHARACTER) {
        if (!(f in (c as Record<string, unknown>))) {
          errors.push(`characters[${i}] missing field: ${f}`);
        }
      }
    });
  } else if ("characters" in story) {
    errors.push("characters must be an array");
  }

  const episodes = story.episodes;
  if (Array.isArray(episodes)) {
    if (episodes.length === 0) errors.push("episodes[] must not be empty");
    episodes.forEach((ep, i) => {
      if (!ep || typeof ep !== "object") {
        errors.push(`episodes[${i}] must be a mapping`);
        return;
      }
      const e = ep as Record<string, unknown>;
      for (const f of REQUIRED_EPISODE) {
        if (!(f in e)) errors.push(`episodes[${i}] missing field: ${f}`);
      }
      if (typeof e.reading_time_minutes === "number") {
        if (e.reading_time_minutes < 6 || e.reading_time_minutes > 12) {
          errors.push(
            `episodes[${i}].reading_time_minutes out of range 6–12 (got ${e.reading_time_minutes})`
          );
        }
      }
      const wcr = e.word_count_range;
      if (wcr && typeof wcr === "object" && !Array.isArray(wcr)) {
        const w = wcr as Record<string, unknown>;
        if (typeof w.min !== "number" || typeof w.max !== "number") {
          errors.push(`episodes[${i}].word_count_range must have numeric min and max`);
        }
      } else if ("word_count_range" in e) {
        errors.push(`episodes[${i}].word_count_range must be a mapping`);
      }
    });
  } else if ("episodes" in story) {
    errors.push("episodes must be an array");
  }

  return { ok: errors.length === 0, errors };
}
