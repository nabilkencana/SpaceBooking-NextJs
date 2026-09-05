"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import type { Diskon } from "@/types";

// ─── Query keys ────────────────────────────────────────────────────────────

export const diskonKeys = {
  active: ["diskon", "active"] as const,
};

// ─── Active diskon list ────────────────────────────────────────────────────

export function useActiveDiskon() {
  return useQuery({
    queryKey: diskonKeys.active,
    queryFn: async () => {
      const { data } = await apiClient.get("/diskon/active");
      return unwrapApi<Diskon[]>({ data });
    },
  });
}

// ─── Check diskon code ─────────────────────────────────────────────────────

export interface CheckDiskonResponse {
  valid: boolean;
  diskon?: Diskon;
  pesan?: string;
}

export function useCheckDiskon() {
  return useMutation({
    mutationFn: async (kode_promo: string) => {
      const { data } = await apiClient.post("/diskon/check", { kode_promo });
      return unwrapApi<CheckDiskonResponse>({ data });
    },
  });
}