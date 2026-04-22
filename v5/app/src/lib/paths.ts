import path from "node:path";

// The Next.js app runs with cwd = v5/app.
// Repo root is two levels up.
export function repoRoot(): string {
  return path.resolve(process.cwd(), "..", "..");
}

// v5 root.
export function v5Root(): string {
  return path.resolve(process.cwd(), "..");
}

// Resolve a path that may be either repo-relative
// (e.g. "v5/artifacts/...") or v5-relative (e.g. "artifacts/...").
export function resolveEpisodeSource(source: string): string {
  if (path.isAbsolute(source)) {
    return source;
  }

  if (source.startsWith("v5/")) {
    return path.join(repoRoot(), source);
  }

  return path.join(v5Root(), source);
}
