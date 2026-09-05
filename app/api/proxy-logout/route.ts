import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, TOKEN_COOKIE, ROLE_COOKIE } from "@/lib/api-server";

export const runtime = "nodejs";

/**
 * POST /api/proxy-logout
 *
 * Best-effort revokes the Sanctum token on the backend, then clears the
 * `sb_token` and `sb_role` cookies locally. Backend failure is ignored —
 * clearing the cookie is what actually signs the user out.
 */
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  // Best-effort backend logout; ignore failures.
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // Swallow — network / backend failure must not block sign-out.
    }
  }

  cookieStore.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });

  cookieStore.set(ROLE_COOKIE, "", {
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
  });

  return NextResponse.json({
    status: true,
    statusCode: 200,
    message: "Logout berhasil",
    data: null,
  });
}