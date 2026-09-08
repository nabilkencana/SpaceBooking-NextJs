"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Armchair,
  BarChart3,
  Building2,
  CalendarCheck,
  ImagePlus,
  Layers,
  LayoutGrid,
  Loader2,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminSpaces,
  useCreateSpace,
  useDeleteSpace,
  usePendingCount,
  useUpdateSpace,
  useUploadSpaceFoto,
  type CreateSpacePayload,
} from "@/hooks/useAdmin";
import { apiClient } from "@/lib/api-client";
import { ApiError, ApiRequestError, unwrapApi } from "@/lib/api";
import AdminPageTransition from "@/components/admin/AdminPageTransition";
import { CountUp } from "@/hooks/useCountUp";
import { SPACE_TYPE_LABELS, type Space, type SpaceType } from "@/types";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
interface SpaceTypeOption {
  tipe: SpaceType;
  label: string;
}

interface SpaceFormState {
  nama_space: string;
  tipe: SpaceType;
  zona_lantai: string;
  harga_per_jam: string;
  kapasitas: string;
  wifi_speed: string;
  ukuran_m2: string;
  badge: string;
  deskripsi: string;
  amenities: string[];
  photos: string[];
  is_available: boolean;
}

// Field sisi klien; backend belum punya kolom is_available (lihat issues.md) —
// dikirim apa adanya agar otomatis aktif saat kolom ditambahkan.
type SpaceSubmitPayload = CreateSpacePayload & { is_available?: boolean };

const EMPTY_FORM: SpaceFormState = {
  nama_space: "",
  tipe: "desk",
  zona_lantai: "",
  harga_per_jam: "20000",
  kapasitas: "1",
  wifi_speed: "",
  ukuran_m2: "",
  badge: "",
  deskripsi: "",
  amenities: [],
  photos: [],
  is_available: true,
};

/** Backend 4xx envelopes arrive as AxiosError via the BFF proxy. */
function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
  }
  if (err instanceof ApiRequestError) return err.message;
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // ─── LIVE DATA ───────────────────────────────────────────────────────────────
  const spacesQuery = useAdminSpaces();
  const spaces = useMemo(() => spacesQuery.data ?? [], [spacesQuery.data]);
  const pendingCount = usePendingCount();

  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace();
  const deleteSpace = useDeleteSpace();
  const uploadFoto = useUploadSpaceFoto();

  // Opsi tipe dari GET /spaces/types (diambil sekali; fallback statis saat gagal)
  const typeOptionsQuery = useQuery({
    queryKey: ["spaces", "types"],
    queryFn: async () => {
      const { data } = await apiClient.get("/spaces/types");
      return unwrapApi<SpaceTypeOption[]>({ data });
    },
    staleTime: Infinity,
  });
  const typeOptions: SpaceTypeOption[] =
    typeOptionsQuery.data ??
    (Object.entries(SPACE_TYPE_LABELS) as [SpaceType, string][]).map(
      ([tipe, label]) => ({ tipe, label })
    );

  // State operasional
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"Semua Tipe" | SpaceType>(
    "Semua Tipe"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form state create/edit
  const [form, setForm] = useState<SpaceFormState>(EMPTY_FORM);
  const [amenityInput, setAmenityInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [firstFotoName, setFirstFotoName] = useState<string | null>(null);

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

  // ─── DERIVED METRICS (LIVE) ──────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts: Record<SpaceType, number> = {
      desk: 0,
      meeting_room: 0,
      private_office: 0,
      focus_pod: 0,
    };
    for (const space of spaces) counts[space.tipe] += 1;
    return counts;
  }, [spaces]);

  const totalKapasitas = useMemo(
    () => spaces.reduce((sum, space) => sum + space.kapasitas, 0),
    [spaces]
  );

  const rataRataTarif = useMemo(
    () =>
      spaces.length
        ? Math.round(
            spaces.reduce((sum, space) => sum + space.harga_per_jam, 0) /
              spaces.length
          )
        : 0,
    [spaces]
  );

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
        return [item.nama_space, item.zona_lantai, item.deskripsi, item.badge]
          .some((v) => v?.toLowerCase().includes(q));
      }

      return true;
    });
  }, [spaces, selectedType, searchQuery]);

  const typeLabel = (tipe: SpaceType) => SPACE_TYPE_LABELS[tipe] ?? tipe;

  // ─── MODAL HELPERS ───────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingSpace(null);
    setForm(EMPTY_FORM);
    setFirstFotoName(null);
    setAmenityInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (space: Space) => {
    setEditingSpace(space);
    const livePhotos = (space.photos ?? []).filter(Boolean);
    setForm({
      nama_space: space.nama_space,
      tipe: space.tipe,
      zona_lantai: space.zona_lantai ?? "",
      harga_per_jam: String(space.harga_per_jam),
      kapasitas: String(space.kapasitas),
      wifi_speed: space.wifi_speed != null ? String(space.wifi_speed) : "",
      // ukuran_m2 tiba sebagai string desimal PG — Number() untuk tampilan
      ukuran_m2:
        space.ukuran_m2 != null && space.ukuran_m2 !== ""
          ? String(Number(space.ukuran_m2))
          : "",
      badge: space.badge ?? "",
      deskripsi: space.deskripsi,
      amenities: (space.amenities ?? []).filter(
        (a): a is string => Boolean(a)
      ),
      photos:
        livePhotos.length > 0
          ? livePhotos
          : space.foto_url
            ? [space.foto_url]
            : [],
      is_available: true,
    });
    setFirstFotoName(null);
    setAmenityInput("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSpace(null);
    setForm(EMPTY_FORM);
    setFirstFotoName(null);
    setAmenityInput("");
  };

  const addAmenity = () => {
    const value = amenityInput.trim();
    if (!value) return;
    if (!form.amenities.some((a) => a.toLowerCase() === value.toLowerCase())) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, value] }));
    }
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  // Upload multi-foto via POST /upload/spaces (BFF proxy, field "file")
  // → path storage /storage/spaces/<filename> masuk photos[], nama file pertama
  //   menjadi fallback kolom foto.
  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const filename = await uploadFoto.mutateAsync(file);
        const path = `/storage/spaces/${filename}`;
        setFirstFotoName((prev) => prev ?? filename);
        setForm((prev) => ({ ...prev, photos: [...prev.photos, path] }));
      }
      toast.success("Foto berhasil diunggah");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // ─── HANDLER SIMPAN (CREATE / EDIT) ──────────────────────────────────────────
  const handleSpaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_space.trim()) {
      toast.error("Nama ruangan/meja wajib diisi!");
      return;
    }
    if (!form.deskripsi.trim()) {
      toast.error("Deskripsi wajib diisi");
      return;
    }

    const payload: SpaceSubmitPayload = {
      nama_space: form.nama_space.trim(),
      tipe: form.tipe,
      harga_per_jam: Math.round(Number(form.harga_per_jam)) || 0,
      kapasitas: Math.round(Number(form.kapasitas)) || 1,
      deskripsi: form.deskripsi.trim(),
      zona_lantai: form.zona_lantai.trim() || null,
      wifi_speed: form.wifi_speed ? Number(form.wifi_speed) : null,
      ukuran_m2: form.ukuran_m2 ? Number(form.ukuran_m2) : null,
      badge: form.badge.trim() || null,
      amenities: form.amenities.length ? form.amenities : undefined,
      photos: form.photos.length ? form.photos : undefined,
      is_available: form.is_available,
      ...(!editingSpace && firstFotoName ? { foto: firstFotoName } : {}),
    };

    const onSuccess = (saved: Space) => {
      toast.success(
        editingSpace
          ? `Data ${saved.nama_space} berhasil diperbarui!`
          : `Unit ${saved.nama_space} berhasil ditambahkan ke inventaris!`
      );
      closeModal();
    };
    const onError = (err: unknown) => toast.error(getApiErrorMessage(err));

    if (editingSpace) {
      updateSpace.mutate(
        { id: editingSpace.id, ...payload },
        { onSuccess, onError }
      );
    } else {
      createSpace.mutate(payload, { onSuccess, onError });
    }
  };

  // ─── HANDLER HAPUS (confirm + pesan 400 backend verbatim) ────────────────────
  const handleDeleteSpace = (space: Space) => {
    if (
      !window.confirm(
        `Hapus "${space.nama_space}" dari inventaris? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }
    deleteSpace.mutate(space.id, {
      onSuccess: () => toast.success("Space berhasil dihapus dari inventaris!"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isSaving = createSpace.isPending || updateSpace.isPending;

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
            <span className="bg-[#FFD500] text-[#111827] font-bold text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center shrink-0">
              {pendingCount.data ?? 0}
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
            onClick={openCreateModal}
            className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Ruang Baru</span>
          </button>
        </div>

        {/* ─── 4. METRIC SUMMARY CARDS (GRID 3 KOLOM, DATA LIVE) ─────────────── */}
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
                <CountUp target={spaces.length} suffix=" Unit Terdaftar" />
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              {typeCounts.desk} Personal Desk • {typeCounts.meeting_room} Meeting
              Room • {typeCounts.private_office} Office • {typeCounts.focus_pod}{" "}
              Focus Pod
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
                <CountUp target={totalKapasitas} suffix=" Orang" />
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Daya tampung simultan seluruh area
            </p>
          </div>

          {/* Kartu 3: Tarif Rata-rata (Canary Yellow Signature Card) */}
          <div className="admin-kpi-card bg-[#FFD500] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
            <div>
              <div className="flex items-center justify-between text-[#111827]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#111827]/80">
                  TARIF RATA-RATA SAAT INI
                </span>
                <div className="w-7 h-7 rounded-lg bg-black/10 text-[#111827] flex items-center justify-center">
                  <Armchair className="w-3.5 h-3.5" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight my-3">
                <CountUp target={rataRataTarif} prefix="Rp " suffix="/jam" />
              </h2>
            </div>
            <p className="text-xs font-semibold text-[#111827]/90">
              Rata-rata tarif {spaces.length} unit terdaftar
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

          {/* Filter Segmented Pills (Sisi Kanan, hitungan live) */}
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
              Semua Tipe ({spaces.length})
            </button>
            {typeOptions.map((option) => (
              <button
                key={option.tipe}
                type="button"
                onClick={() => setSelectedType(option.tipe)}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                  selectedType === option.tipe
                    ? "bg-[#111827] text-white font-bold shadow-xs"
                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-medium"
                }`}
              >
                {option.label} ({typeCounts[option.tipe]})
              </button>
            ))}
          </div>
        </div>

        {/* ─── 6. TABEL INVENTARIS: DAFTAR RUANG & MEJA KERJA ────────────────── */}
        <div className="w-full bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
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
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-4">
                    STATUS
                  </th>
                  <th className="text-[10px] font-bold text-gray-400 uppercase tracking-wider py-4 px-6 text-right">
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spacesQuery.isPending ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={7} className="py-5 px-6">
                        <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : spacesQuery.isError ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <p className="text-xs text-red-500 font-semibold">
                        {getApiErrorMessage(spacesQuery.error)}
                      </p>
                      <button
                        type="button"
                        onClick={() => spacesQuery.refetch()}
                        className="mt-3 text-xs font-bold text-[#5E43F3] hover:text-[#4A32D6] cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </td>
                  </tr>
                ) : filteredSpaces.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-xs text-gray-400 font-medium"
                    >
                      {spaces.length === 0
                        ? "Belum ada unit ruang kerja terdaftar. Tambahkan unit pertama Anda."
                        : `Tidak ada ruang kerja yang cocok dengan kata kunci "${searchQuery}".`}
                    </td>
                  </tr>
                ) : (
                  filteredSpaces.map((item) => (
                    <tr
                      key={item.id}
                      className="admin-table-row hover:bg-gray-50/60 transition-colors"
                    >
                      {/* 1. SPACE / RUANGAN */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 relative">
                            {item.photos?.[0] || item.foto_url ? (
                              <img
                                src={(item.photos?.[0] ?? item.foto_url) as string}
                                alt={item.nama_space}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Armchair className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#111827] block leading-tight">
                              {item.nama_space}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                              {item.zona_lantai ?? "Tanpa zona"}
                            </span>
                            {(item.ukuran_m2 != null && item.ukuran_m2 !== "") ||
                            item.wifi_speed != null ? (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                {item.ukuran_m2 != null && item.ukuran_m2 !== ""
                                  ? `${Number(item.ukuran_m2)} m²`
                                  : null}
                                {item.ukuran_m2 != null &&
                                item.ukuran_m2 !== "" &&
                                item.wifi_speed != null
                                  ? " • "
                                  : null}
                                {item.wifi_speed != null
                                  ? `WiFi ${item.wifi_speed} Mbps`
                                  : null}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 2. TIPE UNIT */}
                      <td className="py-4 px-4 align-middle text-xs text-gray-600 font-medium">
                        {typeLabel(item.tipe)}
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
                          Rp {item.harga_per_jam.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-sans">
                          /jam
                        </span>
                      </td>

                      {/* 5. FASILITAS UTAMA */}
                      <td className="py-4 px-4 align-middle text-xs text-gray-500 max-w-xs truncate">
                        {item.amenities?.filter(Boolean).join(", ") || "—"}
                      </td>

                      {/* 6. STATUS (badge / ketersediaan) */}
                      <td className="py-4 px-4 align-middle whitespace-nowrap">
                        {item.badge ? (
                          <span className="inline-flex items-center bg-[#FFD500]/25 text-[#8a6d00] text-[10px] font-bold px-2.5 py-1 rounded-full">
                            {item.badge}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 font-medium">
                            —
                          </span>
                        )}
                      </td>

                      {/* 7. AKSI */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg text-gray-500 hover:text-[#5E43F3] hover:bg-[#5E43F3]/10 transition-colors cursor-pointer"
                            aria-label={`Edit ${item.nama_space}`}
                            title="Edit unit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpace(item)}
                            disabled={deleteSpace.isPending && deleteSpace.variables === item.id}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Hapus ${item.nama_space}`}
                            title="Hapus unit"
                          >
                            {deleteSpace.isPending && deleteSpace.variables === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── 7. RINGKASAN TABEL (DATA LIVE) ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 text-xs text-gray-500 gap-3">
            <div>
              Menampilkan{" "}
              <span className="font-semibold text-gray-900">
                {filteredSpaces.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900">
                {spaces.length}
              </span>{" "}
              unit ruang kerja
            </div>
            {spacesQuery.isFetching && (
              <div className="flex items-center gap-1.5 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memperbarui data…</span>
              </div>
            )}
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

      {/* ─── MODAL: TAMBAH / EDIT RUANG BARU ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div>
                <h3 className="font-extrabold text-lg text-[#111827]">
                  {editingSpace
                    ? `Edit Ruang: ${editingSpace.nama_space}`
                    : "Tambah Ruang / Meja Baru"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Masukkan data unit workstation ke dalam inventaris operasional.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSpaceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nama Ruang / Nomor Meja:
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_space}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nama_space: e.target.value }))
                  }
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
                    value={form.tipe}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        tipe: e.target.value as SpaceType,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#5E43F3]"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.tipe} value={option.tipe}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Lokasi / Lantai / Zona:
                  </label>
                  <input
                    type="text"
                    value={form.zona_lantai}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        zona_lantai: e.target.value,
                      }))
                    }
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
                    required
                    value={form.kapasitas}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, kapasitas: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tarif Sewa (Rp / Jam):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={form.harga_per_jam}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        harga_per_jam: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kecepatan WiFi (Mbps):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.wifi_speed}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        wifi_speed: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 150"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Ukuran Ruang (m²):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.ukuran_m2}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ukuran_m2: e.target.value,
                      }))
                    }
                    placeholder="Contoh: 40"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Badge Promosi (opsional):
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={form.badge}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, badge: e.target.value }))
                  }
                  placeholder="Contoh: BARU atau Diskon 20% Member"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Deskripsi:
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, deskripsi: e.target.value }))
                  }
                  placeholder="Contoh: Meja kerja individual dengan colokan listrik dan WiFi kencang."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3] resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Fasilitas (Enter untuk menambah):
                </label>
                {form.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.amenities.map((amenity, index) => (
                      <span
                        key={`${amenity}-${index}`}
                        className="inline-flex items-center gap-1 bg-[#5E43F3]/10 text-[#4A32D6] text-[10px] font-bold px-2.5 py-1 rounded-full"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="hover:text-red-600 cursor-pointer"
                          aria-label={`Hapus fasilitas ${amenity}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  placeholder="Contoh: WiFi 100Mbps, Stopkontak Mandiri"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#5E43F3]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Foto Galeri (bisa pilih beberapa sekaligus):
                </label>
                <div className="flex flex-wrap gap-2">
                  {form.photos.map((photo, index) => (
                    <div
                      key={`${photo}-${index}`}
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group"
                    >
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors cursor-pointer"
                        aria-label={`Hapus foto ${index + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label
                    className={`w-14 h-14 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#5E43F3] hover:text-[#5E43F3] ${
                      isUploading ? "opacity-60" : "cursor-pointer"
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={isUploading}
                      onChange={(e) => {
                        handlePhotoFiles(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  JPG/PNG/WebP maksimal 2MB per foto.
                </p>
              </div>

              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-3">
                <div>
                  <span className="block font-bold text-gray-700">
                    Status Ketersediaan
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {form.is_available
                      ? "Unit tampil sebagai tersedia"
                      : "Unit dinonaktifkan dari ketersediaan"}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_available}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      is_available: !prev.is_available,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 cursor-pointer ${
                    form.is_available ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.is_available ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex-1 py-3 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSpace
                    ? "Simpan Perubahan Unit"
                    : "Simpan Unit ke Inventaris"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
