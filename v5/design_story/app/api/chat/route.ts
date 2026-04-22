import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { composeSystemPrompt } from "@/lib/systemPrompt";
import { composePreamble } from "@/lib/preamble";
import { parseCommits, extractStoryId } from "@/lib/commitParser";
import { appendTurns, getSession, setStoryId } from "@/lib/session";
import { storyYamlPath, reviewPath } from "@/lib/paths";
import { ensureWordCountRange } from "@/lib/wordCount";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISALLOWED_TOOLS = ["Bash", "Task", "WebFetch", "WebSearch", "Edit", "Write"].join(",");

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message : "";
  if (!message) {
    return new Response("missing message", { status: 400 });
  }

  let systemPrompt: string;
  try {
    systemPrompt = composeSystemPrompt();
  } catch (err) {
    return new Response(`failed to compose system prompt: ${String(err)}`, { status: 500 });
  }

  const session = getSession();
  const preamble = composePreamble(session, message);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      const env = { ...process.env };
      delete env.ANTHROPIC_API_KEY;

      const child = spawn(
        "claude",
        [
          "-p",
          preamble,
          "--output-format",
          "stream-json",
          "--verbose",
          "--append-system-prompt",
          systemPrompt,
          "--disallowedTools",
          DISALLOWED_TOOLS,
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env,
          cwd: tmpdir(),
        }
      );

      let assistantText = "";
      let stdoutBuf = "";
      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBuf += chunk.toString("utf-8");
        const lines = stdoutBuf.split("\n");
        stdoutBuf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed) as Record<string, unknown>;
            const text = extractText(event);
            if (text) {
              assistantText += text;
              send({ type: "text", delta: text });
            }
          } catch {
            // partial or malformed line; skip
          }
        }
      });

      let stderrBuf = "";
      child.stderr.on("data", (chunk: Buffer) => {
        stderrBuf += chunk.toString("utf-8");
      });

      child.on("close", (code) => {
        if (code !== 0) {
          send({
            type: "error",
            message: stderrBuf.trim() || `claude exited with code ${code}`,
          });
          send({ type: "done" });
          controller.close();
          return;
        }

        try {
          applyCommitsAndUpdateSession(assistantText, message, send);
        } catch (err) {
          send({ type: "error", message: `commit apply failed: ${String(err)}` });
        }

        send({ type: "done" });
        controller.close();
      });

      child.on("error", (err) => {
        send({ type: "error", message: `spawn error: ${String(err)}` });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function applyCommitsAndUpdateSession(
  assistantText: string,
  userMessage: string,
  send: (obj: unknown) => void
): void {
  const commits = parseCommits(assistantText);
  const session = getSession();

  const storyCommit = commits.find((c) => c.filename === "story.yaml");
  const reviewCommit = commits.find((c) => c.filename === "story-design-review.md");

  if (storyCommit) {
    let storyId = session.storyId;
    if (!storyId) {
      const idFromYaml = extractStoryId(storyCommit.content);
      if (!idFromYaml) {
        send({
          type: "error",
          message: "commit:story.yaml lacks a valid story_id; nothing written",
        });
      } else {
        storyId = idFromYaml;
        setStoryId(storyId);
      }
    }
    if (storyId) {
      const content = ensureWordCountRange(storyCommit.content);
      const path = storyYamlPath(storyId);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, "utf-8");
      send({ type: "commit", path: `v5/stories/${storyId}/story.yaml` });
    }
  }

  if (reviewCommit) {
    const storyId = session.storyId;
    if (!storyId) {
      send({
        type: "error",
        message: "commit:story-design-review.md ignored — no active story yet",
      });
    } else {
      const path = reviewPath(storyId);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, reviewCommit.content, "utf-8");
      send({ type: "commit", path: `v5/stories/${storyId}/story-design-review.md` });
    }
  }

  appendTurns([
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantText },
  ]);
}

function extractText(event: Record<string, unknown>): string | null {
  const msg = event.message as
    | { content?: Array<{ type?: string; text?: string }> }
    | undefined;
  if (msg && Array.isArray(msg.content)) {
    const parts: string[] = [];
    for (const block of msg.content) {
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      }
    }
    if (parts.length > 0) return parts.join("");
  }

  const e = event.event as { delta?: { type?: string; text?: string } } | undefined;
  if (e?.delta?.type === "text_delta" && typeof e.delta.text === "string") {
    return e.delta.text;
  }

  return null;
}
