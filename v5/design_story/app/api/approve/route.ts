import { NextRequest } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getSession } from "@/lib/session";
import { storyYamlPath, reviewPath } from "@/lib/paths";
import { validateStory } from "@/lib/validateStory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = getSession();
  if (!session.storyId) {
    return Response.json({ ok: false, errors: ["no active story"] }, { status: 400 });
  }

  const sPath = storyYamlPath(session.storyId);
  if (!existsSync(sPath)) {
    return Response.json(
      { ok: false, errors: ["story.yaml does not exist on disk"] },
      { status: 400 }
    );
  }

  const storyYaml = readFileSync(sPath, "utf-8");
  const result = validateStory(storyYaml);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  const rPath = reviewPath(session.storyId);
  if (!existsSync(rPath)) {
    return Response.json(
      {
        ok: false,
        errors: [
          "story-design-review.md is not on disk — ask the agent to commit Phase D review findings first",
        ],
      },
      { status: 400 }
    );
  }

  const review = readFileSync(rPath, "utf-8");
  const updated = approveReview(review);
  writeFileSync(rPath, updated, "utf-8");

  return Response.json({ ok: true });
}

function approveReview(content: string): string {
  const today = new Date().toISOString().slice(0, 10);
  let out = content.replace(
    /^(-?\s*Status:\s*).*$/m,
    `$1approved`
  );
  out = out.replace(
    /^(-?\s*Date:\s*)(\{YYYY-MM-DD\}|TBD|)\s*$/m,
    `$1${today}`
  );
  return out;
}
