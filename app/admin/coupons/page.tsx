"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BarChart3,
  CalendarCheck,
  Edit2,
  Layers,
  LayoutGrid,
  Loader2,
  Menu,
  Percent,
  Plus,
  Search,
  Settings,
  Tag,
  Ticket,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";
import {
  useAdminDiskon,
  useCreateDiskon,
  useDeleteDiskon,
  usePendingCount,
  useToggleDiskon,
  useUpdateDiskon,
} from "@/hooks/useAdmin";
import { ApiRequestError, type ApiError } from "@/lib/api";
import type { Diskon } from "@/types";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export type CouponStatus = "aktif" | "mendatang" | "kedaluwarsa" | "nonaktif";
export type FilterTab = "Semua" | "Sedang Aktif" | "Kedaluwarsa" | "Mendatang";

// ─── HELPERS ─────────────────────────────────────────────────────────────────────
/** Backend 4xx envelopes arrive as AxiosError via the BFF proxy. */
function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
  }
  if (err instanceof ApiRequestError) return err.message;
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Format ISO datetime (DiskonResource toIso8601String) → "31 Des 2026". */
function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Lokal → "YYYY-MM-DD" tanpa pergeseran zona waktu. */
function isoDariLokal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayIso(): string {
  return isoDariLokal(new Date());
}

function isoDalam30Hari(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return isoDariLokal(d);
}

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

/** Status tampilan: window tanggal menentukan mendatang/kedaluwarsa, flag is_aktif menentukan aktif/nonaktif. */
function deriveStatus(c: Diskon, now: Date): CouponStatus {
  const awal = new Date(c.tanggal_awal).getTime();
  const akhir = new Date(c.tanggal_akhir).getTime();
  if (!Number.isNaN(akhir) && now.getTime() > akhir) return "kedaluwarsa";
  if (!Number.isNaN(awal) && now.getTime() < awal) return "mendatang";
  return c.is_aktif === false ? "nonaktif" : "aktif";
}

/** Toggle switch is_aktif (dipakai di sel tabel & modal form). */
function AktifToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────────
export default function AdminCouponsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // ─── DATA LIVE: GET /admin/diskon ────────────────────────────────────────────
  const diskonQuery = useAdminDiskon();
  const coupons = useMemo(() => diskonQuery.data ?? [], [diskonQuery.data]);
  const pendingCount = usePendingCount();

  const createDiskon = useCreateDiskon();
  const updateDiskon = useUpdateDiskon();
  const deleteDiskon = useDeleteDiskon();
  const toggleDiskon = useToggleDiskon();

  // State operasional
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<FilterTab>("Semua");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal Create
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formKode, setFormKode] = useState("");
  const [formEvent, setFormEvent] = useState("");
  const [formDiskon, setFormDiskon] = useState("20");
  const [formMulai, setFormMulai] = useState(todayIso());
  const [formSelesai, setFormSelesai] = useState(isoDalam30Hari());
  const [formMaxPotongan, setFormMaxPotongan] = useState("");
  const [formUsageLimit, setFormUsageLimit] = useState("");
  const [formAktif, setFormAktif] = useState(true);

  // Modal Edit (salinan Diskon yang sedang diedit)
  const [editingCoupon, setEditingCoupon] = useState<Diskon | null>(null);

  // Modal Delete Confirmation
  const [deletingCoupon, setDeletingCoupon] = useState<Diskon | null>(null);

  // Per-row toggle pending indicator
  const [actingToggleId, setActingToggleId] = useState<number | null>(null);

  // Identitas Admin
  const adminName =
    user?.space_owner?.nama_pemilik ??
    user?.member?.nama_member ??
    user?.username ??
    "Ahmad Bidin";
  const adminRole = "Admin Pengelola";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // ─── METRIC COMPUTATIONS ─────────────────────────────────────────────────────
  const now = useMemo(() => new Date(), []);
  const couponsWithStatus = useMemo(
    () => coupons.map((c) => ({ c, status: deriveStatus(c, now) })),
    [coupons, now]
  );

  const totalCount = couponsWithStatus.length;
  const activeCount = couponsWithStatus.filter(
    ({ status }) => status === "aktif"
  ).length;
  const expiredCount = couponsWithStatus.filter(
    ({ status }) => status === "kedaluwarsa"
  ).length;
  const upcomingCount = couponsWithStatus.filter(
    ({ status }) => status === "mendatang"
  ).length;

  const avgDiscount = useMemo(() => {
    if (coupons.length === 0) return 0;
    const sum = coupons.reduce(
      (acc, curr) => acc + curr.persentase_diskon,
      0
    );
    return Math.round(sum / coupons.length);
  }, [coupons]);

  // ─── FILTER LOGIC ────────────────────────────────────────────────────────────
  const filteredCoupons = useMemo(() => {
    return couponsWithStatus.filter(({ c, status }) => {
      // Filter Status Tab
      if (selectedTab === "Sedang Aktif" && status !== "aktif") return false;
      if (selectedTab === "Kedaluwarsa" && status !== "kedaluwarsa")
        return false;
      if (selectedTab === "Mendatang" && status !== "mendatang") return false;

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKode = c.nama_diskon.toLowerCase().includes(q);
        const matchEvent = (c.nama_event ?? "").toLowerCase().includes(q);
        const matchDiskon = `${c.persentase_diskon}%`.includes(q);
        if (!matchKode && !matchEvent && !matchDiskon) return false;
      }

      return true;
    });
  }, [couponsWithStatus, selectedTab, searchQuery]);

  // ─── VALIDASI FORM (MIRROR BACKEND UX) ───────────────────────────────────────
  const validateForm = (
    kode: string,
    persentase: number,
    mulai: string,
    selesai: string,
    maxPotongan: string,
    usageLimit: string,
    excludeId?: number
  ): boolean => {
    if (!kode.trim()) {
      toast.error("Kode promo tidak boleh kosong.");
      return false;
    }
    if (coupons.some((c) => c.nama_diskon === kode && c.id !== excludeId)) {
      toast.error(`Nama diskon "${kode}" sudah digunakan.`);
      return false;
    }
    if (!Number.isInteger(persentase) || persentase < 1 || persentase > 100) {
      toast.error("Persentase diskon harus antara 1 sampai 100.");
      return false;
    }
    if (!mulai || !selesai) {
      toast.error("Tanggal awal dan tanggal akhir wajib diisi.");
      return false;
    }
    if (selesai <= mulai) {
      toast.error("Tanggal akhir harus setelah tanggal awal.");
      return false;
    }
    if (maxPotongan !== "" && Number(maxPotongan) < 0) {
      toast.error("Maksimal potongan minimal 0.");
      return false;
    }
    if (usageLimit !== "" && Number(usageLimit) < 1) {
      toast.error("Batas pemakaian minimal 1.");
      return false;
    }
    return true;
  };

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanKode = formKode.trim().toUpperCase().replace(/\s+/g, "");
    const persen = Number(formDiskon);
    if (
      !validateForm(
        cleanKode,
        persen,
        formMulai,
        formSelesai,
        formMaxPotongan,
        formUsageLimit
      )
    ) {
      return;
    }

    createDiskon.mutate(
      {
        nama_diskon: cleanKode,
        nama_event: formEvent.trim() || null,
        persentase_diskon: persen,
        tanggal_awal: formMulai,
        tanggal_akhir: formSelesai,
        max_discount_amount:
          formMaxPotongan === "" ? null : Number(formMaxPotongan),
        usage_limit: formUsageLimit === "" ? null : Number(formUsageLimit),
        is_aktif: formAktif,
      },
      {
        onSuccess: () => {
          toast.success(`Kupon "${cleanKode}" berhasil dibuat!`);
          // Reset Form
          setFormKode("");
          setFormEvent("");
          setFormDiskon("20");
          setFormMaxPotongan("");
          setFormUsageLimit("");
          setFormAktif(true);
          setIsCreateModalOpen(false);
        },
        onError: (error) => {
          toast.error(`Gagal membuat kupon: ${getApiErrorMessage(error)}`);
        },
      }
    );
  };

  const handleUpdateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    const persen = Number(editingCoupon.persentase_diskon);
    const mulai = editingCoupon.tanggal_awal.slice(0, 10);
    const selesai = editingCoupon.tanggal_akhir.slice(0, 10);
    const maxPotongan =
      editingCoupon.max_discount_amount == null
        ? ""
        : String(editingCoupon.max_discount_amount);
    const usageLimit =
      editingCoupon.usage_limit == null
        ? ""
        : String(editingCoupon.usage_limit);

    if (
      !validateForm(
        editingCoupon.nama_diskon,
        persen,
        mulai,
        selesai,
        maxPotongan,
        usageLimit,
        editingCoupon.id
      )
    ) {
      return;
    }

    const kode = editingCoupon.nama_diskon;
    updateDiskon.mutate(
      {
        id: editingCoupon.id,
        nama_event: (editingCoupon.nama_event ?? "").trim() || null,
        persentase_diskon: persen,
        tanggal_awal: mulai,
        tanggal_akhir: selesai,
        max_discount_amount: editingCoupon.max_discount_amount ?? null,
        usage_limit: editingCoupon.usage_limit ?? null,
        is_aktif: editingCoupon.is_aktif ?? true,
      },
      {
        onSuccess: () => {
          toast.success(
            `Perubahan kupon "${kode}" berhasil disimpan!`
          );
          setEditingCoupon(null);
        },
        onError: (error) => {
          toast.error(`Gagal menyimpan kupon: ${getApiErrorMessage(error)}`);
        },
      }
    );
  };

  const handleToggleCoupon = (coupon: Diskon) => {
    setActingToggleId(coupon.id);
    toggleDiskon.mutate(
      { id: coupon.id, is_aktif: !coupon.is_aktif },
      {
        onSuccess: () => {
          toast.success(
            `Kupon "${coupon.nama_diskon}" ${
              !coupon.is_aktif ? "diaktifkan" : "dinonaktifkan"
            }.`
          );
        },
        onError: (error) => {
          toast.error(
            `Gagal mengubah status kupon: ${getApiErrorMessage(error)}`
          );
        },
        onSettled: () => {
          setActingToggleId(null);
        },
      }
    );
  };

  const handleDeleteCoupon = () => {
    if (!deletingCoupon) return;

    const kode = deletingCoupon.nama_diskon;
    deleteDiskon.mutate(deletingCoupon.id, {
      onSuccess: () => {
        toast.success(`Kupon "${kode}" berhasil dihapus.`);
        setDeletingCoupon(null);
      },
      onError: (error) => {
        toast.error(`Gagal menghapus kupon: ${getApiErrorMessage(error)}`);
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Kupon Admin">
          {/* 1. Ringkasan & Laporan */}
          <Link
            href="/admin"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>Ringkasan & Laporan</span>
          </Link>

          {/* 2. Operasional Reservasi */}
          <Link
            href="/admin/reservations"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center justify-between text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 text-gray-400" />
              <span>Operasional Reservasi</span>
            </div>
            {(pendingCount.data ?? 0) > 0 && (
              <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                {pendingCount.data}
              </span>
            )}
          </Link>

          {/* 3. Inventaris Space & Meja */}
          <Link
            href="/admin/inventory"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Inventaris Space & Meja</span>
          </Link>

          {/* 4. Kupon & Diskon Promo (STATUS AKTIF PERSIS REFERENSI) */}
          <Link
            href="/admin/coupons"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center gap-3 transition-all bg-[#111827] text-white shadow-sm"
          >
            <Tag className="w-4 h-4 text-white" />
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
            {initials || "AB"}
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

      {/* ─── 2. MOBILE HEADER & DRAWER ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
            aria-label="Buka Menu Admin"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-lg tracking-wider text-[#111827]">
            URSPACE<span className="text-[#FFD500]">.</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#111827] text-white font-bold text-[10px] flex items-center justify-center">
            {initials || "AB"}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col z-10">
            <div className="flex justify-end p-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebar()}</div>
          </div>
        </div>
      )}

      {/* ─── 3. SISI KANAN: WORKSPACE KONTEN UTAMA ─────────────────────────────── */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 xl:p-10 space-y-7 overflow-y-auto mt-14 lg:mt-0">
        <AdminPageTransition pageKey={`${selectedTab}-${searchQuery}`}>
        {/* A. HEADER HALAMAN & TOMBOL AKSI UTAMA */}
        <header className="admin-header-animate flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Kupon & Diskon Promo
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Atur kode voucher potongan harga, persentase diskon, dan periode masa berlaku event promo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kupon Baru</span>
          </button>
        </header>

        {/* B. METRIC SUMMARY CARDS (GRID 3 KOLOM) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Ringkasan Metrik Kupon">
          {/* Kartu 1: Total Kode Promo */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                TOTAL KODE PROMO
              </span>
              <Ticket className="w-4 h-4 text-gray-400" />
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                <CountUp target={totalCount} suffix=" Kupon Terdaftar" />
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {activeCount} aktif digunakan • {expiredCount} kedaluwarsa
            </span>
          </div>

          {/* Kartu 2: Rata-Rata Potongan */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                RATA-RATA POTONGAN
              </span>
              <Percent className="w-4 h-4 text-gray-400" />
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                <CountUp target={avgDiscount} suffix="% Potongan" />
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Dihitung dari {totalCount} kupon terdaftar
            </span>
          </div>

          {/* Kartu 3: Event Promo Aktif (Canary Yellow Signature Card) */}
          <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                EVENT PROMO AKTIF
              </span>
              <Zap className="w-4 h-4 text-[#111827]/70 fill-current" />
            </div>
            <div className="my-3">
              <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                <CountUp target={activeCount} suffix=" Event Berjalan" />
              </span>
            </div>
            <span className="text-xs font-semibold text-[#111827]/90">
              Dapat diklaim member pada form checkout
            </span>
          </div>
        </section>

        {/* C. TOOLBAR PENCARIAN & TAB FILTER STATUS KUPON */}
        <section className="admin-toolbar-animate flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          {/* Field Pencarian */}
          <div className="relative w-full lg:w-96 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode promo atau event..."
              className="w-full text-xs font-medium text-[#111827] placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Tab 1: Semua Kupon */}
            <button
              type="button"
              onClick={() => setSelectedTab("Semua")}
              className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                selectedTab === "Semua"
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Semua Kupon ({totalCount})
            </button>

            {/* Tab 2: Sedang Aktif */}
            <button
              type="button"
              onClick={() => setSelectedTab("Sedang Aktif")}
              className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                selectedTab === "Sedang Aktif"
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Sedang Aktif ({activeCount})
            </button>

            {/* Tab 3: Kedaluwarsa */}
            <button
              type="button"
              onClick={() => setSelectedTab("Kedaluwarsa")}
              className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                selectedTab === "Kedaluwarsa"
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Kedaluwarsa ({expiredCount})
            </button>

            {/* Tab 4: Mendatang */}
            <button
              type="button"
              onClick={() => setSelectedTab("Mendatang")}
              className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                selectedTab === "Mendatang"
                  ? "bg-[#111827] text-white shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Mendatang ({upcomingCount})
            </button>
          </div>
        </section>

        {/* D. TABEL KUPON & DISKON PROMO */}
        <section className="w-full bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">
                    KODE PROMO
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    BESARAN DISKON
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    PERIODE BERLAKU
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    MAKS POTONGAN
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    PENGGUNAAN
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    STATUS
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6 text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {diskonQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Memuat kupon promo...
                    </td>
                  </tr>
                ) : diskonQuery.isError ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Gagal memuat kupon: {getApiErrorMessage(diskonQuery.error)}
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ada kupon atau voucher promo yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map(({ c: coupon, status }) => {
                    const isExpired = status === "kedaluwarsa";
                    const isUpcoming = status === "mendatang";
                    const isInactive = status === "nonaktif";
                    const isActive = status === "aktif";

                    const usageLimit = coupon.usage_limit ?? null;
                    const timesUsed = coupon.times_used ?? 0;
                    const usagePercent =
                      usageLimit && usageLimit > 0
                        ? Math.min(100, Math.round((timesUsed / usageLimit) * 100))
                        : null;

                    return (
                      <tr
                        key={coupon.id}
                        className={`admin-table-row hover:bg-gray-50/70 transition-all ${
                          isExpired ? "opacity-60 hover:opacity-100" : ""
                        }`}
                      >
                        {/* Kolom 1: KODE PROMO + NAMA EVENT */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isActive
                                  ? "bg-purple-50 text-[#5E43F3]"
                                  : isUpcoming || isInactive
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              %
                            </div>
                            <div>
                              <span
                                className={`font-mono font-bold text-xs block tracking-wide ${
                                  isExpired
                                    ? "line-through text-gray-400"
                                    : "text-[#111827]"
                                }`}
                              >
                                {coupon.nama_diskon}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                {coupon.nama_event ?? "Promo Khusus Member"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: BESARAN DISKON */}
                        <td className="py-4 px-4">
                          <span
                            className={`font-mono text-xs ${
                              isExpired
                                ? "text-gray-400 font-normal"
                                : coupon.persentase_diskon >= 50
                                ? "text-[#5E43F3] font-bold"
                                : "text-[#111827] font-bold"
                            }`}
                          >
                            {coupon.persentase_diskon}%
                          </span>
                        </td>

                        {/* Kolom 3: PERIODE BERLAKU */}
                        <td className="py-4 px-4">
                          <span
                            className={`font-mono text-xs ${
                              isExpired ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {formatTanggal(coupon.tanggal_awal)} – {formatTanggal(coupon.tanggal_akhir)}
                          </span>
                        </td>

                        {/* Kolom 4: MAKS POTONGAN */}
                        <td className="py-4 px-4">
                          <span
                            className={`text-xs ${
                              isExpired ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {coupon.max_discount_amount != null
                              ? formatRupiah(coupon.max_discount_amount)
                              : "—"}
                          </span>
                        </td>

                        {/* Kolom 5: PENGGUNAAN (times_used / usage_limit progress) */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5">
                            <span
                              className={`text-xs ${
                                isExpired || (isUpcoming && timesUsed === 0)
                                  ? "text-gray-400"
                                  : "text-gray-600 font-medium"
                              }`}
                            >
                              {timesUsed} Kali Transaksi
                            </span>
                            {usagePercent !== null && usageLimit !== null && (
                              <>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      usagePercent >= 100 ? "bg-rose-500" : "bg-[#5E43F3]"
                                    }`}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {timesUsed} dari {usageLimit} batas pemakaian
                                  {usagePercent >= 100 ? " (habis)" : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Kolom 6: STATUS + TOGGLE is_aktif */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1.5">
                            {isActive && (
                              <span className="text-xs font-semibold text-emerald-600">
                                Sedang Aktif
                              </span>
                            )}
                            {isUpcoming && (
                              <span className="text-xs font-semibold text-blue-600">
                                Mendatang
                              </span>
                            )}
                            {isInactive && (
                              <span className="text-xs font-semibold text-amber-600">
                                Nonaktif
                              </span>
                            )}
                            {isExpired && (
                              <span className="text-xs font-medium text-gray-400">
                                Kedaluwarsa
                              </span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <AktifToggle
                                checked={coupon.is_aktif ?? true}
                                disabled={actingToggleId === coupon.id}
                                onChange={() => handleToggleCoupon(coupon)}
                              />
                              <span className="text-[10px] font-semibold text-gray-400">
                                {coupon.is_aktif ?? true ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 7: AKSI */}
                        <td className="py-4 px-6 text-right space-y-0.5">
                          <button
                            type="button"
                            onClick={() => setEditingCoupon(coupon)}
                            className="text-xs font-medium text-[#5E43F3] hover:text-[#4A32D6] active:scale-95 transition-transform duration-100 inline-flex items-center justify-end gap-1 ml-auto cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCoupon(coupon)}
                            className="text-[11px] font-medium text-gray-400 hover:text-rose-600 active:scale-95 transition-transform duration-100 block ml-auto cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* E. PAGINATION FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <span>
              Menampilkan {filteredCoupons.length > 0 ? "1–" + filteredCoupons.length : "0"} dari {totalCount} kode promo terdaftar
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="text-gray-300 cursor-not-allowed text-xs font-medium px-2 py-1"
              >
                ← Sebelumnya
              </button>
              <span className="w-7 h-7 rounded-full bg-[#111827] text-white font-bold flex items-center justify-center text-xs">
                1
              </span>
              <button
                type="button"
                disabled
                className="text-gray-300 cursor-not-allowed text-xs font-medium px-2 py-1 ml-1"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </section>

        {/* F. STRIP FOOTER STATUS ADMIN */}
        <footer className="pt-6 border-t border-gray-200 text-center sm:text-left">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            URSPACE ADMIN • Manajemen Promosi & Voucher Diskon © 2026
          </p>
        </footer>
        </AdminPageTransition>
      </main>

      {/* ─── MODAL: BUAT KUPON BARU ─────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Buat Kupon Promo Baru
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tambahkan kode voucher untuk diskon sewa meja dan ruang meeting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 pt-5 text-xs">
              {/* Kode Promo (nama_diskon — unik) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kode Promo (Kapital Otomatis, Unik)
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value.toUpperCase())}
                  placeholder="CONTOH: MOKLETSALE20"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono font-bold text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
              </div>

              {/* Nama Event / Deskripsi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Event / Deskripsi Promo
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formEvent}
                  onChange={(e) => setFormEvent(e.target.value)}
                  placeholder="Misal: Flash Sale Kolaborasi Q4"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
              </div>

              {/* Besaran Diskon & Status Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Besaran Diskon (1–100%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={formDiskon}
                      onChange={(e) => setFormDiskon(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 font-mono font-bold text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                    />
                    <span className="absolute right-3 text-gray-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status Aktif
                  </label>
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <AktifToggle
                      checked={formAktif}
                      onChange={(next) => setFormAktif(next)}
                    />
                    <span className="font-medium text-gray-600">
                      {formAktif ? "Bisa diklaim member" : "Sementara nonaktif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rentang Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tanggal Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    required
                    value={formMulai}
                    onChange={(e) => setFormMulai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    required
                    value={formSelesai}
                    onChange={(e) => setFormSelesai(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opsional: Maks Potongan & Batas Pemakaian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Maksimal Potongan (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formMaxPotongan}
                    onChange={(e) => setFormMaxPotongan(e.target.value)}
                    placeholder="Misal: 50000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Batas Pemakaian (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="Misal: 100"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createDiskon.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {createDiskon.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {createDiskon.isPending ? "Menyimpan..." : "Simpan Kupon Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT KUPON ──────────────────────────────────────────────── */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingCoupon(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Edit Kupon Promo
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Perbarui parameter diskon atau masa berlaku voucher {editingCoupon.nama_diskon}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCoupon} className="space-y-4 pt-5 text-xs">
              {/* Kode Promo (readonly — unik di backend) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kode Promo
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCoupon.nama_diskon}
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 font-mono font-bold text-gray-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Kode promo bersifat unik dan tidak dapat diubah.
                </p>
              </div>

              {/* Nama Event / Deskripsi */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Event / Deskripsi Promo
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={editingCoupon.nama_event ?? ""}
                  onChange={(e) =>
                    setEditingCoupon({
                      ...editingCoupon,
                      nama_event: e.target.value,
                    })
                  }
                  placeholder="Misal: Flash Sale Kolaborasi Q4"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
              </div>

              {/* Besaran Diskon & Status Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Besaran Diskon (1–100%)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={editingCoupon.persentase_diskon}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          persentase_diskon: Number(e.target.value),
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 font-mono font-bold text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                    />
                    <span className="absolute right-3 text-gray-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status Aktif
                  </label>
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                    <AktifToggle
                      checked={editingCoupon.is_aktif ?? true}
                      onChange={(next) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          is_aktif: next,
                        })
                      }
                    />
                    <span className="font-medium text-gray-600">
                      {(editingCoupon.is_aktif ?? true)
                        ? "Bisa diklaim member"
                        : "Sementara nonaktif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rentang Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tanggal Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    required
                    value={editingCoupon.tanggal_awal.slice(0, 10)}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        tanggal_awal: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    required
                    value={editingCoupon.tanggal_akhir.slice(0, 10)}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        tanggal_akhir: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opsional: Maks Potongan & Batas Pemakaian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Maksimal Potongan (Rp, Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingCoupon.max_discount_amount ?? ""}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        max_discount_amount:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="Misal: 50000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Batas Pemakaian (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editingCoupon.usage_limit ?? ""}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        usage_limit:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="Misal: 100"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateDiskon.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {updateDiskon.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {updateDiskon.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: HAPUS KUPON ──────────────────────────────────────────────── */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDeletingCoupon(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#111827]">
              Hapus Kupon Promo?
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              Apakah Anda yakin ingin menghapus kupon{" "}
              <strong className="text-black font-mono font-bold">
                {deletingCoupon.nama_diskon}
              </strong>
              ? Kupon tidak akan bisa diklaim lagi oleh member pada form checkout.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCoupon}
                disabled={deleteDiskon.isPending}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {deleteDiskon.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {deleteDiskon.isPending ? "Menghapus..." : "Ya, Hapus Kupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
