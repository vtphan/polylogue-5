import path from "node:path";

// The Next.js app runs with cwd = simplified-framework/app.
// Repo root is two levels up.
export function repoRoot(): string {
  return path.resolve(process.cwd(), "..", "..");
}

// simplified-framework root.
export function simplifiedFrameworkRoot(): string {
  return path.resolve(process.cwd(), "..");
}

// Resolve a path that may be either repo-relative
// (e.g. "simplified-framework/artifacts/...") or
// simplified-framework-relative (e.g. "artifacts/...").
export function resolveEpisodeSource(source: string): string {
  if (path.isAbsolute(source)) {
    return source;
  }

  if (source.startsWith("simplified-framework/")) {
    return path.join(repoRoot(), source);
  }

  return path.join(simplifiedFrameworkRoot(), source);
}
