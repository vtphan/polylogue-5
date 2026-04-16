import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun } from "@/lib/runs";

type WarmupPlaceholderProps = {
  params: Promise<{ runId: string }>;
};

// Milestone 2 will replace this placeholder with the modeled + guided warm-up UI.
// Milestone 1's contract is that reaching this page means the run is persisted
// at current_phase = warmup with reading_complete = true.
export default async function WarmupPlaceholderPage({ params }: WarmupPlaceholderProps) {
  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) {
    notFound();
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Reading complete</p>
        <h1>Warm-ups coming next</h1>
        <p className="muted">
          You finished the episode. Warm-up activities will open here when that milestone ships.
        </p>
      </header>

      <section className="panel stack">
        <p>
          <strong>Saved state:</strong> phase <code>{run.currentPhase}</code>,
          reading_complete <code>{String(run.readingComplete)}</code>, status{" "}
          <code>{run.status}</code>.
        </p>
        <p className="subdued">
          You can close this tab and continue on another device — your run will resume where you left off.
        </p>
        <div className="action-row">
          <Link href={`/runs/${run.runId}/read`} className="secondary">
            Re-read the transcript
          </Link>
          <Link href="/" className="ghost">
            Switch student
          </Link>
        </div>
      </section>
    </div>
  );
}
