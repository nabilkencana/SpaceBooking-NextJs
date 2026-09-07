"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  Clock,
  DoorOpen,
  Eye,
  Globe,
  Layers,
  LayoutGrid,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Phone,
  RotateCcw,
  Save,
  Settings,
  Store,
  Tag,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── INITIAL PROFILE VALUES (PERSIS REFERENSI DESAIN) ────────────────────────────
const INITIAL_DATA = {
  namaCoworking: "Moklet Hub Coworking Space",
  namaPemilik: "Ahmad Bidin, S.Kom",
  nomorTelepon: "081298765432",
  alamatGedung:
    "Jl. Danau Ranau No. 01, Sawojajar, Kedungkandang, Kota Malang, Jawa Timur 65139",
  koordinatLat: "-7.9784",
  koordinatLng: "112.6572",
  deskripsiFasilitas:
    "Ruang kerja modern ramah digital nomad dan tim rintisan di kawasan Sawojajar Malang. Dilengkapi koneksi fiber optic 100Mbps dedicated SLA, ruang rapat kedap suara, area komunal outdoor beratap, dan free flow kopi lokal berkualitas.",
  lastUpdated: "30 Agustus 2026 pukul 08:36 WIB",
};

export default function AdminLocationSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Form states
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState(
    INITIAL_DATA.lastUpdated
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // Character count calculation
  const charCount = formData.deskripsiFasilitas.length;
  const maxChars = 500;

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaCoworking.trim()) {
      toast.error("Nama Coworking Space tidak boleh kosong.");
      return;
    }
    if (!formData.alamatGedung.trim()) {
      toast.error("Alamat lengkap gedung tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setIsSavedSuccess(false);

    // 600ms spinner per project directive, then green checkmark
    setTimeout(() => {
      setIsSaving(false);
      setIsSavedSuccess(true);
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })} pukul ${now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} WIB`;
      setLastUpdatedDisplay(formattedDate);
      toast.success(
        `Profil dan informasi lokasi "${formData.namaCoworking}" berhasil diperbarui!`
      );

      // Revert success state to normal after 1.8s
      setTimeout(() => {
        setIsSavedSuccess(false);
      }, 1800);
    }, 600);
  };

  const handleReset = () => {
    setFormData(INITIAL_DATA);
    toast.info("Formulir pengaturan lokasi telah direset ke nilai awal.");
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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Pengaturan Admin">
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

          {/* 6. Pengaturan Lokasi (STATUS AKTIF PERSIS REFERENSI) */}
          <Link
            href="/admin/settings/location"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center gap-3 transition-all bg-[#111827] text-white shadow-sm"
          >
            <Settings className="w-4 h-4 text-white" />
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
        <AdminPageTransition pageKey="location-settings">
        <form onSubmit={handleSave} className="space-y-7">
          {/* A. HEADER HALAMAN & GLOBAL ACTIONS */}
          <header className="admin-header-animate flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                Pengaturan Profil & Lokasi Coworking
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Perbarui informasi publik tempat kerja, narasi fasilitas, kontak meja depan, dan alamat gedung.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className={`text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-80 ${
                isSavedSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#5E43F3] hover:bg-[#4A32D6]"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menyimpan...</span>
                </>
              ) : isSavedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
                  <span className="font-bold">Perubahan Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </header>

          {/* B. METRIC SUMMARY CARDS (GRID 3 KOLOM) */}
          <section
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            aria-label="Ringkasan Metrik Pengaturan Lokasi"
          >
            {/* Kartu 1: STATUS VISIBILITAS (White Card) */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  STATUS VISIBILITAS
                </span>
                <Eye className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="my-3">
                <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
                  Publik & Aktif
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-2">
                Dapat dicari dan dibooking di katalog member
              </span>
            </div>

            {/* Kartu 2: INVENTARIS TERKONEKSI (White Card) */}
            <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  INVENTARIS TERKONEKSI
                </span>
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <div className="my-3">
                <span className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">
                  <CountUp target={18} suffix=" Unit Ruang" />
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-2">
                Semua ruangan terikat pada profil lokasi ini
              </span>
            </div>

            {/* Kartu 3: NAMA BRAND LOKASI (Canary Yellow Signature Card) */}
            <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                  NAMA BRAND LOKASI
                </span>
                <MapPin className="w-4 h-4 text-[#111827]/80 fill-current" />
              </div>
              <div className="my-3">
                <span className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight truncate">
                  Moklet Hub Coworking
                </span>
              </div>
              <span className="text-xs font-semibold text-[#111827]/90 mt-2">
                ID Pengelola: OWNER-001 • Sawojajar, Malang
              </span>
            </div>
          </section>

          {/* C. STRUKTUR FORMULIR GRIDS (COMPLEX DATA TYPES) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* 1. Formulir Identitas (Kiri) */}
            <div className="admin-card-animate bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-xs space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Identitas Ruang Kerja & Penanggung Jawab
              </h2>

              {/* Field 1: Nama Coworking Space */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  NAMA COWORKING SPACE <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="namaCoworking"
                  value={formData.namaCoworking}
                  onChange={handleChange}
                  placeholder="Moklet Hub Coworking Space"
                  className="w-full text-sm rounded-xl p-3 border border-gray-200 bg-white font-medium text-[#111827] focus:outline-none focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 transition-all"
                />
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  Nama resmi brand yang ditampilkan kepada publik dan member.
                </span>
              </div>

              {/* Field 2: Nama Pemilik / Penanggung Jawab */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  NAMA PEMILIK / PENANGGUNG JAWAB OPERASIONAL{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="namaPemilik"
                  value={formData.namaPemilik}
                  onChange={handleChange}
                  placeholder="Ahmad Bidin, S.Kom"
                  className="w-full text-sm rounded-xl p-3 border border-gray-200 bg-white font-medium text-[#111827] focus:outline-none focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 transition-all"
                />
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  Nama pengelola sah untuk legalitas invoice dan e-ticket reservasi.
                </span>
              </div>

              {/* Field 3: Nomor Telepon / Hotline */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  NOMOR TELEPON / HOTLINE FRONT-DESK{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/20 transition-all">
                  <span className="px-3.5 py-3 text-sm text-gray-400 font-mono font-medium border-r border-gray-200 bg-gray-50/60 select-none">
                    +62
                  </span>
                  <input
                    type="tel"
                    required
                    name="nomorTelepon"
                    value={formData.nomorTelepon}
                    onChange={handleChange}
                    placeholder="081298765432"
                    className="flex-1 p-3 text-sm font-mono text-[#111827] bg-white focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  Digunakan untuk konfirmasi WhatsApp tiket masuk dan kendala lapangan.
                </span>
              </div>
            </div>

            {/* 2. Formulir Lokasi Geografis (Kanan) */}
            <div className="admin-card-animate bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-xs space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Lokasi Geografis & Alamat Fisik
              </h2>

              {/* Field 1: Alamat Lengkap Gedung */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  ALAMAT LENGKAP GEDUNG <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  name="alamatGedung"
                  value={formData.alamatGedung}
                  onChange={handleChange}
                  placeholder="Jl. Danau Ranau No. 01, Sawojajar, Kedungkandang, Kota Malang, Jawa Timur 65139"
                  className="w-full text-sm rounded-xl p-3 border border-gray-200 bg-white font-medium text-[#111827] focus:outline-none focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 transition-all resize-none leading-relaxed"
                />
                <span className="text-[11px] text-gray-400 mt-1.5 block">
                  Cantumkan petunjuk nomor gedung, kode pos, dan nama kelurahan yang presisi.
                </span>
              </div>

              {/* Field 2: Koordinat Peta Terverifikasi */}
              <div className="flex items-center gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-4 mt-6 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#5E43F3] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#5E43F3]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#111827] block">
                    Koordinat Peta Terverifikasi
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-black text-gray-800 tracking-wider">
                      {formData.koordinatLat}, {formData.koordinatLng}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    (Terkoneksi langsung ke penunjuk arah rute Google Maps bagi member)
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* D. SEKSI NARASI FASILITAS EDGE-TO-EDGE */}
          <section className="admin-card-animate bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827]">
                Deskripsi Fasilitas & Narasi Ruang Kerja
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Narasi ini akan tampil pada profil detail di katalog pencarian member serta kartu eksplorasi aplikasi publik.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                DESKRIPSI FASILITAS & KEUNGGULAN RUANG{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                maxLength={maxChars}
                name="deskripsiFasilitas"
                value={formData.deskripsiFasilitas}
                onChange={handleChange}
                placeholder="Ruang kerja modern ramah digital nomad dan tim rintisan di kawasan Sawojajar Malang..."
                className="w-full text-sm rounded-xl p-3.5 border border-gray-200 bg-white font-medium text-[#111827] focus:outline-none focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 transition-all resize-y leading-relaxed"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                <span className="text-[10px] sm:text-xs text-gray-400">
                  Direkomendasikan antara 150 - 300 karakter untuk indeks mesin pencarian katalog.
                </span>
                <span
                  className={`font-mono text-[11px] shrink-0 transition-colors duration-300 ${
                    charCount >= maxChars
                      ? "text-red-600 font-black animate-pulse"
                      : charCount > 400
                      ? "text-rose-500 font-bold"
                      : charCount > 300
                      ? "text-amber-500 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {charCount} / {maxChars} Karakter
                </span>
              </div>
            </div>
          </section>

          {/* E. STRIP FOOTER STATUS ADMIN & GLOBAL ACTIONS */}
          <footer className="pt-6 mt-12 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 font-mono gap-4">
            {/* Metadata Sesi (Kiri) */}
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>
                Terakhir diperbarui: {lastUpdatedDisplay} oleh {adminName}
              </span>
            </div>

            {/* Aksi Tombol (Kanan) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-gray-600 hover:text-black border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Reset Formulir
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className={`text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-80 ${
                  isSavedSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#5E43F3] hover:bg-[#4A32D6]"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : isSavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                    <span className="font-bold">Perubahan Tersimpan!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Profil</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
        </AdminPageTransition>
      </main>
    </div>
  );
}
