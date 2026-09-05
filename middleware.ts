import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "sb_token";
const ROLE_COOKIE = "sb_role";

const MEMBER_HOME = "/reservasi";
const ADMIN_HOME = "/admin/dashboard";

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/spaces"]);

function isPublic(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  if (path.startsWith("/spaces/")) return true;
  if (path.startsWith("/api/")) return true;
  return false;
}

type ProtectedGroup = {
  paths: string[];
  allowedRole: "member" | "admin_space";
};

const PROTECTED_GROUPS: ProtectedGroup[] = [
  { paths: ["/booking", "/reservasi", "/member", "/my"], allowedRole: "member" },
  { paths: ["/admin", "/dashboard", "/panel"], allowedRole: "admin_space" },
];

function matchProtectedGroup(path: string): ProtectedGroup | null {
  for (const group of PROTECTED_GROUPS) {
    for (const prefix of group.paths) {
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        return group;
      }
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths unconditionally.
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const matchedGroup = matchProtectedGroup(pathname);

  // Path is not recognised as public nor protected — allow through.
  if (!matchedGroup) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value as
    | "member"
    | "admin_space"
    | undefined;

  // No token → redirect to login.
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Wrong role for this group → redirect to the user's home.
  if (role !== matchedGroup.allowedRole) {
    const home = role === "admin_space" ? ADMIN_HOME : MEMBER_HOME;
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/booking/:path*",
    "/reservasi/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/member/:path*",
    "/my/:path*",
  ],
};