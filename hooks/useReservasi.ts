"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import type {
  Reservasi,
  ReservasiDetail,
  HistoryResponse,
  ETicket,
  CreateReservasiPayload,
} from "@/types";

// ─── Query keys ────────────────────────────────────────────────────────────

export const reservasiKeys = {
  all: ["reservasi"] as const,
  my: ["reservasi", "my"] as const,
  detail: (id: number) => ["reservasi", id] as const,
  history: (month: number, year: number) =>
    ["reservasi", "history", month, year] as const,
  eTicket: (id: number) => ["reservasi", id, "e-ticket"] as const,
};

// ─── My reservations (list) ────────────────────────────────────────────────

export function useMyReservations() {
  return useQuery({
    queryKey: reservasiKeys.my,
    queryFn: async () => {
      const { data } = await apiClient.get("/reservasi/my");
      return unwrapApi<Reservasi[]>({ data });
    },
  });
}

// ─── Detail ────────────────────────────────────────────────────────────────

export function useReservation(id: number) {
  return useQuery({
    queryKey: reservasiKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/reservasi/${id}`);
      return unwrapApi<ReservasiDetail>({ data });
    },
    enabled: !!id,
  });
}

// ─── History ───────────────────────────────────────────────────────────────

export function useHistory(month: number, year: number) {
  return useQuery({
    queryKey: reservasiKeys.history(month, year),
    queryFn: async () => {
      const { data } = await apiClient.get("/reservasi/my/history", {
        params: { month, year },
      });
      return unwrapApi<HistoryResponse>({ data });
    },
    enabled: !!month && !!year,
  });
}

// ─── E-Ticket ──────────────────────────────────────────────────────────────

export function useETicket(id: number) {
  return useQuery({
    queryKey: reservasiKeys.eTicket(id),
    queryFn: async () => {
      const { data } = await apiClient.get(`/reservasi/${id}/e-ticket`);
      return unwrapApi<ETicket>({ data });
    },
    enabled: !!id,
  });
}

// ─── Create reservation ────────────────────────────────────────────────────

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReservasiPayload) => {
      const { data } = await apiClient.post("/reservasi", payload);
      return unwrapApi<Reservasi>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reservasiKeys.my });
      qc.invalidateQueries({ queryKey: reservasiKeys.all });
    },
  });
}

// ─── Cancel reservation ────────────────────────────────────────────────────

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.patch(`/reservasi/${id}/cancel`);
      return unwrapApi<Reservasi>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reservasiKeys.my });
      qc.invalidateQueries({ queryKey: reservasiKeys.all });
    },
  });
}