import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/ui";
import { FrameworkVisualization } from "./framework-visualization";
import { loadFrameworkData } from "@/lib/framework/loaders";

export default async function FrameworkPage() {
  const data = await loadFrameworkData();

  return (
    <>
      <Breadcrumbs items={[{ href: "/stories", label: "Stories" }, { label: "Framework" }]} />
      <PageHero
        kicker="Polylogue Framework"
        title="Conceptual Framework Explorer"
        subtitle="Inspect the framework as a navigable map: lenses reveal facets, forces weaken them, and cross-lens visibility shows where multiple legitimate readings emerge."
      />

      <div className="framework-intro panel">
        <p className="page-subtitle framework-intro-copy">
          This view is grounded in `framework/reference/` and shaped by the conceptual source of truth in
          `framework/docs/conceptual-framework.md`.
        </p>
        <Link href="/stories" className="cta subtle">
          Back to stories
        </Link>
      </div>

      <FrameworkVisualization data={data} />
    </>
  );
}
