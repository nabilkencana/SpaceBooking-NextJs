"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * Primary auth hook — returns the full auth context.
 */
export function useAuth() {
  return useAuthContext();
}

/**
 * Restrict a client page to authenticated users.
 *
 * While `isLoading` is true (profile hydration in-flight) it returns without
 * redirecting, then redirects to `redirectTo` once it knows there is no user.
 */
export function useRequireAuth(redirectTo = "/login") {
  const { user, role, isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  return { user, role, isAuthenticated, isLoading };
}

/**
 * Wrapper component that renders its children only when authenticated.
 * While loading it renders a lightweight placeholder; once it settles without
 * a session it redirects the user to `redirectTo`.
 */
export function RequireAuth({
  redirectTo = "/login",
  children,
}: {
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return children;
}