import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "researcher") {
    redirect("/login");
  }

  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({ where: { id } });

  if (!scenario) {
    return <p className="text-sm text-muted-foreground">Scenario not found.</p>;
  }

  const artifacts = JSON.parse(scenario.artifacts);
  const turnCount = artifacts.transcript?.turns?.length ?? 0;
  const passageCount = artifacts.analysis?.passage_analyses?.length ?? 0;
  const facetCount =
    artifacts.analysis?.passage_analyses?.reduce(
      (sum: number, p: { facet_annotations?: unknown[] }) =>
        sum + (p.facet_annotations?.length ?? 0),
      0
    ) ?? 0;

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/researcher" className="hover:underline">
          Dashboard
        </Link>
        {" / "}
        <span className="text-foreground">{scenario.topic}</span>
      </div>

      <h2 className="mb-1 text-xl font-semibold">{scenario.topic}</h2>
      <div className="mb-6 flex items-center gap-2">
        <Badge variant={scenario.status === "available" ? "default" : "secondary"}>
          {scenario.status}
        </Badge>
        <span className="text-sm text-muted-foreground">{scenario.id}</span>
      </div>

      <div className="mb-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <span className="font-medium text-foreground">{turnCount}</span> turns
        </div>
        <div>
          <span className="font-medium text-foreground">{passageCount}</span> passages
        </div>
        <div>
          <span className="font-medium text-foreground">{facetCount}</span> facet annotations
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Walkthrough</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              See the 5-stage pipeline flow, the information barrier, and how each artifact was produced.
            </p>
            <Link href={`/researcher/scenario/${id}/pipeline`}>
              <Button>View Pipeline</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artifact Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Browse annotated views of the transcript, analysis, scaffolding, and facilitation guide.
            </p>
            <Link href={`/researcher/scenario/${id}/artifacts`}>
              <Button>View Artifacts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
