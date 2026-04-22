import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACTIVE_STUDENT_COOKIE } from "@/lib/student-cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const activeStudentId = request.cookies.get(ACTIVE_STUDENT_COOKIE)?.value ?? "";

  if (pathname.startsWith("/runs") && !activeStudentId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/runs/:path*"],
};
