import {
  buildTranscriptTurnIndex,
  buildTurnNormalizationPreview,
  loadSessionBundle,
} from "@/lib/content/loaders";
import { SessionShell } from "@/features/session/components/session-shell";

const readinessChecklist = [
  "Fresh Next.js app scaffolded in apps/lens/",
  "Lens v1 docs aligned to a greenfield implementation target",
  "Manifest, session config, and persistence defaults documented",
  "Turn-ID normalization rule fixed before loader work begins",
];

const nextSlices = [
  "Define Zod schemas for package, transcript, manifest, session config, and persistence records.",
  "Build the content loader and normalize transcript turn_02 IDs to package t02 keys.",
  "Wire bundled manifest discovery and direct-open config resolution.",
];

export default async function Home() {
  const bundle = await loadSessionBundle("forest-ep01-table-a");
  const turnIndex = buildTranscriptTurnIndex(bundle.transcript);
  const normalizationPreview = buildTurnNormalizationPreview(
    bundle.transcript,
    bundle.assistivePackage,
  );

  const firstTurn = turnIndex.get("t02");
  const firstPassage = bundle.assistivePackage.analytic_core.passages[0];

  return (
    <main
      className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12"
    >
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Polylogue
              </p>
              <h1
                className="max-w-3xl text-5xl leading-none sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Lens v1 is now a clean app inside <span className="text-[var(--accent)]">apps/lens</span>.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[color:rgba(29,36,48,0.76)] sm:text-lg">
                This scaffold intentionally starts fresh. The old <code>lens-app/</code> runtime is
                not the base. The next slices are schemas, content loading, manifest resolution, and
                browser-local session state.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-strong)] p-5 lg:w-[20rem]">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Current target
              </span>
              <div className="text-2xl font-semibold">Greenfield Next.js App Router</div>
              <div className="text-sm leading-6 text-[color:rgba(37,50,68,0.72)]">
                Shared-device, browser-local, artifact-driven Lens v1 runtime.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] p-7 shadow-[0_18px_56px_rgba(39,41,53,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                className="text-3xl leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Readiness Snapshot
              </h2>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                scaffold
              </span>
            </div>

            <ul className="grid gap-3">
              {readinessChecklist.map((item, index) => (
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
                Loader proof
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

          <section className="rounded-[2rem] border border-[var(--line)] bg-[#273548] p-7 text-white shadow-[0_18px_56px_rgba(25,31,43,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              Immediate next slices
            </p>
            <ol className="mt-5 grid gap-4">
              {nextSlices.map((item, index) => (
                <li key={item} className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
                    Slice {index + 1}
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
