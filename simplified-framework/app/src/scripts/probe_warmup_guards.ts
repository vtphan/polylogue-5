// Standalone probe for the Milestone 2 state-machine guards.
// Run with: npx tsx src/scripts/probe_warmup_guards.ts
//
// Each case asserts that the library rejects invalid state instead of
// silently writing it. The probe leaves the database cleaned up on exit.

import { prisma } from "@/lib/db";
import {
  completeModeledWarmup,
  continueFromGuidedWarmup,
  recordGuidedHintOpened,
  submitGuidedWarmup,
} from "@/lib/warmup";
import type { SessionRun } from "@prisma/client";

type ProbeResult = { label: string; ok: boolean; detail: string };

const results: ProbeResult[] = [];

async function expectThrow(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    results.push({ label, ok: false, detail: "expected throw, got success" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : String(error);
    results.push({ label, ok: true, detail: message });
  }
}

async function expectPass(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    results.push({ label, ok: true, detail: "ok" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : String(error);
    results.push({ label, ok: false, detail: message });
  }
}

async function freshRun(phase: "read" | "warmup"): Promise<SessionRun> {
  const suffix = Math.random().toString(36).slice(2, 8);
  return prisma.sessionRun.create({
    data: {
      configId: "probe-config",
      episodeSource: "artifacts/strangers-in-the-old-forest/episode_01",
      groupId: `probe-${suffix}`,
      studentId: `probe-${suffix}`,
      currentPhase: phase,
      readingComplete: phase === "warmup",
    },
  });
}

async function cleanup(): Promise<void> {
  await prisma.warmupProgress.deleteMany({
    where: { sessionRun: { configId: "probe-config" } },
  });
  await prisma.sessionRun.deleteMany({ where: { configId: "probe-config" } });
}

async function main(): Promise<void> {
  try {
  // Case A: submitGuidedWarmup rejects an option_id that is not in the package.
  {
    const run = await freshRun("warmup");
    await completeModeledWarmup(run.runId);
    await expectThrow("submit rejects unknown option_id", () =>
      submitGuidedWarmup({ run, selectedAnswerId: "not-a-real-id", usedHint: false }),
    );
    // Confirm nothing leaked into persistence.
    const progress = await prisma.warmupProgress.findUnique({ where: { runId: run.runId } });
    results.push({
      label: "submit leaves guidedSubmitted=false after reject",
      ok: progress?.guidedSubmitted === false && progress?.guidedSelectedAnswerId === null,
      detail: JSON.stringify({
        guidedSubmitted: progress?.guidedSubmitted,
        guidedSelectedAnswerId: progress?.guidedSelectedAnswerId,
      }),
    });
  }

  // Case B: submitGuidedWarmup rejects when modeled is not yet complete.
  {
    const run = await freshRun("warmup");
    // Note: no completeModeledWarmup call. A row may still be created via
    // getOrCreateWarmupProgress before the user presses Continue on modeled.
    await prisma.warmupProgress.create({ data: { runId: run.runId } });
    await expectThrow("submit rejects before modeled complete", () =>
      submitGuidedWarmup({ run, selectedAnswerId: "g1", usedHint: false }),
    );
  }

  // Case C: continueFromGuidedWarmup rejects when no warmup_progress exists.
  {
    const run = await freshRun("warmup");
    await expectThrow("continue rejects without warmup_progress row", () =>
      continueFromGuidedWarmup(run),
    );
    // Confirm session_runs was not moved to level.
    const refreshed = await prisma.sessionRun.findUnique({ where: { runId: run.runId } });
    results.push({
      label: "continue without row leaves phase=warmup",
      ok: refreshed?.currentPhase === "warmup" && refreshed?.currentLevelId === null,
      detail: JSON.stringify({
        currentPhase: refreshed?.currentPhase,
        currentLevelId: refreshed?.currentLevelId,
      }),
    });
  }

  // Case D: continueFromGuidedWarmup rejects when guided not yet submitted.
  {
    const run = await freshRun("warmup");
    await completeModeledWarmup(run.runId);
    await expectThrow("continue rejects before guided submit", () =>
      continueFromGuidedWarmup(run),
    );
    const refreshed = await prisma.sessionRun.findUnique({ where: { runId: run.runId } });
    results.push({
      label: "continue pre-submit leaves phase=warmup",
      ok: refreshed?.currentPhase === "warmup",
      detail: String(refreshed?.currentPhase),
    });
  }

  // Case E: recordGuidedHintOpened rejects before modeled complete.
  {
    const run = await freshRun("warmup");
    await prisma.warmupProgress.create({ data: { runId: run.runId } });
    await expectThrow("hint rejects before modeled complete", () =>
      recordGuidedHintOpened(run.runId),
    );
  }

  // Case F (happy path): full sequence succeeds and lands in level.
  {
    const run = await freshRun("warmup");
    await completeModeledWarmup(run.runId);
    await expectPass("hint open after modeled", () => recordGuidedHintOpened(run.runId));
    await expectPass("submit with valid option g1", () =>
      submitGuidedWarmup({ run, selectedAnswerId: "g1", usedHint: true }),
    );
    await expectPass("continue after full sequence", () => continueFromGuidedWarmup(run));
    const refreshed = await prisma.sessionRun.findUnique({ where: { runId: run.runId } });
    results.push({
      label: "happy path ends at phase=level with current_level_id=level_01",
      ok:
        refreshed?.currentPhase === "level" &&
        refreshed?.currentLevelId === "level_01",
      detail: JSON.stringify({
        currentPhase: refreshed?.currentPhase,
        currentLevelId: refreshed?.currentLevelId,
      }),
    });
  }

  // Case G: second submit after acceptance is locked (returns existing row).
  {
    const run = await freshRun("warmup");
    await completeModeledWarmup(run.runId);
    await submitGuidedWarmup({ run, selectedAnswerId: "g1", usedHint: false });
    const after = await submitGuidedWarmup({ run, selectedAnswerId: "g2", usedHint: false });
    results.push({
      label: "second submit is locked to first selection",
      ok: after.guidedSelectedAnswerId === "g1",
      detail: `selected=${after.guidedSelectedAnswerId}`,
    });
  }

  // Case H: two concurrent submits must both return the SAME canonical
  // selection (one winner, no silent overwrite). Repeat several times to
  // shake out any ordering-dependent bugs.
  {
    let allOk = true;
    let lastDetail = "";
    for (let iteration = 0; iteration < 5; iteration += 1) {
      const run = await freshRun("warmup");
      await completeModeledWarmup(run.runId);
      const [r1, r2] = await Promise.all([
        submitGuidedWarmup({ run, selectedAnswerId: "g1", usedHint: false }),
        submitGuidedWarmup({ run, selectedAnswerId: "g2", usedHint: false }),
      ]);
      const canonical = await prisma.warmupProgress.findUnique({
        where: { runId: run.runId },
      });
      const winner = canonical?.guidedSelectedAnswerId;
      const iterationOk =
        (winner === "g1" || winner === "g2") &&
        r1.guidedSelectedAnswerId === winner &&
        r2.guidedSelectedAnswerId === winner &&
        r1.guidedSubmitted === true &&
        r2.guidedSubmitted === true;
      if (!iterationOk) {
        allOk = false;
        lastDetail = `iter=${iteration} winner=${winner} r1=${r1.guidedSelectedAnswerId} r2=${r2.guidedSelectedAnswerId}`;
        break;
      }
      lastDetail = `winner=${winner} (5 iterations)`;
    }
    results.push({
      label: "concurrent submits resolve to a single canonical selection",
      ok: allOk,
      detail: lastDetail,
    });
  }

  // Case I: concurrent submits must still OR-merge guidedUsedHint when any
  // caller reports usedHint=true.
  {
    const run = await freshRun("warmup");
    await completeModeledWarmup(run.runId);
    const [r1, r2] = await Promise.all([
      submitGuidedWarmup({ run, selectedAnswerId: "g1", usedHint: false }),
      submitGuidedWarmup({ run, selectedAnswerId: "g2", usedHint: true }),
    ]);
    const canonical = await prisma.warmupProgress.findUnique({
      where: { runId: run.runId },
    });
    results.push({
      label: "concurrent submit with usedHint=true lands guidedUsedHint=true",
      ok: canonical?.guidedUsedHint === true,
      detail: `guidedUsedHint=${canonical?.guidedUsedHint} winner=${canonical?.guidedSelectedAnswerId} r1Hint=${r1.guidedUsedHint} r2Hint=${r2.guidedUsedHint}`,
    });
  }
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  let failed = 0;
  for (const r of results) {
    const prefix = r.ok ? "PASS" : "FAIL";
    if (!r.ok) failed += 1;
    console.log(`${prefix}  ${r.label} — ${r.detail}`);
  }

  if (failed > 0) {
    console.log(`\n${failed} failure(s)`);
    process.exit(1);
  }
  console.log(`\n${results.length} checks passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
