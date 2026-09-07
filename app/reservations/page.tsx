"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Calendar,
  Clock,
  Filter,
  Info,
  CalendarCheck,
  QrCode,
  ArrowRight,
  ArrowDown,
  RotateCcw,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { MotionFooter } from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { RequireAuth } from "@/hooks/useAuth";
import { useMyHistory, useCancelReservation } from "@/hooks/useReservasi";
import type {
  HistoryItem,
  ReservasiStatus,
  PaymentStatus,
} from "@/types";

// ─── CONTRACT ────────────────────────────────────────────────────────────────
// GET /reservasi/my/history (ReservasiController::history) returns:
// { month, year, total_reservasi, total_pengeluaran, items: HistoryItem[] }
// - total_reservasi & total_pengeluaran are SERVER aggregates (used as-is).
// - total_jam is NOT provided by the endpoint → client-summed from items.
// - payment_status is NOT exposed on history items → typed optional; the chip
//   renders as soon as the resource adds it.

type HistoryItemWithPayment = HistoryItem & { payment_status?: PaymentStatus };

const STATUS_META: Record<ReservasiStatus, { label: string; className: string }> = {
  belum_dikonfirm: {
    label: "Menunggu Konfirmasi",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  disetujui: {
    label: "Disetujui",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  aktif: {
    label: "Aktif / Digunakan",
    className: "bg-[#5E43F3]/10 text-[#5E43F3] border-[#5E43F3]/20",
  },
  selesai: {
    label: "Selesai",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  dibatalkan: {
    label: "Dibatalkan",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Lunas",
  unpaid: "Belum Bayar",
  refunded: "Dana Kembali",
};

// Transisi yang diizinkan state machine: belum_dikonfirm/disetujui → dibatalkan
const CANCELLABLE_STATUS: ReservasiStatus[] = ["belum_dikonfirm", "disetujui"];

const MONTHS = [
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

const YEARS = [2024, 2025, 2026, 2027];

const formatRupiah = (val: number) => "Rp " + val.toLocaleString("id-ID");

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const formatTanggal = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDurasiLabel = (item: HistoryItem) =>
  `${item.jam_mulai} – ${item.jam_selesai} (${item.durasi_jam} Jam)`;

const getInitials = (name: string) => {
  const parts = name.split(/[\s—–-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
};

// ─── SKELETONS ───────────────────────────────────────────────────────────────

function MetricSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-2xs min-h-[160px] animate-pulse">
      <div className="h-2.5 w-32 rounded-full bg-gray-100" />
      <div className="mt-6 h-8 w-44 rounded-lg bg-gray-100" />
      <div className="mt-4 h-2.5 w-28 rounded-full bg-gray-100" />
    </div>
  );
}

function ReservationRowSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-pulse">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 shrink-0" />
        <div className="space-y-2.5">
          <div className="h-5 w-56 rounded-md bg-gray-100" />
          <div className="h-3 w-40 rounded-full bg-gray-100" />
          <div className="h-3 w-52 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="space-y-2.5 md:text-right">
        <div className="h-7 w-32 rounded-md bg-gray-100" />
        <div className="h-3 w-20 rounded-full bg-gray-100 ml-auto" />
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function MemberReservationsDashboardPage() {
  return (
    <RequireAuth>
      <MemberReservationsDashboardContent />
    </RequireAuth>
  );
}

function MemberReservationsDashboardContent() {
  const now = new Date();
  const initialMonth = now.getMonth() + 1;
  const initialYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // Two-stage smooth scroll state (Tertahan dulu di page reservasi, scroll kedua kalinya baru ke footer)
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [footerUnlocked, setFooterUnlocked] = useState(false);

  // DOM Refs
  const reservationWrapperRef = useRef<HTMLDivElement>(null);

  // Mutable refs for high-frequency scroll / wheel listeners
  const isAtBottomRef = useRef(false);
  isAtBottomRef.current = isAtBottom;

  const footerUnlockedRef = useRef(false);
  footerUnlockedRef.current = footerUnlocked;

  const canTriggerSecondScrollRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const historyQuery = useMyHistory(selectedMonth, selectedYear);
  const cancelReservation = useCancelReservation();

  // Hitung posisi mentok konten dashboard reservasi (di mana bagian bawah konten reservasi terlihat penuh di viewport)
  const getReservationStopPosition = () => {
    if (!reservationWrapperRef.current) return 0;
    const rect = reservationWrapperRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const contentBottom = scrollY + rect.bottom;
    return Math.max(0, contentBottom - window.innerHeight);
  };

  // ─── TWO-STAGE SMOOTH SCROLL (TERTAHAN DULU DI PAGE RESERVASI, SCROLL KEDUA BARU KE FOOTER) ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Scroll Listener: Menjaga agar scroll mentok di batas konten reservasi dan tidak langsung bablas
    const handleScroll = () => {
      const stopPos = getReservationStopPosition();
      const currentY = window.scrollY || window.pageYOffset;

      if (currentY >= stopPos - 10) {
        if (!isAtBottomRef.current) {
          setIsAtBottom(true);
        }

        // Jika footer belum di-unlock oleh scroll kedua, tahan scroll di stopPos secara halus
        if (!footerUnlockedRef.current && currentY > stopPos + 2) {
          const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
          if (lenis) {
            lenis.scrollTo(stopPos, { immediate: true });
          } else {
            window.scrollTo({ top: stopPos });
          }
        }
      } else {
        if (isAtBottomRef.current) {
          setIsAtBottom(false);
        }

        // Jika user scroll kembali naik ke atas, kunci kembali footer
        if (currentY < stopPos - 80 && footerUnlockedRef.current) {
          setFooterUnlocked(false);
          canTriggerSecondScrollRef.current = false;
        }
      }
    };

    // 2. Wheel Listener: Mendeteksi gesture scroll kedua kalinya untuk meluncur ke footer
    const handleWheel = (e: WheelEvent) => {
      const stopPos = getReservationStopPosition();
      const currentY = window.scrollY || window.pageYOffset;

      // Saat sedang berada di posisi mentok bawah halaman reservasi
      if (currentY >= stopPos - 15 && !footerUnlockedRef.current) {
        // Jika scroll KE BAWAH
        if (e.deltaY > 0) {
          if (canTriggerSecondScrollRef.current) {
            // SCROLL KEDUA TERDETEKSI: Buka footer secara mulus!
            setFooterUnlocked(true);
            canTriggerSecondScrollRef.current = false;

            const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
            if (lenis) {
              lenis.scrollTo("#reservation-footer-section", {
                duration: 1.15,
                ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              });
            } else {
              document
                .getElementById("reservation-footer-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }
          } else {
            // Mencegah bablas pada scroll pertama
            e.preventDefault();

            // Aktifkan kesiapan scroll kedua setelah jeda singkat (cooldown jeda gesture)
            if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
            wheelIdleTimerRef.current = setTimeout(() => {
              canTriggerSecondScrollRef.current = true;
            }, 160);
          }
        }
      }
    };

    // 3. Touch Handling (Mobile / Trackpad swipe gestures)
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const stopPos = getReservationStopPosition();
      const currentY = window.scrollY || window.pageYOffset;
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (currentY >= stopPos - 15 && !footerUnlockedRef.current && deltaY > 15) {
        if (canTriggerSecondScrollRef.current) {
          setFooterUnlocked(true);
          canTriggerSecondScrollRef.current = false;

          const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
          if (lenis) {
            lenis.scrollTo("#reservation-footer-section", { duration: 1.1 });
          } else {
            document
              .getElementById("reservation-footer-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }
        } else {
          canTriggerSecondScrollRef.current = true;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: false });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
    };
  }, []);

  const handleScrollToFooter = () => {
    setFooterUnlocked(true);
    const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
    if (lenis) {
      lenis.scrollTo("#reservation-footer-section", {
        duration: 1.15,
        ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      document
        .getElementById("reservation-footer-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancel = (item: HistoryItemWithPayment) => {
    cancelReservation.mutate(item.id, {
      onSuccess: () => {
        toast.success(`Reservasi ${item.kode_booking} berhasil dibatalkan.`);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal membatalkan reservasi."
        );
      },
    });
  };

  const data = historyQuery.data;
  // Cast di boundary: backend history belum mengirim payment_status (opsional di tipe lokal).
  const items = (data?.items ?? []) as HistoryItemWithPayment[];

  // Agregat dari SERVER (total_reservasi & total_pengeluaran) — tanpa kalkulasi ulang klien
  const totalSesi = data?.total_reservasi ?? 0;
  const totalPengeluaran = data?.total_pengeluaran ?? 0;

  // Endpoint tidak menyediakan total_jam → satu-satunya agregat yang dijumlahkan klien
  const totalDurasiJam = items.reduce((acc, curr) => acc + curr.durasi_jam, 0);

  const uniqueLocations = new Set(items.map((r) => r.space_name)).size;
  const averageHoursPerSession =
    totalSesi === 0 ? 0 : Math.round(totalDurasiJam / totalSesi);

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = [
      "No. Referensi",
      "Nama Ruang",
      "Tanggal",
      "Durasi",
      "Total Biaya",
      "Status",
    ];

    const rows = items.map((item) => [
      `"${item.kode_booking}"`,
      `"${item.space_name}"`,
      `"${formatTanggal(item.tanggal_reservasi)}"`,
      `"${formatDurasiLabel(item)}"`,
      `"${item.total_bayar}"`,
      `"${STATUS_META[item.status].label}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join(
      "\r\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rekap-reservasi-urspace-${MONTHS[selectedMonth - 1].toLowerCase()}-${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `Rekap transaksi periode ${MONTHS[selectedMonth - 1]} ${selectedYear} berhasil diekspor (.csv)`
    );
  };

  const isError = historyQuery.isError;
  const isLoading = historyQuery.isLoading;
  const errorMessage =
    historyQuery.error instanceof Error
      ? historyQuery.error.message
      : "Terjadi kesalahan yang tidak diketahui.";

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111827] flex flex-col font-sans selection:bg-[#5E43F3] selection:text-white">
      <SmoothScroll />

      {/* ─── 1. RESERVATION PAGE WRAPPER (MENTOK DULU DI SINI SEBELUM FOOTER) ──── */}
      <div
        ref={reservationWrapperRef}
        id="reservation-page-wrapper"
        className="relative z-10 bg-[#FAFAFA] shadow-[0_20px_50px_rgba(0,0,0,0.08)] min-h-screen flex flex-col justify-between"
      >
        {/* ─── GLOBAL HEADER ───────────────────────────────────────────────── */}
        <GlobalHeader isLoggedIn={true} />

        {/* ─── 2. MAIN DASHBOARD CONTENT AREA ───────────────────────────────── */}
        <main className="flex-1 w-full bg-[#FDFBF7]/60 py-10 sm:py-12">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 space-y-8">

          {/* A. ACTION BAR (TOMBOL EKSPOR REKAP BULANAN) */}
          <div className="flex items-center justify-end w-full mb-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={items.length === 0}
              className="text-xs font-semibold text-gray-700 bg-white border border-[#E5E7EB] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Ekspor Rekap Bulanan</span>
            </button>
          </div>

          {isError ? (
            /* ─── ERROR STATE DENGAN RETRY ─── */
            <div className="w-full bg-white rounded-3xl border border-dashed border-red-200 p-10 sm:p-14 text-center max-w-xl mx-auto flex flex-col items-center justify-center shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 mb-4 border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-400 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Gagal memuat riwayat reservasi
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => historyQuery.refetch()}
                className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-6 py-3 rounded-full mt-6 transition-all shadow-sm active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : (
            <>
          {/* B. METRIC SUMMARY CARDS (GRID 3 KOLOM) — AGREGAT DARI SERVER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {isLoading ? (
              <>
                <MetricSkeletonCard />
                <MetricSkeletonCard />
                <MetricSkeletonCard />
              </>
            ) : (
              <>
            {/* Kartu 1: Urspace Yellow Signature Card */}
            <div className="bg-[#FFD500] rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xs flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-[#111827]/70 uppercase">
                  TOTAL SESI BULAN INI
                </span>
                <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center text-[#111827]">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-3xl sm:text-4xl font-black text-[#111827] tracking-tight font-sans">
                  {totalSesi > 0 ? `${totalSesi} Sesi` : "0 Sesi"}
                </div>
                <p className="text-xs font-semibold text-[#111827]/80 mt-3">
                  • Tersebar di {uniqueLocations > 0 ? uniqueLocations : 0} lokasi berbeda
                </p>
              </div>
            </div>

            {/* Kartu 2: Total Pengeluaran Bulanan */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-2xs flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                  TOTAL PENGELUARAN BULANAN
                </span>
                <button
                  type="button"
                  title="Informasi kalkulasi pengeluaran"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] font-mono tracking-tight">
                  {formatRupiah(totalPengeluaran)}
                </div>
                <div className="text-xs font-medium text-gray-400 mt-3">
                  • Sudah termasuk potongan promo & biaya layanan
                </div>
              </div>
            </div>

            {/* Kartu 3: Akumulasi Durasi Kerja */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] shadow-2xs flex flex-col justify-between min-h-[160px]">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                  AKUMULASI DURASI KERJA
                </span>
                <div className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                  <Clock className="w-3 h-3" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                  {totalDurasiJam} Jam
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  • Rata-rata {averageHoursPerSession} jam per sesi
                </p>
              </div>
            </div>
              </>
            )}
          </div>

          {/* C. PERIOD FILTER BAR (REFETCH OTOMATIS VIA QUERY KEY ?month=&year=) */}
          <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-wrap items-center gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-gray-400 mr-2">
              <Filter className="w-3.5 h-3.5 text-[#5E43F3]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                PERIODE:
              </span>
            </div>

            {/* Dropdown Bulan */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-semibold text-gray-800 bg-gray-50/70 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#5E43F3] cursor-pointer transition-colors"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Tahun */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-semibold text-gray-800 bg-gray-50/70 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#5E43F3] cursor-pointer transition-colors"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reset ke bulan berjalan */}
            {(selectedMonth !== initialMonth || selectedYear !== initialYear) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(initialMonth);
                  setSelectedYear(initialYear);
                }}
                className="ml-auto text-xs text-[#5E43F3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Bulan Ini</span>
              </button>
            )}
          </div>

          {/* D. HEADING SEKSI TRANSAKSI */}
          <div className="flex items-center justify-between text-xs pt-2">
            <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              DAFTAR RESERVASI PERIODE INI
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              Menampilkan {items.length} transaksi
            </span>
          </div>

          {/* E. LIST KARTU RESERVASI */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <ReservationRowSkeleton />
                <ReservationRowSkeleton />
                <ReservationRowSkeleton />
              </>
            ) : items.length > 0 ? (
              items.map((item) => {
                const cancellable = CANCELLABLE_STATUS.includes(item.status);
                const isCancelling =
                  cancelReservation.isPending &&
                  cancelReservation.variables === item.id;
                const statusMeta = STATUS_META[item.status];

                // TIPE 2: SESI AKTIF / DIGUNAKAN (HIGHLIGHTED BORDER #FFD500 + QR)
                if (item.status === "aktif") {
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border-2 border-[#FFD500] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-md relative group transition-all"
                    >
                      <HistoryItemInfo item={item} />

                      {/* Sisi Kanan: Status & Tombol Aksi QR Masuk */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 gap-4">
                        <div className="text-left md:text-right">
                          <StatusBadge meta={statusMeta} />
                          <div className="text-lg sm:text-xl font-extrabold font-mono text-[#111827] mt-2">
                            {formatRupiah(item.total_bayar)}
                          </div>
                          <PaymentChip paymentStatus={item.payment_status} />
                        </div>

                        <Link
                          href={`/reservations/${item.id}/ticket`}
                          className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Tampilkan Kode Masuk QR</span>
                        </Link>
                      </div>
                    </div>
                  );
                }

                // TIPE 1 & 3: STANDAR RIWAYAT / SELESAI (+ AKSI BATALKAN)
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-gray-300 transition-all shadow-2xs group"
                  >
                    <HistoryItemInfo item={item} />

                    {/* Sisi Kanan: Pembayaran, Status Lencana & Aksi */}
                    <div className="text-left md:text-right w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <div className="flex md:justify-end">
                        <StatusBadge meta={statusMeta} />
                      </div>
                      <div className="text-lg sm:text-xl font-extrabold font-mono text-[#111827] mt-2">
                        {formatRupiah(item.total_bayar)}
                      </div>
                      <div className="flex md:justify-end mt-1">
                        <PaymentChip paymentStatus={item.payment_status} />
                      </div>

                      {cancellable && (
                        <button
                          type="button"
                          onClick={() => handleCancel(item)}
                          disabled={isCancelling}
                          className="mt-3 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isCancelling ? "Membatalkan..." : "Batalkan"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* DYNAMIC FALLBACK EMPTY STATE (JIKA PERIODE TERSEBUT 0 HASIL) */
              <div className="w-full bg-white rounded-3xl border border-dashed border-gray-200 p-10 sm:p-14 text-center max-w-xl mx-auto flex flex-col items-center justify-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
                  <Calendar className="w-5 h-5 text-gray-400 stroke-[1.75]" />
                </div>
                <h3 className="text-lg font-bold text-[#111827]">
                  Tidak ada riwayat pemesanan di bulan ini
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                  Anda belum memesan ruangan atau meja kerja pada periode{" "}
                  <span className="font-semibold text-gray-700">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </span>
                  . Mulai eksplorasi dan amankan ruang kerja ternyaman Anda.
                </p>
                <Link
                  href="/spaces"
                  className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-6 py-3 rounded-full mt-6 transition-all shadow-sm active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Eksplorasi Ruang Kerja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
            </>
          )}

          {/* ─── FOOTER REVEAL HINT PILL (PETUNJUK KETIKA MENTOK DI BAWAH) ─── */}
          <div className="mt-12 flex flex-col items-center justify-center pb-4">
            <button
              type="button"
              onClick={handleScrollToFooter}
              className={`group px-5 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs ${
                isAtBottom && !footerUnlocked
                  ? "bg-white border-[#5E43F3] text-[#5E43F3] shadow-md shadow-[#5E43F3]/10 scale-105"
                  : "bg-white/80 border-gray-200 text-gray-500 hover:text-black hover:bg-white"
              }`}
            >
              <span>
                {isAtBottom && !footerUnlocked
                  ? "Gulir sekali lagi untuk membuka footer"
                  : "Gulir ke bawah untuk footer"}
              </span>
              <ArrowDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isAtBottom && !footerUnlocked
                    ? "text-[#5E43F3] animate-bounce"
                    : "text-gray-400 group-hover:translate-y-0.5"
                }`}
              />
            </button>
          </div>

        </div>
      </main>
      </div>

      {/* ─── 3. LIVE-DATA MASTER FOOTER ───────────────────────────────────── */}
      <div id="reservation-footer-section">
        <MotionFooter />
      </div>
    </div>
  );
}

// ─── PAGE-LOCAL ROW SUBCOMPONENTS ────────────────────────────────────────────

function HistoryItemInfo({ item }: { item: HistoryItemWithPayment }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
      {/* Thumbnail inisial space (endpoint riwayat tidak menyertakan foto) */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#F3F0FF] border border-[#5E43F3]/10 flex items-center justify-center shrink-0">
        <span className="text-xl sm:text-2xl font-black text-[#5E43F3] tracking-tight">
          {getInitials(item.space_name)}
        </span>
      </div>

      {/* Metadata Info */}
      <div>
        {/* Booking Ref Monospace Pill */}
        <div className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
          {item.kode_booking}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
          {item.space_name}
        </h3>

        <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatTanggal(item.tanggal_reservasi)}</span>
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{formatDurasiLabel(item)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  meta,
}: {
  meta: { label: string; className: string };
}) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function PaymentChip({
  paymentStatus,
}: {
  paymentStatus: PaymentStatus | undefined;
}) {
  // Backend history endpoint belum mengekspos payment_status — chip muncul otomatis begitu resource menambahkannya.
  if (!paymentStatus) return null;
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-200">
      {PAYMENT_LABELS[paymentStatus]}
    </span>
  );
}
