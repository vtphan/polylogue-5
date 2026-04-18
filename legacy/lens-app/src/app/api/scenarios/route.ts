import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireAuth("researcher", "teacher");
  if (auth instanceof NextResponse) return auth;

  const scenarios = await prisma.scenario.findMany({
    where: auth.role === "teacher" ? { status: "available" } : undefined,
    select: {
      id: true,
      topic: true,
      status: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json(scenarios);
}
