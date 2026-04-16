import { loadDefaultLensBundle } from "@/lib/content/default-bundle";
import { SessionRuntime } from "@/features/session/components/session-runtime";

export default async function HomePage() {
  const bundle = await loadDefaultLensBundle();

  return (
    <main className="shell">
      <SessionRuntime bundle={bundle} />
    </main>
  );
}
