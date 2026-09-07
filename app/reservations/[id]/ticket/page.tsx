"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin,
  Check,
  Printer,
  Calendar,
  ArrowLeft,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { useETicket } from "@/hooks/useReservasi";
import { usePublicLocation } from "@/hooks/useAdmin";
import { useRequireAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/lib/api";
import type { ReservasiStatus } from "@/types";

// ─── Page-local formatters (server data formatting only — no pricing math) ──

const formatRupiah = (val: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(val);

const parseUtcDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  );
};

const HARI_INDO = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const BULAN_INDO = [
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
] as const;

function formatTanggalIndo(value: string) {
  const date = parseUtcDate(value);
  if (!date) return value;
  return `${HARI_INDO[date.getUTCDay()]}, ${date.getUTCDate()} ${
    BULAN_INDO[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
}

function timeToMinutes(hhmm: string): number | null {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Nominal jam_selesai dapat >= 24:00 (mis. "26:00") — tampilkan digulir ke hari berikutnya.
function rollTimeForDisplay(hhmm: string): string {
  const minutes = timeToMinutes(hhmm);
  if (minutes === null) return hhmm;
  return minutesToTime(minutes);
}

const statusLabel = (status: ReservasiStatus) => {
  const labels: Record<ReservasiStatus, string> = {
    belum_dikonfirm: "Menunggu Konfirmasi",
    disetujui: "Disetujui",
    aktif: "Aktif / Digunakan",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };
  return labels[status];
};

const statusChipClass = (status: ReservasiStatus) => {
  const classes: Record<ReservasiStatus, string> = {
    belum_dikonfirm: "bg-amber-400 text-black",
    disetujui: "bg-[#3B38F6] text-white",
    aktif: "bg-emerald-500 text-white",
    selesai: "bg-gray-500 text-white",
    dibatalkan: "bg-red-500 text-white",
  };
  return classes[status];
};

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function addDaysToIsoDate(value: string, days: number): string {
  const date = parseUtcDate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// .ics sesuai RFC 5545 — zona Asia/Jakarta (WIB, UTC+7) via TZID.
function buildIcsContent(opts: {
  summary: string;
  description: string;
  location: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  uid: string;
}): string | null {
  const startMinutes = timeToMinutes(opts.jamMulai);
  const endTotalMinutes = timeToMinutes(opts.jamSelesai);
  if (startMinutes === null || endTotalMinutes === null) return null;

  // jam_selesai nominal >= 24:00 (mis. "26:00") digulir ke hari berikutnya.
  const dayOffset = Math.floor(endTotalMinutes / 1440);
  const endMinutes = endTotalMinutes % 1440;
  const tanggalMulai = opts.tanggal.slice(0, 10);
  const tanggalSelesai = addDaysToIsoDate(tanggalMulai, dayOffset);

  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Urspace//Coworking Ticket//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${escapeIcsText(opts.summary)}`,
    `DESCRIPTION:${escapeIcsText(opts.description)}`,
    `LOCATION:${escapeIcsText(opts.location)}`,
    `DTSTART;TZID=Asia/Jakarta:${tanggalMulai.replace(/-/g, "")}T${minutesToTime(
      startMinutes,
    )}00`,
    `DTEND;TZID=Asia/Jakarta:${tanggalSelesai.replace(/-/g, "")}T${minutesToTime(
      endMinutes,
    )}00`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspaceTicketPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const numericId = Number(ticketId);

  // Halaman privat member — redirect ke /login saat belum terautentikasi.
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth("/login");

  const eTicketQuery = useETicket(numericId);
  const locationQuery = usePublicLocation();

  // Sesi hangus setelah hidrasi (401 dari endpoint e-ticket) → /login.
  useEffect(() => {
    if (
      isAuthenticated &&
      eTicketQuery.error instanceof ApiRequestError &&
      eTicketQuery.error.statusCode === 401
    ) {
      window.location.assign("/login");
    }
  }, [isAuthenticated, eTicketQuery.error]);

  const ticket = eTicketQuery.data;
  const location = locationQuery.data;

  // Nilai venue & kontak: endpoint lokasi publik dulu, fallback dari e-ticket.
  const venueName =
    location?.nama_coworking ?? ticket?.coworking_space?.nama ?? null;
  const venueAddress =
    location?.alamat ?? ticket?.coworking_space?.alamat ?? null;
  const venuePhone = location?.hotline ?? ticket?.coworking_space?.telepon ?? null;
  const waDigits = venuePhone ? venuePhone.replace(/\D/g, "") : "";

  // Two-stage smooth scroll state
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [footerUnlocked, setFooterUnlocked] = useState(false);

  // DOM Refs
  const ticketWrapperRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);

  // Mutable refs for high-frequency scroll / wheel listeners
  const isAtBottomRef = useRef(false);
  isAtBottomRef.current = isAtBottom;

  const footerUnlockedRef = useRef(false);
  footerUnlockedRef.current = footerUnlocked;

  const canTriggerSecondScrollRef = useRef(false);
  const wheelIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hitung posisi mentok tiket (di mana bagian bawah konten tiket terlihat penuh di viewport)
  const getTicketStopPosition = () => {
    if (!ticketWrapperRef.current) return 0;
    const rect = ticketWrapperRef.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const ticketBottom = scrollY + rect.bottom;
    return Math.max(0, ticketBottom - window.innerHeight);
  };

  // ─── TWO-STAGE SMOOTH SCROLL (TERTAHAN DULU DI TIKET, SCROLL KEDUA BARU KE FOOTER) ───
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Scroll Listener: Menjaga agar scroll mentok di batas tiket dan tidak langsung bablas
    const handleScroll = () => {
      const stopPos = getTicketStopPosition();
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
      const stopPos = getTicketStopPosition();
      const currentY = window.scrollY || window.pageYOffset;

      // Saat sedang berada di posisi mentok bawah tiket
      if (currentY >= stopPos - 15 && !footerUnlockedRef.current) {
        // Jika scroll KE BAWAH
        if (e.deltaY > 0) {
          if (canTriggerSecondScrollRef.current) {
            // SCROLL KEDUA TERDETEKSI: Buka footer secara mulus!
            setFooterUnlocked(true);
            canTriggerSecondScrollRef.current = false;

            const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
            if (lenis) {
              lenis.scrollTo("#ticket-footer-section", {
                duration: 1.15,
                ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              });
            } else {
              document
                .getElementById("ticket-footer-section")
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
      const stopPos = getTicketStopPosition();
      const currentY = window.scrollY || window.pageYOffset;
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (currentY >= stopPos - 15 && !footerUnlockedRef.current && deltaY > 15) {
        if (canTriggerSecondScrollRef.current) {
          setFooterUnlocked(true);
          canTriggerSecondScrollRef.current = false;

          const lenis = (window as unknown as { lenisInstance?: { scrollTo: (target: number | string, opts?: object) => void } }).lenisInstance;
          if (lenis) {
            lenis.scrollTo("#ticket-footer-section", { duration: 1.1 });
          } else {
            document
              .getElementById("ticket-footer-section")
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
      lenis.scrollTo("#ticket-footer-section", {
        duration: 1.15,
        ease: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      document
        .getElementById("ticket-footer-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Action 1: Print (Cetak / Simpan sebagai PDF via dialog sistem)
  const handlePrint = () => {
    window.print();
  };

  // Action 2: Download Calendar .ics Event (dari jadwal live reservasi)
  const handleDownloadICS = () => {
    if (!ticket) {
      toast.error("Data tiket belum siap, coba beberapa saat lagi.");
      return;
    }

    const icsContent = buildIcsContent({
      summary: `Reservasi ${ticket.space?.nama ?? "Space"} - ${venueName ?? "Coworking Space"}`,
      description: `Reservasi ruang kerja Urspace.\nNo. Referensi: ${ticket.kode_booking}\nSerial: ${ticket.e_ticket_number}\nTunjukkan QR Instant Pass pada scanner turnstile saat kedatangan.`,
      location: [venueName, venueAddress].filter(Boolean).join(", "),
      tanggal: ticket.jadwal.tanggal,
      jamMulai: ticket.jadwal.jam_mulai,
      jamSelesai: ticket.jadwal.jam_selesai,
      uid: `${ticket.e_ticket_number}@urspace`,
    });

    if (!icsContent) {
      toast.error("Jadwal reservasi tidak valid untuk dibuat ke kalender.");
      return;
    }

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reservasi-${ticket.kode_booking}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("File kalender (.ics) berhasil diunduh!");
  };

  // ─── Auth gate: tunggu profil, redirect berjalan via useRequireAuth ───
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center print:bg-white">
        <p className="text-sm text-gray-500 font-semibold">Memeriksa sesi...</p>
      </div>
    );
  }

  // ─── Error state (bukan 401 — 401 sudah diarahkan ke /login) ───
  if (eTicketQuery.error || !Number.isFinite(numericId)) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center px-4 print:bg-white">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <h1 className="text-lg font-black text-[#111827] mt-4">
            E-Tiket Tidak Dapat Dimuat
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {eTicketQuery.error instanceof ApiRequestError
              ? eTicketQuery.error.message
              : "Terjadi kesalahan saat memuat e-tiket."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={() => eTicketQuery.refetch()}
              className="flex-1 bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm cursor-pointer transition-all"
            >
              Coba Lagi
            </button>
            <Link
              href="/reservations"
              className="flex-1 bg-white hover:bg-gray-50 text-[#111827] border border-[#E5E7EB] font-bold py-3 px-5 rounded-2xl text-xs sm:text-sm transition-all"
            >
              Kembali ke Reservasi Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading state ───
  if (!ticket) {
    return (
      <div className="min-h-screen w-full bg-[#F9FAFB] flex items-center justify-center print:bg-white">
        <p className="text-sm text-gray-500 font-semibold animate-pulse">
          Memuat e-tiket...
        </p>
      </div>
    );
  }

  // ─── Nilai live dari server ───
  const payloadString = ticket.qr_code_payload;
  const guestInitials =
    ticket.member?.nama
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "UR";
  const jamSelesaiDisplay = rollTimeForDisplay(ticket.jadwal.jam_selesai);

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-[#5E43F3] selection:text-white print:bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: [
            "@media print {",
            "  @page { margin: 12mm; }",
            "  html, body { background: #ffffff !important; }",
            "  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }",
            "}",
          ].join("\n"),
        }}
      />
      <SmoothScroll />

      {/* ─── 1. TICKET PAGE WRAPPER (MENTOK DULU DI SINI SEBELUM FOOTER) ──── */}
      <div
        ref={ticketWrapperRef}
        id="ticket-page-wrapper"
        className="relative z-10 bg-[#F9FAFB] shadow-[0_20px_50px_rgba(0,0,0,0.08)] min-h-screen flex flex-col justify-between print:shadow-none print:bg-white"
      >
        {/* ─── TOP NAVBAR (GLOBAL HEADER) ─────────────────────────────────── */}
        <div className="print:hidden">
          <GlobalHeader isLoggedIn={true} />
        </div>

        {/* ─── TICKET WORKSPACE CANVAS ────────────────────────────────────── */}
        <main className="w-full flex-1 py-8 sm:py-10 px-4 sm:px-6 flex flex-col items-center justify-start print:p-0 print:m-0">

        {/* A. Top Action & API Reference Bar */}
        <div className="max-w-2xl mx-auto mb-5 flex items-center justify-between w-full print:hidden">
          <Link
            href="/reservations"
            className="text-xs font-semibold text-gray-500 hover:text-black transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Reservasi Saya</span>
          </Link>
        </div>

        {/* B. ANATOMI KARTU TIKET BOARDING PASS */}
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden relative print:shadow-none print:border print:m-0 print:w-full print:rounded-2xl">

          {/* 1. Header Rintisan Tiket Atas (Kuning Kenari Urspace Gold) */}
          <div className="bg-[#FFD500] p-6 sm:p-8">
            {/* Baris Atas Banner Kuning: Status Masuk & Badge Status */}
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-1.5 text-black">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" strokeWidth={2.5} />
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase font-mono">
                  TIKET AKSES MASUK RESMI • URSPACE NOMAD PASS
                </span>
              </div>

              <span className={`px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs shrink-0 ${statusChipClass(ticket.status_reservasi)}`}>
                {statusLabel(ticket.status_reservasi)}
              </span>
            </div>

            {/* Baris Utama: Lokasi & Kotak No Referensi */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 font-mono block mb-1">
                  LOKASI RUANG KERJA
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-tight">
                  {venueName ?? "Coworking Space"}
                </h1>
                {venueAddress && (
                  <div className="flex items-center gap-1.5 text-xs text-[#111827]/80 font-medium mt-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#111827]" />
                    <span>{venueAddress}</span>
                  </div>
                )}
              </div>

              {/* Kotak Referensi Booking (Kuning Muda Krim Sesuai Gambar) */}
              <div className="bg-[#FEF8C8] border border-black/10 rounded-xl px-4 py-2.5 text-right shrink-0 shadow-2xs w-full sm:w-auto">
                <span className="text-[9px] font-extrabold tracking-wider text-gray-600 uppercase block font-mono">
                  NO. REFERENSI BOOKING
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-[#111827] tracking-wider block mt-0.5 leading-tight break-all">
                  {ticket.kode_booking}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Garis Perforasi Sobekan Tiket (Perforated Ticket Tear Line) */}
          <div className="relative w-full bg-white py-0 my-0">
            {/* Lubang Sobekan Samping Kiri */}
            <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F9FAFB] border-r border-[#E5E7EB] z-10 print:bg-white" />

            {/* Garis Border Putus-Putus */}
            <div className="w-full border-b-2 border-dashed border-gray-200" />

            {/* Lubang Sobekan Samping Kanan */}
            <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F9FAFB] border-l border-[#E5E7EB] z-10 print:bg-white" />
          </div>

          {/* 3. Badan Utama Tiket (Ticket Main Body) */}
          <div className="p-6 sm:p-8 space-y-6 bg-white">

            {/* A. Baris Atas: Ruang Kerja & Jadwal Penggunaan (2 Kolom) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-gray-100">
              {/* Sisi Kiri: Ruang Kerja & Tipe */}
              <div className="md:col-span-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1 font-mono">
                  RUANG KERJA &amp; TIPE
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#111827] tracking-tight">
                  {ticket.space?.nama ?? "Space Reservasi"}
                </h2>
                {ticket.space && (
                  <p className="text-xs text-gray-600 mt-1">
                    Tipe: <span className="font-bold text-gray-900">{ticket.space.tipe}</span>
                  </p>
                )}
              </div>

              {/* Sisi Kanan: Jadwal Penggunaan */}
              <div className="md:col-span-6 md:border-l md:border-gray-100 md:pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1 font-mono">
                  JADWAL PENGGUNAAN
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#111827] tracking-tight">
                  {formatTanggalIndo(ticket.jadwal.tanggal)}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1 font-mono">
                  {ticket.jadwal.jam_mulai} - {jamSelesaiDisplay} WIB
                  {ticket.jadwal.durasi ? ` • (Durasi: ${ticket.jadwal.durasi})` : ""}
                </p>
                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/90 px-3 py-0.5 rounded-full inline-block">
                    Harap tiba 10 menit sebelum jam reservasi
                  </span>
                </div>
              </div>
            </div>

            {/* B. Baris Tengah: Profil Member & Metode Bayar (3 Kolom) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3 font-mono">
                NAMA LENGKAP TAMU (DATA MEMBER)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-gray-100 items-center">
                {/* Kolom 1: Member */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                    {guestInitials}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111827] block leading-tight">
                      {ticket.member?.nama ?? "Tamu"}
                    </span>
                    {ticket.member?.instansi && (
                      <span className="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                        {ticket.member.instansi}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kolom 2: Kontak */}
                <div>
                  <span className="text-[10px] text-gray-400 block">Nomor WhatsApp:</span>
                  <span className="text-xs font-bold text-gray-900 font-mono block mt-0.5">
                    {ticket.member?.telp ?? "-"}
                  </span>
                </div>

                {/* Kolom 3: Pembayaran */}
                <div>
                  <span className="text-[10px] text-gray-400 block">Metode Pembayaran:</span>
                  <div className="mt-0.5">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold font-mono inline-block">
                      {ticket.rincian_pembayaran.total_dibayar > 0 ? "Lunas" : "Belum Bayar"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* C. Rincian Transaksi & Kalkulasi Monospace (nilai dari server) */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3 font-mono">
                RINCIAN TRANSAKSI &amp; PEMBAYARAN
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-mono">Tarif Dasar Sewa</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatRupiah(ticket.rincian_pembayaran.tarif_kotor)}
                  </span>
                </div>

                {ticket.rincian_pembayaran.diskon_promo &&
                  ticket.rincian_pembayaran.potongan > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-medium font-sans">Diskon Promo</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono">
                          {ticket.rincian_pembayaran.diskon_promo}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">
                        -{formatRupiah(ticket.rincian_pembayaran.potongan)}
                      </span>
                    </div>
                  )}
              </div>

              <div className="border-t border-gray-100 my-4" />

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-base font-black text-[#111827] block">
                    Total Telah Dibayar
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    No. Tiket: {ticket.e_ticket_number}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-[#111827] block leading-none">
                    {formatRupiah(ticket.rincian_pembayaran.total_dibayar)}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    Ref: {ticket.kode_booking}
                  </span>
                </div>
              </div>
            </div>

            {/* D. Blok Akses Turnstile & Sensor QR */}
            <div className="border border-gray-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 bg-white shadow-2xs">
              {/* Kotak QR Code dengan Border Hitam Tebal Sesuai Gambar */}
              <div className="border-2 border-black rounded-2xl p-3.5 bg-white flex flex-col items-center shrink-0 shadow-xs">
                <QRCodeSVG
                  value={payloadString}
                  size={105}
                  level="H"
                  fgColor="#111827"
                  bgColor="#ffffff"
                />
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest text-center block mt-2 font-mono">
                  QR INSTANT PASS
                </span>
              </div>

              {/* Serial Token & Payload */}
              <div className="flex-1 w-full text-left">
                <div className="flex items-center flex-wrap">
                  <span className="text-[9px] font-bold text-gray-600 uppercase bg-gray-100 px-2 py-0.5 rounded font-mono">
                    SERIAL TOKEN
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-[#111827] tracking-wider ml-2.5">
                    {ticket.e_ticket_number}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                  Tunjukkan kode QR ini ke petugas meja depan atau scanner turnstile saat kedatangan untuk verifikasi check-in dan aktivasi meja kerja otomatis.
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                  <span>
                    Payload:{" "}
                    <strong className="text-gray-700" data-testid="qr-payload">
                      {payloadString}
                    </strong>{" "}
                    •
                  </span>
                </div>

                <p className="text-xs font-semibold text-gray-600 mt-1 pl-5">
                  Akses Turnstile Otomatis
                </p>
              </div>
            </div>

          </div>

          {/* E. Security Strip Bawah (Microprint Footer Tiket) */}
          <div className="bg-[#F8F9FA] border-t border-gray-100 px-6 sm:px-8 py-3 flex justify-between items-center text-[9px] font-mono text-gray-400 uppercase tracking-wider">
            <span>NO. TIKET: {ticket.e_ticket_number}</span>
            <span>REF: {ticket.kode_booking}</span>
          </div>

        </div>

        {/* C. TOMBOL UTILITAS & AKSI CETAK */}
        <div className="max-w-2xl mx-auto mt-6 space-y-3 w-full print:hidden">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-1/2 bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-bold py-3.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota / Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadICS}
              className="w-full sm:w-1/2 bg-white hover:bg-gray-50 text-[#111827] border border-[#E5E7EB] font-bold py-3.5 px-5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-gray-600" />
              <span>Simpan ke Kalender (.ics)</span>
            </button>
          </div>

          {venuePhone && (
            <p className="text-[11px] text-gray-500 text-center block pt-2">
              Kendala akses saat di lokasi? Hubungi tim meja depan via{" "}
              {waDigits.length >= 8 ? (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5E43F3] font-bold hover:underline"
                >
                  WhatsApp ({venuePhone})
                </a>
              ) : (
                <span className="font-bold">{venuePhone}</span>
              )}
            </p>
          )}
        </div>

        {/* ─── FOOTER REVEAL HINT PILL (PETUNJUK KETIKA MENTOK DI BAWAH) ─── */}
        <div className="mt-8 flex flex-col items-center justify-center pb-4 print:hidden">
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

      </main>
      </div>

      {/* ─── 3. LIVE-DATA MASTER FOOTER ────────────────────────────────────── */}
      <div id="ticket-footer-section" ref={footerSectionRef} className="print:hidden">
        <GlobalFooter />
      </div>
    </div>
  );
}
