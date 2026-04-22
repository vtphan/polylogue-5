import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { getSession } from "@/lib/session";
import { storyYamlPath, reviewPath } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = getSession();
  let storyContent: string | null = null;
  let reviewContent: string | null = null;
  let approved = false;

  if (session.storyId) {
    const sPath = storyYamlPath(session.storyId);
    if (existsSync(sPath)) storyContent = readFileSync(sPath, "utf-8");

    const rPath = reviewPath(session.storyId);
    if (existsSync(rPath)) {
      reviewContent = readFileSync(rPath, "utf-8");
      approved = /^-?\s*Status:\s*approved\s*$/m.test(reviewContent);
    }
  }

  return Response.json({
    storyId: session.storyId,
    phase: session.phase,
    storyContent,
    reviewContent,
    approved,
  });
}
