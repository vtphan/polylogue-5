export type CommitFilename = "story.yaml" | "story-design-review.md";

export type Commit = {
  filename: CommitFilename;
  content: string;
};

const ALLOWED_FILENAMES = new Set<CommitFilename>(["story.yaml", "story-design-review.md"]);

const FENCE_RE = /```commit:([^\s]+)\s*\n([\s\S]*?)```/g;

export function parseCommits(text: string): Commit[] {
  const commits: Commit[] = [];
  const seen = new Set<CommitFilename>();
  FENCE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_RE.exec(text)) !== null) {
    const filename = match[1] as CommitFilename;
    if (!ALLOWED_FILENAMES.has(filename)) continue;
    if (seen.has(filename)) continue;
    seen.add(filename);
    commits.push({ filename, content: match[2].trimEnd() + "\n" });
  }
  return commits;
}

const STORY_ID_RE = /^story_id:\s*["']?([A-Za-z0-9_][A-Za-z0-9_-]*)["']?\s*$/m;

export function extractStoryId(yaml: string): string | null {
  const match = yaml.match(STORY_ID_RE);
  return match ? match[1] : null;
}
