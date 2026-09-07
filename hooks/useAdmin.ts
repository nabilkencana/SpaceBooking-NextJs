"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import type {
  AdminProfile,
  Diskon,
  Member,
  IncomeReport,
  MonthlyReport,
  Reservasi,
  Space,
} from "@/types";

// ─── Payload types ─────────────────────────────────────────────────────────

export interface CreateMemberPayload {
  username: string;
  password: string;
  nama_member: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto?: string | null;
}

export interface UpdateMemberPayload
  extends Partial<CreateMemberPayload> {
  password?: string;
}

// ─── Query keys ────────────────────────────────────────────────────────────

export const adminKeys = {
  profile: ["admin", "profile"] as const,
  members: ["admin", "members"] as const,
  member: (id: number) => ["admin", "members", id] as const,
  spaces: ["admin", "spaces"] as const,
  reservations: (filters?: Record<string, string | number>) =>
    ["admin", "reservations", filters] as const,
  reports: (type: string, month: number, year: number) =>
    ["admin", "reports", type, month, year] as const,
};

// ─── Profile ───────────────────────────────────────────────────────────────

export function useAdminProfile() {
  return useQuery({
    queryKey: adminKeys.profile,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/profile");
      return unwrapApi<AdminProfile>({ data });
    },
  });
}

export function useUpdateAdminProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<AdminProfile>,
    ) => {
      const { data } = await apiClient.put(
        "/admin/profile",
        payload,
      );
      return unwrapApi<AdminProfile>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.profile });
    },
  });
}

// ─── Members ───────────────────────────────────────────────────────────────

export function useMembers() {
  return useQuery({
    queryKey: adminKeys.members,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/members");
      return unwrapApi<Member[]>({ data });
    },
  });
}

export function useMember(id: number) {
  return useQuery({
    queryKey: adminKeys.member(id),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/members/${id}`,
      );
      return unwrapApi<Member>({ data });
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMemberPayload) => {
      const { data } = await apiClient.post(
        "/admin/members",
        payload,
      );
      return unwrapApi<Member>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.members });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: number } & UpdateMemberPayload) => {
      const { data } = await apiClient.put(
        `/admin/members/${id}`,
        payload,
      );
      return unwrapApi<Member>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.members });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(
        `/admin/members/${id}`,
      );
      return unwrapApi<{ message: string }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.members });
    },
  });
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const members = useQuery({
    queryKey: adminKeys.members,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/members");
      return unwrapApi<Member[]>({ data });
    },
  });

  const spaces = useQuery({
    queryKey: adminKeys.spaces,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/spaces");
      return unwrapApi<unknown[]>({ data });
    },
  });

  const reservationsThisMonth = useQuery({
    queryKey: adminKeys.reservations({ month, year }),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/reservasi?month=${month}&year=${year}`,
      );
      return unwrapApi<Reservasi[]>({ data });
    },
  });

  const incomeThisMonth = useQuery({
    queryKey: adminKeys.reports("income", month, year),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/reports/income?month=${month}&year=${year}`,
      );
      return unwrapApi<IncomeReport>({ data });
    },
  });

  return { members, spaces, reservationsThisMonth, incomeThisMonth };
}

// ─── Reservasi (Phase 6) ───────────────────────────────────────────────────

export function useAdminReservasi(
  filters?: { month?: number; year?: number; status?: string },
) {
  return useQuery({
    queryKey: adminKeys.reservations(filters as Record<string, string | number>),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.month) params.set("month", String(filters.month));
      if (filters?.year) params.set("year", String(filters.year));
      if (filters?.status) params.set("status", filters.status);
      const qs = params.toString();
      const { data } = await apiClient.get(
        `/admin/reservasi${qs ? `?${qs}` : ""}`,
      );
      return unwrapApi<Reservasi[]>({ data });
    },
  });
}

// ─── Reports (Phase 6) ─────────────────────────────────────────────────────

export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: adminKeys.reports("monthly", month, year),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/reports/monthly?month=${month}&year=${year}`,
      );
      return unwrapApi<MonthlyReport>({ data });
    },
    enabled: !!month && !!year,
  });
}

export function useIncomeReport(month: number, year: number) {
  return useQuery({
    queryKey: adminKeys.reports("income", month, year),
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/admin/reports/income?month=${month}&year=${year}`,
      );
      return unwrapApi<IncomeReport>({ data });
    },
    enabled: !!month && !!year,
  });
}

// ─── Spaces ────────────────────────────────────────────────────────────────

export interface CreateSpacePayload {
  nama_space: string;
  tipe: string;
  harga_per_jam: number;
  kapasitas: number;
  deskripsi: string;
  foto?: string | null;
}

export interface UpdateSpacePayload {
  nama_space?: string;
  tipe?: string;
  harga_per_jam?: number;
  kapasitas?: number;
  deskripsi?: string;
  foto?: string | null;
}

export function useAdminSpaces() {
  return useQuery({
    queryKey: adminKeys.spaces,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/spaces");
      return unwrapApi<Space[]>({ data });
    },
  });
}

export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSpacePayload) => {
      const { data } = await apiClient.post("/admin/spaces", payload);
      return unwrapApi<Space>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.spaces });
    },
  });
}

export function useUpdateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: number } & UpdateSpacePayload) => {
      const { data } = await apiClient.put(
        `/admin/spaces/${id}`,
        payload,
      );
      return unwrapApi<Space>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.spaces });
    },
  });
}

export function useDeleteSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(
        `/admin/spaces/${id}`,
      );
      return unwrapApi<{ message: string }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.spaces });
    },
  });
}

export function useUploadSpaceFoto() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("image", file);
      const { data } = await apiClient.post(
        "/upload/spaces",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const payload = unwrapApi<unknown>({ data });
      if (typeof payload === "string") return payload;
      if (payload && typeof payload === "object") {
        const rec = payload as Record<string, unknown>;
        const filename = rec.foto ?? rec.filename ?? rec.path ?? rec.name;
        if (typeof filename === "string") return filename;
      }
      throw new Error("Respons upload tidak mengandung nama file");
    },
  });
}

// ─── Diskon ────────────────────────────────────────────────────────────────

export interface CreateDiskonPayload {
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
}

export interface UpdateDiskonPayload
  extends Partial<CreateDiskonPayload> {}

export function useAdminDiskon() {
  return useQuery({
    queryKey: ["admin", "diskon"] as const,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/diskon");
      return unwrapApi<Diskon[]>({ data });
    },
  });
}

export const adminDiskonKeys = {
  all: ["admin", "diskon"] as const,
  detail: (id: number) => ["admin", "diskon", id] as const,
};

export function useCreateDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDiskonPayload) => {
      const { data } = await apiClient.post("/admin/diskon", payload);
      return unwrapApi<Diskon>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminDiskonKeys.all });
    },
  });
}

export function useUpdateDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: { id: number } & UpdateDiskonPayload) => {
      const { data } = await apiClient.put(
        `/admin/diskon/${id}`,
        payload,
      );
      return unwrapApi<Diskon>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminDiskonKeys.all });
    },
  });
}

export function useDeleteDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.delete(
        `/admin/diskon/${id}`,
      );
      return unwrapApi<{ message: string }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminDiskonKeys.all });
    },
  });
}