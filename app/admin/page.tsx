"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Download,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Percent,
  Settings,
  Tag,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export type AdminReservationStatus =
  | "menunggu_konfirmasi"
  | "disetujui"
  | "sedang_digunakan"
  | "selesai"
  | "dibatalkan";

export interface AdminReservationItem {
  id: string;
  kodeBooking: string;
  namaTamu: string;
  instansi: string;
  namaRuang: string;
  jadwal: string;
  durasiJam: number;
  status: AdminReservationStatus;
  nominal: number;
}

// ─── INITIAL OPERATIONAL QUEUE DATA (PERSIS GAMBAR REFERENSI) ────────────────────
const INITIAL_RESERVATIONS: AdminReservationItem[] = [
  {
    id: "1",
    kodeBooking: "BOOK-20260830-0012",
    namaTamu: "John Doe",
    instansi: "PT Inovasi Digital",
    namaRuang: "Personal Desk – Flexi 01",
    jadwal: "09:00 – 12:00 WIB",
    durasiJam: 3,
    status: "menunggu_konfirmasi",
    nominal: 75000,
  },
  {
    id: "2",
    kodeBooking: "BOOK-20260830-0015",
    namaTamu: "Siti Nurhaliza",
    instansi: "Universitas Brawijaya",
    namaRuang: "Meeting Room Alpha",
    jadwal: "13:00 – 15:00 WIB",
    durasiJam: 2,
    status: "disetujui",
    nominal: 200000,
  },
  {
    id: "3",
    kodeBooking: "BOOK-20260830-0018",
    namaTamu: "Rian Ardiansyah",
    instansi: "Nomad Remote",
    namaRuang: "Private Glass Suite",
    jadwal: "08:00 – 14:00 WIB",
    durasiJam: 6,
    status: "sedang_digunakan",
    nominal: 250000,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State operasional
  const [activeTab, setActiveTab] = useState<string>("ringkasan");
  const [reservations, setReservations] =
    useState<AdminReservationItem[]>(INITIAL_RESERVATIONS);
  const [selectedMonth, setSelectedMonth] = useState("Agustus 2026");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Identitas admin
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

  // ─── ACTION HANDLERS ─────────────────────────────────────────────────────────
  const handleApprove = (id: string, kode: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "disetujui" } : r))
    );
    toast.success(`Reservasi ${kode} berhasil disetujui.`);
  };

  const handleReject = (id: string, kode: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "dibatalkan" } : r))
    );
    toast.error(`Reservasi ${kode} ditolak.`);
  };

  const handleCheckIn = (id: string, tamu: string, ruang: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "sedang_digunakan" } : r))
    );
    toast.success(`Tamu ${tamu} berhasil check-in ke ${ruang}.`);
  };

  const handleCheckOut = (id: string, tamu: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "selesai" } : r))
    );
    toast.success(`Sesi kerja ${tamu} telah selesai (check-out).`);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // ─── EXPORT CSV RECAPITULATION ───────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      "KODE BOOKING",
      "NAMA TAMU",
      "INSTANSI",
      "RUANG KERJA",
      "JADWAL SEWA",
      "DURASI (JAM)",
      "STATUS",
      "NOMINAL (IDR)",
    ];

    const rows = reservations.map((r) => [
      `"${r.kodeBooking}"`,
      `"${r.namaTamu}"`,
      `"${r.instansi}"`,
      `"${r.namaRuang}"`,
      `"${r.jadwal}"`,
      r.durasiJam,
      `"${r.status}"`,
      r.nominal,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `rekapitulasi_omzet_${selectedMonth.toLowerCase().replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Laporan CSV berhasil diunduh!");
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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Admin">
          {/* 1. Ringkasan & Laporan (Aktif) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("ringkasan");
              setMobileSidebarOpen(false);
            }}
            className={`w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === "ringkasan"
                ? "bg-[#111827] text-white shadow-sm"
                : "text-gray-600 hover:text-black hover:bg-gray-50 font-medium"
            }`}
          >
            <BarChart3
              className={`w-4 h-4 ${
                activeTab === "ringkasan" ? "text-white" : "text-gray-400"
              }`}
            />
            <span>Ringkasan & Laporan</span>
          </button>

          {/* 2. Operasional Reservasi */}
          <Link
            href="/admin/reservations"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center justify-between transition-all cursor-pointer text-gray-600 hover:text-black hover:bg-gray-50 font-medium"
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 text-gray-400" />
              <span>Operasional Reservasi</span>
            </div>
            <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              5
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
      {/* ─── 1. SISI KIRI: DESKTOP SIDEBAR (FIXED / STICKY TOP-0) ─────────────── */}
      <aside className="hidden lg:block w-64 xl:w-72 bg-white border-r border-[#E5E7EB] shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {renderSidebar()}
      </aside>

      {/* ─── 2. MOBILE HEADER & DRAWER ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Menu"
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

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#111827] text-white font-bold text-[10px] flex items-center justify-center">
            {initials || "AB"}
          </div>
        </div>
      </div>

      {/* Mobile Slide-over Drawer */}
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
      <main className="flex-1 min-w-0 p-6 sm:p-8 xl:p-10 space-y-8 overflow-y-auto mt-14 lg:mt-0">
        <AdminPageTransition pageKey={`${selectedMonth}-${selectedYear}`}>
          {/* HEADER HALAMAN & TOOLBAR FILTER */}
          <div className="admin-header-animate flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Performa & Rekapitulasi Pendapatan
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                Konsolidasi omzet bulanan dan antrean check-in workstation.
              </p>
            </div>

            {/* Sisi Kanan Toolbar Filter & Ekspor */}
            <div className="admin-toolbar-animate flex flex-wrap items-center gap-3">
              {/* Dropdown Bulan */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthOpen((prev) => !prev);
                    setIsYearOpen(false);
                  }}
                  className="border border-[#E5E7EB] bg-white rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{selectedMonth}</span>
                  <span className="text-[10px] text-gray-400">▾</span>
                </button>

                {isMonthOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {["Agustus 2026", "Juli 2026", "Juni 2026", "Mei 2026"].map(
                      (m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setIsMonthOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                            selectedMonth === m
                              ? "bg-gray-100 text-black font-bold"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {m}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Dropdown Tahun */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsYearOpen((prev) => !prev);
                    setIsMonthOpen(false);
                  }}
                  className="border border-[#E5E7EB] bg-white rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>{selectedYear}</span>
                  <span className="text-[10px] text-gray-400">▾</span>
                </button>

                {isYearOpen && (
                  <div className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                    {["2026", "2025"].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          selectedYear === y
                            ? "bg-gray-100 text-black font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Ekspor CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-white hover:bg-gray-50 text-[#111827] border border-[#E5E7EB] hover:border-gray-300 text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Unduh Laporan CSV</span>
                <span className="font-mono text-sm leading-none">↓</span>
              </button>
            </div>
          </div>

          {/* ─── 4. METRIC REVENUE CARDS (GRID 3 KOLOM ATAS) ───────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KARTU 1: Realisasi Pendapatan Bersih (Solid Canary Yellow) */}
            <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80 block">
                  REALISASI PENDAPATAN BERSIH
                </span>
                <h2 className="text-3xl sm:text-4xl font-black font-mono text-[#111827] tracking-tight my-4">
                  <CountUp target={1600000} prefix="Rp " duration={0.85} />
                </h2>
              </div>
              <p className="text-xs font-semibold text-[#111827]/90 pt-1">
                15 transaksi selesai & aktif pada periode ini
              </p>
            </div>

            {/* KARTU 2: Estimasi Kotor & Diskon */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    ESTIMASI KOTOR & DISKON
                  </span>
                  <Info className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-[#111827] tracking-tight my-4">
                  <CountUp target={1850000} prefix="Rp " duration={0.85} />
                </h2>
              </div>
              <p className="text-xs font-medium text-rose-600 pt-1">
                Potongan Kupon Promo: -Rp 250.000
              </p>
            </div>

            {/* KARTU 3: Total Akumulasi Waktu */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5 duration-200">
              <div>
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    TOTAL AKUMULASI WAKTU
                  </span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight my-4">
                  <CountUp target={48} suffix=" Jam Sewa" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs text-gray-400 pt-1 font-medium">
                Total 15 sesi reservasi terdaftar
              </p>
            </div>
          </div>

        {/* ─── 5. DISTRIBUSI UTILISASI PER TIPE RUANG (GRID 3 KOLOM TENGAH) ──── */}
        <section aria-labelledby="utilisasi-heading" className="space-y-4">
          <div>
            <h2
              id="utilisasi-heading"
              className="text-lg font-bold text-[#111827] tracking-tight"
            >
              Distribusi Utilisasi per Tipe Ruang
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rincian pendapatan berdasarkan kategori inventaris resmi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Personal Desk */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-[#111827]">
                Personal Desk
              </h3>
              <div className="space-y-1.5">
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Total Sesi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    10 Reservasi
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Durasi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    30 Jam Total
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  SUBTOTAL PENDAPATAN
                </span>
                <span className="text-base font-extrabold font-mono text-[#111827]">
                  Rp 600.000
                </span>
              </div>
            </div>

            {/* Card 2: Meeting Room */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-[#111827]">
                Meeting Room
              </h3>
              <div className="space-y-1.5">
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Total Sesi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    3 Reservasi
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Durasi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    8 Jam Total
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  SUBTOTAL PENDAPATAN
                </span>
                <span className="text-base font-extrabold font-mono text-[#111827]">
                  Rp 750.000
                </span>
              </div>
            </div>

            {/* Card 3: Private Office */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-[#111827]">
                Private Office
              </h3>
              <div className="space-y-1.5">
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Total Sesi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    2 Reservasi
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium flex justify-between">
                  <span>Durasi:</span>
                  <span className="font-mono text-gray-900 font-semibold">
                    10 Jam Total
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  SUBTOTAL PENDAPATAN
                </span>
                <span className="text-base font-extrabold font-mono text-[#111827]">
                  Rp 250.000
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. TABEL OPERASIONAL: ANTREAN RESERVASI HARI INI ──────────────── */}
        <section aria-labelledby="antrean-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              id="antrean-heading"
              className="text-lg font-bold text-[#111827] tracking-tight"
            >
              Antrean Reservasi Hari Ini
            </h2>
            <Link
              href="/admin/reservations"
              className="text-xs font-semibold text-[#5E43F3] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Buka Semua Reservasi (15)</span>
              <span className="font-mono">→</span>
            </Link>
          </div>

          <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-white">
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      KODE BOOKING
                    </th>
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      TAMU & KONTAK
                    </th>
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      RUANG KERJA
                    </th>
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      JADWAL SEWA
                    </th>
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      STATUS
                    </th>
                    <th className="py-3.5 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                      TINDAKAN OPERASIONAL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((item) => {
                    const isWaiting = item.status === "menunggu_konfirmasi";
                    const isApproved = item.status === "disetujui";
                    const isInSession = item.status === "sedang_digunakan";
                    const isFinished = item.status === "selesai";
                    const isCancelled = item.status === "dibatalkan";

                    return (
                      <tr
                        key={item.id}
                        className="admin-table-row hover:bg-gray-50/70 transition-colors"
                      >
                        {/* 1. KODE BOOKING */}
                        <td className="py-4 px-6 align-middle font-mono text-xs font-bold text-gray-900 whitespace-nowrap">
                          {item.kodeBooking}
                        </td>

                        {/* 2. TAMU & KONTAK */}
                        <td className="py-4 px-6 align-middle">
                          <span className="text-xs font-bold text-gray-900 block leading-tight">
                            {item.namaTamu}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                            {item.instansi}
                          </span>
                        </td>

                        {/* 3. RUANG KERJA */}
                        <td className="py-4 px-6 align-middle text-xs text-gray-700 font-medium">
                          {item.namaRuang}
                        </td>

                        {/* 4. JADWAL SEWA */}
                        <td className="py-4 px-6 align-middle text-xs text-gray-600 font-mono">
                          {item.jadwal}{" "}
                          <span className="text-[11px] text-gray-400 font-sans">
                            ({item.durasiJam} Jam)
                          </span>
                        </td>

                        {/* 5. STATUS */}
                        <td className="py-4 px-6 align-middle whitespace-nowrap">
                          {isWaiting && (
                            <span className="text-xs font-bold text-amber-700">
                              Menunggu Konfirmasi
                            </span>
                          )}
                          {isApproved && (
                            <span className="text-xs font-bold text-emerald-700">
                              Disetujui
                            </span>
                          )}
                          {isInSession && (
                            <span className="text-xs font-bold text-blue-700">
                              Sedang Digunakan
                            </span>
                          )}
                          {isFinished && (
                            <span className="text-xs font-bold text-gray-500">
                              Selesai
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-xs font-bold text-rose-600">
                              Dibatalkan
                            </span>
                          )}
                        </td>

                        {/* 6. TINDAKAN OPERASIONAL */}
                        <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                          {isWaiting && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(item.id, item.kodeBooking)
                                }
                                className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(item.id, item.kodeBooking)
                                }
                                className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2 py-1.5 transition-colors cursor-pointer active:scale-95"
                              >
                                Tolak
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCheckIn(
                                  item.id,
                                  item.namaTamu,
                                  item.namaRuang
                                )
                              }
                              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                            >
                              Proses Check-In
                            </button>
                          )}

                          {isInSession && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCheckOut(item.id, item.namaTamu)
                              }
                              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                            >
                              Proses Check-Out
                            </button>
                          )}

                          {(isFinished || isCancelled) && (
                            <span className="text-xs text-gray-400 italic">
                              Tidak ada tindakan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── 7. STRIP FOOTER TEKNIS ADMIN (ADMIN STATUS BAR) ──────────────── */}
        <footer className="pt-8 mt-10 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-mono gap-3 pb-8">
          <div className="font-sans font-bold text-gray-500 flex items-center gap-1.5">
            <span className="font-normal text-gray-400">
              Sistem Manajemen & Reservasi Coworking © 2026
            </span>
          </div>
        </footer>
      </AdminPageTransition>
    </main>
    </div>
  );
}
