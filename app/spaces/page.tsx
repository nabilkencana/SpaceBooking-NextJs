"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  Clock,
  ChevronDown,
  Bell,
  Users,
  Wifi,
  Maximize2,
  Check,
  ArrowDown,
} from "lucide-react";
import { catalogSpaces } from "@/lib/dummy-catalog";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import MotionFooter from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

const SORT_OPTIONS = [
  "Rekomendasi",
  "Harga: Terendah ke Tertinggi",
  "Harga: Tertinggi ke Terendah",
  "Kapasitas Terbesar",
];

export default function SpacesDirectoryPage() {
  const [lokasiQuery, setLokasiQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("Rekomendasi");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Two-stage smooth scroll state
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [footerUnlocked, setFooterUnlocked] = useState(false);

  // DOM Refs
  const directoryWrapperRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);

  // Mutable refs for high-frequency scroll / wheel listeners
  const isAtBottomRef = useRef(false);
  isAtBottomRef.current = isAtBottom;

  const footerUnlockedRef = useRef(false);
  footerUnlockedRef.current = footerUnlocked;

  const canTriggerSecondScrollRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter & Sort Logic
  const filteredAndSortedSpaces = useMemo(() => {
    let list = [...catalogSpaces];

    if (lokasiQuery.trim()) {
      const q = lokasiQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.lokasi.toLowerCase().includes(q) ||
          item.tipe.toLowerCase().includes(q)
      );
    }

    if (selectedSort === "Harga: Terendah ke Tertinggi") {
      list.sort((a, b) => a.hargaPerJam - b.hargaPerJam);
    } else if (selectedSort === "Harga: Tertinggi ke Terendah") {
      list.sort((a, b) => b.hargaPerJam - a.hargaPerJam);
    } else if (selectedSort === "Kapasitas Terbesar") {
      list.sort((a, b) => b.kapasitas - a.kapasitas);
    }

    return list;
  }, [lokasiQuery, selectedSort]);

  // Hitung posisi mentok direktori space (di mana pagination terlihat penuh di viewport)
  const getDirectoryStopPosition = () => {
    if (!directoryWrapperRef.current) return 0;
    const rect = directoryWrapperRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const directoryBottom = scrollY + rect.bottom;
    return Math.max(0, directoryBottom - window.innerHeight);
  };

  // ─── TWO-STAGE SMOOTH SCROLL (TANPA PIN / TANPA KETARIK / BUTTER SMOOTH) ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Scroll Listener: Menjaga agar scroll mentok di batas direktori dan tidak langsung bablas
    const handleScroll = () => {
      const stopPos = getDirectoryStopPosition();
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
      const stopPos = getDirectoryStopPosition();
      const currentY = window.scrollY || window.pageYOffset;

      // Saat sedang berada di posisi mentok bawah direktori
      if (currentY >= stopPos - 15 && !footerUnlockedRef.current) {
        // Jika scroll KE BAWAH
        if (e.deltaY > 0) {
          if (canTriggerSecondScrollRef.current) {
            // SCROLL KEDUA TERDETEKSI: Buka footer secara mulus!
            setFooterUnlocked(true);
            canTriggerSecondScrollRef.current = false;

            const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
            if (lenis) {
              lenis.scrollTo("#spaces-footer-section", {
                duration: 1.15,
                ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              });
            } else {
              document
                .getElementById("spaces-footer-section")
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
      const stopPos = getDirectoryStopPosition();
      const currentY = window.scrollY || window.pageYOffset;
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (currentY >= stopPos - 15 && !footerUnlockedRef.current && deltaY > 15) {
        if (canTriggerSecondScrollRef.current) {
          setFooterUnlocked(true);
          canTriggerSecondScrollRef.current = false;

          const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
          if (lenis) {
            lenis.scrollTo("#spaces-footer-section", { duration: 1.1 });
          } else {
            document
              .getElementById("spaces-footer-section")
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
      lenis.scrollTo("#spaces-footer-section", {
        duration: 1.15,
        ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      document
        .getElementById("spaces-footer-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111827] flex flex-col font-sans selection:bg-[#5E43F3] selection:text-white overflow-x-hidden">
      <SmoothScroll />

      {/* ─── 1. SPACES DIRECTORY WRAPPER (ELEVATED & MENTOK DULU DI SINI) ──── */}
      <div
        ref={directoryWrapperRef}
        id="spaces-directory-wrapper"
        className="relative z-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-screen flex flex-col justify-between"
      >
        {/* ─── UNIFIED GLOBAL HEADER ───────────────────────────────────────── */}
        <GlobalHeader />

        {/* ─── MAIN DIRECTORY BODY ─────────────────────────────────────────── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 pt-10 pb-16">
          {/* Judul Halaman */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
              Direktori Ruang Kerja
            </h1>
          </div>

          {/* ─── FLOATING SEARCH & FILTER BAR ──────────────────────────────── */}
          <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_10px_30px_rgba(0,0,0,0.04)] p-2.5 sm:p-3 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              {/* Input Lokasi / Fasilitas */}
              <div className="md:col-span-4 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="w-full">
                  <label
                    htmlFor="filter-lokasi"
                    className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer"
                  >
                    LOKASI / FASILITAS
                  </label>
                  <input
                    id="filter-lokasi"
                    type="text"
                    placeholder="Cari area, kota, atau nama gedung..."
                    value={lokasiQuery}
                    onChange={(e) => setLokasiQuery(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none bg-transparent pt-0.5"
                  />
                </div>
              </div>

              {/* Input Tanggal Sewa */}
              <div className="md:col-span-3 flex items-center justify-between px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      TANGGAL SEWA
                    </span>
                    <span className="text-xs font-semibold text-gray-800 pt-0.5 block">
                      30/08/2026
                    </span>
                  </div>
                </div>
                <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0 pointer-events-none" />
              </div>

              {/* Input Jam Mulai & Durasi */}
              <div className="md:col-span-3 flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      JAM MULAI & DURASI
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 pt-0.5">
                      <span className="flex items-center gap-0.5">
                        09:00 WIB
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-0.5">
                        3 Jam
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Cari */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => {}}
                  className="w-full bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cek Ketersediaan</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── SORTING BAR ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end mb-6 text-xs text-gray-500 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-black transition-colors"
              >
                <span>Urutkan:</span>
                <span className="font-semibold text-gray-900">{selectedSort}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                    isSortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSelectedSort(opt);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedSort === opt
                          ? "font-bold text-[#5E43F3]"
                          : "text-gray-700"
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedSort === opt && (
                        <Check className="w-3.5 h-3.5 text-[#5E43F3]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── 3-COLUMN WORKSPACE GRID ───────────────────────────────────── */}
          {filteredAndSortedSpaces.length === 0 ? (
            <div className="w-full py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm font-semibold text-gray-600">
                Tidak ada ruang kerja yang sesuai dengan pencarian Anda.
              </p>
              <button
                onClick={() => setLokasiQuery("")}
                className="mt-3 text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer"
                type="button"
              >
                Reset filter pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredAndSortedSpaces.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl border border-[#E5E7EB] p-4 flex flex-col justify-between hover:shadow-xl hover:border-gray-300 transition-all duration-300"
                >
                  <div>
                    {/* Gambar Card dengan Badge */}
                    <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gray-100 mb-4">
                      <Image
                        alt={item.nama}
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        fill
                        src={item.foto}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {item.badge && (
                        <span
                          className={`absolute top-3 left-3 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                            item.badge === "BARU"
                              ? "bg-[#5E43F3] text-white"
                              : "bg-white/90 text-gray-800 backdrop-blur-sm border border-gray-100"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Baris Harga & Spesifikasi Fasilitas (Lega & Rapi) */}
                    <div className="flex items-baseline justify-between gap-x-3 gap-y-1.5 pb-3 border-b border-gray-100 flex-wrap sm:flex-nowrap">
                      <div className="flex items-baseline gap-1 shrink-0">
                        <span className="text-base sm:text-[17px] font-extrabold text-[#111827] tracking-tight">
                          Rp {item.hargaPerJam.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[11px] text-gray-400 font-normal">
                          / jam
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-500 text-[10.5px] sm:text-[11px] font-medium shrink-0 ml-auto sm:ml-0">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{item.kapasitas} Orang</span>
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{item.wifiSpeed} Mbps</span>
                        </span>
                        {item.luasRuang && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{item.luasRuang} m²</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Judul Ruang & Sub-lokasi */}
                    <div className="mt-3">
                      <h3 className="text-base font-bold text-[#111827] leading-snug group-hover:text-[#5E43F3] transition-colors">
                        {item.nama}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{item.lokasi}</p>
                    </div>
                  </div>

                  {/* Tautan Aksi Bawah */}
                  <div className="pt-5 mt-4 border-t border-gray-100 text-right">
                    <Link
                      className="text-xs font-bold text-[#5E43F3] hover:text-[#4A32D6] inline-flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
                      href={`/spaces/${item.slug}`}
                    >
                      <span>{item.ctaText}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── PAGINATION FOOTER ─────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <span>Menampilkan 1–6 dari 18 ruang kerja</span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                type="button"
                className={`w-7 h-7 rounded-full font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 1
                    ? "bg-[#111827] text-white"
                    : "hover:bg-gray-100 text-gray-700 font-medium"
                }`}
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                type="button"
                className={`w-7 h-7 rounded-full font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 2
                    ? "bg-[#111827] text-white"
                    : "hover:bg-gray-100 text-gray-700 font-medium"
                }`}
              >
                2
              </button>
              <button
                onClick={() => setCurrentPage(3)}
                type="button"
                className={`w-7 h-7 rounded-full font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  currentPage === 3
                    ? "bg-[#111827] text-white"
                    : "hover:bg-gray-100 text-gray-700 font-medium"
                }`}
              >
                3
              </button>
              <span className="px-1 text-gray-400">...</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, 3))}
                type="button"
                className="hover:text-black font-semibold ml-2 cursor-pointer transition-colors"
              >
                Berikutnya →
              </button>
            </div>
          </div>

          {/* ─── FOOTER REVEAL HINT PILL (PETUNJUK KETIKA MENTOK DI BAWAH) ─── */}
          <div className="mt-8 flex flex-col items-center justify-center pb-2">
            <button
              type="button"
              onClick={handleScrollToFooter}
              className={`group px-5 py-2.5 rounded-full border transition-all duration-300 flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs ${
                isAtBottom && !footerUnlocked
                  ? "bg-white border-[#5E43F3] text-[#5E43F3] shadow-md shadow-[#5E43F3]/10 scale-105"
                  : "bg-gray-50/80 border-gray-200 text-gray-500 hover:text-black hover:bg-white"
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
        </main>
      </div>

      {/* ─── 2. MASTER MOTION FOOTER (TERLETAK ALAMI DI BAWAH DIREKTORI) ───── */}
      <div id="spaces-footer-section" ref={footerSectionRef}>
        <MotionFooter />
      </div>
    </div>
  );
}