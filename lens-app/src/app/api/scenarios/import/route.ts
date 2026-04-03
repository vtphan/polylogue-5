import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const ARTIFACT_FILES = [
  "transcript.yaml",
  "analysis.yaml",
  "facilitation.yaml",
  "scaffolding.yaml",
  "session.yaml",
  "scenario.yaml",
] as const;

export async function POST(req: NextRequest) {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const { registryPath } = await req.json();

  if (!registryPath) {
    return NextResponse.json(
      { error: "registryPath is required" },
      { status: 400 }
    );
  }

  // Validate resolved path is within the project's registry directory
  const resolvedPath = path.resolve(registryPath);
  const allowedBase = path.resolve(process.cwd(), "..", "registry");
  let realResolved: string;
  try {
    realResolved = await fs.realpath(resolvedPath);
  } catch {
    return NextResponse.json(
      { error: `Cannot resolve registry path: ${resolvedPath}` },
      { status: 400 }
    );
  }
  let realBase: string;
  try {
    realBase = await fs.realpath(allowedBase);
  } catch {
    return NextResponse.json(
      { error: "Registry base directory not found" },
      { status: 500 }
    );
  }
  if (!realResolved.startsWith(realBase + path.sep) && realResolved !== realBase) {
    return NextResponse.json(
      { error: "Registry path must be within the project registry directory" },
      { status: 403 }
    );
  }

  // List scenario directories in the registry
  let entries: string[];
  try {
    const dirEntries = await fs.readdir(realResolved, { withFileTypes: true });
    entries = dirEntries
      .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "Archived")
      .map((e) => e.name);
  } catch {
    return NextResponse.json(
      { error: `Cannot read registry path: ${realResolved}` },
      { status: 400 }
    );
  }

  const results: { id: string; topic: string; status: string }[] = [];
  const errors: { id: string; error: string }[] = [];

  for (const scenarioId of entries) {
    const scenarioDir = path.join(realResolved, scenarioId);

    // Check if already imported
    const existing = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (existing) {
      results.push({
        id: scenarioId,
        topic: existing.topic,
        status: "already_imported",
      });
      continue;
    }

    // Read all artifact files
    const artifacts: Record<string, unknown> = {};
    let missingFiles: string[] = [];

    for (const file of ARTIFACT_FILES) {
      const filePath = path.join(scenarioDir, file);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const key = file.replace(".yaml", "");
        artifacts[key] = yaml.load(content);
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      errors.push({
        id: scenarioId,
        error: `Missing files: ${missingFiles.join(", ")}`,
      });
      continue;
    }

    // Extract topic from scenario.yaml
    const scenarioData = artifacts.scenario as Record<string, unknown>;
    const topic = (scenarioData?.topic as string) || scenarioId;

    await prisma.scenario.create({
      data: {
        id: scenarioId,
        topic,
        artifacts: JSON.stringify(artifacts),
        publishedBy: auth.userId,
      },
    });

    results.push({ id: scenarioId, topic, status: "imported" });
  }

  return NextResponse.json({ results, errors });
}
