import { NextRequest, NextResponse } from "next/server";

// Route protection via middleware.
// Redirects unauthenticated users to /login.
// iron-session cookies are httpOnly so we can't read them here —
// we check for cookie existence as a fast gate, and API routes
// do the real auth check via getSession().

const publicPaths = ["/login", "/student-login", "/api/auth/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie existence (fast gate)
  const sessionCookie = request.cookies.get("lens-session");
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
