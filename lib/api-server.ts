import { cookies } from "next/headers";

/** Base URL of the Laravel backend API. */
export const BACKEND_URL =
  process.env.BACKEND_API_URL || "http://localhost:8000/api";

/** Name of the httpOnly cookie holding the Sanctum access token. */
export const TOKEN_COOKIE = "sb_token";

/** Name of the (non-httpOnly) cookie holding the user role. */
export const ROLE_COOKIE = "sb_role";

/** Reads the access token from the httpOnly cookie, or null when absent. */
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value ?? null;
}

/**
 * Server-side helper for server components and route handlers.
 *
 * Forwards a request to the Laravel backend, automatically attaching the
 * `Authorization: Bearer <sb_token>` header from the httpOnly cookie when a
 * token is present.
 *
 * Returns the parsed JSON body plus the fetch metadata (`ok`, `status`).
 */
export async function apiServer(path: string, options: RequestInit = {}) {
  const token = await getServerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  const body = await res.json();
  return { ok: res.ok, status: res.status, body };
}