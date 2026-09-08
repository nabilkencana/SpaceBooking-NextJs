"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BarChart3,
  Building2,
  CalendarCheck,
  Layers,
  LayoutGrid,
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
import {
  useAdminMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  usePendingCount,
  type UpdateMemberPayload,
} from "@/hooks/useAdmin";
import { ApiRequestError, type ApiError } from "@/lib/api";
import type { Member } from "@/types";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";

// ─── TYPES & HELPERS ────────────────────────────────────────────────────────────
// MemberResource belum mengekspos username (milik relasi user) — kolom dirender
// kondisional dan otomatis terisi begitu resource backend menambahkannya.
type MemberRow = Member & { username?: string };

/** Backend 4xx envelopes arrive as AxiosError via the BFF proxy. */
function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
  }
  if (err instanceof ApiRequestError) return err.message;
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return initials || "MB";
}

const ITEMS_PER_PAGE = 10;

export default function AdminMembersDirectoryPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // ─── LIVE DATA (GET /admin/members, search: nama_member/instansi/telp) ──────
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Debounce 300ms: ketikan berhenti dulu baru query ke backend
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const membersQuery = useAdminMembers(searchQuery.trim() || undefined);
  const members = useMemo(() => (membersQuery.data ?? []) as MemberRow[], [membersQuery.data]);

  // Mutasi CRUD
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const pendingCountQuery = usePendingCount();

  // Modal Tambah Member Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newInstansi, setNewInstansi] = useState("");
  const [newTelepon, setNewTelepon] = useState("");
  const [newAlamat, setNewAlamat] = useState("");

  // Modal Edit Member
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
  const [editPassword, setEditPassword] = useState("");

  // Modal Konfirmasi Hapus Member
  const [deletingMember, setDeletingMember] = useState<MemberRow | null>(null);

  // Identitas Admin
  const adminName =
    user?.space_owner?.nama_pemilik ??
    user?.member?.nama_member ??
    user?.username ??
    "Ahmad Bidin";
  const adminRole = "Admin Pengelola";
  const initials = initialsOf(adminName);

  // ─── METRIC COMPUTATIONS (dari response server) ─────────────────────────────
  const totalMembersCount = members.length;
  const totalOrganizationsCount = useMemo(() => {
    const orgs = new Set(members.map((m) => m.instansi.trim()));
    return orgs.size;
  }, [members]);
  // Referensi waktu stabil per-mount (bukan per-render) untuk "member baru bulan ini"
  const now = useMemo(() => new Date(), []);
  const newMembersThisMonthCount = useMemo(
    () =>
      members.filter((m) => {
        const d = new Date(m.created_at);
        return (
          !Number.isNaN(d.getTime()) &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }).length,
    [members, now],
  );

  // ─── PAGINATION LOGIC (server belum mempage endpoint members) ───────────────
  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE) || 1;
  // Clamp derived (bukan effect): react.dev "You Might Not Need an Effect"
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return members.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [members, safePage]);

  const startIndexDisplay = members.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endIndexDisplay = Math.min(safePage * ITEMS_PER_PAGE, members.length);

  // ─── HANDLERS ────────────────────────────────────────────────────────────────
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) {
      toast.error("Nama lengkap member wajib diisi.");
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    const cleanUsername =
      newUsername.trim().toLowerCase().replace(/\s+/g, ".") ||
      newNama.trim().toLowerCase().replace(/\s+/g, ".");

    createMember.mutate(
      {
        username: cleanUsername,
        password: newPassword.trim(),
        nama_member: newNama.trim(),
        instansi: newInstansi.trim(),
        alamat: newAlamat.trim(),
        telp: newTelepon.trim(),
      },
      {
        onSuccess: (created) => {
          toast.success(`Member "${created.nama_member}" berhasil ditambahkan ke direktori!`);
          setNewNama("");
          setNewUsername("");
          setNewPassword("");
          setNewInstansi("");
          setNewTelepon("");
          setNewAlamat("");
          setIsAddModalOpen(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const payload: UpdateMemberPayload = {
      nama_member: editingMember.nama_member.trim(),
      instansi: editingMember.instansi.trim(),
      telp: editingMember.telp.trim(),
      alamat: editingMember.alamat.trim(),
    };
    const username = editingMember.username?.trim();
    if (username) payload.username = username;
    if (editPassword.trim()) payload.password = editPassword.trim();

    updateMember.mutate(
      { id: editingMember.id, ...payload },
      {
        onSuccess: (updated) => {
          toast.success(`Data member "${updated.nama_member}" berhasil diperbarui!`);
          setEditingMember(null);
          setEditPassword("");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    deleteMember.mutate(deletingMember.id, {
      onSuccess: () => {
        toast.success(`Member "${deletingMember.nama_member}" telah dihapus dari direktori.`);
        setDeletingMember(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleExportCSV = () => {
    if (members.length === 0) {
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
      "Member Sejak",
    ];

    const csvRows = members.map((m) => [
      m.id,
      `"${m.nama_member.replace(/"/g, '""')}"`,
      `"${m.username ?? "-"}"`,
      `"${m.instansi.replace(/"/g, '""')}"`,
      `"${m.telp}"`,
      `"${m.alamat.replace(/"/g, '""')}"`,
      `"${formatTanggal(m.created_at)}"`,
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
            <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shrink-0">
              {pendingCountQuery.data ?? 0}
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
        <AdminPageTransition pageKey={`${currentPage}-${searchQuery}`}>
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
              Sinkron langsung dengan database member
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

          {/* Kartu 3: Member Baru Bulan Ini (Canary Yellow Signature Card) */}
          <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                MEMBER BARU BULAN INI
              </span>
              <Zap className="w-4 h-4 text-[#111827]/70 fill-current" />
            </div>
            <div className="my-3">
              <span className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight">
                <CountUp target={newMembersThisMonthCount} suffix=" Orang" />
              </span>
            </div>
            <span className="text-xs font-semibold text-[#111827]/90 mt-2">
              Terhitung dari tanggal registrasi akun member
            </span>
          </div>
        </section>

        {/* C. TOOLBAR PENCARIAN & EKSPOR */}
        <section className="admin-toolbar-animate flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-2">
          {/* Field Pencarian Server-Side: nama_member / instansi / telp (Sisi Kiri) */}
          <div className="relative w-full lg:w-96 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-xs focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/20 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, instansi, atau nomor telepon..."
              className="w-full text-xs font-medium text-[#111827] placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="text-gray-400 hover:text-gray-600 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tombol Ekspor CSV (Sisi Kanan) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
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
                    MEMBER SEJAK
                  </th>
                  <th className="py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {membersQuery.isLoading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={`skeleton-${i}`} className="admin-table-row">
                      <td colSpan={6} className="py-3 px-6">
                        <div className="h-8 w-full rounded-xl bg-gray-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : membersQuery.isError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-xs font-semibold text-rose-600">
                        Gagal memuat data member.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {getErrorMessage(membersQuery.error)}
                      </p>
                      <button
                        type="button"
                        onClick={() => membersQuery.refetch()}
                        className="mt-4 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </td>
                  </tr>
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      {searchQuery
                        ? `Tidak ada member yang cocok dengan pencarian "${searchQuery}".`
                        : "Belum ada member terdaftar."}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="admin-table-row hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Kolom 1: MEMBER / NAMA LENGKAP */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {initialsOf(member.nama_member)}
                          </div>
                          <span className="text-xs font-bold text-[#111827] block leading-tight">
                            {member.nama_member}
                          </span>
                        </div>
                      </td>

                      {/* Kolom 2: USERNAME (resource backend belum mengekspos) */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs text-gray-600">
                          {member.username ?? "—"}
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
                          {member.telp}
                        </span>
                      </td>

                      {/* Kolom 5: MEMBER SEJAK (tanggal registrasi) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-xs text-gray-600">
                          {formatTanggal(member.created_at)}
                        </span>
                      </td>

                      {/* Kolom 6: AKSI */}
                      <td className="py-4 px-6 text-right space-y-0.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditPassword("");
                            setEditingMember(member);
                          }}
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* E. PAGINATION FOOTER */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <span>
              Menampilkan <strong className="text-gray-900">{startIndexDisplay}–{endIndexDisplay}</strong> dari{" "}
              <strong className="text-gray-900">{members.length}</strong> member terdaftar
            </span>

            <div className="flex items-center gap-2">
              {/* Tombol Sebelumnya */}
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                className={`text-xs font-medium px-2 py-1 transition-colors ${
                  safePage === 1
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
                    safePage === pageNum
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
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                className={`text-xs font-semibold ml-2 transition-colors ${
                  safePage === totalPages
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
                    placeholder="085712345678"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Akun Member */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password Akun
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
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
                  disabled={createMember.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98 disabled:opacity-60 disabled:cursor-wait"
                >
                  {createMember.isPending ? "Menyimpan..." : "Simpan Member Baru"}
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
                  Perbarui profil member {editingMember.nama_member}
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
                    value={editingMember.nama_member}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, nama_member: e.target.value })
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
                    value={editingMember.username ?? ""}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        username: e.target.value,
                      })
                    }
                    placeholder="budi.member"
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
                      setEditingMember({ ...editingMember, instansi: e.target.value })
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
                    value={editingMember.telp}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, telp: e.target.value })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Baru (opsional) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan bila tidak diubah"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
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
                    setEditingMember({ ...editingMember, alamat: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-[#111827] focus:bg-white focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20 focus:outline-none"
                />
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
                  disabled={updateMember.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white font-bold shadow-md cursor-pointer transition-transform active:scale-98 disabled:opacity-60 disabled:cursor-wait"
                >
                  {updateMember.isPending ? "Menyimpan..." : "Simpan Perubahan"}
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
                {deletingMember.nama_member}
              </strong>{" "}
              ({deletingMember.username ?? "—"}) dari direktori? Akun dan data member terkait akan dihapus.
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
                disabled={deleteMember.isPending}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer text-xs disabled:opacity-60 disabled:cursor-wait"
              >
                {deleteMember.isPending ? "Menghapus..." : "Ya, Hapus Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
