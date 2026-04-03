import { NextResponse } from "next/server";
import { getSession, SessionData } from "./session";

type Role = SessionData["role"];

/**
 * Require authentication with optional role check.
 * Returns the session data if authorized, or a NextResponse error.
 */
export async function requireAuth(
  ...allowedRoles: Role[]
): Promise<SessionData | NextResponse> {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return session;
}
