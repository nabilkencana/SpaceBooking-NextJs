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
  ReservasiDetail,
  ReservasiStatus,
  Space,
  SpaceOwner,
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

export interface AdminReservationFilters {
  month?: number;
  year?: number;
  status?: ReservasiStatus;
  id_space?: number;
  tanggal?: string;
}

export interface UpdateLocationProfilePayload {
  nama_coworking?: string;
  nama_pemilik?: string;
  telp?: string;
  hotline?: string | null;
  alamat?: string | null;
  deskripsi?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_public?: boolean;
}

// ─── Query keys ────────────────────────────────────────────────────────────

export const adminKeys = {
  profile: ["admin", "profile"] as const,
  publicLocation: ["location", "profile"] as const,
  members: (filters?: Record<string, string | number | null | undefined>) =>
    ["admin", "members", filters] as const,
  member: (id: number) => ["admin", "members", id] as const,
  spaces: ["admin", "spaces"] as const,
  reservations: (
    filters?: Record<string, string | number | null | undefined>,
  ) => ["admin", "reservations", filters] as const,
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
    queryKey: adminKeys.members(),
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/members");
      return unwrapApi<Member[]>({ data });
    },
  });
}

export function useAdminMembers(search?: string) {
  return useQuery({
    queryKey: adminKeys.members({ search: search || null }),
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/members", {
        params: search ? { search } : undefined,
      });
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
      qc.invalidateQueries({ queryKey: adminKeys.members() });
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
      qc.invalidateQueries({ queryKey: adminKeys.members() });
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
      qc.invalidateQueries({ queryKey: adminKeys.members() });
    },
  });
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const members = useQuery({
    queryKey: adminKeys.members(),
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
  tipe: Space["tipe"];
  harga_per_jam: number;
  kapasitas: number;
  deskripsi: string;
  foto?: string | null;
  zona_lantai?: string | null;
  wifi_speed?: number | null;
  ukuran_m2?: number | string | null;
  badge?: string | null;
  amenities?: string[];
  photos?: string[];
}

export interface UpdateSpacePayload
  extends Partial<CreateSpacePayload> {}

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
  nama_event?: string | null;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  is_aktif?: boolean;
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

export function useToggleDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_aktif }: { id: number; is_aktif: boolean }) => {
      const { data } = await apiClient.put(`/admin/diskon/${id}`, {
        is_aktif,
      });
      return unwrapApi<Diskon>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminDiskonKeys.all });
    },
  });
}

// ─── Location (admin profile + public) ─────────────────────────────────────

export function useLocationProfile() {
  return useQuery({
    queryKey: adminKeys.profile,
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/profile");
      return unwrapApi<AdminProfile>({ data });
    },
  });
}

export function useUpdateLocationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateLocationProfilePayload) => {
      const { data } = await apiClient.put("/admin/profile", payload);
      return unwrapApi<AdminProfile>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.profile });
      qc.invalidateQueries({ queryKey: adminKeys.publicLocation });
    },
  });
}

export function usePublicLocation() {
  return useQuery({
    queryKey: adminKeys.publicLocation,
    queryFn: async () => {
      const { data } = await apiClient.get("/location/profile");
      return unwrapApi<SpaceOwner>({ data });
    },
  });
}

// ─── Admin reservations ────────────────────────────────────────────────────

export function useAdminReservations(filters?: AdminReservationFilters) {
  const hasFilters =
    filters &&
    Object.values(filters).some((value) => value !== undefined && value !== "");

  return useQuery({
    queryKey: adminKeys.reservations(
      hasFilters ? (filters as Record<string, string | number>) : undefined,
    ),
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/reservasi", {
        params: filters,
      });
      return unwrapApi<Reservasi[]>({ data });
    },
  });
}

export function useReservationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: ReservasiStatus;
    }) => {
      const { data } = await apiClient.patch(
        `/admin/reservasi/${id}/status`,
        { status },
      );
      return unwrapApi<{ id: number; status: ReservasiStatus }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] as const });
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(`/admin/reservasi/${id}/check-in`);
      return unwrapApi<{
        id: number;
        status: ReservasiStatus;
        check_in_time: string;
      }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] as const });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post(
        `/admin/reservasi/${id}/check-out`,
      );
      return unwrapApi<{
        id: number;
        status: ReservasiStatus;
        check_out_time: string;
      }>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] as const });
    },
  });
}

export function useVerifyQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post("/admin/reservasi/verify-qr", {
        token,
      });
      return unwrapApi<ReservasiDetail>({ data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservations"] as const });
    },
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: adminKeys.reservations({ status: "belum_dikonfirm" }),
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/reservasi", {
        params: { status: "belum_dikonfirm" },
      });
      return unwrapApi<Reservasi[]>({ data });
    },
    select: (reservations) => reservations.length,
  });
}

// ─── Reports ───────────────────────────────────────────────────────────────

export function useReports(month: number, year: number) {
  const monthly = useMonthlyReport(month, year);
  const income = useIncomeReport(month, year);
  return { monthly, income };
}