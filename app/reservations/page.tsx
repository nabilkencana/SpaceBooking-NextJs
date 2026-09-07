"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Calendar,
  Clock,
  MapPin,
  Filter,
  Info,
  ArrowUpRight,
  CalendarCheck,
  QrCode,
  ArrowRight,
  ArrowDown,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import MotionFooter from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────────
export interface ReservationItem {
  id: string;
  bookingRef: string;
  namaRuang: string;
  tipeBadge: "Desk" | "Meeting" | "Pod";
  lokasi: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  durasiJam: number;
  durasiLabel: string;
  hargaTotal: number;
  metodeBayar: string;
  status: "lunas" | "turnstile_aktif" | "selesai";
  statusLabel: string;
  bulan: string; // e.g. "Agustus"
  tahun: string; // e.g. "2026"
  fotoUrl: string;
  ticketUrl: string;
}

// ─── MOCK DATA (PERSISTENT EDITORIAL REFERENCE) ──────────────────────────────────
const RESERVATIONS_DATA: ReservationItem[] = [
  {
    id: "12",
    bookingRef: "BOOK-20260830-0012",
    namaRuang: "Personal Desk — Flexi 01",
    tipeBadge: "Desk",
    lokasi: "Moklet Hub Coworking Space, Canggu",
    tanggal: "Minggu, 30 Agustus 2026",
    jamMulai: "09:00",
    jamSelesai: "12:00",
    durasiJam: 3,
    durasiLabel: "09:00 – 12:00 WITA (3 Jam)",
    hargaTotal: 48000,
    metodeBayar: "QRIS (Instan)",
    status: "lunas",
    statusLabel: "Lunas • QRIS Instan",
    bulan: "Agustus",
    tahun: "2026",
    fotoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA_o-kHBggvQhNKap2If35Mv5ZOJIXhes19yjW4f1m7eI0EFtAdxhqIFWdOgSMMg8QCtJT8QxByZHDP1QPlw61bOOUnJp6QYS25meOsTBTpGhAESrwTkVRZ5S7S3j_JdaDrg6qxDXu2iYLECK3I8MG8tMQeWzimm9nbYzWi0T_NffPIzeVSTphwjQrtBGNRsglDpKCkKfJwmyjMfqDSy97v2GijZOKKylSQmPPgxakRA8apaYjo1soOZA",
    ticketUrl: "/reservations/12/ticket",
  },
  {
    id: "09",
    bookingRef: "BOOK-20260824-0009",
    namaRuang: "Acoustic Meeting Nook — Room 03",
    tipeBadge: "Meeting",
    lokasi: "Urspace Collective, Seminyak",
    tanggal: "Senin, 24 Agustus 2026",
    jamMulai: "13:00",
    jamSelesai: "15:00",
    durasiJam: 2,
    durasiLabel: "13:00 – 15:00 WITA (2 Jam)",
    hargaTotal: 60000,
    metodeBayar: "QRIS (Instan)",
    status: "turnstile_aktif",
    statusLabel: "Turnstile Gate Aktif",
    bulan: "Agustus",
    tahun: "2026",
    fotoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDwLeVBjwnz9-PHDFPuSRuvn6gA0XVb0AwKVRIdltz39QoIWdfM-nMOlU13tuclp6c1EmdH9rxjnXZpeWRdlWNe0-pbkNCgKWiFIau-RjKW-UJh0uKULlFd77-dGTkzaesFVp3YaWh_-R4qFvxgAJIFsgHR_UZ1MywcHfSx9E1IwtnkAIk6ewztLjk_jzIjKw8AikhY503GyP-tpEzW0bZal3Q0A1tyKo9i81dOgD8Hht91v4aPEn1NXg",
    ticketUrl: "/reservations/09/ticket",
  },
  {
    id: "04",
    bookingRef: "BOOK-20260812-0004",
    namaRuang: "Focus Pod — Silentium 02",
    tipeBadge: "Pod",
    lokasi: "Moklet Hub Coworking Space, Canggu",
    tanggal: "Rabu, 12 Agustus 2026",
    jamMulai: "10:00",
    jamSelesai: "14:00",
    durasiJam: 4,
    durasiLabel: "10:00 – 14:00 WITA (4 Jam)",
    hargaTotal: 42000,
    metodeBayar: "QRIS (Instan)",
    status: "selesai",
    statusLabel: "Sesi Berakhir Sempurna",
    bulan: "Agustus",
    tahun: "2026",
    fotoUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKfaBOO-mAmrZRI3UXEexYatnvkGYTro5n6054NEJ3TQGOwqJyCm_tXQW78Vp2lymNELdMTQSELxKFZese0hxD7YyE_2Bl-OIyA-h8tMlR9Jb4aOgFAJt_ewJl-hEgaHHBBIHG_GjlJXUzkJwL1fKZH5rQqGUFvF8MkBluVz1eIYCUBKDZiqCah8OgDN_yBSxpIH34PidjWyF7tUuljy4oDcwMN7IB9DwjaZOn2sdODC2InXimp_9cmw",
    ticketUrl: "/reservations/04/ticket",
  },
];

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

const YEARS = ["2024", "2025", "2026", "2027"];

export default function MemberReservationsDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState("Agustus");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [forceEmptyStatePreview, setForceEmptyStatePreview] = useState(false);

  // Two-stage smooth scroll state (Tertahan dulu di page reservasi, scroll kedua kalinya baru ke footer)
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [footerUnlocked, setFooterUnlocked] = useState(false);

  // DOM Refs
  const reservationWrapperRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);

  // Mutable refs for high-frequency scroll / wheel listeners
  const isAtBottomRef = useRef(false);
  isAtBottomRef.current = isAtBottom;

  const footerUnlockedRef = useRef(false);
  footerUnlockedRef.current = footerUnlocked;

  const canTriggerSecondScrollRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Filter items according to month & year selection
  const filteredReservations = useMemo(() => {
    if (forceEmptyStatePreview) return [];
    return RESERVATIONS_DATA.filter(
      (item) => item.bulan === selectedMonth && item.tahun === selectedYear
    );
  }, [selectedMonth, selectedYear, forceEmptyStatePreview]);

  // Aggregate metrics calculation
  const totalSesi = filteredReservations.length;
  const uniqueLocations = useMemo(() => {
    const set = new Set(filteredReservations.map((r) => r.lokasi));
    return set.size;
  }, [filteredReservations]);

  const totalPengeluaran = useMemo(() => {
    return filteredReservations.reduce((acc, curr) => acc + curr.hargaTotal, 0);
  }, [filteredReservations]);

  const totalDurasiJam = useMemo(() => {
    return filteredReservations.reduce((acc, curr) => acc + curr.durasiJam, 0);
  }, [filteredReservations]);

  const averageHoursPerSession = useMemo(() => {
    if (totalSesi === 0) return 0;
    return Math.round(totalDurasiJam / totalSesi);
  }, [totalDurasiJam, totalSesi]);

  // Format currency IDR
  const formatRupiah = (val: number) => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = [
      "No. Referensi",
      "Nama Ruang",
      "Kategori",
      "Lokasi",
      "Tanggal",
      "Durasi",
      "Total Biaya",
      "Metode Pembayaran",
      "Status",
    ];

    const rows = filteredReservations.map((item) => [
      `"${item.bookingRef}"`,
      `"${item.namaRuang}"`,
      `"${item.tipeBadge}"`,
      `"${item.lokasi}"`,
      `"${item.tanggal}"`,
      `"${item.durasiLabel}"`,
      `"${item.hargaTotal}"`,
      `"${item.metodeBayar}"`,
      `"${item.statusLabel}"`,
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
      `rekap-reservasi-urspace-${selectedMonth.toLowerCase()}-${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `Rekap transaksi periode ${selectedMonth} ${selectedYear} berhasil diekspor (.csv)`
    );
  };

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
              className="text-xs font-semibold text-gray-700 bg-white border border-[#E5E7EB] hover:bg-gray-50 px-4 py-2 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>Ekspor Rekap Bulanan</span>
            </button>
          </div>

          {/* B. METRIC SUMMARY CARDS (GRID 3 KOLOM) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-3">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Hemat Rp 35.000 lewat kode promo</span>
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
          </div>

          {/* C. PERIOD FILTER BAR */}
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
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setForceEmptyStatePreview(false);
                }}
                className="text-xs font-semibold text-gray-800 bg-gray-50/70 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#5E43F3] cursor-pointer transition-colors"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown Tahun */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setForceEmptyStatePreview(false);
                }}
                className="text-xs font-semibold text-gray-800 bg-gray-50/70 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#5E43F3] cursor-pointer transition-colors"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reset if filtered */}
            {(selectedMonth !== "Agustus" || selectedYear !== "2026" || forceEmptyStatePreview) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth("Agustus");
                  setSelectedYear("2026");
                  setForceEmptyStatePreview(false);
                }}
                className="ml-auto text-xs text-[#5E43F3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Default (Agustus 2026)</span>
              </button>
            )}
          </div>

          {/* D. HEADING SEKSI TRANSAKSI */}
          <div className="flex items-center justify-between text-xs pt-2">
            <h2 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
              DAFTAR RESERVASI PERIODE INI
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              Menampilkan {filteredReservations.length} dari {RESERVATIONS_DATA.length} transaksi
            </span>
          </div>

          {/* E. LIST KARTU RESERVASI */}
          <div className="space-y-4">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((item) => {
                // TIPE 2: TURNSTILE GATE AKTIF (HIGHLIGHTED BORDER #FFD500)
                if (item.status === "turnstile_aktif") {
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border-2 border-[#FFD500] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-md relative group transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
                        {/* Thumbnail dengan Badge */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                          <img
                            src={item.fotoUrl}
                            alt={item.namaRuang}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                            {item.tipeBadge}
                          </span>
                        </div>

                        {/* Metadata Spesifikasi Ruang */}
                        <div>
                          {/* Booking Ref Monospace Pill */}
                          <div className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                            {item.bookingRef}
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                            {item.namaRuang}
                          </h3>

                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{item.lokasi}</span>
                          </div>

                          <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{item.tanggal}</span>
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              <span>{item.durasiLabel}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sisi Kanan: Status & Tombol Aksi QR Masuk */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 gap-4">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            TOTAL PEMBAYARAN
                          </span>
                          <div className="text-lg sm:text-xl font-extrabold font-mono text-[#111827] mt-0.5">
                            {formatRupiah(item.hargaTotal)}
                          </div>
                          <span className="text-xs font-semibold text-[#5E43F3] mt-0.5 block">
                            {item.statusLabel}
                          </span>
                        </div>

                        <Link
                          href={item.ticketUrl}
                          className="bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xs transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer shrink-0"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Tampilkan Kode Masuk QR</span>
                        </Link>
                      </div>
                    </div>
                  );
                }

                // TIPE 1 & 3: STANDAR RIWAYAT / SELESAI
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-gray-300 transition-all shadow-2xs group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full md:w-auto">
                      {/* Thumbnail dengan Badge */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-2xs">
                        <img
                          src={item.fotoUrl}
                          alt={item.namaRuang}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                          {item.tipeBadge}
                        </span>
                      </div>

                      {/* Metadata Info */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#111827] leading-snug">
                          {item.namaRuang}
                        </h3>

                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{item.lokasi}</span>
                        </div>

                        <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.tanggal}</span>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{item.durasiLabel}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sisi Kanan: Pembayaran & Status Lencana */}
                    <div className="text-left md:text-right w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        TOTAL PEMBAYARAN
                      </span>
                      <div className="text-lg sm:text-xl font-extrabold font-mono text-[#111827] mt-0.5">
                        {formatRupiah(item.hargaTotal)}
                      </div>
                      <span
                        className={`text-xs mt-1 block font-medium ${
                          item.status === "lunas"
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* DYNAMIC FALLBACK EMPTY STATE (JIKA FILTER MENAMPILKAN 0 HASIL) */
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
                    {selectedMonth} {selectedYear}
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

          {/* F. PREVIEW KOMPONEN STATUS KOSONG (EMPTY STATE SIMULATOR) */}
          <div className="pt-8 border-t border-gray-200/60">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>PREVIEW KOMPONEN STATUS KOSONG (EMPTY STATE)</span>
              <button
                type="button"
                onClick={() => setForceEmptyStatePreview((prev) => !prev)}
                className="text-[10px] font-semibold text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                {forceEmptyStatePreview
                  ? "Tampilkan Data Asli"
                  : "Bila filter = 0 hasil"}
              </button>
            </div>

            <div className="w-full bg-white rounded-3xl border border-dashed border-gray-200 p-10 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
                <Calendar className="w-5 h-5 text-gray-400 stroke-[1.75]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">
                Tidak ada riwayat pemesanan di bulan ini
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
                Anda belum memesan ruangan atau meja kerja pada periode yang dipilih.
                Mulai eksplorasi dan amankan ruang kerja ternyaman Anda.
              </p>
              <Link
                href="/spaces"
                className="bg-[#111827] hover:bg-black text-white text-xs font-semibold px-6 py-3 rounded-full mt-6 transition-all shadow-sm active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Eksplorasi Ruang Kerja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

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

      {/* ─── 3. CINEMATIC MOTION FOOTER ────────────────────────────────────── */}
      <div id="reservation-footer-section" ref={footerSectionRef}>
        <MotionFooter />
      </div>
    </div>
  );
}
