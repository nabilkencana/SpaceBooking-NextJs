"use client";

import React, { use, useEffect, useRef, useState } from "react";
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
import MotionFooter from "@/components/ui/motion-footer";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspaceTicketPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id || "12";

  // Dynamic Metadata based on ticket ID
  const formattedSuffix = ticketId.padStart(4, "0");
  const bookingReference = `BOOK-20260830-${formattedSuffix}`;
  const serialToken = `TICKET-MOKLET-20260830-${formattedSuffix}`;
  const payloadString = `VERIFY-RESERVASI-${ticketId}-BOOK-20260830-${formattedSuffix}`;

  // Action 1: Print or Export PDF
  const handlePrint = () => {
    window.print();
  };

  // Action 2: Download Calendar .ics Event
  const handleDownloadICS = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Urspace//Coworking Ticket//ID",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "SUMMARY:Reservasi Meja - Moklet Hub Coworking Space",
      `DESCRIPTION:Reservasi ruang kerja Urspace.\\nNo. Referensi: ${bookingReference}\\nSerial: ${serialToken}\\nTunjukkan QR Instant Pass pada scanner turnstile saat kedatangan.`,
      "LOCATION:Moklet Hub Coworking Space, Jl. Pantai Batu Bolong No. 42, Canggu, Bali",
      "DTSTART:20260830T010000Z", // 09:00 WITA (UTC+8) -> 01:00 UTC
      "DTEND:20260830T040000Z",   // 12:00 WITA (UTC+8) -> 04:00 UTC
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reservasi-urspace-${bookingReference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("File kalender (.ics) berhasil diunduh!");
  };

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

  return (
    <div className="min-h-screen w-full bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-[#5E43F3] selection:text-white print:bg-white">
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
            href="/reservasi"
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
            {/* Baris Atas Banner Kuning: Status Masuk & Badge Biru */}
            <div className="flex items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-1.5 text-black">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" strokeWidth={2.5} />
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase font-mono">
                  TIKET AKSES MASUK RESMI • URSPACE NOMAD PASS
                </span>
              </div>

              <span className="px-3.5 py-1 rounded-full bg-[#3B38F6] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-xs shrink-0">
                DISETUJUI / AKSES AKTIF
              </span>
            </div>

            {/* Baris Utama: Lokasi & Kotak No Referensi */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-1">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/70 font-mono block mb-1">
                  LOKASI RUANG KERJA
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-tight">
                  Moklet Hub Coworking Space
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-[#111827]/80 font-medium mt-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#111827]" />
                  <span>Jl. Pantai Batu Bolong No. 42, Canggu, Bali • Lantai 2</span>
                </div>
              </div>

              {/* Kotak Referensi Booking (Kuning Muda Krim Sesuai Gambar) */}
              <div className="bg-[#FEF8C8] border border-black/10 rounded-xl px-4 py-2.5 text-right shrink-0 shadow-2xs w-full sm:w-auto">
                <span className="text-[9px] font-extrabold tracking-wider text-gray-600 uppercase block font-mono">
                  NO. REFERENSI BOOKING
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-[#111827] tracking-wider block mt-0.5 leading-tight">
                  BOOK-20260830-
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-[#111827] tracking-wider block leading-tight">
                  {formattedSuffix}
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
                  Personal Desk — Flexi 01
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Tipe: <span className="font-bold text-gray-900">Meja Mandiri</span> • Kapasitas: <span className="font-bold text-gray-900">1 Orang</span>
                </p>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Termasuk: Meja Ergonomis, Stopkontak Mandiri, &amp; Internet WiFi Fiber 100 Mbps
                </p>
              </div>

              {/* Sisi Kanan: Jadwal Penggunaan */}
              <div className="md:col-span-6 md:border-l md:border-gray-100 md:pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1 font-mono">
                  JADWAL PENGGUNAAN
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#111827] tracking-tight">
                  Minggu, 30 Agustus 2026
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mt-1 font-mono">
                  09:00 - 12:00 WITA • (Durasi: 3 Jam)
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
                    JD
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#111827] block leading-tight">
                      John Doe
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                      PT Inovasi Digital
                    </span>
                  </div>
                </div>

                {/* Kolom 2: Kontak */}
                <div>
                  <span className="text-[10px] text-gray-400 block">Nomor WhatsApp:</span>
                  <span className="text-xs font-bold text-gray-900 font-mono block mt-0.5">
                    +62 812-3456-7890
                  </span>
                </div>

                {/* Kolom 3: Pembayaran */}
                <div>
                  <span className="text-[10px] text-gray-400 block">Metode Pembayaran:</span>
                  <div className="mt-0.5">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold font-mono inline-block">
                      QRIS (Lunas)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* C. Rincian Transaksi & Kalkulasi Monospace */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3 font-mono">
                RINCIAN TRANSAKSI &amp; PEMBAYARAN
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-mono">Tarif Dasar Sewa (Rp 20.000 × 3 jam)</span>
                  <span className="font-mono font-bold text-gray-900">Rp 60.000</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium font-sans">Diskon Promo Member</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold font-mono">
                      DISKONHEMAT20 (-20%)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">-Rp 12.000</span>
                </div>
              </div>

              <div className="border-t border-gray-100 my-4" />

              <div className="flex items-end justify-between">
                <div>
                  <span className="text-base font-black text-[#111827] block">
                    Total Telah Dibayar
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    Status: Terverifikasi oleh Bank Settlement
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-[#111827] block leading-none">
                    Rp 48.000
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    ID Transaksi: TRX-20260830-4891
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
                    {serialToken}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                  Tunjukkan kode QR ini ke petugas meja depan atau scanner turnstile saat kedatangan untuk verifikasi check-in dan aktivasi meja kerja otomatis.
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2.5} />
                  <span>
                    Payload: <strong className="text-gray-700">{payloadString}</strong> •
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
            <span>SECURITY HASH: 7F8A2D3C4E9B01F2</span>
            <span>GATEWAY: BALI-CANGGU-NODE-01</span>
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

          <p className="text-[11px] text-gray-500 text-center block pt-2">
            Kendala akses saat di lokasi? Hubungi tim meja depan via{" "}
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5E43F3] font-bold hover:underline"
            >
              WhatsApp (+62 812 3456 7890)
            </a>
          </p>
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

      {/* ─── 3. CINEMATIC MOTION FOOTER ────────────────────────────────────── */}
      <div id="ticket-footer-section" ref={footerSectionRef} className="print:hidden">
        <MotionFooter />
      </div>
    </div>
  );
}
