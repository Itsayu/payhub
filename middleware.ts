import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // ---------- Super Admin routes ----------
  if (pathname.startsWith("/super-admin") && pathname !== "/super-admin/login") {
    if (!session || session.role !== "super_admin") {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ---------- Universal org-admin login (/admin) ----------
  // If an org admin is already signed in, skip the login form and go straight
  // to their own dashboard instead of asking them to log in again.
  if (pathname === "/admin") {
    if (session && session.role === "org_admin" && session.orgSlug) {
      const dest = session.forcePasswordChange
        ? `/${session.orgSlug}/admin/change-password`
        : `/${session.orgSlug}/admin`;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // ---------- Organization Admin routes ----------
  const orgAdminMatch = pathname.match(/^\/([^/]+)\/admin(\/.*)?$/);
  if (orgAdminMatch) {
    const orgSlug = orgAdminMatch[1];
    const subPath = orgAdminMatch[2] ?? "/";

    if (subPath === "/login") {
      return NextResponse.next();
    }

    if (!session || session.role !== "org_admin" || session.orgSlug !== orgSlug) {
      return NextResponse.redirect(new URL(`/${orgSlug}/admin/login`, req.url));
    }

    // Force password change gate
    if (session.forcePasswordChange && subPath !== "/change-password") {
      return NextResponse.redirect(new URL(`/${orgSlug}/admin/change-password`, req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super-admin/:path*", "/:org_slug/admin/:path*", "/admin"],
};
