import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isAuthenticatedInMiddleware } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!(await isAuthenticatedInMiddleware(token))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
