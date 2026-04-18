import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACTIVE_STUDENT_COOKIE,
  PRACTICE_COMPLETE_COOKIE,
} from "@/lib/student-cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const activeStudentId = request.cookies.get(ACTIVE_STUDENT_COOKIE)?.value ?? "";
  const practiceComplete =
    request.cookies.get(PRACTICE_COMPLETE_COOKIE)?.value === "true";

  if ((pathname.startsWith("/practice") || pathname.startsWith("/runs")) && !activeStudentId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/runs") && activeStudentId && !practiceComplete) {
    return NextResponse.redirect(new URL("/practice", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/practice/:path*", "/runs/:path*"],
};
