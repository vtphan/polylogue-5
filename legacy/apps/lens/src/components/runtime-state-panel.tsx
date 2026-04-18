type RuntimeStatePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  detail?: string;
};

export function RuntimeStatePanel({
  eyebrow,
  title,
  description,
  detail,
}: RuntimeStatePanelProps) {
  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow)] md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              {eyebrow}
            </p>
            <h1
              className="mt-3 text-4xl leading-none sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[color:rgba(29,36,48,0.76)] sm:text-lg">
              {description}
            </p>
          </div>

          {detail ? (
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)]/70 p-5 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]">
              <span className="font-semibold text-[var(--surface-ink)]">Runtime detail:</span> {detail}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
