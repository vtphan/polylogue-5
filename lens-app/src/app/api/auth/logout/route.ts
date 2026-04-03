import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  session.destroy();

  // Form submissions (no Accept: application/json) get redirected to login
  const accept = req.headers.get("accept") || "";
  if (!accept.includes("application/json")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.json({ ok: true });
}
