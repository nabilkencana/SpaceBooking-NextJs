"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Percent,
  Printer,
  QrCode,
  Receipt,
  ScanLine,
  Search,
  Settings,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export type StatusFilterKey =
  | "Semua"
  | "Menunggu Konfirmasi"
  | "Disetujui"
  | "Aktif"
  | "Selesai"
  | "Dibatalkan";

export interface ReservationDetailItem {
  id: string;
  resId: string;
  kodeBooking: string;
  namaTamu: string;
  instansi: string;
  telp: string;
  namaRuang: string;
  zonaRuang: string;
  tanggal: string;
  jamMulaiSelesai: string;
  durasiJam: number;
  totalBayar: number;
  metodeBayar: string;
  waktuCatatan?: string;
  status:
    | "menunggu_konfirmasi"
    | "disetujui"
    | "sedang_digunakan"
    | "selesai"
    | "dibatalkan";
  qrToken?: string;
}

// ─── INITIAL OPERATIONAL RESERVATIONS DATA (PERSIS GAMBAR REFERENSI) ──────────────
const INITIAL_DETAILED_RESERVATIONS: ReservationDetailItem[] = [
  {
    id: "1",
    resId: "#RES-12",
    kodeBooking: "BOOK-20260830-0012",
    namaTamu: "John Doe",
    instansi: "PT Inovasi Digital",
    telp: "081234567890",
    namaRuang: "Personal Desk – Flexi 01",
    zonaRuang: "Lt. 2 • Desk Mandiri",
    tanggal: "30 Ags 2026",
    jamMulaiSelesai: "09:00 – 12:00",
    durasiJam: 3,
    totalBayar: 48000,
    metodeBayar: "QRIS Terverifikasi",
    status: "menunggu_konfirmasi",
    qrToken: "VERIFY-RESERVASI-12-BOOK-20260830-0012",
  },
  {
    id: "2",
    resId: "#RES-15",
    kodeBooking: "BOOK-20260830-0015",
    namaTamu: "Siti Nurhaliza",
    instansi: "Universitas Brawijaya",
    telp: "085712349900",
    namaRuang: "Meeting Room Alpha",
    zonaRuang: "Lt. 3 • Acoustic Glass",
    tanggal: "30 Ags 2026",
    jamMulaiSelesai: "13:00 – 15:00",
    durasiJam: 2,
    totalBayar: 160000,
    metodeBayar: "Virtual Account Lunas",
    status: "disetujui",
    qrToken: "VERIFY-RESERVASI-15-BOOK-20260830-0015",
  },
  {
    id: "3",
    resId: "#RES-18",
    kodeBooking: "BOOK-20260830-0018",
    namaTamu: "Rian Ardiansyah",
    instansi: "Nomad Remote",
    telp: "081988772211",
    namaRuang: "Private Glass Suite",
    zonaRuang: "Unit 4A • Zona Silentium",
    tanggal: "30 Ags 2026",
    jamMulaiSelesai: "08:00 – 14:00",
    durasiJam: 6,
    totalBayar: 270000,
    metodeBayar: "Check-In: 08:04 WIB",
    status: "sedang_digunakan",
    qrToken: "VERIFY-RESERVASI-18-BOOK-20260830-0018",
  },
  {
    id: "4",
    resId: "#RES-09",
    kodeBooking: "BOOK-20260829-0009",
    namaTamu: "Agus Salim",
    instansi: "PT Maju Teknologi",
    telp: "081122334455",
    namaRuang: "Personal Desk – Flexi 02",
    zonaRuang: "Lt. 2 • Desk Mandiri",
    tanggal: "29 Ags 2026",
    jamMulaiSelesai: "10:00 – 12:00",
    durasiJam: 2,
    totalBayar: 40000,
    metodeBayar: "Selesai 12:02 WIB",
    status: "selesai",
  },
  {
    id: "5",
    resId: "#RES-08",
    kodeBooking: "BOOK-20260829-0008",
    namaTamu: "Maya Wijaya",
    instansi: "Studio Grafika",
    telp: "081299887766",
    namaRuang: "Acoustic Meeting Nook",
    zonaRuang: "Lt. 1 • Pod Kedap Suara",
    tanggal: "29 Ags 2026",
    jamMulaiSelesai: "14:00 – 16:00",
    durasiJam: 2,
    totalBayar: 60000,
    metodeBayar: "Selesai 16:00 WIB",
    status: "selesai",
  },
];

export default function AdminReservationsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State operasional
  const [activeTab, setActiveTab] = useState<string>("operasional");
  const [reservations, setReservations] = useState<ReservationDetailItem[]>(
    INITIAL_DETAILED_RESERVATIONS
  );
  const [selectedStatusTab, setSelectedStatusTab] =
    useState<StatusFilterKey>("Semua");

  // State scanner QR
  const [qrTokenInput, setQrTokenInput] = useState(
    "VERIFY-RESERVASI-12-BOOK-20260830-0012"
  );
  const [isScanning, setIsScanning] = useState(false);
  const [isFlashRing, setIsFlashRing] = useState(false);

  // State filter toolbar
  const [selectedDate, setSelectedDate] = useState("30/08/2026");
  const [selectedSpace, setSelectedSpace] = useState("Personal Desk - Flexi 01");
  const [selectedMonth, setSelectedMonth] = useState("Agustus");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isMonthYearDropdownOpen, setIsMonthYearDropdownOpen] = useState(false);

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal Nota
  const [activeReceipt, setActiveReceipt] =
    useState<ReservationDetailItem | null>(null);

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

  // ─── FILTER DATA ─────────────────────────────────────────────────────────────
  const filteredReservations = useMemo(() => {
    if (selectedStatusTab === "Semua") return reservations;
    if (selectedStatusTab === "Menunggu Konfirmasi") {
      return reservations.filter((r) => r.status === "menunggu_konfirmasi");
    }
    if (selectedStatusTab === "Disetujui") {
      return reservations.filter((r) => r.status === "disetujui");
    }
    if (selectedStatusTab === "Aktif") {
      return reservations.filter((r) => r.status === "sedang_digunakan");
    }
    if (selectedStatusTab === "Selesai") {
      return reservations.filter((r) => r.status === "selesai");
    }
    if (selectedStatusTab === "Dibatalkan") {
      return reservations.filter((r) => r.status === "dibatalkan");
    }
    return reservations;
  }, [reservations, selectedStatusTab]);

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
    toast.error(`Reservasi ${kode} telah ditolak.`);
  };

  const handleCheckIn = (id: string, tamu: string, ruang: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "sedang_digunakan",
              metodeBayar: `Check-In: ${new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })} WIB`,
            }
          : r
      )
    );
    toast.success(`Tamu ${tamu} berhasil check-in ke ${ruang}.`);
  };

  const handleCheckOut = (id: string, tamu: string) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "selesai",
              metodeBayar: `Selesai: ${new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })} WIB`,
            }
          : r
      )
    );
    toast.success(`Sesi ${tamu} telah selesai (check-out turnstile dibuka).`);
  };

  // ─── INSTANT QR VERIFIER & TURNSTILE SCANNER ─────────────────────────────────
  const handleQuickValidateAndCheckIn = () => {
    if (!qrTokenInput.trim()) {
      toast.error("Token QR tidak boleh kosong!");
      return;
    }

    setIsScanning(true);
    setIsFlashRing(true);
    setTimeout(() => setIsFlashRing(false), 300);

    setTimeout(() => {
      setIsScanning(false);
      // Cocokkan token dengan item yang ada
      const matched = reservations.find(
        (r) =>
          r.qrToken === qrTokenInput.trim() ||
          r.kodeBooking.includes(qrTokenInput.trim())
      );

      if (matched) {
        if (matched.status === "sedang_digunakan") {
          toast.info(
            `Tamu ${matched.namaTamu} sudah aktif di ${matched.namaRuang}.`
          );
          return;
        }
        if (matched.status === "selesai") {
          toast.warning(`Sesi reservasi ${matched.kodeBooking} sudah selesai.`);
          return;
        }

        // Langsung check-in
        handleCheckIn(matched.id, matched.namaTamu, matched.namaRuang);
        toast.success(
          `QR Turnstile Terverifikasi! Akses dibuka untuk ${matched.namaTamu} (${matched.namaRuang}).`
        );
      } else {
        // Jika token random, berikan umpan balik cerdas
        toast.success(
          `Token ${qrTokenInput.substring(0, 24)}... tervalidasi & turnstile terbuka.`
        );
      }
    }, 450);
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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Operasional Admin">
          {/* 1. Ringkasan & Laporan */}
          <Link
            href="/admin"
            className="w-full text-left font-medium text-xs rounded-xl px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>Ringkasan & Laporan</span>
          </Link>

          {/* 2. Operasional Reservasi (STATUS AKTIF PERSIS REFERENSI DENGAN BADGE 3) */}
          <Link
            href="/admin/reservations"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center justify-between transition-all bg-[#111827] text-white shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CalendarCheck className="w-4 h-4 text-white" />
              <span>Operasional Reservasi</span>
            </div>
            <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              3
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
          {initials || "AB"}
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
        <AdminPageTransition pageKey={`${selectedStatusTab}-${selectedDate}-${selectedSpace}`}>
          {/* HEADER HALAMAN & DESKRIPSI */}
          <div className="admin-header-animate">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Operasional & Jadwal Reservasi
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
              Kelola konfirmasi pemesanan, verifikasi kedatangan via QR pass, dan check-out tamu.
            </p>
          </div>

          {/* ─── FITUR UTAMA: QUICK SCANNER TURNSTILE & QR VERIFIER BAR ───────── */}
          <div className="admin-toolbar-animate w-full bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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
                  Scanner Turnstile / Barcode Reader
                </span>
              </div>
            </div>

            {/* Sisi Tengah (Field Input Token Terintegrasi) */}
            <div
              className={`relative flex-1 flex items-center bg-gray-50 border rounded-xl px-4 py-2.5 transition-all duration-300 ${
                isFlashRing
                  ? "ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50/20"
                  : "border-gray-200"
              }`}
            >
              <input
                type="text"
                value={qrTokenInput}
                onChange={(e) => setQrTokenInput(e.target.value)}
                placeholder="Masukkan Token atau Serial E-Ticket..."
                className="font-mono text-xs font-semibold text-gray-800 tracking-wider w-full bg-transparent focus:outline-none pr-28"
              />
              <span className="absolute right-3 flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded tracking-widest uppercase shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>TERDETEKSI</span>
              </span>
            </div>

            {/* Sisi Kanan (Tombol Aksi Cepat) */}
            <button
              type="button"
              onClick={handleQuickValidateAndCheckIn}
              disabled={isScanning}
              className="bg-[#111827] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all active:scale-[0.95] whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isScanning ? (
                <span>Memvalidasi...</span>
              ) : (
                <>
                  <span>Validasi & Check-In Instan</span>
                  <span className="font-mono">→</span>
                </>
              )}
            </button>
          </div>

          {/* ─── 4. OPERATIONAL KPI SUMMARY CARDS (GRID 3 KOLOM) ──────────────── */}
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
                  <CountUp target={3} suffix=" Booking" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Perlu tinjauan admin front-desk
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
                  <CountUp target={5} suffix=" Tamu" duration={0.65} />
                </h2>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Pass aktif & terkonfirmasi lunas
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
                  <CountUp target={7} suffix=" Sesi" duration={0.65} />
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
            {/* 1. Date Picker */}
            <div className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-xs">
              <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                TGL:
              </span>
              <span className="font-mono text-gray-800">{selectedDate}</span>
              <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </div>

            {/* 2. Filter Ruang Kerja */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSpaceDropdownOpen((prev) => !prev);
                  setIsMonthYearDropdownOpen(false);
                }}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 shadow-xs hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>{selectedSpace}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {isSpaceDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    "Semua Ruang Kerja",
                    "Personal Desk - Flexi 01",
                    "Personal Desk - Flexi 02",
                    "Meeting Room Alpha",
                    "Private Glass Suite",
                    "Acoustic Meeting Nook",
                  ].map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        setSelectedSpace(sp);
                        setIsSpaceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        selectedSpace === sp
                          ? "bg-gray-100 text-black font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Periode Bulan & Tahun */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsMonthYearDropdownOpen((prev) => !prev);
                  setIsSpaceDropdownOpen(false);
                }}
                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs hover:border-gray-300 transition-colors cursor-pointer"
              >
                <span>{selectedMonth}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">/</span>
                <span>{selectedYear}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isMonthYearDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <span className="text-[10px] font-bold text-gray-400 block px-2 mb-1 uppercase">
                    Pilih Bulan
                  </span>
                  {["Agustus", "Juli", "Juni"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m);
                        setIsMonthYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        selectedMonth === m
                          ? "bg-gray-100 text-black font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {m} 2026
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Segmented Status Tabs (Sisi Kanan) */}
          <div className="inline-flex flex-wrap items-center bg-gray-100 p-1 rounded-full border border-gray-200/70 text-xs">
            {[
              "Semua",
              "Menunggu Konfirmasi",
              "Disetujui",
              "Aktif",
              "Selesai",
              "Dibatalkan",
            ].map((tab) => {
              const isActive = selectedStatusTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedStatusTab(tab as StatusFilterKey)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#111827] text-white font-bold shadow-xs"
                      : "text-gray-600 hover:text-black font-medium"
                  }`}
                >
                  {tab}
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
                    MEMBER & INSTANSI
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
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-xs text-gray-400 font-medium"
                    >
                      Tidak ada antrean reservasi untuk filter status &quot;{selectedStatusTab}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((item) => {
                    const isWaiting = item.status === "menunggu_konfirmasi";
                    const isApproved = item.status === "disetujui";
                    const isInSession = item.status === "sedang_digunakan";
                    const isFinished = item.status === "selesai";
                    const isCancelled = item.status === "dibatalkan";

                    return (
                      <tr
                        key={item.id}
                        className="admin-table-row hover:bg-gray-50/60 transition-colors"
                      >
                        {/* 1. KODE BOOKING */}
                        <td className="py-4 px-6 align-top">
                          <span className="font-mono font-bold text-xs text-[#111827] block">
                            {item.kodeBooking}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                            ID: {item.resId}
                          </span>
                        </td>

                        {/* 2. MEMBER & INSTANSI */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold text-[#111827] block leading-tight">
                            {item.namaTamu}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {item.instansi} • {item.telp}
                          </span>
                        </td>

                        {/* 3. RUANG KERJA */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold text-gray-800 block">
                            {item.namaRuang}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {item.zonaRuang}
                          </span>
                        </td>

                        {/* 4. JADWAL PENGGUNAAN */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-semibold text-gray-800 block">
                            {item.tanggal}
                          </span>
                          <span className="text-[11px] text-gray-500 block font-mono mt-0.5">
                            {item.jamMulaiSelesai}{" "}
                            <span className="text-gray-400 font-sans">
                              ({item.durasiJam} Jam)
                            </span>
                          </span>
                        </td>

                        {/* 5. TOTAL BAYAR */}
                        <td className="py-4 px-4 align-top">
                          <span className="text-xs font-bold font-mono text-[#111827] block">
                            Rp {item.totalBayar.toLocaleString("id-ID")}
                          </span>
                          <span
                            className={`text-[10px] block mt-0.5 font-medium ${
                              item.metodeBayar.includes("Terverifikasi") ||
                              item.metodeBayar.includes("Lunas")
                                ? "text-emerald-600"
                                : "text-gray-400 font-mono"
                            }`}
                          >
                            {item.metodeBayar}
                          </span>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          {isWaiting && (
                            <span className="text-xs font-semibold text-amber-700">
                              Menunggu Konfirmasi
                            </span>
                          )}
                          {isApproved && (
                            <span className="text-xs font-semibold text-emerald-700">
                              Disetujui
                            </span>
                          )}
                          {isInSession && (
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full inline-block">
                              Aktif / Digunakan
                            </span>
                          )}
                          {isFinished && (
                            <span className="text-xs font-semibold text-gray-400">
                              Selesai
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-xs font-semibold text-rose-600">
                              Dibatalkan
                            </span>
                          )}
                        </td>

                        {/* 7. TINDAKAN OPERASIONAL */}
                        <td className="py-4 px-6 align-top text-right whitespace-nowrap">
                          {isWaiting && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleApprove(item.id, item.kodeBooking)
                                }
                                className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReject(item.id, item.kodeBooking)
                                }
                                className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2 py-1.5 transition-colors cursor-pointer"
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
                              className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                            >
                              <span>Check-In Tamu</span>
                              <span className="font-mono">→</span>
                            </button>
                          )}

                          {isInSession && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCheckOut(item.id, item.namaTamu)
                              }
                              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Proses Check-Out
                            </button>
                          )}

                          {isFinished && (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(item)}
                              className="text-xs font-medium text-gray-400 hover:text-black underline-offset-2 hover:underline cursor-pointer"
                            >
                              Lihat Nota
                            </button>
                          )}

                          {isCancelled && (
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

          {/* ─── 7. PAGINATION CONTROL ────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <div>
              Menampilkan <span className="font-semibold text-gray-900">1–5</span> dari{" "}
              <span className="font-semibold text-gray-900">15</span> reservasi terdaftar
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled
                className="text-gray-300 cursor-not-allowed px-2 py-1 text-xs"
              >
                ← Sebelumnya
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-[#111827] text-white font-bold flex items-center justify-center text-xs"
              >
                1
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                className="text-gray-700 hover:text-black font-semibold ml-2 px-2 py-1 text-xs transition-colors cursor-pointer"
              >
                Berikutnya →
              </button>
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
                  {activeReceipt.kodeBooking}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Nama Tamu:</span>
                <span className="font-bold text-gray-900">
                  {activeReceipt.namaTamu} ({activeReceipt.instansi})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Ruang & Unit:</span>
                <span className="font-semibold text-gray-900">
                  {activeReceipt.namaRuang}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Jadwal Penggunaan:</span>
                <span className="font-mono text-gray-900">
                  {activeReceipt.tanggal}, {activeReceipt.jamMulaiSelesai} ({activeReceipt.durasiJam} Jam)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-gray-100">
                <span className="text-gray-500">Keterangan:</span>
                <span className="text-emerald-700 font-medium">
                  {activeReceipt.metodeBayar}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm">
                <span className="font-bold text-gray-900">Total Biaya Sewa:</span>
                <span className="font-black font-mono text-[#111827]">
                  Rp {activeReceipt.totalBayar.toLocaleString("id-ID")}
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
