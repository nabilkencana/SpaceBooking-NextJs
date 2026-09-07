"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiClient } from "@/lib/api-client";
import { unwrapApi, ApiRequestError, type ApiSuccess } from "@/lib/api";
import type { Role, User } from "@/types";

export interface LoginCredentials {
  username: string;
  password: string;
}

export type LoginMode = "login" | "register-member" | "register-admin";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hydrationRef = useRef(false);

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get("/auth/profile");
      const profile = unwrapApi<User>({ data });
      setUser(profile);
      const nextRole: Role | null = profile.role ?? null;
      setRole(nextRole);
      return profile;
    } catch {
      // Clear session state when the profile can't be loaded (no/invalid token).
      setUser(null);
      setRole(null);
      return null;
    }
  }, []);

  // Hydrate the user from the httpOnly cookie on mount so page refreshes keep
  // you logged in. Called exactly once.
  useEffect(() => {
    if (hydrationRef.current) return;
    hydrationRef.current = true;
    void refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      const { data } = await apiClient.post<ApiSuccess<User>>(
        "/proxy-login",
        { username, password },
      );
      const u = unwrapApi<User>({ data });
      setUser(u);
      setRole(u.role ?? null);
      // await refreshProfile();
      return u;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/proxy-logout");
    } catch {
      // Best-effort — clear local state regardless.
    }
    setUser(null);
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
    }),
    [user, role, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
}

// Re-export the error class so callers can catch specific API failures.
export { ApiRequestError };