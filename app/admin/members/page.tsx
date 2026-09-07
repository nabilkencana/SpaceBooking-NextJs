"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Info,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export type MemberStatus =
  | "Aktif di Ruangan"
  | "Reservasi Hari Ini"
  | "Tidak Aktif";

export type FilterTab =
  | "Semua"
  | "Aktif di Ruangan"
  | "Reservasi Hari Ini";

export interface MemberItem {
  id: number;
  nama: string;
  username: string;
  instansi: string;
  telepon: string;
  alamat: string;
  status: MemberStatus;
  memberSejak: string;
  avatarText?: string;
}

// ─── INITIAL MEMBERS DATA (PERSIS GAMBAR REFERENSI & METRIK 24 MEMBER) ───────────
const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: 1,
    nama: "Budi Raharjo",
    username: "budi.member",
    instansi: "SMK Telkom Malang",
    telepon: "0857-1234-5678",
    alamat: "Jl. Danau Ranau No. 1, Sawojajar, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "12 Jan 2026",
    avatarText: "BR",
  },
  {
    id: 2,
    nama: "Siti Nurhaliza",
    username: "siti.member",
    instansi: "Universitas Brawijaya",
    telepon: "0857-1234-9900",
    alamat: "Jl. MT Haryono No. 169, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "03 Feb 2026",
    avatarText: "SN",
  },
  {
    id: 3,
    nama: "John Doe",
    username: "johndoe",
    instansi: "PT Inovasi Digital",
    telepon: "0812-3456-7890",
    alamat: "Jl. Sudirman No. 123, Jakarta Selatan",
    status: "Tidak Aktif",
    memberSejak: "18 Nov 2025",
    avatarText: "JD",
  },
  {
    id: 4,
    nama: "Amanda Putri",
    username: "amanda.putri",
    instansi: "Nusantara Creative Lab",
    telepon: "0813-8899-7711",
    alamat: "Jl. Ijen Boulevard No. 45, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "05 Jan 2026",
    avatarText: "AP",
  },
  {
    id: 5,
    nama: "Rian Hidayat",
    username: "rian.nomad",
    instansi: "Remote Software Dev",
    telepon: "0821-4455-6677",
    alamat: "Jl. Soekarno Hatta No. 88, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "19 Des 2025",
    avatarText: "RH",
  },
  {
    id: 6,
    nama: "Dimas Anggara",
    username: "dimas.dev",
    instansi: "GoTo Financial Malang",
    telepon: "0812-9988-1122",
    alamat: "Jl. Candi Mendut No. 14, Lowokwaru, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "10 Feb 2026",
    avatarText: "DA",
  },
  {
    id: 7,
    nama: "Clarissa Dewi",
    username: "clarissa.design",
    instansi: "Studio UX Nusantara",
    telepon: "0856-7788-3344",
    alamat: "Jl. Simpang Wilis No. 9, Klojen, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "15 Jan 2026",
    avatarText: "CD",
  },
  {
    id: 8,
    nama: "Fajar Pratama",
    username: "fajar.startup",
    instansi: "PT Tech Edukasi Asia",
    telepon: "0822-6677-8899",
    alamat: "Jl. Bunga Cengkeh No. 23, Jatimulyo, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "22 Jan 2026",
    avatarText: "FP",
  },
  {
    id: 9,
    nama: "Nadia Safira",
    username: "nadia.safira",
    instansi: "Politeknik Negeri Malang",
    telepon: "0819-3322-1144",
    alamat: "Jl. Kawi No. 34, Kauman, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "28 Jan 2026",
    avatarText: "NS",
  },
  {
    id: 10,
    nama: "Hendra Gunawan",
    username: "hendra.gunawan",
    instansi: "East Java Venture Lab",
    telepon: "0811-2233-4455",
    alamat: "Jl. Dieng No. 56, Gading Kasri, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "02 Feb 2026",
    avatarText: "HG",
  },
  {
    id: 11,
    nama: "Maya Kusuma",
    username: "maya.writer",
    instansi: "Freelance Copywriter Hub",
    telepon: "0877-6655-4433",
    alamat: "Jl. Sigura-gura No. 12, Sumbersari, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "08 Jan 2026",
    avatarText: "MK",
  },
  {
    id: 12,
    nama: "Bambang Pamungkas",
    username: "bambang.p",
    instansi: "Agro Tech Digital",
    telepon: "0813-2211-9988",
    alamat: "Jl. Bendungan Sutami No. 40, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "14 Jan 2026",
    avatarText: "BP",
  },
  {
    id: 13,
    nama: "Ayu Lestari",
    username: "ayu.lestari",
    instansi: "Universitas Negeri Malang",
    telepon: "0858-1122-3344",
    alamat: "Jl. Surabaya No. 6, Klojen, Malang",
    status: "Aktif di Ruangan",
    memberSejak: "19 Jan 2026",
    avatarText: "AL",
  },
  {
    id: 14,
    nama: "Rizky Ramadhan",
    username: "rizky.ramadhan",
    instansi: "SMK Telkom Malang",
    telepon: "0856-4433-2211",
    alamat: "Jl. Danau Toba No. 18, Sawojajar, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "25 Jan 2026",
    avatarText: "RR",
  },
  {
    id: 15,
    nama: "Santi Wijaya",
    username: "santi.wijaya",
    instansi: "PT Media Nusantara Prima",
    telepon: "0812-7788-9900",
    alamat: "Jl. Pahlawan Trip No. 5, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "30 Jan 2026",
    avatarText: "SW",
  },
  {
    id: 16,
    nama: "Kevin Sanjaya",
    username: "kevin.nomad",
    instansi: "Remote Software Dev",
    telepon: "0823-1122-3344",
    alamat: "Jl. Bondowoso No. 22, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "04 Feb 2026",
    avatarText: "KS",
  },
  {
    id: 17,
    nama: "Indah Permatasari",
    username: "indah.permatasari",
    instansi: "Nusantara Creative Lab",
    telepon: "0813-5566-7788",
    alamat: "Jl. Galunggung No. 17, Gading Kasri, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "09 Feb 2026",
    avatarText: "IP",
  },
  {
    id: 18,
    nama: "Arif Kurniawan",
    username: "arif.kurniawan",
    instansi: "East Java Venture Lab",
    telepon: "0857-8899-0011",
    alamat: "Jl. Terusan Dieng No. 8, Sukun, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "12 Feb 2026",
    avatarText: "AK",
  },
  {
    id: 19,
    nama: "Putri Maharani",
    username: "putri.maharani",
    instansi: "Universitas Brawijaya",
    telepon: "0812-3344-5566",
    alamat: "Jl. Veteran Blok C-2, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "15 Feb 2026",
    avatarText: "PM",
  },
  {
    id: 20,
    nama: "Teguh Santoso",
    username: "teguh.santoso",
    instansi: "PT Inovasi Digital",
    telepon: "0821-9988-7766",
    alamat: "Jl. Jakarta No. 19, Penanggungan, Malang",
    status: "Reservasi Hari Ini",
    memberSejak: "18 Feb 2026",
    avatarText: "TS",
  },
  {
    id: 21,
    nama: "Fitri Handayani",
    username: "fitri.handayani",
    instansi: "Startup Nomad Remote",
    telepon: "0878-1122-3344",
    alamat: "Jl. Bandung No. 11, Klojen, Malang",
    status: "Tidak Aktif",
    memberSejak: "01 Des 2025",
    avatarText: "FH",
  },
  {
    id: 22,
    nama: "Wahyu Pratama",
    username: "wahyu.pratama",
    instansi: "Freelance Copywriter Hub",
    telepon: "0813-4455-6677",
    alamat: "Jl. Kaliurang No. 3, Lowokwaru, Malang",
    status: "Tidak Aktif",
    memberSejak: "11 Des 2025",
    avatarText: "WP",
  },
  {
    id: 23,
    nama: "Dian Anggraini",
    username: "dian.anggraini",
    instansi: "PT Tech Edukasi Asia",
    telepon: "0856-1122-3344",
    alamat: "Jl. Semeru No. 42, Kauman, Malang",
    status: "Tidak Aktif",
    memberSejak: "20 Des 2025",
    avatarText: "DA",
  },
  {
    id: 24,
    nama: "Agus Setiawan",
    username: "agus.setiawan",
    instansi: "Agro Tech Digital",
    telepon: "0812-6677-8899",
    alamat: "Jl. Borobudur No. 15, Mojolangu, Malang",
    status: "Tidak Aktif",
    memberSejak: "28 Des 2025",
    avatarText: "AS",
  },
];

const ITEMS_PER_PAGE = 10;

export default function AdminMembersDirectoryPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // State operasional
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<FilterTab>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal Tambah Member Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newInstansi, setNewInstansi] = useState("");
  const [newTelepon, setNewTelepon] = useState("");
  const [newAlamat, setNewAlamat] = useState("");
  const [newStatus, setNewStatus] = useState<MemberStatus>("Aktif di Ruangan");

  // Modal Edit Member
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);

  // Modal Konfirmasi Hapus Member
  const [deletingMember, setDeletingMember] = useState<MemberItem | null>(null);

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
  const totalMembersCount = members.length;
  const activeInRoomCount = members.filter((m) => m.status === "Aktif di Ruangan").length;
  const reservedTodayCount = members.filter((m) => m.status === "Reservasi Hari Ini").length;

  const totalOrganizationsCount = useMemo(() => {
    const orgs = new Set(members.map((m) => m.instansi.trim()));
    return orgs.size;
  }, [members]);

  // ─── FILTER LOGIC ────────────────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Filter Tab
      if (selectedTab === "Aktif di Ruangan" && m.status !== "Aktif di Ruangan") return false;
      if (selectedTab === "Reservasi Hari Ini" && m.status !== "Reservasi Hari Ini") return false;

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = m.nama.toLowerCase().includes(q);
        const matchUsername = m.username.toLowerCase().includes(q);
        const matchInstansi = m.instansi.toLowerCase().includes(q);
        const matchTelepon = m.telepon.toLowerCase().includes(q);
        const matchAlamat = m.alamat.toLowerCase().includes(q);
        if (!matchNama && !matchUsername && !matchInstansi && !matchTelepon && !matchAlamat) {
          return false;
        }
      }

      return true;
    });
  }, [members, selectedTab, searchQuery]);

  // ─── PAGINATION LOGIC ────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const startIndexDisplay = filteredMembers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndexDisplay = Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length);

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) {
      toast.error("Nama lengkap member wajib diisi.");
      return;
    }

    const cleanUsername =
      newUsername.trim().toLowerCase().replace(/\s+/g, ".") ||
      newNama.toLowerCase().replace(/\s+/g, ".");

    const initialsArr = newNama
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newMember: MemberItem = {
      id: Date.now(),
      nama: newNama.trim(),
      username: cleanUsername,
      instansi: newInstansi.trim() || "Independent Freelancer",
      telepon: newTelepon.trim() || "0812-0000-0000",
      alamat: newAlamat.trim() || "Kota Malang",
      status: newStatus,
      memberSejak: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      avatarText: initialsArr || "MB",
    };

    setMembers((prev) => [newMember, ...prev]);
    toast.success(`Member "${newMember.nama}" berhasil ditambahkan ke direktori!`);

    // Reset Form
    setNewNama("");
    setNewUsername("");
    setNewInstansi("");
    setNewTelepon("");
    setNewAlamat("");
    setIsAddModalOpen(false);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    toast.success(`Data member "${editingMember.nama}" berhasil diperbarui!`);
    setEditingMember(null);
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
    toast.success(`Member "${deletingMember.nama}" telah dihapus dari direktori.`);
    setDeletingMember(null);
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error("Tidak ada data member yang dapat diekspor.");
      return;
    }

    const csvHeaders = [
      "ID",
      "Nama Lengkap",
      "Username",
      "Instansi / Asal",
      "No. Telepon / WhatsApp",
      "Alamat Domisili",
      "Status",
      "Member Sejak",
    ];

    const csvRows = filteredMembers.map((m) => [
      m.id,
      `"${m.nama.replace(/"/g, '""')}"`,
      `"${m.username}"`,
      `"${m.instansi.replace(/"/g, '""')}"`,
      `"${m.telepon}"`,
      `"${m.alamat.replace(/"/g, '""')}"`,
      `"${m.status}"`,
      `"${m.memberSejak}"`,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `urspace-direktori-member-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Database member berhasil diekspor ke file CSV!");
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
        <nav className="px-4 py-6 space-y-1.5" aria-label="Navigasi Member Admin">
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

          {/* 5. Direktori Member (STATUS AKTIF PERSIS REFERENSI) */}
          <Link
            href="/admin/members"
            className="w-full text-left font-semibold text-xs rounded-xl px-4 py-3 flex items-center gap-3 transition-all bg-[#111827] text-white shadow-sm"
          >
            <Users className="w-4 h-4 text-white" />
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
        <AdminPageTransition pageKey={`${selectedTab}-${currentPage}-${searchQuery}`}>
        {/* A. HEADER HALAMAN & GLOBAL ACTIONS */}
        <header className="admin-header-animate flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
              Direktori Member & Pelanggan
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Kelola database pelanggan terdaftar, verifikasi identitas instansi, dan kontak reservasi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Member Baru</span>
          </button>
        </header>

        {/* B. METRIC SUMMARY CARDS (GRID 3 KOLOM) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-label="Ringkasan Metrik Member">
          {/* Kartu 1: Total Member Terdaftar (White Card) */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                TOTAL MEMBER TERDAFTAR
              </span>
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
                <CountUp target={totalMembersCount} suffix=" Member" />
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-2">
              18 akun aktif berkunjung bulan ini
            </span>
          </div>

          {/* Kartu 2: Afiliasi Instansi / Perusahaan (White Card) */}
          <div className="admin-kpi-card bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                AFILIASI INSTANSI / PERUSAHAAN
              </span>
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
                <CountUp target={totalOrganizationsCount} suffix=" Organisasi" />
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-2">
              Startup, universitas, dan nomad remote
            </span>
          </div>

          {/* Kartu 3: Member Aktif di Lokasi (Canary Yellow Signature Card) */}
          <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                MEMBER AKTIF DI LOKASI
              </span>
              <Zap className="w-4 h-4 text-[#111827]/70 fill-current" />
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
                <CountUp target={activeInRoomCount} suffix=" Orang Saat Ini" />
              </span>
            </div>
            <span className="text-xs font-semibold text-[#111827]/90 mt-2">
              Tersebar di personal desk dan meeting room
            </span>
          </div>
        </section>

        {/* C. TOOLBAR PENCARIAN, FILTER & EKSPOR */}
        <section className="admin-toolbar-animate flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-2">
          {/* Field Pencarian Multivariat (Sisi Kiri) */}
          <div className="relative w-full lg:w-96 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, instansi, atau nomor telepon..."
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

          {/* Filter Segmented Pills & Ekspor (Sisi Kanan) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              {/* Pill 1: Semua */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("Semua");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                  selectedTab === "Semua"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
                }`}
              >
                Semua ({totalMembersCount})
              </button>

              {/* Pill 2: Aktif di Ruangan */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("Aktif di Ruangan");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                  selectedTab === "Aktif di Ruangan"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
                }`}
              >
                Aktif di Ruangan ({activeInRoomCount})
              </button>

              {/* Pill 3: Reservasi Hari Ini */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("Reservasi Hari Ini");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full font-bold transition-colors cursor-pointer ${
                  selectedTab === "Reservasi Hari Ini"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
                }`}
              >
                Reservasi Hari Ini ({reservedTodayCount})
              </button>
            </div>

            {/* Tombol Ekspor CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="bg-white hover:bg-gray-50 active:scale-95 text-[#111827] border border-[#E5E7EB] text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto xl:ml-0"
            >
              <span>Ekspor CSV</span>
              <span className="font-mono">↓</span>
            </button>
          </div>
        </section>

        {/* D. TABEL DIREKTORI MEMBER */}
        <section className="w-full bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    MEMBER / NAMA LENGKAP
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    USERNAME
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    INSTANSI / ASAL
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    NO. TELEPON / WHATSAPP
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    ALAMAT DOMISILI
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Tidak ada member yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => {
                    const isAktif = member.status === "Aktif di Ruangan";
                    const isReserved = member.status === "Reservasi Hari Ini";
                    const isInactive = member.status === "Tidak Aktif";

                    return (
                      <tr
                        key={member.id}
                        className="admin-table-row hover:bg-gray-50/70 transition-colors"
                      >
                        {/* Kolom 1: MEMBER / NAMA LENGKAP */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {member.avatarText || "MB"}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#111827] block leading-tight">
                                {member.nama}
                              </span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Member sejak {member.memberSejak}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: USERNAME */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs text-gray-600">
                            {member.username}
                          </span>
                        </td>

                        {/* Kolom 3: INSTANSI / ASAL */}
                        <td className="py-4 px-4">
                          <span className="text-xs text-gray-800 font-medium">
                            {member.instansi}
                          </span>
                        </td>

                        {/* Kolom 4: NO. TELEPON / WHATSAPP */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs text-gray-700 whitespace-nowrap">
                            {member.telepon}
                          </span>
                        </td>

                        {/* Kolom 5: ALAMAT DOMISILI */}
                        <td className="py-4 px-4 max-w-[220px]">
                          <span className="text-xs text-gray-600 line-clamp-1">
                            {member.alamat}
                          </span>
                        </td>

                        {/* Kolom 6: STATUS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isAktif && (
                            <span className="text-xs font-semibold text-emerald-600">
                              Aktif di Ruangan
                            </span>
                          )}
                          {isReserved && (
                            <span className="text-xs font-semibold text-blue-600">
                              Reservasi Hari Ini
                            </span>
                          )}
                          {isInactive && (
                            <span className="text-xs font-medium text-gray-400">
                              Tidak Aktif
                            </span>
                          )}
                        </td>

                        {/* Kolom 7: AKSI */}
                        <td className="py-4 px-6 text-right space-y-0.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingMember(member)}
                            className="text-xs font-medium text-[#5E43F3] hover:text-[#4A32D6] active:scale-95 transition-transform duration-100 block ml-auto cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMember(member)}
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
              Menampilkan <strong className="text-gray-900">{startIndexDisplay}–{endIndexDisplay}</strong> dari{" "}
              <strong className="text-gray-900">{filteredMembers.length}</strong> member terdaftar
            </span>

            <div className="flex items-center gap-2">
              {/* Tombol Sebelumnya */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`text-xs font-medium px-2 py-1 transition-colors ${
                  currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-black cursor-pointer"
                }`}
              >
                ← Sebelumnya
              </button>

              {/* Angka Halaman Dinamis */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#111827] text-white shadow-xs"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Tombol Berikutnya */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`text-xs font-semibold ml-2 transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-[#111827] hover:text-black cursor-pointer"
                }`}
              >
                Berikutnya →
              </button>
            </div>
          </div>
        </section>

        {/* F. STRIP FOOTER STATUS ADMIN */}
        <footer className="pt-6 border-t border-gray-200 text-center sm:text-left">
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            URSPACE ADMIN • Database Member & Pelanggan Moklet Hub © 2026
          </p>
        </footer>
        </AdminPageTransition>
      </main>

      {/* ─── MODAL: TAMBAH MEMBER BARU ──────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Tambah Member Baru
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daftarkan pelanggan atau member baru ke database Moklet Hub
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 pt-5 text-xs">
              {/* Nama Lengkap & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={newNama}
                    onChange={(e) => setNewNama(e.target.value)}
                    placeholder="Contoh: Budi Raharjo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="budi.member"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instansi & Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Instansi / Asal Organisasi
                  </label>
                  <input
                    type="text"
                    required
                    value={newInstansi}
                    onChange={(e) => setNewInstansi(e.target.value)}
                    placeholder="Contoh: SMK Telkom Malang"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={newTelepon}
                    onChange={(e) => setNewTelepon(e.target.value)}
                    placeholder="0857-1234-5678"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alamat Domisili */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Domisili
                </label>
                <input
                  type="text"
                  required
                  value={newAlamat}
                  onChange={(e) => setNewAlamat(e.target.value)}
                  placeholder="Jl. Danau Ranau No. 1, Sawojajar, Malang"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
              </div>

              {/* Status Member */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Status Keberadaan Member
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as MemberStatus)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                >
                  <option value="Aktif di Ruangan">Aktif di Ruangan</option>
                  <option value="Reservasi Hari Ini">Reservasi Hari Ini</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98"
                >
                  Simpan Member Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT MEMBER ─────────────────────────────────────────────── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingMember(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Edit Data Member
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Perbarui profil dan status reservasi member {editingMember.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 pt-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.nama}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, nama: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.username}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        username: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Instansi / Asal Organisasi
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.instansi}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        instansi: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.telepon}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        telepon: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Domisili
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.alamat}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      alamat: e.target.value,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Status Member
                </label>
                <select
                  value={editingMember.status}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      status: e.target.value as MemberStatus,
                    })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                >
                  <option value="Aktif di Ruangan">Aktif di Ruangan</option>
                  <option value="Reservasi Hari Ini">Reservasi Hari Ini</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: KONFIRMASI HAPUS MEMBER ─────────────────────────────────── */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDeletingMember(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl z-10 border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[#111827]">
              Hapus Data Member?
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-6">
              Apakah Anda yakin ingin menghapus data member{" "}
              <strong className="text-black font-bold">
                {deletingMember.nama}
              </strong>{" "}
              ({deletingMember.username}) dari direktori? Riwayat transaksi dan reservasi terkait akan diarsipkan.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer text-xs"
              >
                Ya, Hapus Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
