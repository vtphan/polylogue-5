import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("researcher");
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const classes = await prisma.class.findMany({
    where: { teacherId: id },
    select: {
      id: true,
      name: true,
      sessions: {
        select: {
          id: true,
          status: true,
          joinCode: true,
          createdAt: true,
          activatedAt: true,
          closedAt: true,
          scenario: { select: { id: true, topic: true } },
          _count: {
            select: {
              sessionGroups: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const sessions = classes.flatMap((c) =>
    c.sessions.map((s) => ({
      ...s,
      className: c.name,
      classId: c.id,
    }))
  );

  return NextResponse.json(sessions);
}
