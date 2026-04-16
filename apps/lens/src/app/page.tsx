import {
  buildTranscriptTurnIndex,
  buildTurnNormalizationPreview,
  loadSessionBundle,
} from "@/lib/content/loaders";
import { RuntimeStatePanel } from "@/components/runtime-state-panel";
import { SessionShell } from "@/features/session/components/session-shell";
import type { LoaderBundle } from "@/lib/types/content";

const statusChecklist = [
  "Validated manifest, transcript, and assistive-package loading against live episode artifacts.",
  "Turn normalization is enforced from transcript turn_02 IDs to app-level t02 keys.",
  "Shared-device sessions persist locally with pause, resume, completion, and recognition state.",
  "The full v1 backbone now runs in apps/lens from reading through revision and transfer.",
];

const runtimeHighlights = [
  "Guided and browser-local by default, with no dependency on the legacy lens-app runtime.",
  "Comparison, discussion, revision, badges, and peer recognition are all wired to real session state.",
  "Loader failures and empty episode bundles degrade into explicit runtime-state surfaces.",
];

export default async function Home() {
  let bundle: LoaderBundle;

  try {
    bundle = await loadSessionBundle("forest-ep01-table-a");
  } catch (error) {
    return (
      <RuntimeStatePanel
        description="Lens could not load the configured manifest or episode artifacts for this session. Fix the broken config or artifact contract before continuing."
        detail={error instanceof Error ? error.message : "Unknown loader failure"}
        eyebrow="Load Failure"
        title="The session bundle did not validate."
      />
    );
  }

  if (
    bundle.transcript.turns.length === 0 ||
    bundle.assistivePackage.analytic_core.passages.length === 0
  ) {
    return (
      <RuntimeStatePanel
        description="Lens loaded the session bundle, but the episode is missing the minimum transcript or passage data required to begin reading."
        detail={`turns=${bundle.transcript.turns.length}, passages=${bundle.assistivePackage.analytic_core.passages.length}`}
        eyebrow="Empty State"
        title="This session is missing core episode content."
      />
    );
  }

  const turnIndex = buildTranscriptTurnIndex(bundle.transcript);
  const normalizationPreview = buildTurnNormalizationPreview(
    bundle.transcript,
    bundle.assistivePackage,
  );

  const firstTurn = turnIndex.get("t02");
  const firstPassage = bundle.assistivePackage.analytic_core.passages[0];

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="lens-panel lens-reveal rounded-[2rem] p-8 backdrop-blur md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Polylogue
              </p>
              <h1
                className="max-w-3xl text-5xl leading-none sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Lens now runs as a dedicated shared-device studio inside <span className="text-[var(--accent)]">apps/lens</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[color:rgba(29,36,48,0.76)] sm:text-lg">
                This is no longer a scaffold-only surface. The current build loads live Polylogue artifacts,
                runs the full round backbone, persists table progress locally, and supports guided stop points
                without relying on the legacy <code>lens-app/</code> codepath.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.52)] p-5 lg:w-[21rem]">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Runtime posture
              </span>
              <div className="text-2xl font-semibold">Artifact-driven and classroom-local</div>
              <div className="text-sm leading-6 text-[color:rgba(37,50,68,0.72)]">
                Next.js App Router frontend, Zod-validated content contracts, and browser-local session state
                for one shared device at a table.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="lens-panel lens-reveal rounded-[2rem] p-7" style={{ animationDelay: "80ms" }}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                className="text-3xl leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Runtime Snapshot
              </h2>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                live
              </span>
            </div>

            <ul className="grid gap-3">
              {statusChecklist.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-4 rounded-[1.25rem] border border-[var(--line)] bg-white/70 px-4 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-ink)] text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-[color:rgba(29,36,48,0.84)] sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-4 rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)]/70 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moss)]">
                Contract proof
              </div>
              <div className="grid gap-3 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]">
                <div>
                  Resolved config <code>{bundle.sessionConfig.config_id}</code> against manifest version{" "}
                  <code>{bundle.manifest.manifest_version}</code>.
                </div>
                <div>
                  Loaded transcript for <code>{bundle.transcript.story_id}</code>, episode{" "}
                  <code>{bundle.transcript.episode_number}</code>, with{" "}
                  <code>{bundle.transcript.turns.length}</code> turns.
                </div>
                <div>
                  Loaded assistive package schema <code>{bundle.assistivePackage.package_meta.schema_version}</code>{" "}
                  with <code>{firstPassage?.target_turn_ids.length ?? 0}</code> target turns in the first
                  passage.
                </div>
                <div>
                  Normalized sample: <code>{normalizationPreview.transcriptTurnKeys[1]?.transcriptId}</code> maps
                  to <code>{normalizationPreview.transcriptTurnKeys[1]?.turnKey}</code>.
                </div>
                <div>
                  Reverse mapping sample: <code>{normalizationPreview.packageTurnKeys[0]?.turnKey}</code> maps
                  to <code>{normalizationPreview.packageTurnKeys[0]?.transcriptId}</code>.
                </div>
                <div>
                  Turn <code>t02</code> resolves to speaker <code>{firstTurn?.speaker}</code>.
                </div>
              </div>
            </div>
          </section>

          <section className="lens-dark-panel lens-reveal rounded-[2rem] p-7 text-white" style={{ animationDelay: "140ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              What this build already does
            </p>
            <ol className="mt-5 grid gap-4">
              {runtimeHighlights.map((item, index) => (
                <li key={item} className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                    Highlight {index + 1}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/84">{item}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <SessionShell
          assistivePackage={bundle.assistivePackage}
          episodeContext="A group of students at one table is about to read a short Polylogue episode, confirm who is participating on this device, and begin from a shared browser-local session."
          episodeTitle="Strangers in the Old Forest"
          sessionConfig={bundle.sessionConfig}
          transcript={bundle.transcript}
        />
      </section>
    </main>
  );
}
