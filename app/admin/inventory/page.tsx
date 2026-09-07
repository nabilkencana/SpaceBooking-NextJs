"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  DoorOpen,
  Filter,
  Image as ImageIcon,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Percent,
  Plus,
  Search,
  Settings,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export type SpaceTypeFilter =
  | "Semua Tipe"
  | "Personal Desk"
  | "Meeting Room"
  | "Private Office";

export interface InventorySpaceItem {
  id: number;
  nama: string;
  lokasi: string;
  tipe: "Personal Desk" | "Meeting Room" | "Private Office";
  kapasitas: number;
  tarifPerJam: number;
  fasilitas: string;
  status: "sedang_digunakan" | "kosong_siap_pakai";
  foto: string;
}

// ─── INITIAL INVENTORY DATA (PERSIS GAMBAR REFERENSI DESAIN) ─────────────────────
const INITIAL_INVENTORY: InventorySpaceItem[] = [
  {
    id: 1,
    nama: "Personal Desk – Flexi 01",
    lokasi: "Lantai 2 • Silentium Zone",
    tipe: "Personal Desk",
    kapasitas: 1,
    tarifPerJam: 20000,
    fasilitas: "WiFi 100Mbps, Stopkontak Mandiri, M...",
    status: "sedang_digunakan",
    foto: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    nama: "Meeting Room Alpha",
    lokasi: "Lantai 3 • Collaboration Hub",
    tipe: "Meeting Room",
    kapasitas: 8,
    tarifPerJam: 100000,
    fasilitas: 'Smart TV 55", Soundbar, Whiteboard K...',
    status: "kosong_siap_pakai",
    foto: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    nama: "Private Glass Suite 4A",
    lokasi: "Lantai 2 • East Wing",
    tipe: "Private Office",
    kapasitas: 4,
    tarifPerJam: 150000,
    fasilitas: "Akses 24 Jam, Standing Desk Elektrik, ...",
    status: "kosong_siap_pakai",
    foto: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    nama: "Personal Desk – Quiet Pod 03",
    lokasi: "Lantai 1 • Nook Area",
    tipe: "Personal Desk",
    kapasitas: 1,
    tarifPerJam: 25000,
    fasilitas: "Ergonomic Herman Miller Chair, Noise...",
    status: "sedang_digunakan",
    foto: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80",
  },
];

export default function AdminInventoryPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State operasional
  const [spaces, setSpaces] = useState<InventorySpaceItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<SpaceTypeFilter>("Semua Tipe");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form state untuk penambahan ruang baru
  const [newNama, setNewNama] = useState("");
  const [newLokasi, setNewLokasi] = useState("");
  const [newTipe, setNewTipe] =
    useState<"Personal Desk" | "Meeting Room" | "Private Office">("Personal Desk");
  const [newKapasitas, setNewKapasitas] = useState("1");
  const [newTarif, setNewTarif] = useState("20000");
  const [newFasilitas, setNewFasilitas] = useState("");
  const [newStatus, setNewStatus] =
    useState<"kosong_siap_pakai" | "sedang_digunakan">("kosong_siap_pakai");

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

  // ─── FILTER LOGIC ────────────────────────────────────────────────────────────
  const filteredSpaces = useMemo(() => {
    return spaces.filter((item) => {
      // Filter kategori tipe
      if (selectedType !== "Semua Tipe" && item.tipe !== selectedType) {
        return false;
      }

      // Filter pencarian teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama.toLowerCase().includes(q);
        const matchLocation = item.lokasi.toLowerCase().includes(q);
        const matchFacility = item.fasilitas.toLowerCase().includes(q);
        return matchName || matchLocation || matchFacility;
      }

      return true;
    });
  }, [spaces, selectedType, searchQuery]);

  // Hitung jumlah tipe
  const personalDeskCount = useMemo(
    () => spaces.filter((s) => s.tipe === "Personal Desk").length,
    [spaces]
  );
  const meetingRoomCount = useMemo(
    () => spaces.filter((s) => s.tipe === "Meeting Room").length,
    [spaces]
  );
  const privateOfficeCount = useMemo(
    () => spaces.filter((s) => s.tipe === "Private Office").length,
    [spaces]
  );

  // ─── HANDLER TAMBAH RUANG BARU ───────────────────────────────────────────────
  const handleAddSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) {
      toast.error("Nama ruangan/meja wajib diisi!");
      return;
    }

    const defaultImages = {
      "Personal Desk":
        "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=400&q=80",
      "Meeting Room":
        "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80",
      "Private Office":
        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80",
    };

    const newItem: InventorySpaceItem = {
      id: Date.now(),
      nama: newNama.trim(),
      lokasi: newLokasi.trim() || "Lantai 2 • Silentium Zone",
      tipe: newTipe,
      kapasitas: Number(newKapasitas) || 1,
      tarifPerJam: Number(newTarif) || 25000,
      fasilitas:
        newFasilitas.trim() || "WiFi 100Mbps, Stopkontak Mandiri, Meja Ergonomis",
      status: newStatus,
      foto: defaultImages[newTipe],
    };

    setSpaces((prev) => [newItem, ...prev]);
    toast.success(`Unit ${newItem.nama} berhasil ditambahkan ke inventaris!`);

    // Reset form
    setNewNama("");
    setNewLokasi("");
    setNewFasilitas("");
    setIsAddModalOpen(false);
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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Inventaris Admin">
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

          {/* 3. Inventaris Space & Meja (STATUS AKTIF PERSIS REFERENSI) */}
          <Link
            href="/admin/inventory"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center gap-3 transition-all bg-[#111827] text-white shadow-sm"
          >
            <Layers className="w-4 h-4 text-white" />
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

      {/* ─── 2. MOBILE HEADER & DRAWER ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Menu navigasi"
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
        <AdminPageTransition pageKey={`${selectedType}-${searchQuery}`}>
        {/* HEADER HALAMAN & TOMBOL TAMBAH RUANG */}
        <div className="admin-header-animate flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Inventaris Ruang & Meja Kerja
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
              Atur tarif sewa per jam, kapasitas meja, dan spesifikasi fasilitas ruang kerja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Ruang Baru</span>
          </button>
        </div>

        {/* ─── 4. METRIC SUMMARY CARDS (GRID 3 KOLOM) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Kartu 1: Total Unit Ruang (White Card) */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  TOTAL UNIT RUANG
                </span>
                <Building2 className="w-4 h-4 text-gray-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight my-3">
                <CountUp target={18} suffix=" Unit Terdaftar" />
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              10 Personal Desk • 5 Meeting Room • 3 Office
            </p>
          </div>

          {/* Kartu 2: Kapasitas Total Kursi (White Card) */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  KAPASITAS TOTAL KURSI
                </span>
                <Armchair className="w-4 h-4 text-gray-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight my-3">
                <CountUp target={64} suffix=" Orang" />
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Daya tampung simultan seluruh area
            </p>
          </div>

          {/* Kartu 3: Status Okupansi Saat Ini (Canary Yellow Signature Card) */}
          <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div>
              <div className="flex items-center justify-between text-[#111827]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                  STATUS OKUPANSI SAAT INI
                </span>
                <div className="w-7 h-7 rounded-lg bg-black/10 text-[#111827] flex items-center justify-center">
                  <Armchair className="w-3.5 h-3.5" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight my-3">
                <CountUp target={7} suffix=" Unit Aktif" />
              </h2>
            </div>
            <p className="text-xs font-semibold text-[#111827]/90">
              11 unit tersedia untuk reservasi instan
            </p>
          </div>
        </div>

        {/* ─── 5. TOOLBAR PENCARIAN & TAB FILTER KATEGORI ───────────────────── */}
        <div className="admin-toolbar-animate flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          {/* Field Pencarian Nama / Fasilitas (Sisi Kiri) */}
          <div className="relative w-full lg:w-96 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama unit atau fasilitas..."
              className="w-full text-xs font-medium text-[#111827] placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Segmented Pills (Sisi Kanan) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedType("Semua Tipe")}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                selectedType === "Semua Tipe"
                  ? "bg-[#111827] text-white font-bold shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Semua Tipe (18)
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("Personal Desk")}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                selectedType === "Personal Desk"
                  ? "bg-[#111827] text-white font-bold shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Personal Desk ({personalDeskCount >= 10 ? personalDeskCount : 10})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("Meeting Room")}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                selectedType === "Meeting Room"
                  ? "bg-[#111827] text-white font-bold shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Meeting Room ({meetingRoomCount >= 5 ? meetingRoomCount : 5})
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("Private Office")}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                selectedType === "Private Office"
                  ? "bg-[#111827] text-white font-bold shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
              }`}
            >
              Private Office ({privateOfficeCount >= 3 ? privateOfficeCount : 3})
            </button>
          </div>
        </div>

        {/* ─── 6. TABEL INVENTARIS: DAFTAR RUANG & MEJA KERJA ────────────────── */}
        <div className="w-full bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6">
                    SPACE / RUANGAN
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    TIPE UNIT
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    KAPASITAS
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    TARIF PER JAM
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    FASILITAS UTAMA
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6 text-right">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSpaces.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-xs text-gray-400 font-medium"
                    >
                      Tidak ada ruang kerja yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredSpaces.map((item) => {
                    const isOccupied = item.status === "sedang_digunakan";

                    return (
                      <tr
                        key={item.id}
                        className="admin-table-row hover:bg-gray-50/60 transition-colors"
                      >
                        {/* 1. SPACE / RUANGAN */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 relative">
                              <img
                                src={item.foto}
                                alt={item.nama}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#111827] block leading-tight">
                                {item.nama}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                                {item.lokasi}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. TIPE UNIT */}
                        <td className="py-4 px-4 align-middle text-xs text-gray-600 font-medium">
                          {item.tipe}
                        </td>

                        {/* 3. KAPASITAS */}
                        <td className="py-4 px-4 align-middle">
                          <div className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                            {item.kapasitas > 1 ? (
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-gray-400" />
                            )}
                            <span>{item.kapasitas} Orang</span>
                          </div>
                        </td>

                        {/* 4. TARIF PER JAM */}
                        <td className="py-4 px-4 align-middle">
                          <span className="font-mono text-xs font-bold text-[#111827] block">
                            Rp {item.tarifPerJam.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-sans">
                            /jam
                          </span>
                        </td>

                        {/* 5. FASILITAS UTAMA */}
                        <td className="py-4 px-4 align-middle text-xs text-gray-500 max-w-xs truncate">
                          {item.fasilitas}
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                          {isOccupied ? (
                            <span className="text-xs font-semibold text-[#5E43F3] block">
                              Sedang Digunakan
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 block">
                              Kosong / Siap Pakai
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
              Menampilkan <span className="font-semibold text-gray-900">1–{filteredSpaces.length}</span> dari{" "}
              <span className="font-semibold text-gray-900">18</span> unit ruang kerja
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
                className="w-7 h-7 rounded-full hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                4
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

        {/* ─── 8. STRIP FOOTER STATUS ADMIN ─────────────────────────────────── */}
        <footer className="pt-6 border-t border-gray-200 text-center sm:text-left pb-8">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            URSPACE ADMIN • Manajemen Inventaris Workstation © 2026
          </p>
        </footer>
        </AdminPageTransition>
      </main>

      {/* ─── MODAL: TAMBAH RUANG BARU ─────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div>
                <h3 className="font-extrabold text-lg text-[#111827]">
                  Tambah Ruang / Meja Baru
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Masukkan data unit workstation ke dalam inventaris operasional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSpaceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nama Ruang / Nomor Meja:
                </label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Personal Desk – Flexi 03"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kategori / Tipe Unit:
                  </label>
                  <select
                    value={newTipe}
                    onChange={(e) =>
                      setNewTipe(
                        e.target.value as
                          | "Personal Desk"
                          | "Meeting Room"
                          | "Private Office"
                      )
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#5E43F3]"
                  >
                    <option value="Personal Desk">Personal Desk</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Private Office">Private Office</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Lokasi / Lantai / Zona:
                  </label>
                  <input
                    type="text"
                    value={newLokasi}
                    onChange={(e) => setNewLokasi(e.target.value)}
                    placeholder="Contoh: Lantai 2 • Zona Silentium"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kapasitas (Orang):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newKapasitas}
                    onChange={(e) => setNewKapasitas(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tarif Sewa (Rp / Jam):
                  </label>
                  <input
                    type="number"
                    step="5000"
                    value={newTarif}
                    onChange={(e) => setNewTarif(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Fasilitas Utama:
                </label>
                <input
                  type="text"
                  value={newFasilitas}
                  onChange={(e) => setNewFasilitas(e.target.value)}
                  placeholder="Contoh: WiFi 100Mbps, Stopkontak Mandiri, Kursi Ergonomis"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Status Ketersediaan Awal:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(
                      e.target.value as
                        | "kosong_siap_pakai"
                        | "sedang_digunakan"
                    )
                  }
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#5E43F3]"
                >
                  <option value="kosong_siap_pakai">Kosong / Siap Pakai</option>
                  <option value="sedang_digunakan">Sedang Digunakan</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Simpan Unit ke Inventaris
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
