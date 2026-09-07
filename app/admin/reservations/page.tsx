"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  LayoutGrid,
  Loader2,
  Menu,
  Printer,
  Receipt,
  ScanLine,
  Settings,
  Tag,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";
import {
  adminKeys,
  useAdminReservations,
  useAdminSpaces,
  useCheckIn,
  useCheckOut,
  usePendingCount,
  useReservationAction,
  useVerifyQr,
} from "@/hooks/useAdmin";
import type { AdminReservationFilters } from "@/hooks/useAdmin";
import type { Reservasi, ReservasiDetail, ReservasiStatus } from "@/types";
import { SPACE_TYPE_LABELS } from "@/types";
import { ApiError, ApiRequestError } from "@/lib/api";
import { PAYMENT_STATUS_LABELS, STATUS_ACTION_LABELS } from "../status-labels";

// ─── PAGE-LOCAL HELPERS ──────────────────────────────────────────────────────────
const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

// tanggal_reservasi "YYYY-MM-DD" diparse manual agar bebas geser zona waktu.
const formatDateID = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return `${String(d).padStart(2, "0")} ${MONTH_SHORT_ID[m - 1]} ${y}`;
};

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Backend 4xx envelopes arrive as AxiosError via the BFF proxy. */
function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
  }
  if (err instanceof ApiRequestError) return err.message;
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

// Tab status memakai label B6 di atas enum backend (lihat ../status-labels).
const STATUS_TABS: { key: ReservasiStatus | null; label: string }[] = [
  { key: null, label: "Semua" },
  { key: "belum_dikonfirm", label: STATUS_ACTION_LABELS.belum_dikonfirm.label },
  { key: "disetujui", label: STATUS_ACTION_LABELS.disetujui.label },
  { key: "aktif", label: STATUS_ACTION_LABELS.aktif.label },
  { key: "selesai", label: STATUS_ACTION_LABELS.selesai.label },
  { key: "dibatalkan", label: STATUS_ACTION_LABELS.dibatalkan.label },
];

type PeriodSelection = { month: number | null; year: number | null };

export default function AdminReservationsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // ─── STATE FILTER TOOLBAR ────────────────────────────────────────────────────
  const [statusTab, setStatusTab] = useState<ReservasiStatus | null>(null);
  const [period, setPeriod] = useState<PeriodSelection>({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  });
  const [filterSpaceId, setFilterSpaceId] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);

  // Opsi periode: "Semua Periode" + 6 bulan bergulir (bulan berjalan + 5 sebelumnya).
  const periodOptions: (PeriodSelection & { label: string })[] = [
    { month: null, year: null, label: "Semua Periode" },
    ...Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      return {
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`,
      };
    }),
  ];
  const periodLabel =
    period.month !== null && period.year !== null
      ? `${MONTH_NAMES_ID[period.month - 1]} ${period.year}`
      : "Semua Periode";

  const tableFilters = useMemo<AdminReservationFilters>(() => {
    const filters: AdminReservationFilters = {};
    if (statusTab) filters.status = statusTab;
    if (period.month !== null && period.year !== null) {
      filters.month = period.month;
      filters.year = period.year;
    }
    if (filterSpaceId) filters.id_space = filterSpaceId;
    if (filterDate) filters.tanggal = filterDate;
    return filters;
  }, [statusTab, period, filterSpaceId, filterDate]);

  const overviewFilters = useMemo<AdminReservationFilters>(
    () =>
      period.month !== null && period.year !== null
        ? { month: period.month, year: period.year }
        : {},
    [period]
  );

  // ─── LIVE DATA ───────────────────────────────────────────────────────────────
  const tableQuery = useAdminReservations(tableFilters);
  const overviewQuery = useAdminReservations(overviewFilters);
  const spacesQuery = useAdminSpaces();
  const pendingCountQuery = usePendingCount();

  const reservations = tableQuery.data ?? [];
  const overviewItems = overviewQuery.data ?? [];
  const adminSpaces = spacesQuery.data ?? [];
  const sidebarPendingCount = pendingCountQuery.data ?? 0;

  // KPI operasional dari agregasi tampilan atas data server (bukan harga/otoritas).
  const pendingTotal = overviewItems.filter(
    (r) => r.status === "belum_dikonfirm"
  ).length;
  const readyTodayTotal = overviewItems.filter(
    (r) => r.status === "disetujui" && r.tanggal_reservasi === todayIso
  ).length;
  const activeTotal = overviewItems.filter(
    (r) => r.status === "aktif"
  ).length;

  // ─── STATE SCANNER QR ────────────────────────────────────────────────────────
  const [qrTokenInput, setQrTokenInput] = useState("");
  const [verified, setVerified] = useState<ReservasiDetail | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // ─── STATE UI LAIN ───────────────────────────────────────────────────────────
  const [actingId, setActingId] = useState<number | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Reservasi | null>(null);

  // ─── MUTASI ──────────────────────────────────────────────────────────────────
  const reservationAction = useReservationAction();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const verifyQr = useVerifyQr();

  // Identitas Admin
  const adminName =
    user?.space_owner?.nama_pemilik ??
    user?.member?.nama_member ??
    user?.username ??
    "Admin";
  const adminRole = "Admin Pengelola";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // ─── ACTION HANDLERS (OPTIMISTIC) ────────────────────────────────────────────
  // TanStack 5.102 hanya menerima onMutate di level useMutation (tidak per-call),
  // sedangkan hook hooks/useAdmin.ts tidak menyediakannya. Pola onMutate T12
  // direplikasi page-side: cancel → snapshot → setQueryData → rollback onError.
  type Snapshot = { key: readonly unknown[]; data: Reservasi[] | undefined };

  // Replika persis konstruksi queryKey useAdminReservations (cast + gerbang
  // hasFilters) agar snapshot/rollback tepat sasaran termasuk saat filter kosong.
  const toReservationKey = (filters: AdminReservationFilters): readonly unknown[] =>
    Object.values(filters).some((value) => value !== undefined && value !== "")
      ? adminKeys.reservations(filters as Record<string, string | number>)
      : adminKeys.reservations(undefined);

  const applyStatusOptimistically = async (
    item: Reservasi,
    patch: Partial<Reservasi>
  ): Promise<Snapshot[]> => {
    const keys = [toReservationKey(tableFilters), toReservationKey(overviewFilters)];
    await Promise.all(
      keys.map((key) => queryClient.cancelQueries({ queryKey: key }))
    );
    return keys.map((key) => {
      const previous = queryClient.getQueryData<Reservasi[]>(key);
      queryClient.setQueryData<Reservasi[]>(key, (old) =>
        (old ?? []).map((r) => (r.id === item.id ? { ...r, ...patch } : r))
      );
      return { key, data: previous };
    });
  };

  const rollbackSnapshots = (snapshots: Snapshot[]) => {
    for (const { key, data } of snapshots) {
      if (data) {
        queryClient.setQueryData(key, data);
      } else {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    }
  };

  const handleDecision = async (
    item: Reservasi,
    status: "disetujui" | "dibatalkan"
  ) => {
    setActingId(item.id);
    const snapshots = await applyStatusOptimistically(item, { status });
    reservationAction.mutate(
      { id: item.id, status },
      {
        onSuccess: () => {
          if (status === "disetujui") {
            toast.success(
              `Reservasi ${item.kode_booking} berhasil disetujui.`
            );
          } else {
            toast.error(`Reservasi ${item.kode_booking} telah ditolak.`);
          }
        },
        onError: (error) => {
          rollbackSnapshots(snapshots);
          toast.error(
            `Gagal memproses reservasi ${item.kode_booking}: ${getApiErrorMessage(error)}`
          );
        },
        onSettled: () => setActingId(null),
      }
    );
  };

  const handleCheckIn = async (item: Reservasi) => {
    setActingId(item.id);
    const snapshots = await applyStatusOptimistically(item, {
      status: "aktif",
      check_in_at: new Date().toISOString(),
    });
    checkInMutation.mutate(item.id, {
      onSuccess: () => {
        toast.success(
          `Tamu ${item.member?.nama_member ?? "-"} berhasil check-in ke ${item.space?.nama_space ?? "-"}.`
        );
      },
      onError: (error) => {
        rollbackSnapshots(snapshots);
        toast.error(`Check-in gagal: ${getApiErrorMessage(error)}`);
      },
      onSettled: () => setActingId(null),
    });
  };

  const handleCheckOut = async (item: Reservasi) => {
    setActingId(item.id);
    const snapshots = await applyStatusOptimistically(item, {
      status: "selesai",
      check_out_at: new Date().toISOString(),
    });
    checkOutMutation.mutate(item.id, {
      onSuccess: () => {
        toast.success(
          `Sesi ${item.member?.nama_member ?? "-"} telah selesai (check-out turnstile dibuka).`
        );
      },
      onError: (error) => {
        rollbackSnapshots(snapshots);
        toast.error(`Check-out gagal: ${getApiErrorMessage(error)}`);
      },
      onSettled: () => setActingId(null),
    });
  };

  // ─── INSTANT QR VERIFIER (paste-token, POST /admin/reservasi/verify-qr) ──────
  const handleQuickValidateAndCheckIn = () => {
    const token = qrTokenInput.trim();
    if (!token) {
      toast.error("Token QR tidak boleh kosong!");
      return;
    }
    verifyQr.mutate(token, {
      onSuccess: (data) => {
        setVerified(data);
        setVerifyError(null);
        setQrTokenInput("");
        toast.success(
          `QR Turnstile Terverifikasi! Akses dibuka untuk ${data.member?.nama_member ?? "tamu"} (${data.space?.nama_space ?? "space"}).`
        );
      },
      onError: (error) => {
        setVerified(null);
        const message = getApiErrorMessage(error);
        setVerifyError(message);
        toast.error(message);
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const activeStatusLabel =
    statusTab === null ? "Semua" : STATUS_ACTION_LABELS[statusTab].label;

  // ─── SIDEBAR COMPONENT ───────────────────────────────────────────────────────
  const renderSidebar = () => (
    <div className="h-full flex flex-col justify-between bg-white select-none">
      <div>
        {/* A. Brand & Identitas Lokasi Atas */}
        <div className="p-6 pb-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[#111827] flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-xl tracking-[0.18em] text-[#111827] font-sans">
              URSPACE<span className="text-[#FFD500]">.</span>
            </span>
          </Link>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 block">
            SISTEM MANAJEMEN MOKLET HUB
          </span>
        </div>

        {/* B. Daftar Menu Navigasi Vertikal */}
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Operasional Admin">
          {/* 1. Ringkasan & Laporan */}
          <Link
            href="/admin"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>Ringkasan & Laporan</span>
          </Link>

          {/* 2. Operasional Reservasi (STATUS AKTIF DENGAN BADGE PENDING LIVE) */}
          <Link
            href="/admin/reservations"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center justify-between transition-all bg-[#111827] text-white shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 text-white" />
              <span>Operasional Reservasi</span>
            </div>
            <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              {sidebarPendingCount}
            </span>
          </Link>

          {/* 3. Inventaris Space & Meja */}
          <Link
            href="/admin/inventory"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Inventaris Space & Meja</span>
          </Link>

          {/* 4. Kupon & Diskon Promo */}
          <Link
            href="/admin/coupons"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <Tag className="w-4 h-4 text-gray-400" />
            <span>Kupon & Diskon Promo</span>
          </Link>

          {/* 5. Direktori Member */}
          <Link
            href="/admin/members"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4 text-gray-400" />
            <span>Direktori Member</span>
          </Link>

          {/* 6. Pengaturan Lokasi */}
          <Link
            href="/admin/settings/location"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
            <span>Pengaturan Lokasi</span>
          </Link>
        </nav>
      </div>

      {/* C. Profil Admin & Logout Sesi Bawah */}
      <div className="p-4 m-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {initials || "AD"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#111827] block leading-tight truncate">
              {adminName}
            </span>
            <span className="text-[10px] text-gray-400 block truncate">
              {adminRole}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors pt-2.5 border-t border-gray-200/60 text-left flex items-center justify-between cursor-pointer"
        >
          <span>Keluar Sesi</span>
          <span className="font-mono">→</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-[#F9FAFB] text-[#111827] font-sans antialiased selection:bg-[#FFD500] selection:text-[#111827]">
      {/* ─── 1. SISI KIRI: DESKTOP SIDEBAR (STICKY TOP-0 H-SCREEN) ────────────── */}
      <aside className="hidden lg:block w-64 xl:w-72 bg-white border-r border-[#E5E7EB] shrink-0 sticky top-0 h-screen overflow-y-auto">
        {renderSidebar()}
      </aside>

      {/* ─── 2. MOBILE TOP BAR & DRAWER ───────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Buka navigasi"
          >
            {mobileSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#111827] flex items-center justify-center text-white">
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-base tracking-widest text-[#111827]">
              URSPACE<span className="text-[#FFD500]">.</span>
            </span>
          </div>
        </div>

        <div className="w-7 h-7 rounded-full bg-[#111827] text-white font-bold text-[10px] flex items-center justify-center">
          {initials || "AD"}
        </div>
      </div>

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            {renderSidebar()}
          </div>
        </div>
      )}

      {/* ─── 3. SISI KANAN: WORKSPACE KONTEN UTAMA ────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 xl:p-10 space-y-7 overflow-y-auto mt-14 lg:mt-0">
        <AdminPageTransition pageKey={`${activeStatusLabel}-${periodLabel}-${filterDate}-${filterSpaceId ?? "all"}`}>
          {/* HEADER HALAMAN & DESKRIPSI */}
          <div className="admin-header-animate">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Operasional & Jadwal Reservasi
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
              Kelola konfirmasi pemesanan, verifikasi kedatangan via QR pass, dan check-out tamu.
            </p>
          </div>

          {/* ─── FITUR UTAMA: QUICK SCANNER TURNSTILE (PASTE-TOKEN → verify-qr) ── */}
          <div className="admin-toolbar-animate w-full bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Sisi Kiri (Label & Ikon Scanner) */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-[#111827]">
                  <ScanLine className="w-5 h-5 text-[#111827]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#111827] block">
                    Verifikasi Cepat E-Ticket:
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    Tempel token QR dari e-ticket tamu (tanpa kamera)
                  </span>
                </div>
              </div>

              {/* Sisi Tengah (Field Input Token) */}
              <div className="relative flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500">
                <input
                  type="text"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleQuickValidateAndCheckIn();
                    }
                  }}
                  placeholder="VERIFY-RESERVASI-{id}-{kode_booking}"
                  className="font-mono text-xs font-semibold text-gray-800 tracking-wider w-full bg-transparent focus:outline-none"
                  aria-label="Token QR e-ticket"
                />
              </div>

              {/* Sisi Kanan (Tombol Aksi Cepat) */}
              <button
                type="button"
                onClick={handleQuickValidateAndCheckIn}
                disabled={verifyQr.isPending}
                className="bg-[#111827] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all active:scale-[0.95] whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {verifyQr.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memvalidasi...</span>
                  </span>
                ) : (
                  <>
                    <span>Validasi & Check-In Instan</span>
                    <span className="font-mono">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Pesan error verbatim dari backend (token salah / di luar jendela / status) */}
            {verifyError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                {verifyError}
              </p>
            )}

            {/* Ringkasan reservasi hasil validasi sukses (200) */}
            {verified && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800">
                      Check-in berhasil — reservasi kini aktif.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-gray-600">
                    <span className="font-mono font-bold text-gray-800">
                      {verified.kode_booking}
                    </span>
                    <span>
                      {verified.member?.nama_member ?? "-"}
                      {verified.member?.instansi
                        ? ` (${verified.member.instansi})`
                        : ""}
                      {" • "}
                      {verified.member?.telp ?? "-"}
                    </span>
                    <span>{verified.space?.nama_space ?? "-"}</span>
                    <span className="font-mono">
                      {formatDateID(verified.tanggal_reservasi)} • {verified.jam_mulai} – {verified.jam_selesai} ({verified.durasi_jam} Jam)
                    </span>
                    <span className={STATUS_ACTION_LABELS[verified.status].textClass}>
                      {STATUS_ACTION_LABELS[verified.status].label}
                    </span>
                    {verified.check_in_at && (
                      <span className="font-mono">
                        Check-In: {formatTimestamp(verified.check_in_at)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerified(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-white/60 transition-colors cursor-pointer shrink-0"
                  aria-label="Tutup ringkasan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ─── 4. OPERATIONAL KPI SUMMARY CARDS (GRID 3 KOLOM, DATA LIVE) ────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Kartu 1: Menunggu Konfirmasi */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <div className="flex items-center justify-between text-rose-600">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
                    MENUNGGU KONFIRMASI
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight my-3">
                  <CountUp target={pendingTotal} suffix=" Booking" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {overviewQuery.isLoading
                  ? "Memuat data operasional..."
                  : `Periode ${periodLabel}`}
              </p>
            </div>

            {/* Kartu 2: Siap Check-In Hari Ini */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    SIAP CHECK-IN HARI INI
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight my-3">
                  <CountUp target={readyTodayTotal} suffix=" Tamu" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Pass disetujui dengan jadwal {formatDateID(todayIso)}
              </p>
            </div>

            {/* Kartu 3: Sedang Aktif di Ruangan (Signature Yellow Card) */}
            <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <div className="flex items-center justify-between text-[#111827]">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                    SEDANG AKTIF DI RUANGAN
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-black/10 text-[#111827] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight my-3">
                  <CountUp target={activeTotal} suffix=" Sesi" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs font-semibold text-[#111827]/90">
                Okupansi workstation terisi saat ini
              </p>
            </div>
          </div>

        {/* ─── 5. TOOLBAR FILTER OPERASIONAL & SEGMENTED STATUS TABS ────────── */}
        <div className="admin-toolbar-animate flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pt-1">
          {/* Multi-Parameter Selector (Sisi Kiri) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Date Picker (filter ?tanggal=) */}
            <div className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-xs">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                TGL:
              </span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="font-mono text-gray-800 bg-transparent focus:outline-none text-xs cursor-pointer"
                aria-label="Filter tanggal reservasi"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                  aria-label="Hapus filter tanggal"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>

            {/* 2. Filter Ruang Kerja (filter ?id_space=) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSpaceDropdownOpen((prev) => !prev);
                  setIsPeriodDropdownOpen(false);
                }}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-xs hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>
                  {filterSpaceId
                    ? adminSpaces.find((s) => s.id === filterSpaceId)?.nama_space ??
                      "Space"
                    : "Semua Ruang Kerja"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isSpaceDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSpaceId(null);
                      setIsSpaceDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      filterSpaceId === null
                        ? "bg-gray-100 text-black font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Semua Ruang Kerja
                  </button>
                  {adminSpaces.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setFilterSpaceId(s.id);
                        setIsSpaceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        filterSpaceId === s.id
                          ? "bg-gray-100 text-black font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {s.nama_space}
                    </button>
                  ))}
                  {spacesQuery.isLoading && (
                    <span className="block px-3.5 py-2 text-xs text-gray-400">
                      Memuat daftar space...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3. Periode Bulan & Tahun (filter ?month=&year=) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPeriodDropdownOpen((prev) => !prev);
                  setIsSpaceDropdownOpen(false);
                }}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>{periodLabel}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isPeriodDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {periodOptions.map((option) => {
                    const isActive =
                      period.month === option.month && period.year === option.year;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          setPeriod({ month: option.month, year: option.year });
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          isActive
                            ? "bg-gray-100 text-black font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Segmented Status Tabs (Sisi Kanan) */}
          <div className="inline-flex flex-wrap items-center bg-gray-100 p-1 rounded-full border border-gray-200/70 text-xs">
            {STATUS_TABS.map((tab) => {
              const isActive = statusTab === tab.key;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#111827] text-white font-bold shadow-xs"
                      : "text-gray-600 hover:text-black font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 6. TABEL OPERASIONAL: ANTREAN DETAIL RESERVASI ────────────────── */}
        <div className="w-full bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[840px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">
                    KODE BOOKING
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    MEMBER & KONTAK
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    RUANG KERJA
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    JADWAL PENGGUNAAN
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    TOTAL BAYAR
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    STATUS
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6 text-right">
                    TINDAKAN OPERASIONAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableQuery.isLoading ? (
                  [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i} className="admin-table-row">
                      <td colSpan={7} className="py-4 px-6">
                        <div className="h-8 w-full rounded-lg bg-gray-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : tableQuery.isError ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <p className="text-xs font-semibold text-rose-600">
                        Gagal memuat data reservasi: {getApiErrorMessage(tableQuery.error)}
                      </p>
                      <button
                        type="button"
                        onClick={() => tableQuery.refetch()}
                        className="mt-3 text-xs font-bold text-[#111827] underline underline-offset-2 cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </td>
                  </tr>
                ) : reservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-xs text-gray-400 font-medium"
                    >
                      Tidak ada antrean reservasi untuk filter status &quot;{activeStatusLabel}&quot;.
                    </td>
                  </tr>
                ) : (
                  reservations.map((item) => {
                    const statusMeta = STATUS_ACTION_LABELS[item.status];
                    const isActing = actingId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className="admin-table-row hover:bg-gray-50/60 transition-colors"
                      >
                        {/* 1. KODE BOOKING */}
                        <td className="py-4 px-6 align-top">
                          <span className="font-mono font-bold text-xs text-[#111827] block">
                            {item.kode_booking}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                            ID: #RES-{item.id}
                          </span>
                        </td>

                        {/* 2. MEMBER & KONTAK */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold text-[#111827] block leading-tight">
                            {item.member?.nama_member ?? "-"}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">
                            {item.member?.telp ?? "-"}
                          </span>
                        </td>

                        {/* 3. RUANG KERJA */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold text-gray-800 block">
                            {item.space?.nama_space ?? "-"}
                          </span>
                          {item.space && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {SPACE_TYPE_LABELS[item.space.tipe]}
                            </span>
                          )}
                        </td>

                        {/* 4. JADWAL PENGGUNAAN */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-semibold text-gray-800 block">
                            {formatDateID(item.tanggal_reservasi)}
                          </span>
                          <span className="text-[11px] text-gray-500 block font-mono mt-0.5">
                            {item.jam_mulai} – {item.jam_selesai}{" "}
                            <span className="text-gray-400 font-sans">
                              ({item.durasi_jam} Jam)
                            </span>
                          </span>
                        </td>

                        {/* 5. TOTAL BAYAR */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold font-mono text-[#111827] block">
                            {formatRupiah(item.total_bayar)}
                          </span>
                          <span
                            className={`text-[10px] block mt-0.5 font-medium ${
                              item.payment_status === "paid"
                                ? "text-emerald-600"
                                : "text-gray-400 font-mono"
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[item.payment_status]}
                          </span>
                        </td>

                        {/* 6. STATUS (dengan timestamp check-in/out live) */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold ${statusMeta.textClass}${
                              item.status === "aktif"
                                ? " bg-blue-50 px-2.5 py-0.5 rounded-full inline-block"
                                : ""
                            }`}
                          >
                            {statusMeta.label}
                          </span>
                          {item.status === "aktif" && item.check_in_at && (
                            <span className="block text-[10px] font-mono text-gray-400 mt-0.5">
                              Check-In {formatClock(item.check_in_at)} WIB
                            </span>
                          )}
                          {item.status === "selesai" && item.check_out_at && (
                            <span className="block text-[10px] font-mono text-gray-400 mt-0.5">
                              Check-Out {formatClock(item.check_out_at)} WIB
                            </span>
                          )}
                        </td>

                        {/* 7. TINDAKAN OPERASIONAL (mesin status: belum_dikonfirm → disetujui → aktif → selesai) */}
                        <td className="py-4 px-6 align-top text-right whitespace-nowrap">
                          {item.status === "belum_dikonfirm" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecision(item, "disetujui")}
                                disabled={isActing}
                                className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {isActing && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>Setujui</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecision(item, "dibatalkan")}
                                disabled={isActing}
                                className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2 py-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Tolak
                              </button>
                            </div>
                          )}

                          {item.status === "disetujui" && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(item)}
                              disabled={isActing}
                              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 ml-auto transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                              {isActing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : null}
                              <span>Check-In Tamu</span>
                              <span className="font-mono">→</span>
                            </button>
                          )}

                          {item.status === "aktif" && (
                            <button
                              type="button"
                              onClick={() => handleCheckOut(item)}
                              disabled={isActing}
                              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
                            >
                              {isActing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : null}
                              <span>Proses Check-Out</span>
                            </button>
                          )}

                          {item.status === "selesai" && (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(item)}
                              className="text-xs font-medium text-gray-400 hover:text-black underline-offset-2 hover:underline cursor-pointer"
                            >
                              Lihat Nota
                            </button>
                          )}

                          {item.status === "dibatalkan" && (
                            <span className="text-xs text-gray-400 italic">
                              Batal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── 7. STRIP JUMLAH DATA (index backend tanpa paginasi) ──────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <div>
              Menampilkan{" "}
              <span className="font-semibold text-gray-900">
                {reservations.length}
              </span>{" "}
              reservasi
              {tableQuery.isFetching && !tableQuery.isLoading && (
                <span className="ml-2 text-gray-400">memperbarui...</span>
              )}
            </div>
            <div className="text-gray-400">
              {activeStatusLabel} • {periodLabel}
              {filterDate ? ` • TGL ${filterDate}` : ""}
            </div>
          </div>
        </div>

        {/* ─── 8. STRIP FOOTER OPERASIONAL ADMIN ────────────────────────────── */}
        <footer className="pt-6 border-t border-gray-200 text-center sm:text-left pb-8">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            URSPACE ADMIN • Terminal Operasional Front-Desk © 2026
          </p>
        </footer>
        </AdminPageTransition>
      </main>

      {/* ─── MODAL DETAIL NOTA TRANSAKSI ──────────────────────────────────────── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gray-700" />
                <h3 className="font-extrabold text-base text-[#111827]">
                  Bukti Nota Reservasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Kode Booking:</span>
                <span className="font-mono font-bold text-gray-900">
                  {activeReceipt.kode_booking}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Nama Tamu:</span>
                <span className="font-bold text-gray-900">
                  {activeReceipt.member?.nama_member ?? "-"}{" "}
                  {activeReceipt.member?.telp ? `(${activeReceipt.member.telp})` : ""}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Ruang & Unit:</span>
                <span className="font-semibold text-gray-900">
                  {activeReceipt.space?.nama_space ?? "-"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Jadwal Penggunaan:</span>
                <span className="font-mono text-gray-900">
                  {formatDateID(activeReceipt.tanggal_reservasi)}, {activeReceipt.jam_mulai} – {activeReceipt.jam_selesai} ({activeReceipt.durasi_jam} Jam)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Keterangan:</span>
                <span className="text-emerald-700 font-medium">
                  {PAYMENT_STATUS_LABELS[activeReceipt.payment_status]}
                </span>
              </div>
              {activeReceipt.check_in_at && (
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                  <span className="text-gray-500">Check-In:</span>
                  <span className="font-mono text-gray-900">
                    {formatTimestamp(activeReceipt.check_in_at)}
                  </span>
                </div>
              )}
              {activeReceipt.check_out_at && (
                <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                  <span className="text-gray-500">Check-Out:</span>
                  <span className="font-mono text-gray-900">
                    {formatTimestamp(activeReceipt.check_out_at)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-sm">
                <span className="font-bold text-gray-900">Total Biaya Sewa:</span>
                <span className="font-black font-mono text-[#111827]">
                  {formatRupiah(activeReceipt.total_bayar)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
