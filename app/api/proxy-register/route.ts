import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, TOKEN_COOKIE, ROLE_COOKIE } from "@/lib/api-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: false, statusCode: 400, message: "Invalid body" }, { status: 400 });
  }

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;
  if (!isRecord(body)) {
    return NextResponse.json({ status: false, statusCode: 400, message: "Invalid body" }, { status: 400 });
  }

  const { type, ...fields } = body;
  
  // Determine which backend endpoint to call
  const endpoint = type === "admin" 
    ? "/auth/register/admin-space" 
    : "/auth/register/member";

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ status: false, statusCode: 502, message: "Backend unreachable" }, { status: 502 });
  }

  let result: unknown;
  try { result = await res.json(); } catch { result = {}; }

  // Pass through errors
  if (!res.ok || (isRecord(result) && result.status === false)) {
    return NextResponse.json(result, { status: res.status || 400 });
  }

  const data = isRecord(result) && isRecord(result.data) ? result.data : undefined;
  if (!data?.access_token) {
    return NextResponse.json({ status: false, statusCode: 500, message: "No access token returned" }, { status: 500 });
  }

  // Set cookies from the returned access_token
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, String(data.access_token), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    path: "/", sameSite: "lax", maxAge: 604800,
  });
  cookieStore.set(ROLE_COOKIE, String(data.role), {
    httpOnly: false, secure: process.env.NODE_ENV === "production",
    path: "/", sameSite: "lax", maxAge: 604800,
  });

  // Strip access_token from response before returning to client
  const { access_token: _stripped, ...safeData } = data;
  void _stripped;
  return NextResponse.json({ ...(isRecord(result) ? result : {}), data: safeData });
}