"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import type {
  Paginated,
  Space,
  SpaceDetail,
  AvailabilityResponse,
} from "@/types";

// ─── Query keys ────────────────────────────────────────────────────────────

export const spaceKeys = {
  all: ["spaces"] as const,
  list: (params: Record<string, string | number | null | undefined>) =>
    ["spaces", "list", params] as const,
  detail: (id: number) => ["space", id] as const,
  slug: (slug: string) => ["space", "slug", slug] as const,
  availability: (params: Record<string, string | number | null | undefined>) =>
    ["space", "availability", params] as const,
};

// ─── Space list (paginated or flat) ───────────────────────────────────────

export interface SpacesQueryParams {
  search?: string;
  type?: string;
  sort?: "name" | "price";
  page?: number;
  per_page?: number;
}

export function useSpacesQuery(params: SpacesQueryParams = {}) {
  const queryKey = spaceKeys.list(params as Record<string, string | number>);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const requestParams: Record<string, string | number> = {};
      if (params.search) requestParams.search = params.search;
      if (params.type) requestParams.tipe = params.type;
      if (params.page) requestParams.page = params.page;
      if (params.per_page) requestParams.per_page = params.per_page;

      const { data } = await apiClient.get("/spaces", {
        params: requestParams,
      });
      const payload = unwrapApi<Space[] | Paginated<Space>>({ data });

      const items = Array.isArray(payload) ? payload : payload.items;
      const meta = Array.isArray(payload) ? null : payload.meta;

      const sorted = params.sort
        ? [...items].sort((a, b) => {
            if (params.sort === "price") {
              return a.harga_per_jam - b.harga_per_jam;
            }
            return a.nama_space.localeCompare(b.nama_space);
          })
        : items;

      return { items: sorted, meta };
    },
  });
}

// ─── Space detail by id ───────────────────────────────────────────────────

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

// ─── Space detail by slug (endpoint accepts id-or-slug) ───────────────────

export function useSpaceBySlug(slug: string) {
  return useQuery({
    queryKey: spaceKeys.slug(slug),
    queryFn: async () => {
      const { data } = await apiClient.get(`/spaces/${encodeURIComponent(slug)}`);
      return unwrapApi<SpaceDetail>({ data });
    },
    enabled: !!slug,
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