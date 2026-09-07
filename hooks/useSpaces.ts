"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import type { SpaceDetail, AvailabilityResponse } from "@/types";

// ─── Query keys ────────────────────────────────────────────────────────────

export const spaceKeys = {
  detail: (id: number) => ["space", id] as const,
  availability: (params: Record<string, string | number | null | undefined>) =>
    ["space", "availability", params] as const,
};

// ─── Space detail ──────────────────────────────────────────────────────────

export function useSpace(id: number) {
  return useQuery({
    queryKey: spaceKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/spaces/${id}`);
      return unwrapApi<SpaceDetail>({ data });
    },
    enabled: !!id,
  });
}

// ─── Availability ──────────────────────────────────────────────────────────

export interface AvailabilityParams {
  id_space?: number;
  tanggal?: string;
  jam_mulai?: string;
  durasi_jam?: number;
}

export function useCheckAvailability(
  params: AvailabilityParams,
  enabled: boolean,
) {
  const hasRequired =
    !!params.id_space &&
    !!params.tanggal &&
    !!params.jam_mulai &&
    !!params.durasi_jam;

  const queryKey: QueryKey = [
    ...spaceKeys.availability(params as Record<string, string | number>),
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get("/spaces/availability", {
        params: {
          id_space: params.id_space,
          tanggal: params.tanggal,
          jam_mulai: params.jam_mulai,
          durasi_jam: params.durasi_jam,
        },
      });
      return unwrapApi<AvailabilityResponse>({ data });
    },
    enabled: enabled && hasRequired,
  });
}