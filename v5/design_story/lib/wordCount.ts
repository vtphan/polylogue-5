import { parseDocument, isMap, isSeq, Scalar } from "yaml";

const WPM = 150;

export function computeWordCountRange(readingTimeMinutes: number): { min: number; max: number } {
  return {
    min: (readingTimeMinutes - 1) * WPM,
    max: (readingTimeMinutes + 1) * WPM,
  };
}

export function ensureWordCountRange(storyYaml: string): string {
  const doc = parseDocument(storyYaml);
  const episodes = doc.get("episodes");
  if (!isSeq(episodes)) return storyYaml;

  let mutated = false;
  for (const ep of episodes.items) {
    if (!isMap(ep)) continue;

    const rtmNode = ep.get("reading_time_minutes", true);
    const rtm = unwrap(rtmNode);
    if (typeof rtm !== "number") continue;

    const existing = ep.get("word_count_range");
    if (isMap(existing)) continue;

    const { min, max } = computeWordCountRange(rtm);
    ep.set("word_count_range", { min, max });
    mutated = true;
  }

  return mutated ? String(doc) : storyYaml;
}

function unwrap(node: unknown): unknown {
  if (node && typeof node === "object" && "value" in node) {
    return (node as Scalar).value;
  }
  return node;
}
