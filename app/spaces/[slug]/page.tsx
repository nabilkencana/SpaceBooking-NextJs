"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Share2,
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  Check,
  X,
  Wifi,
  Armchair,
  Monitor,
  Key,
  Coffee,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Navigation,
  Zap,
  Sparkles,
  Star,
  ArrowLeft,
  ArrowDown,
  Copy,
  Info,
  AudioLines,
  Fingerprint,
  Lock,
  Waves,
  ArrowRight,
  Plug,
  Mic,
  Droplet,
  ShowerHead,
  Snowflake,
  MoveDiagonal,
  Printer,
  Bike,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { catalogSpaces } from "@/lib/dummy-catalog";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import MotionFooter from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function WorkspaceDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  // Match space from catalog or fallback to default "Personal Desk – Flexi 01"
  const matchedSpace = useMemo(() => {
    return (
      catalogSpaces.find(
        (s) => s.slug === slug || String(s.id) === slug
      ) ?? catalogSpaces[0]
    );
  }, [slug]);

  // Gallery state
  const galleryImages = useMemo(() => [
    {
      id: "main",
      label: "Zona A • Suaka Fokus",
      url: matchedSpace.foto || "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "thumb-1",
      label: "Bilik Diskusi",
      url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "thumb-2",
      label: "Bilik Telepon",
      url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "thumb-3",
      label: "Kafe Artisan",
      url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    },
  ], [matchedSpace]);

  const [activePhotoUrl, setActivePhotoUrl] = useState(galleryImages[0].url);
  const [activeBadge, setActiveBadge] = useState(galleryImages[0].label);
  const [isSaved, setIsSaved] = useState(false);
  // Booking Calculator State (Initialized matching reference image)
  const [selectedDate, setSelectedDate] = useState("08/09/2026");
  const [selectedTime, setSelectedTime] = useState("09:00 WITA");
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [promoInput, setPromoInput] = useState("DISKONHEMAT20");
  const [appliedPromo, setAppliedPromo] = useState<string | null>("DISKONHEMAT20");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const baseHourlyPrice = matchedSpace.hargaPerJam || 20000;

  // Dynamic Price Calculations (Service Fee is Free as in reference)
  const subtotal = baseHourlyPrice * selectedDuration;
  const discountRate = appliedPromo ? 0.2 : 0;
  const discountAmount = Math.round(subtotal * discountRate);
  const serviceFee = 0; // Biaya Layanan & Fasilitas: Gratis
  const totalPrice = subtotal - discountAmount + serviceFee;

  // Promo Handlers
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === "DISKONMEMBER20" || code === "DISKONHEMAT20") {
      setAppliedPromo(code);
      setPromoInput("");
      toast.success(`Kupon promo ${code} berhasil diterapkan! (-20%)`);
    } else {
      toast.error("Kode promo tidak valid atau telah kedaluwarsa.");
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    toast.info("Kode promo dibatalkan.");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Tautan direktori ruang kerja disalin ke papan klip!");
    }
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev);
    toast.success(
      isSaved ? "Ruang dihapus dari daftar simpan." : "Ruang kerja berhasil disimpan ke daftar favorit!"
    );
  };

  // Two-stage smooth scroll state
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [footerUnlocked, setFooterUnlocked] = useState(false);

  // DOM Refs
  const detailWrapperRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);

  // Mutable refs for high-frequency scroll / wheel listeners
  const isAtBottomRef = useRef(false);
  isAtBottomRef.current = isAtBottom;

  const footerUnlockedRef = useRef(false);
  footerUnlockedRef.current = footerUnlocked;

  const canTriggerSecondScrollRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hitung posisi mentok detail ruang kerja (di mana bagian bawah konten detail terlihat penuh di viewport)
  const getDetailStopPosition = () => {
    if (!detailWrapperRef.current) return 0;
    const rect = detailWrapperRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const detailBottom = scrollY + rect.bottom;
    return Math.max(0, detailBottom - window.innerHeight);
  };

  // ─── TWO-STAGE SMOOTH SCROLL (TERTAHAN DULU DI DETAIL SPACE, SCROLL KEDUA BARU KE FOOTER) ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Scroll Listener: Menjaga agar scroll mentok di batas detail ruang dan tidak langsung bablas
    const handleScroll = () => {
      const stopPos = getDetailStopPosition();
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
      const stopPos = getDetailStopPosition();
      const currentY = window.scrollY || window.pageYOffset;

      // Saat sedang berada di posisi mentok bawah detail
      if (currentY >= stopPos - 15 && !footerUnlockedRef.current) {
        // Jika scroll KE BAWAH
        if (e.deltaY > 0) {
          if (canTriggerSecondScrollRef.current) {
            // SCROLL KEDUA TERDETEKSI: Buka footer secara mulus!
            setFooterUnlocked(true);
            canTriggerSecondScrollRef.current = false;

            const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
            if (lenis) {
              lenis.scrollTo("#spaces-detail-footer-section", {
                duration: 1.15,
                ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              });
            } else {
              document
                .getElementById("spaces-detail-footer-section")
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
      const stopPos = getDetailStopPosition();
      const currentY = window.scrollY || window.pageYOffset;
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (currentY >= stopPos - 15 && !footerUnlockedRef.current && deltaY > 15) {
        if (canTriggerSecondScrollRef.current) {
          setFooterUnlocked(true);
          canTriggerSecondScrollRef.current = false;

          const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
          if (lenis) {
            lenis.scrollTo("#spaces-detail-footer-section", { duration: 1.1 });
          } else {
            document
              .getElementById("spaces-detail-footer-section")
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
      lenis.scrollTo("#spaces-detail-footer-section", {
        duration: 1.15,
        ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      document
        .getElementById("spaces-detail-footer-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111827] flex flex-col font-sans selection:bg-[#5E43F3] selection:text-white">
      <SmoothScroll />

      {/* ─── 1. SPACES DETAIL WRAPPER (ELEVATED & MENTOK DULU DI SINI SEBELUM FOOTER) ──── */}
      <div
        ref={detailWrapperRef}
        id="spaces-detail-wrapper"
        className="relative z-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] min-h-screen flex flex-col justify-between"
      >
        {/* ─── TOP NAVBAR (GLOBAL HEADER) ─────────────────────────────────── */}
        <GlobalHeader isLoggedIn={true} />

        {/* ─── 2. MAIN DETAIL CONTAINER ──────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full flex-1">
        
        {/* A. BREADCRUMB & ACTION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          {/* Sisi Kiri: Tautan Kembali & Breadcrumb Hierarkis */}
          <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm text-gray-500">
            <Link
              href="/spaces"
              className="inline-flex items-center gap-1 font-semibold text-[#111827] hover:text-[#5E43F3] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Direktori Ruang</span>
            </Link>

            <span className="text-gray-300 mx-2">|</span>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
              <Link href="/spaces" className="hover:text-black transition-colors">
                Ruang Kerja
              </Link>
              <span className="text-gray-300">/</span>
              <span className="hover:text-black transition-colors cursor-default">
                Bali, Canggu
              </span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-[#111827]">
                {matchedSpace.nama}
              </span>
            </nav>
          </div>

          {/* Sisi Kanan: Dua Tombol Utilitas (Share & Bookmark) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              type="button"
              className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Bagikan</span>
            </button>

            <button
              onClick={handleToggleSave}
              type="button"
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                isSaved
                  ? "border-[#5E43F3] bg-[#5E43F3]/10 text-[#5E43F3]"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  isSaved ? "fill-[#5E43F3] text-[#5E43F3]" : "text-gray-500"
                }`}
              />
              <span>{isSaved ? "Tersimpan" : "Simpan"}</span>
            </button>
          </div>
        </div>

        {/* B. HEADER JUDUL & METAINFORMASI */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            {matchedSpace.nama}
          </h1>

          <div className="flex items-center flex-wrap gap-2.5 mt-3 text-xs sm:text-[13px] text-gray-500">
            <span className="flex items-center gap-1 text-gray-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>Jl. Pantai Batu Bolong No. 42, Canggu, Bali</span>
            </span>

            <span className="text-gray-300">•</span>

            {/* Badge Status Operasional */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              • Buka 24/7
            </span>

            <span className="text-gray-300">•</span>

            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>Koneksi Fiber Kecepatan Tinggi</span>
            </span>
          </div>
        </div>

        {/* ─── C. ARSITEKTUR DUA KOLOM ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          
          {/* ═════════ KOLOM KIRI: DETAIL FASILITAS, GALERI & LOKASI ═════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-10">
            
            {/* 1. GALERI KOMPOSISI MULTI-FOTO (HERO SHOWCASE) */}
            <div className="space-y-4">
              {/* Foto Utama */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                <Image
                  src={activePhotoUrl}
                  alt={matchedSpace.nama}
                  fill
                  priority
                  className="object-cover object-center transition-all duration-500"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />

                {/* Badge Lokasi / Suasana di Sudut Kiri Bawah */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white text-gray-900 text-xs sm:text-[13px] font-bold shadow-md border border-gray-150">
                    {activeBadge}
                  </span>
                </div>
              </div>

              {/* Baris 3 Thumbnail Bawah */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {galleryImages.slice(1).map((thumb) => (
                  <button
                    key={thumb.id}
                    type="button"
                    onClick={() => {
                      if (activePhotoUrl === thumb.url) {
                        setActivePhotoUrl(galleryImages[0].url);
                        setActiveBadge(galleryImages[0].label);
                      } else {
                        setActivePhotoUrl(thumb.url);
                        setActiveBadge(thumb.label);
                      }
                    }}
                    className={`group relative h-24 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer border-2 transition-all ${
                      activePhotoUrl === thumb.url
                        ? "border-[#5E43F3] ring-2 ring-[#5E43F3]/20 scale-[1.01]"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={thumb.url}
                      alt={thumb.label}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 33vw, 20vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-xs text-[11px] sm:text-xs font-semibold text-white tracking-wide">
                      {thumb.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. BENTO FEATURES CARD (SEPERTI DI GAMBAR) */}
            <div className="bg-[#F8F9FE] border border-[#ECEFFC] rounded-3xl p-6 sm:p-7 md:p-8 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-7 gap-x-6 sm:gap-x-8">
                {/* Fitur 1: Fiber 300 Mbps */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Wifi className="w-5 h-5 text-[#5E43F3]" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Fiber 300 Mbps
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      SLA terdedikasi latensi rendah
                    </p>
                  </div>
                </div>

                {/* Fitur 2: Herman Miller */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <svg
                      className="w-5 h-5 text-[#5E43F3]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 6h10" />
                      <path d="M9 6v4" />
                      <path d="M15 6v4" />
                      <rect width="16" height="5" x="4" y="10" rx="2" />
                      <path d="M12 15v5" />
                      <path d="M8 20h8" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Herman Miller
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Aeron v2 terkalibrasi penuh
                    </p>
                  </div>
                </div>

                {/* Fitur 3: Dual 27" 4K */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Monitor className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Dual 27" 4K
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Pengisian daya satu kabel USB-C 90W
                    </p>
                  </div>
                </div>

                {/* Fitur 4: Akustik NRC 0.85 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <AudioLines className="w-5 h-5 text-[#5E43F3]" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Akustik NRC 0.85
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Peredaman kebisingan sekitar
                    </p>
                  </div>
                </div>

                {/* Fitur 5: Kopi Single Origin */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Coffee className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Kopi Single Origin
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Racikan barista sepuasnya
                    </p>
                  </div>
                </div>

                {/* Fitur 6: Biometrik 24/7 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Fingerprint className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Biometrik 24/7
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Termasuk loker tanpa kunci
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NARASI EDITORIAL: "TENTANG MEJA KERJA INI" */}
            <div className="pt-2">
              <h2 className="text-xl font-bold text-[#111827] mb-3">
                Tentang Meja Kerja Ini
              </h2>
              <div className="space-y-3.5 text-sm text-gray-600 leading-relaxed">
                <p>
                  Dirancang secara khusus untuk para profesional teknologi, pendiri startup, dan direktur kreatif yang membutuhkan konsentrasi mutlak tanpa gangguan. Flexi 01 terletak di area suaka pencahayaan alami utara kami, diposisikan secara tenang jauh dari lalu lalang dengan dinding berperedam akustik matte dan pencahayaan kerja khusus anti-silau.
                </p>
                <p>
                  Setiap meja dikerjakan secara presisi dari kayu jati Indonesia berkelanjutan, dipadukan dengan kursi ergonomis terkemuka Herman Miller Aeron, monitor ganda eksternal 4K dengan konektivitas kabel tunggal, serta kontrol sirkulasi udara berpendingin mandiri 22°C yang sejuk dan menenangkan.
                </p>
              </div>

              {/* Divider */}
              <div className="border-b border-gray-100 my-8" />

              {/* 4. SPESIFIKASI RUANG & FASILITAS KERJA */}
              <h2 className="text-xl font-bold text-[#111827] mb-5">
                Spesifikasi Ruang & Fasilitas Kerja
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 text-xs sm:text-sm text-gray-700 font-medium">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <Plug className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>100% Genset Cadangan Otomatis</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Diskon 50% Ruang Podcast 4K</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Droplet className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Air Minum Elektrolit & Sparkling</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShowerHead className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Layanan Shower & Handuk Bersih</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <Snowflake className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Pendingin Udara HEPA Filter 22°C</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MoveDiagonal className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Sandaran Ergonomis & Penopang Pinggang</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Pencetakan Berwarna & Alat Tulis Kantor</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Bike className="w-4 h-4 text-[#5E43F3] shrink-0" />
                    <span>Penyimpanan Aman untuk Papan Selancar & Sepeda</span>
                  </div>
                </div>
              </div>

              {/* 5. KARTU HOST KOMUNITAS */}
              <div className="mt-8 bg-[#F6F7FF] border border-[#ECEFFC] rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      className="w-12 h-12 rounded-full object-cover grayscale border border-white shadow-xs"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_o-kHBggvQhNKap2If35Mv5ZOJIXhes19yjW4f1m7eI0EFtAdxhqIFWdOgSMMg8QCtJT8QxByZHDP1QPlw61bOOUnJp6QYS25meOsTBTpGhAESrwTkVRZ5S7S3j_JdaDrg6qxDXu2iYLECK3I8MG8tMQeWzimm9nbYzWi0T_NffPIzeVSTphwjQrtBGNRsglDpKCkKfJwmyjMfqDSy97v2GijZOKKylSQmPPgxakRA8apaYjo1soOZA"
                      alt="Made & Sarah"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                      Made & Sarah
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pengelola di Lokasi Batu Bolong Hub • Respons &lt; 15 menit
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toast.info("Menghubungkan ke layanan host komunitas via WhatsApp...")}
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-900 border border-gray-200/80 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Hubungi Pengelola
                </button>
              </div>

              {/* Divider */}
              <div className="border-b border-gray-100 my-8" />

              {/* 6. PETA INTERAKTIF & LINGKUNGAN SEKITAR */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#111827]">
                  Lokasi & Sekitar
                </h2>
                <span className="text-xs sm:text-sm font-normal text-gray-500">
                  Canggu Pusat • 400m dari Pantai
                </span>
              </div>

              {/* Minimalist Vector-Styled Interactive Map Container */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 bg-[#E8EDF5] shadow-xs">
                {/* Peta Interaktif OpenStreetMap */}
                <iframe
                  title="Peta Lokasi Urspace Canggu Hub"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=115.1106%2C-8.6689%2C115.1506%2C-8.6389&layer=mapnik&marker=-8.6539%2C115.1306"
                  className="w-full h-full border-0"
                  loading="lazy"
                />

                {/* Badge Pin Urspace Hub Bottom-Left with link */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=-8.6539,115.1306"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 z-10 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-gray-900 text-xs font-bold shadow-md border border-gray-200 flex items-center gap-1.5 transition-all hover:scale-105 group cursor-pointer backdrop-blur-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
                  <span>Urspace Canggu Hub (Batu Bolong)</span>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-700 ml-0.5" />
                </a>

                {/* Tombol Akses Peta Lengkap */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=-8.6539,115.1306"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 text-[11px] font-semibold shadow-xs border border-gray-200 flex items-center gap-1.5 transition-all backdrop-blur-xs cursor-pointer"
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </div>
            </div>

          </div>

          {/* ═════════ KOLOM KANAN: WIDGET KALKULATOR RESERVASI INSTAN ═════════ */}
          <div className="lg:col-span-5 xl:col-span-4 self-start sticky top-24 z-30">
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
              
              {/* 1. HEADER KARTU RESERVASI (HARGA & ULASAN) */}
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 gap-2">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-gray-950 font-sans whitespace-nowrap">
                    Rp {baseHourlyPrice.toLocaleString("id-ID")}
                  </span>
                  <span className="text-gray-400 font-normal text-xs whitespace-nowrap truncate">
                    (128 ulasan)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-gray-900 whitespace-nowrap shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>4.94</span>
                  <span className="text-gray-400 font-normal ml-0.5">(128 ulasan)</span>
                </div>
              </div>

              {/* 2. FORMULIR JADWAL PEMAKAIAN */}
              <div className="mt-5 space-y-4">
                {/* Tanggal Penggunaan */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
                    <span>Tanggal Penggunaan</span>
                    <button
                      type="button"
                      onClick={() => toast.info("Jadwal sewa tersedia untuk hari ini dan tanggal mendatang.")}
                      className="text-[#5E43F3] hover:underline text-[11px] font-medium cursor-pointer"
                    >
                      Tersedia hari ini & mendatang
                    </button>
                  </div>
                  <div className="relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/10 transition-all">
                    <div className="flex items-center gap-2.5 flex-1">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <input
                        type="text"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full text-xs font-bold text-[#111827] bg-transparent focus:outline-none"
                      />
                    </div>
                    <Calendar className="w-4 h-4 text-gray-800 shrink-0 pointer-events-none" />
                  </div>
                </div>

                {/* Grid 2 Kolom (Jam Mulai & Durasi) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Jam Mulai Sewa */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Jam Mulai Sewa
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#5E43F3] cursor-pointer pr-8"
                      >
                        <option value="08:00 WITA">08:00 WITA</option>
                        <option value="09:00 WITA">09:00 WITA</option>
                        <option value="10:00 WITA">10:00 WITA</option>
                        <option value="11:00 WITA">11:00 WITA</option>
                        <option value="13:00 WITA">13:00 WITA</option>
                        <option value="14:00 WITA">14:00 WITA</option>
                        <option value="15:00 WITA">15:00 WITA</option>
                        <option value="17:00 WITA">17:00 WITA</option>
                        <option value="19:00 WITA">19:00 WITA</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Durasi Pemakaian (Jam) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Durasi Pemakaian (Jam)
                    </label>
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-xs font-bold text-[#111827] h-[40px] transition-colors">
                      <button
                        type="button"
                        onClick={() => setSelectedDuration((prev) => Math.max(1, prev - 1))}
                        disabled={selectedDuration <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-black disabled:opacity-25 transition-colors cursor-pointer text-sm font-bold"
                        aria-label="Kurangi durasi"
                      >
                        —
                      </button>
                      <span className="font-extrabold text-[#111827]">{selectedDuration} Jam</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDuration((prev) => Math.min(12, prev + 1))}
                        disabled={selectedDuration >= 12}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-black disabled:opacity-25 transition-colors cursor-pointer text-base font-bold"
                        aria-label="Tambah durasi"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. INPUT KODE PROMO */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-800 mb-1.5">
                    <span>Masukkan Kode Promo</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromoInput("DISKONHEMAT20");
                        setAppliedPromo("DISKONHEMAT20");
                        toast.success("Kupon DISKONHEMAT20 berhasil diterapkan! (-20%)");
                      }}
                      className="text-gray-500 hover:text-[#5E43F3] text-xs font-normal cursor-pointer transition-colors"
                    >
                      Coba: DISKONHEMAT20
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="DISKONHEMAT20"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5E43F3] uppercase tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Terapkan
                    </button>
                  </div>

                  {/* Status Voucher Terpasang */}
                  {appliedPromo && (
                    <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Kupon {appliedPromo} aktif (-20%)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-emerald-700 hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                        aria-label="Hapus promo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. KOTAK RINCIAN KALKULASI (BERLATAR ABU-ABU HALUS) */}
              <div className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100 my-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-medium">
                    Tarif Sewa (Rp {baseHourlyPrice.toLocaleString("id-ID")} × {selectedDuration} jam)
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                    <span>Diskon Promo (20%)</span>
                    <span className="font-mono">
                      -Rp {discountAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Biaya Layanan & Fasilitas</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-700 text-[10px] font-bold">
                    Gratis
                  </span>
                </div>

                {/* Garis Pemisah & Total Pembayaran */}
                <div className="border-t border-gray-200/80 pt-3.5 mt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 block whitespace-nowrap">
                      Total Pembayaran
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block whitespace-nowrap">
                      Sudah termasuk PPN 11%
                    </span>
                  </div>
                  <span className="text-2xl sm:text-[26px] font-extrabold font-sans text-gray-950 tracking-tight whitespace-nowrap shrink-0">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* 5. TOMBOL CTA AKSI UTAMA */}
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-3.5 sm:py-4 px-4 bg-[#5E43F3] hover:bg-[#4D32E8] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5E43F3]/25 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="whitespace-nowrap">Konfirmasi & Buat Reservasi Sekarang</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              {/* Subketerangan dengan Ikon Gembok */}
              <div className="flex items-center justify-center gap-1.5 mt-3.5 text-[11px] text-gray-500 text-center leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bebas biaya tersembunyi • Pembatalan gratis hingga 2 jam sebelum mulai</span>
              </div>

              {/* 6. LENCANA JAMINAN & KEPERCAYAAN */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5 text-xs text-gray-600">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Akses instan e-tiket via WhatsApp & Email</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Check-in mandiri dengan kode QR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jaminan 100% koneksi internet lancar</span>
                </div>
              </div>

            </div>
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

      {/* ─── 3. MASTER MOTION FOOTER (TERLETAK ALAMI DI BAWAH DETAIL) ───── */}
      <div id="spaces-detail-footer-section" ref={footerSectionRef}>
        <MotionFooter />
      </div>

      {/* ─── 4. MODAL INSTANT BOOKING CONFIRMATION (BESPOKE EDITORIAL DESIGN) ─── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-lg w-full shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* A. Header Pratinjau Ruang & Identitas */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 text-white p-5 sm:p-6">
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#5E43F3]/25 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md">
                    <Image
                      src={matchedSpace.foto || activePhotoUrl}
                      alt={matchedSpace.nama}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-[#FFD500] text-gray-950 text-[10px] font-extrabold uppercase tracking-wider font-mono">
                        Konfirmasi Instan
                      </span>
                      <span className="text-[11px] text-gray-300 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Terverifikasi</span>
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                      {matchedSpace.nama}
                    </h3>
                    <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">Batu Bolong Hub, Canggu, Bali</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  type="button"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* B. Badan Rincian Reservasi */}
            <div className="p-5 sm:p-6 space-y-4">
              
              {/* Chip Tanggal & Durasi */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-gray-200/70 flex items-center justify-center text-[#5E43F3] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-mono">
                      Tanggal
                    </span>
                    <span className="text-xs font-bold text-gray-900 block mt-0.5">
                      {selectedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-gray-200/70 flex items-center justify-center text-[#5E43F3] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider font-mono">
                      Waktu &amp; Durasi
                    </span>
                    <span className="text-xs font-bold text-gray-900 block mt-0.5">
                      {selectedTime} • {selectedDuration} Jam
                    </span>
                  </div>
                </div>
              </div>

              {/* Fasilitas Unggulan Termasuk */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 px-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>WiFi 300 Mbps + Kopi Artisan</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>QR Turnstile Pass Otomatis</span>
                </span>
              </div>

              {/* Rincian Slip Pembayaran */}
              <div className="rounded-2xl border border-gray-200/90 p-4 space-y-2.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Tarif Sewa ({selectedDuration} Jam × Rp {baseHourlyPrice.toLocaleString("id-ID")})</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold font-mono">
                        {appliedPromo} (-20%)
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-600 font-mono">
                      -Rp {discountAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Biaya Layanan &amp; Fasilitas</span>
                  <span className="font-semibold text-emerald-600 font-mono text-[11px]">
                    GRATIS
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 mt-1 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Total Pembayaran
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Metode: QRIS Instant Pay (Bebas Biaya Admin)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black font-mono text-[#5E43F3]">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Keamanan & Enkripsi */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Enkripsi 256-bit • Tiket langsung aktif seketika</span>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/reservations/12/ticket"
                  onClick={() => {
                    toast.success("Reservasi Berhasil Dikonfirmasi! Tiket QR siap digunakan.");
                    setIsBookingModalOpen(false);
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold text-sm text-center shadow-md shadow-[#5E43F3]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer group"
                >
                  <span>Konfirmasi &amp; Buka E-Ticket</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Kembali &amp; Ubah Jadwal
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
