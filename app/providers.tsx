"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/app/query-provider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </AuthProvider>
    </QueryProvider>
  );
}