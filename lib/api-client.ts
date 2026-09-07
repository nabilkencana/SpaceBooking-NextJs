import axios from "axios";

/**
 * Axios instance for client components.
 *
 * Points at the frontend's OWN `/api/...` route handlers (the BFF proxy),
 * never directly at the Laravel backend. The proxy attaches the Bearer
 * token server-side from the httpOnly `sb_token` cookie, so the client
 * never touches the raw access token.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});