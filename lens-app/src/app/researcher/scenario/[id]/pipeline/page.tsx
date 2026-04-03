import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { PipelineWalkthrough } from "./pipeline-client";

export default async function PipelinePage({
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

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        <Link href="/researcher" className="hover:underline">
          Dashboard
        </Link>
        {" / "}
        <Link href={`/researcher/scenario/${id}`} className="hover:underline">
          {scenario.topic}
        </Link>
        {" / "}
        <span className="text-foreground">Pipeline</span>
      </div>
      <PipelineWalkthrough artifacts={artifacts} scenarioId={id} topic={scenario.topic} />
    </div>
  );
}
