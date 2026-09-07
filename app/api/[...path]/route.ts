import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/api-server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_API_URL || "http://localhost:8000/api";

/**
 * Generic BFF proxy — catches every `/api/{...}` call from the client and
 * forwards it to the Laravel backend with the `Authorization: Bearer <token>`
 * header attached server-side from the httpOnly cookie.
 *
 * Supports JSON and multipart/form-data bodies (for upload endpoints).
 */
async function handler(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const joined = path.join("/");
  const query = req.url.includes("?") ? "?" + req.url.split("?")[1] : "";
  const url = `${BACKEND_URL}/${joined}${query}`;

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  // Build outgoing headers — preserve the incoming Content-Type for
  // multipart requests so the boundary is forwarded correctly.
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const contentType = req.headers.get("content-type") ?? "";

  // Forward body: multipart passes the raw FormData, JSON passes the
  // serialised payload, and methods with no body skip it.
  let body: BodyInit | null | undefined;
  if (contentType.includes("multipart/form-data")) {
    body = req.body; // ReadableStream — pipe raw bytes through
    headers.set("Content-Type", contentType); // keep boundary
  } else if (req.method !== "GET" && req.method !== "HEAD") {
    // Read the body as JSON for forwarding
    try {
      const json = await req.json();
      body = JSON.stringify(json);
      headers.set("Content-Type", "application/json");
    } catch {
      // Body wasn't JSON or was empty — that's fine
      body = undefined;
      headers.set("Content-Type", "application/json");
    }
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: body ?? undefined,
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

  // Parse the body — for empty responses (204 etc.) return null
  let responseBody: unknown;
  const text = await backendRes.text();
  try {
    responseBody = text ? JSON.parse(text) : null;
  } catch {
    responseBody = text;
  }

  return NextResponse.json(responseBody, { status: backendRes.status });
}

// Export handler for every HTTP method.
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;