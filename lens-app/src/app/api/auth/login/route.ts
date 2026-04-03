import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  // Check researcher first, then teacher
  const researcher = await prisma.researcher.findUnique({
    where: { username },
  });

  if (researcher) {
    const valid = await bcrypt.compare(password, researcher.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.userId = researcher.id;
    session.role = "researcher";
    session.username = researcher.username;
    await session.save();

    return NextResponse.json({
      id: researcher.id,
      role: "researcher",
      username: researcher.username,
    });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { username },
  });

  if (teacher) {
    const valid = await bcrypt.compare(password, teacher.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.userId = teacher.id;
    session.role = "teacher";
    session.username = teacher.username;
    await session.save();

    return NextResponse.json({
      id: teacher.id,
      role: "teacher",
      username: teacher.username,
      fullName: teacher.fullName,
    });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
