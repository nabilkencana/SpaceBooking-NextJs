"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Share2,
  Bookmark,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  X,
  Wifi,
  Armchair,
  Monitor,
  Coffee,
  ShieldCheck,
  CheckCircle2,
  Star,
  ArrowLeft,
  ArrowDown,
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
  AudioLines,
  Fingerprint,
  Lock,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { MotionFooter } from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { useAuthContext } from "@/contexts/AuthContext";
import { ApiRequestError, type ApiError } from "@/lib/api";
import { useCheckAvailability } from "@/hooks/useSpaces";
import { useValidateCoupon } from "@/hooks/useDiskon";
import { useCreateReservation } from "@/hooks/useReservasi";
import { SPACE_TYPE_LABELS, type SpaceDetail } from "@/types";

interface WorkspaceDetailBookingProps {
  space: SpaceDetail;
}

interface GalleryImage {
  id: string;
  label: string;
  url: string | null;
}

interface AppliedCoupon {
  id: number;
  nama_diskon: string;
  persentase_diskon: number;
  potongan: number;
}

/** Backend 4xx envelopes arrive as AxiosError via the BFF proxy. */
function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiError | undefined;
    if (body?.message) return body.message;
  }
  if (err instanceof ApiRequestError) return err.message;
  return err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
}

function getTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTanggal(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const TIME_OPTIONS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const AMENITY_ICONS = [
  Plug,
  Wifi,
  Coffee,
  Droplet,
  ShowerHead,
  Snowflake,
  Printer,
  Bike,
  Monitor,
  Mic,
  AudioLines,
  Fingerprint,
];

export default function WorkspaceDetailBooking({
  space,
}: WorkspaceDetailBookingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  // ─── Live gallery: space.photos (fallback foto_url), placeholder bila kosong ───
  // Seeded/legacy paths may lack the leading slash ("spaces/x.jpg"); next/image
  // hard-throws on such src, so normalize before rendering.
  const galleryImages: GalleryImage[] = useMemo(() => {
    const toImageSrc = (url: string) =>
      url.startsWith("/") || url.startsWith("http") ? url : `/${url}`;
    const photos = (space.photos ?? []).filter(Boolean).map(toImageSrc);
    const urls =
      photos.length > 0
        ? photos
        : space.foto_url
          ? [toImageSrc(space.foto_url)]
          : [];
    if (urls.length === 0) {
      return [{ id: "placeholder", label: space.nama_space, url: null }];
    }
    return urls.map((url, i) => ({
      id: `photo-${i}`,
      label: i === 0 ? "Tampilan Utama" : `Foto ${i + 1}`,
      url,
    }));
  }, [space]);

  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(
    galleryImages[0].url,
  );
  const [activeBadge, setActiveBadge] = useState(galleryImages[0].label);
  const [isSaved, setIsSaved] = useState(false);

  // ─── Booking state (tanggal/jam/durasi; link params dari katalog bila ada) ───
  const [selectedDate, setSelectedDate] = useState("");
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const tanggal = searchParams?.get("tanggal");
    setSelectedDate(
      tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal) ? tanggal : getTodayIso(),
    );
    setMinDate(getTodayIso());

    const jam = searchParams?.get("jam_mulai");
    if (jam && /^\d{2}:\d{2}$/.test(jam)) setSelectedTime(jam);

    const durasi = searchParams?.get("durasi_jam");
    const durasiNum = durasi ? Number.parseInt(durasi, 10) : Number.NaN;
    if (!Number.isNaN(durasiNum) && durasiNum >= 1 && durasiNum <= 12) {
      setSelectedDuration(durasiNum);
    }
  }, [searchParams]);

  const tanggalValid = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);

  // ─── Server price preview: GET /spaces/availability (PPN-inclusive, display only) ───
  const availability = useCheckAvailability(
    {
      id_space: space.id,
      tanggal: selectedDate,
      jam_mulai: selectedTime,
      durasi_jam: selectedDuration,
    },
    tanggalValid,
  );
  const availabilityError = availability.error
    ? getApiErrorMessage(availability.error)
    : null;
  const estimasiTotal = availability.data?.estimasi_total;

  // ─── Server-validated coupon: POST /diskon/check {kode, subtotal} → potongan ───
  const validateCoupon = useValidateCoupon();

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    validateCoupon.mutate(
      {
        kode: code,
        // Satu-satunya aritmetika yang diizinkan: payload cek kupon (display derivation).
        subtotal: space.harga_per_jam * selectedDuration,
      },
      {
        onSuccess: (res) => {
          const potongan = res.potongan ?? 0;
          setAppliedCoupon({
            id: res.id,
            nama_diskon: res.nama_diskon,
            persentase_diskon: res.persentase_diskon,
            potongan,
          });
          setPromoInput("");
          toast.success(
            `Kupon ${res.nama_diskon} valid! Hemat ${formatRupiah(potongan)}`,
          );
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    toast.info("Kode promo dibatalkan.");
  };

  // ─── Submit: POST /reservasi → redirect e-ticket ───
  const createReservation = useCreateReservation();

  const handleSubmitReservation = () => {
    if (!tanggalValid) {
      toast.error("Pilih tanggal penggunaan terlebih dahulu.");
      return;
    }
    if (availabilityError) {
      toast.error(availabilityError);
      return;
    }
    if (!authLoading && !isAuthenticated) {
      toast.info("Silakan masuk terlebih dahulu untuk membuat reservasi.");
      router.push("/login");
      return;
    }

    createReservation.mutate(
      {
        id_space: space.id,
        tanggal_reservasi: selectedDate,
        jam_mulai: selectedTime,
        durasi_jam: selectedDuration,
        id_diskon: appliedCoupon?.id ?? null,
        payment_method: "qris",
      },
      {
        onSuccess: (res) => {
          toast.success("Reservasi berhasil dibuat! Tiket QR siap digunakan.");
          setIsBookingModalOpen(false);
          router.push(`/reservations/${res.id}/ticket`);
        },
        onError: (err) => {
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            toast.info("Sesi berakhir. Silakan masuk kembali.");
            router.push("/login");
            return;
          }
          // 400 overlap: pesan backend ditampilkan apa adanya.
          toast.error(getApiErrorMessage(err));
        },
      },
    );
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
      isSaved ? "Ruang dihapus dari daftar simpan." : "Ruang kerja berhasil disimpan ke daftar favorit!",
    );
  };

  const amenities = (space.amenities ?? []).filter(Boolean) as string[];

  // ─── Two-stage smooth scroll state
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

  const ownerAlamat = space.owner?.alamat ?? space.owner?.nama_coworking ?? "Moklet Hub Coworking Space";

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
                {space.owner?.nama_coworking ?? "Moklet Hub Coworking Space"}
              </span>
              <span className="text-gray-300">/</span>
              <span className="font-semibold text-[#111827]">
                {space.nama_space}
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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
              {space.nama_space}
            </h1>
            {space.badge && (
              <span className="px-2.5 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-[11px] font-bold border border-[#5E43F3]/20">
                {space.badge}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2.5 mt-3 text-xs sm:text-[13px] text-gray-500">
            <span className="flex items-center gap-1 text-gray-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{ownerAlamat}</span>
            </span>

            <span className="text-gray-300">•</span>

            {/* Badge Status Operasional */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
              • Buka 24/7
            </span>

            <span className="text-gray-300">•</span>

            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>
                {space.wifi_speed
                  ? `WiFi Fiber ${space.wifi_speed} Mbps`
                  : "WiFi Cepat Tersedia"}
              </span>
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
                {activePhotoUrl ? (
                  <Image
                    src={activePhotoUrl}
                    alt={space.nama_space}
                    fill
                    priority
                    className="object-cover object-center transition-all duration-500"
                    sizes="(max-width: 1024px) 100vw, 65vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#EDEBFF] via-[#F8F9FE] to-white">
                    <Waves className="w-10 h-10 text-[#5E43F3] opacity-60" />
                    <span className="text-xs font-bold text-gray-500">
                      {activeBadge}
                    </span>
                  </div>
                )}

                {/* Badge Lokasi / Suasana di Sudut Kiri Bawah */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white text-gray-900 text-xs sm:text-[13px] font-bold shadow-md border border-gray-150">
                    {activeBadge}
                  </span>
                </div>
              </div>

              {/* Baris Thumbnail Bawah */}
              {galleryImages.length > 1 && (
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
                      {thumb.url && (
                        <Image
                          src={thumb.url}
                          alt={thumb.label}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 33vw, 20vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-xs text-[11px] sm:text-xs font-semibold text-white tracking-wide">
                        {thumb.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BENTO FEATURES CARD (DATA LIVE SPACE) */}
            <div className="bg-[#F8F9FE] border border-[#ECEFFC] rounded-3xl p-6 sm:p-7 md:p-8 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-7 gap-x-6 sm:gap-x-8">
                {/* Fitur 1: WiFi */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Wifi className="w-5 h-5 text-[#5E43F3]" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      {space.wifi_speed ? `WiFi ${space.wifi_speed} Mbps` : "WiFi Cepat"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Koneksi internet stabil untuk kerja remote
                    </p>
                  </div>
                </div>

                {/* Fitur 2: Kapasitas */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Armchair className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      Kapasitas {space.kapasitas} Orang
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Dilengkapi furnitur nyaman
                    </p>
                  </div>
                </div>

                {/* Fitur 3: Luas Area */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <MoveDiagonal className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      {space.ukuran_m2 ? `${space.ukuran_m2} m²` : "Area Nyaman"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Ruang gerak lega dan tertata
                    </p>
                  </div>
                </div>

                {/* Fitur 4: Zona / Lantai */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <MapPin className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      {space.zona_lantai ?? "Lokasi Strategis"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Mudah dijangkau di dalam gedung
                    </p>
                  </div>
                </div>

                {/* Fitur 5: Badge */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Star className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      {space.badge ?? "Terverifikasi"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      Space terverifikasi pengelola
                    </p>
                  </div>
                </div>

                {/* Fitur 6: Tipe Ruang */}
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-[#5E43F3] shrink-0 border border-gray-100/80">
                    <Sparkles className="w-5 h-5 text-[#5E43F3]" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight">
                      {SPACE_TYPE_LABELS[space.tipe]}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                      {space.tipe === "meeting_room" || space.tipe === "private_office"
                        ? "Ruangan privat untuk produktivitas"
                        : "Meja kerja individual siap pakai"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NARASI EDITORIAL: "TENTANG RUANG KERJA INI" */}
            <div className="pt-2">
              <h2 className="text-xl font-bold text-[#111827] mb-3">
                Tentang Ruang Kerja Ini
              </h2>
              <div className="space-y-3.5 text-sm text-gray-600 leading-relaxed">
                {(space.deskripsi ?? "").split("\n").filter(Boolean).map((par, i) => (
                  <p key={i}>{par}</p>
                ))}
              </div>

              {/* Divider */}
              <div className="border-b border-gray-100 my-8" />

              {/* 4. SPESIFIKASI RUANG & FASILITAS KERJA (DARI space.amenities) */}
              {amenities.length > 0 && (
                <>
                  <h2 className="text-xl font-bold text-[#111827] mb-5">
                    Spesifikasi Ruang &amp; Fasilitas Kerja
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-8 text-xs sm:text-sm text-gray-700 font-medium">
                    {amenities.map((amenity, i) => {
                      const AmenityIcon = AMENITY_ICONS[i % AMENITY_ICONS.length];
                      return (
                        <div key={`${amenity}-${i}`} className="flex items-center gap-2.5">
                          <AmenityIcon className="w-4 h-4 text-[#5E43F3] shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 5. KARTU HOST KOMUNITAS */}
              <div className="mt-8 bg-[#F6F7FF] border border-[#ECEFFC] rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      className="w-12 h-12 rounded-full object-cover grayscale border border-white shadow-xs"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_o-kHBggvQhNKap2If35Mv5ZOJIXhes19yjW4f1m7eI0EFtAdxhqIFWdOgSMMg8QCtJT8QxByZHDP1QPlw61bOOUnJp6QYS25meOsTBTpGhAESrwTkVRZ5S7S3j_JdaDrg6qxDXu2iYLECK3I8MG8tMQeWzimm9nbYzWi0T_NffPIzeVSTphwjQrtBGNRsglDpKCkKfJwmyjMfqDSy97v2GijZOKKylSQmPPgxakRA8apaYjo1soOZA"
                      alt={space.owner?.nama_pemilik ?? "Pengelola"}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                      {space.owner?.nama_pemilik ?? "Pengelola Space"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pengelola di {space.owner?.nama_coworking ?? "Moklet Hub Coworking Space"} • Respons &lt; 15 menit
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
                  Lokasi &amp; Sekitar
                </h2>
                <span className="text-xs sm:text-sm font-normal text-gray-500">
                  {space.owner?.nama_coworking ?? "Moklet Hub Coworking Space"}
                </span>
              </div>

              {/* Minimalist Vector-Styled Interactive Map Container */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 bg-[#E8EDF5] shadow-xs">
                {/* Peta Interaktif OpenStreetMap */}
                <iframe
                  title={`Peta Lokasi ${space.owner?.nama_coworking ?? "Moklet Hub Coworking Space"}`}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=112.6272%2C-7.9884%2C112.6672%2C-7.9584&layer=mapnik&marker=-7.9784%2C112.6572"
                  className="w-full h-full border-0"
                  loading="lazy"
                />

                {/* Badge Pin Lokasi Bottom-Left with link */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=-7.9784,112.6572"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 z-10 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-gray-900 text-xs font-bold shadow-md border border-gray-200 flex items-center gap-1.5 transition-all hover:scale-105 group cursor-pointer backdrop-blur-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
                  <span>{space.owner?.nama_coworking ?? "Moklet Hub Coworking Space"}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-gray-700 ml-0.5" />
                </a>

                {/* Tombol Akses Peta Lengkap */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=-7.9784,112.6572"
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
                    {formatRupiah(space.harga_per_jam)}
                  </span>
                  <span className="text-gray-400 font-normal text-xs whitespace-nowrap">
                    /jam
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
                      Tersedia hari ini &amp; mendatang
                    </button>
                  </div>
                  <div className="relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 focus-within:border-[#5E43F3] focus-within:ring-2 focus-within:ring-[#5E43F3]/10 transition-all">
                    <div className="flex items-center gap-2.5 flex-1">
                      <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                      <input
                        type="date"
                        value={selectedDate}
                        min={minDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full text-xs font-bold text-[#111827] bg-transparent focus:outline-none cursor-pointer"
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
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t} WITA
                          </option>
                        ))}
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
                  <div className="text-xs font-bold text-gray-800 mb-1.5">
                    <span>Masukkan Kode Promo</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan kode promo"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5E43F3] uppercase tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={validateCoupon.isPending}
                      className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-wait"
                    >
                      {validateCoupon.isPending ? "Memeriksa…" : "Terapkan"}
                    </button>
                  </div>

                  {/* Status Voucher Terpasang */}
                  {appliedCoupon && (
                    <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Kupon {appliedCoupon.nama_diskon} aktif • Hemat {formatRupiah(appliedCoupon.potongan)}
                        </span>
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
                    Tarif Sewa ({formatRupiah(space.harga_per_jam)} × {selectedDuration} jam)
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    {space.harga_per_jam.toLocaleString("id-ID")}/jam
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                    <span>Diskon {appliedCoupon.nama_diskon} (Hemat)</span>
                    <span className="font-mono">
                      -{formatRupiah(appliedCoupon.potongan)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">PPN &amp; Biaya Layanan</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-700 text-[10px] font-bold">
                    Termasuk
                  </span>
                </div>

                {availabilityError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{availabilityError}</span>
                  </div>
                )}

                {/* Garis Pemisah & Total Pembayaran */}
                <div className="border-t border-gray-200/80 pt-3.5 mt-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 block whitespace-nowrap">
                      Total Pembayaran
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block whitespace-nowrap">
                      {availabilityError
                        ? "Jadwal tidak dapat dipesan"
                        : tanggalValid
                          ? "Estimasi dari server • termasuk PPN 11%"
                          : "Pilih tanggal untuk melihat estimasi"}
                    </span>
                  </div>
                  <span className="text-2xl sm:text-[26px] font-extrabold font-sans text-gray-950 tracking-tight whitespace-nowrap shrink-0">
                    {availabilityError || !tanggalValid
                      ? "—"
                      : availability.isFetching || estimasiTotal === undefined
                        ? "…"
                        : formatRupiah(estimasiTotal)}
                  </span>
                </div>
              </div>

              {/* 5. TOMBOL CTA AKSI UTAMA */}
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                disabled={!!availabilityError || !tanggalValid}
                className="w-full py-3.5 sm:py-4 px-4 bg-[#5E43F3] hover:bg-[#4D32E8] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#5E43F3]/25 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="whitespace-nowrap">Konfirmasi &amp; Buat Reservasi Sekarang</span>
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
                  <span>Akses instan e-tiket via WhatsApp &amp; Email</span>
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

      {/* ─── 3. LIVE-DATA MASTER FOOTER (TERLETAK ALAMI DI BAWAH DETAIL) ── */}
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
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-md bg-[#5E43F3]/30">
                    {(space.foto_url || activePhotoUrl) ? (
                      <Image
                        src={(space.foto_url || activePhotoUrl) as string}
                        alt={space.nama_space}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Waves className="w-6 h-6 text-white/80" />
                      </div>
                    )}
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
                      {space.nama_space}
                    </h3>
                    <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{ownerAlamat}</span>
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
                      {formatTanggal(selectedDate)}
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
                      {selectedTime} WITA • {selectedDuration} Jam
                    </span>
                  </div>
                </div>
              </div>

              {/* Fasilitas Unggulan Termasuk */}
              <div className="flex items-center justify-between text-[11px] text-gray-600 px-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {space.wifi_speed ? `WiFi ${space.wifi_speed} Mbps` : "WiFi Cepat"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>QR Turnstile Pass Otomatis</span>
                </span>
              </div>

              {/* Rincian Slip Pembayaran (estimasi dari server, display only) */}
              <div className="rounded-2xl border border-gray-200/90 p-4 space-y-2.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Tarif Sewa ({selectedDuration} Jam × {formatRupiah(space.harga_per_jam)})
                  </span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {space.harga_per_jam.toLocaleString("id-ID")}/jam
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold font-mono">
                        {appliedCoupon.nama_diskon} (-{appliedCoupon.persentase_diskon}%)
                      </span>
                    </span>
                    <span className="font-semibold text-emerald-600 font-mono">
                      -{formatRupiah(appliedCoupon.potongan)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>PPN &amp; Biaya Layanan</span>
                  <span className="font-semibold text-emerald-600 font-mono text-[11px]">
                    TERMASUK
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 mt-1 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Total Pembayaran
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Estimasi server • termasuk PPN 11%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black font-mono text-[#5E43F3]">
                      {availabilityError || estimasiTotal === undefined
                        ? "—"
                        : formatRupiah(estimasiTotal)}
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
                <button
                  type="button"
                  onClick={handleSubmitReservation}
                  disabled={createReservation.isPending || !!availabilityError || !tanggalValid}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold text-sm text-center shadow-md shadow-[#5E43F3]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {createReservation.isPending
                      ? "Memproses Reservasi…"
                      : "Konfirmasi & Buat Reservasi"}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

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
