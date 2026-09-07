import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, TOKEN_COOKIE, ROLE_COOKIE } from "@/lib/api-server";
import type { Role } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/proxy-login
 *
 * Forwards `{ username, password }` to the Laravel backend. On success,
 * converts the returned `access_token` into an httpOnly `sb_token` cookie and
 * a readable `sb_role` cookie. The access token is never returned to the client.
 */
export async function POST(req: Request) {
  let username: string;
  let password: string;

  try {
    const body = await req.json();
    username = body.username ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json(
      {
        status: false,
        statusCode: 400,
        message: "Request body tidak valid",
        error: "Bad Request",
      },
      { status: 400 },
    );
  }

  // Forward to the Laravel backend (unauthenticated, so no Bearer header).
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        status: false,
        statusCode: 502,
        message: "Gagal terhubung ke server backend",
        error: "Bad Gateway",
      },
      { status: 502 },
    );
  }

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  // Propagate backend errors without setting any cookie.
  if (!res.ok || body?.status === false || body?.statusCode >= 400) {
    return NextResponse.json(body, { status: res.status });
  }

  const data = body?.data;
  const accessToken = data?.access_token;
  const role = data?.role as Role | undefined;

  if (!accessToken || typeof accessToken !== "string") {
    return NextResponse.json(
      {
        status: false,
        statusCode: 500,
        message: "Backend tidak mengembalikan access_token",
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  cookieStore.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    path: "/",
    sameSite: "lax",
    maxAge,
  });

  if (role) {
    cookieStore.set(ROLE_COOKIE, role, {
      httpOnly: false,
      secure: isProduction,
      path: "/",
      sameSite: "lax",
      maxAge,
    });
  }

  // Return the user object WITHOUT the access token for safety.
  const safeData = { ...data } as Record<string, unknown>;
  delete safeData.access_token;

  return NextResponse.json({ ...body, data: safeData });
}