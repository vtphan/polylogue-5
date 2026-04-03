import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("researcher", "teacher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const scenario = await prisma.scenario.findUnique({ where: { id } });

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...scenario,
    artifacts: JSON.parse(scenario.artifacts),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { status } = await req.json();

  if (status !== "available" && status !== "hidden") {
    return NextResponse.json(
      { error: "Status must be 'available' or 'hidden'" },
      { status: 400 }
    );
  }

  const scenario = await prisma.scenario.update({
    where: { id },
    data: { status },
    select: { id: true, topic: true, status: true, publishedAt: true },
  });

  return NextResponse.json(scenario);
}
