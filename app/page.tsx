"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { GlobalFooter } from "@/components/layout/GlobalFooter";

gsap.registerPlugin(ScrollTrigger);

export default function UrspaceLandingPage() {
  const [selectedLocation, setSelectedLocation] = useState("Bali, Indonesia");
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    perusahaan: "",
    telepon: "",
    lokasi: "",
    anggota: "",
  });

  const heroCardRef = useRef<HTMLDivElement>(null);
  const yellowSectionRef = useRef<HTMLElement>(null);
  const yellowCardsRef = useRef<HTMLDivElement>(null);
  const workspacesRef = useRef<HTMLElement>(null);
  const orangeBannerRef = useRef<HTMLElement>(null);
  const consultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Card Floating Entrance
      if (heroCardRef.current) {
        gsap.fromTo(
          heroCardRef.current,
          { opacity: 0, y: 30, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", delay: 0.1 }
        );
      }

      // Yellow Section Cards Stagger Reveal
      if (yellowCardsRef.current) {
        gsap.from(yellowCardsRef.current.children, {
          scrollTrigger: {
            trigger: yellowSectionRef.current,
            start: "top 75%",
          },
          opacity: 0,
          y: 35,
          duration: 0.8,
          stagger: 0.18,
          ease: "power2.out",
        });
      }

      // Workspace Grid Cards Reveal
      if (workspacesRef.current) {
        const cards = workspacesRef.current.querySelectorAll(".workspace-card");
        gsap.from(cards, {
          scrollTrigger: {
            trigger: workspacesRef.current,
            start: "top 70%",
          },
          opacity: 0,
          y: 30,
          duration: 0.7,
          stagger: 0.15,
          ease: "power2.out",
        });
      }

      // Orange Statement Banner Kinetic Pop
      if (orangeBannerRef.current) {
        const headline = orangeBannerRef.current.querySelector("h2");
        if (headline) {
          gsap.from(headline, {
            scrollTrigger: {
              trigger: orangeBannerRef.current,
              start: "top 80%",
            },
            scale: 0.94,
            opacity: 0.7,
            duration: 0.8,
            ease: "power3.out",
          });
        }
      }

      // Consultation Card Soft Float
      if (consultCardRef.current) {
        gsap.from(consultCardRef.current, {
          scrollTrigger: {
            trigger: consultCardRef.current,
            start: "top 80%",
          },
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: "power3.out",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingConsultation(true);
    setTimeout(() => {
      setIsSubmittingConsultation(false);
      toast.success("Permintaan konsultasi Anda berhasil dikirim!", {
        description: "Tim konsultan Urspace akan segera menghubungi Anda.",
      });
      setFormData({
        nama: "",
        email: "",
        perusahaan: "",
        telepon: "",
        lokasi: "",
        anggota: "",
      });
    }, 500);
  };

  const [activeWorkspaceIndex, setActiveWorkspaceIndex] = useState(0);
  const isDraggingWorkspaceRef = useRef(false);
  const startXWorkspaceRef = useRef(0);
  const scrollLeftWorkspaceRef = useRef(0);


  const scrollToWorkspaceIndex = (index: number) => {
    if (yellowCardsRef.current) {
      const cardWidth = 350;
      yellowCardsRef.current.scrollTo({ left: index * cardWidth, behavior: "smooth" });
      setActiveWorkspaceIndex(index);
    }
  };

  const handleWorkspaceScroll = () => {
    if (!yellowCardsRef.current) return;
    const scrollLeft = yellowCardsRef.current.scrollLeft;
    const index = Math.round(scrollLeft / 320);
    setActiveWorkspaceIndex(Math.min(Math.max(index, 0), 2));
  };

  const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
    if (!yellowCardsRef.current) return;
    isDraggingWorkspaceRef.current = true;
    startXWorkspaceRef.current = e.pageX - yellowCardsRef.current.offsetLeft;
    scrollLeftWorkspaceRef.current = yellowCardsRef.current.scrollLeft;
  };

  const handleWorkspaceMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingWorkspaceRef.current || !yellowCardsRef.current) return;
    e.preventDefault();
    const x = e.pageX - yellowCardsRef.current.offsetLeft;
    const walk = (x - startXWorkspaceRef.current) * 1.5;
    yellowCardsRef.current.scrollLeft = scrollLeftWorkspaceRef.current - walk;
  };

  const handleWorkspaceMouseUpOrLeave = () => {
    isDraggingWorkspaceRef.current = false;
  };

  return (
    <div className="bg-white text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-brand-purple selection:text-white min-h-screen flex flex-col">
      {/* ─── 1. TOP STICKY NAVIGATION ────────────────────────────────────────── */}
      <GlobalHeader />

      {/* ─── 2. HERO SECTION ─────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[820px] lg:min-h-[880px] flex items-center justify-center px-4 py-20 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAS1FOOfdYAxXVlD7DtF6xRVNYvd2UyMR-VzvngwcqW2SBoboyI5LIR3BtbEQbqDgc7ucgN5mhTVxCY2KQR_JnMyVb3Om9LsVsTbjw7aK4zvnt0WZPyR51LZ2UbhBB6T2p6T9s1jqbo4ZqqsEa64yfcaNruXBKJsyfvww4sFj1dzUkoQj0u8GfUq3O7bl799Cv6SnjMq2IXI2vFFuRvTxWeu13nz4BTL4USLG9z6Miboz1t3WaNieG5zA")`,
        }}
      >
        {/* Hero Floating Elevated Card Container */}
        <div
          ref={heroCardRef}
          className="relative z-10 w-full max-w-xl mx-auto bg-white rounded-2xl p-8 sm:p-12 shadow-2xl text-center border border-white/60"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-neutral-950 leading-[1.2] tracking-tight">
            Temukan Ruang Kerja
            <br />
            Ideal untuk
            <br />
            Digital Nomad
          </h1>
          <p className="mt-4 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
            Akses meja kerja fleksibel, kantor privat, dan ruang rapat di pusat produktivitas terbaik.
          </p>

          {/* Filter Dropdown & Button Form */}
          <div className="mt-8 space-y-4 max-w-md mx-auto">
            <div className="relative">
              <div className="flex flex-col text-left px-5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors shadow-sm">
                <label
                  className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider cursor-pointer"
                  htmlFor="workspace-location"
                >
                  Pilih Lokasi
                </label>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5 w-full"
                    id="workspace-location"
                  >
                    <svg
                      className="w-4 h-4 text-neutral-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <path
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="bg-transparent border-0 p-0 text-sm font-semibold text-neutral-800 focus:ring-0 focus:outline-none cursor-pointer w-full"
                    >
                      <option value="Bali, Indonesia">Bali, Indonesia</option>
                      <option value="Malang, Jawa Timur">Malang, Jawa Timur</option>
                      <option value="Jakarta Selatan">Jakarta Selatan</option>
                      <option value="Surabaya, Jawa Timur">Surabaya, Jawa Timur</option>
                      <option value="Yogyakarta">Yogyakarta</option>
                    </select>
                  </span>
                  <svg
                    className="w-4 h-4 text-neutral-400 ml-2 shrink-0 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <Link
              href="/spaces"
              className="w-full py-4 px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-purple/25 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Cari Ruang Kerja</span>
              <span>→</span>
            </Link>
          </div>

          {/* Descriptive Nomad Narrative */}
          <p className="mt-8 text-xs sm:text-[13px] leading-relaxed text-neutral-600 max-w-md mx-auto">
            Nikmati kebebasan gaya hidup digital nomad seutuhnya dengan ruang kerja yang dirancang khusus untuk kenyamanan dan produktivitas Anda di berbagai penjuru nusantara.
          </p>
        </div>

        {/* Scroll Down Pill Indicator */}
        <a
          href="#options"
          aria-label="Gulir ke Pilihan Sewa"
          className="absolute bottom-8 right-8 z-10 w-11 h-11 rounded-full bg-white/90 border border-white flex items-center justify-center text-neutral-700 hover:bg-white hover:text-neutral-950 transition-all shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </a>
      </section>

      {/* ─── 3. WORKSPACE OPTIONS SECTION (SOLID CANARY YELLOW #FFD500) ─────────── */}
      <section
        ref={yellowSectionRef}
        className="bg-brand-yellow py-20 lg:py-28 scroll-mt-16 overflow-hidden"
        id="options"
      >
        <div className="w-full pl-6 sm:pl-8 lg:pl-[max(1.5rem,calc((100vw-80rem)/2+2rem))] xl:pl-[max(2rem,calc((100vw-80rem)/2+3rem))] pr-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 lg:gap-14">
            {/* Left Column Headline, Narrative & Navigation Controls */}
            <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 flex flex-col items-start pr-4">
              <h2 className="text-4xl sm:text-5xl lg:text-[46px] font-extrabold text-neutral-950 leading-[1.08] tracking-tight">
                Pilihan Ruang Kerja
                <br />
                untuk Setiap Kebutuhan
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-neutral-900/80 font-medium leading-relaxed max-w-sm">
                Tersedia beragam opsi ruang kerja fleksibel yang siap mendukung produktivitas individu hingga kolaborasi tim besar.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="#workspaces"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-900 text-xs sm:text-[13px] font-bold text-neutral-900 hover:bg-neutral-900 hover:text-white transition duration-200"
                >
                  <span>Lihat Semua Pilihan Ruang →</span>
                </Link>

                <div className="flex items-center gap-2">
                  {/* Indicator Dots */}
                  <div className="flex items-center gap-1.5 ml-1">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToWorkspaceIndex(idx)}
                        aria-label={`Lihat pilihan ke-${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          activeWorkspaceIndex === idx
                            ? "w-6 bg-neutral-950"
                            : "w-2 bg-neutral-950/25 hover:bg-neutral-950/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Full-Bleed Horizontally Scrollable Cards Track */}
            <div className="w-full flex-1 min-w-0 overflow-hidden">
              <div
                ref={yellowCardsRef}
                onScroll={handleWorkspaceScroll}
                onMouseDown={handleWorkspaceMouseDown}
                onMouseMove={handleWorkspaceMouseMove}
                onMouseUp={handleWorkspaceMouseUpOrLeave}
                onMouseLeave={handleWorkspaceMouseUpOrLeave}
                className="flex gap-6 sm:gap-7 overflow-x-auto scroll-smooth py-6 pr-6 sm:pr-10 lg:pr-24 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* Card 1: Kantor Privat (private_office) - Orange Backdrop Accent */}
                <div className="w-[300px] sm:w-[340px] md:w-[360px] lg:w-[370px] shrink-0 snap-start bg-white rounded-3xl p-8 sm:p-9 flex flex-col justify-between shadow-xl border border-white/80 transition-transform duration-200 hover:-translate-y-1.5">
                  <div>
                    {/* Line art illustration with Orange accent shape */}
                    <div className="h-44 w-full flex items-center justify-center mb-6 pointer-events-none">
                      <svg
                        className="h-36 w-auto"
                        fill="none"
                        viewBox="0 0 200 160"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          fill="#FF4612"
                          fillOpacity="0.9"
                          height="75"
                          rx="12"
                          width="70"
                          x="25"
                          y="35"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="46"
                          rx="4"
                          stroke="#111111"
                          strokeWidth="3"
                          width="68"
                          x="55"
                          y="32"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="89" x2="89" y1="78" y2="92" />
                        <line
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3"
                          x1="75"
                          x2="103"
                          y1="92"
                          y2="92"
                        />
                        <line
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                          x1="20"
                          x2="160"
                          y1="94"
                          y2="94"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="35" x2="35" y1="94" y2="140" />
                        <line stroke="#111111" strokeWidth="3" x1="145" x2="145" y1="94" y2="140" />
                        <rect
                          fill="#FFFFFF"
                          height="42"
                          rx="6"
                          stroke="#111111"
                          strokeWidth="3"
                          width="34"
                          x="74"
                          y="55"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="91" x2="91" y1="97" y2="125" />
                        <path
                          d="M72 135 L91 125 L110 135"
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-950">Kantor Privat</h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-medium">
                      Ruang eksklusif untuk tim kecil dengan privasi maksimal dan fasilitas lengkap.
                    </p>
                    <p className="mt-4 text-xs font-bold text-brand-orange">
                      Mulai Rp 75.000 / jam
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      2–6 Orang
                    </span>
                    <Link
                      className="text-brand-dark hover:text-brand-purple inline-flex items-center gap-1 transition-colors"
                      href="/spaces?tipe=private_office"
                    >
                      Lihat Rincian →
                    </Link>
                  </div>
                </div>

                {/* Card 2: Meja Mandiri (desk) - Yellow Backdrop Accent */}
                <div className="w-[300px] sm:w-[340px] md:w-[360px] lg:w-[370px] shrink-0 snap-start bg-white rounded-3xl p-8 sm:p-9 flex flex-col justify-between shadow-xl border border-white/80 transition-transform duration-200 hover:-translate-y-1.5">
                  <div>
                    {/* Line art illustration with Yellow accent shape */}
                    <div className="h-44 w-full flex items-center justify-center mb-6 pointer-events-none">
                      <svg
                        className="h-36 w-auto"
                        fill="none"
                        viewBox="0 0 200 160"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          fill="#FFD500"
                          fillOpacity="0.95"
                          height="75"
                          rx="12"
                          width="85"
                          x="80"
                          y="28"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="38"
                          rx="4"
                          stroke="#111111"
                          strokeWidth="3"
                          width="55"
                          x="42"
                          y="32"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="38"
                          rx="4"
                          stroke="#111111"
                          strokeWidth="3"
                          width="55"
                          x="103"
                          y="32"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="69" x2="69" y1="70" y2="82" />
                        <line stroke="#111111" strokeWidth="3" x1="130" x2="130" y1="70" y2="82" />
                        <line
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                          x1="25"
                          x2="175"
                          y1="84"
                          y2="84"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="38" x2="38" y1="84" y2="138" />
                        <line stroke="#111111" strokeWidth="3" x1="162" x2="162" y1="84" y2="138" />
                        <rect
                          fill="#FFFFFF"
                          height="42"
                          rx="8"
                          stroke="#111111"
                          strokeWidth="3"
                          width="48"
                          x="76"
                          y="60"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="100" x2="100" y1="102" y2="128" />
                        <path
                          d="M80 138 L100 128 L120 138"
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-950">Meja Mandiri</h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-medium">
                      Meja kerja personal yang tenang dengan internet stabil dan akses fleksibel.
                    </p>
                    <p className="mt-4 text-xs font-bold text-brand-purple">
                      Mulai Rp 20.000 / jam
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      1 Orang
                    </span>
                    <Link
                      className="text-brand-dark hover:text-brand-purple inline-flex items-center gap-1 transition-colors"
                      href="/spaces?tipe=desk"
                    >
                      Lihat Rincian →
                    </Link>
                  </div>
                </div>

                {/* Card 3: Ruang Rapat (meeting_room) - Purple Backdrop Accent */}
                <div className="w-[300px] sm:w-[340px] md:w-[360px] lg:w-[370px] shrink-0 snap-start bg-white rounded-3xl p-8 sm:p-9 flex flex-col justify-between shadow-xl border border-white/80 transition-transform duration-200 hover:-translate-y-1.5">
                  <div>
                    {/* Line art illustration with Purple accent shape */}
                    <div className="h-44 w-full flex items-center justify-center mb-6 pointer-events-none">
                      <svg
                        className="h-36 w-auto"
                        fill="none"
                        viewBox="0 0 200 160"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          fill="#5E43F3"
                          fillOpacity="0.9"
                          height="75"
                          rx="12"
                          width="82"
                          x="59"
                          y="24"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="46"
                          rx="4"
                          stroke="#111111"
                          strokeWidth="3"
                          width="78"
                          x="61"
                          y="24"
                        />
                        <rect
                          fill="#111111"
                          height="5"
                          rx="2"
                          width="22"
                          x="89"
                          y="19"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="100" x2="100" y1="70" y2="86" />
                        <line
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                          x1="18"
                          x2="182"
                          y1="88"
                          y2="88"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="32" x2="32" y1="88" y2="138" />
                        <line stroke="#111111" strokeWidth="3" x1="168" x2="168" y1="88" y2="138" />
                        <line stroke="#111111" strokeWidth="2.5" x1="100" x2="100" y1="88" y2="138" strokeDasharray="3 3" />
                        <rect
                          fill="#FFFFFF"
                          height="36"
                          rx="6"
                          stroke="#111111"
                          strokeWidth="2.5"
                          width="28"
                          x="38"
                          y="66"
                        />
                        <line stroke="#111111" strokeWidth="2.5" x1="52" x2="52" y1="102" y2="126" />
                        <path
                          d="M42 133 L52 126 L62 133"
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="2.5"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="40"
                          rx="6"
                          stroke="#111111"
                          strokeWidth="3"
                          width="34"
                          x="83"
                          y="58"
                        />
                        <line stroke="#111111" strokeWidth="3" x1="100" x2="100" y1="98" y2="128" />
                        <path
                          d="M87 135 L100 128 L113 135"
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="3"
                        />
                        <rect
                          fill="#FFFFFF"
                          height="36"
                          rx="6"
                          stroke="#111111"
                          strokeWidth="2.5"
                          width="28"
                          x="134"
                          y="66"
                        />
                        <line stroke="#111111" strokeWidth="2.5" x1="148" x2="148" y1="102" y2="126" />
                        <path
                          d="M138 133 L148 126 L158 133"
                          stroke="#111111"
                          strokeLinecap="round"
                          strokeWidth="2.5"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-950">Ruang Rapat</h3>
                    <p className="mt-2 text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-medium">
                      Ruang kedap suara dengan Smart TV & fasilitas presentasi profesional.
                    </p>
                    <p className="mt-4 text-xs font-bold text-brand-purple">
                      Mulai Rp 100.000 / jam
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      8–12 Orang
                    </span>
                    <Link
                      className="text-brand-dark hover:text-brand-purple inline-flex items-center gap-1 transition-colors"
                      href="/spaces?tipe=meeting_room"
                    >
                      Lihat Rincian →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. WORKSPACES NEAR YOU SECTION ───────────────────────────────────── */}
      <section
        ref={workspacesRef}
        className="py-24 px-6 lg:px-12 max-w-7xl mx-auto w-full"
        id="workspaces"
      >
        {/* Section Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
            Ruang Kerja di Sekitar Anda
          </h2>
          <Link
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-800 hover:border-neutral-900 transition-colors w-fit"
            href="/spaces"
          >
            <span>Lihat Selengkapnya →</span>
          </Link>
        </div>

        {/* 2x2 Grid of Workspace Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="workspace-card group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-100">
              <img
                alt="Interior Ruang Kerja Legian"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYb04jw7agN_xj55iAiWq2b7FDNMVRfLHAf6diFPbeZpNuiBZ0292E-AsXGfZgajmrSbbq5UsUuEc00ep-MTPTSQSGkhsmdumN2AOndsn0GUDWRKg-DdvWGpXI5yaVhiKBXpiniUShyZvHCHTawNynpLMK00Yuf7lTbA2hXihR_lcIuQfLj1j1ncaNRd51iKVUfHZ0VpaEJIUXPWEcJ0AkzPmZ0hsPBtShxDeTkX7EVafNOY3slM1Ukw"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#5E43F3] text-[10px] font-extrabold uppercase tracking-wider text-white rounded-full">
                  BARU
                </span>
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-emerald-700 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight">
                  Rp 20.000<span className="text-sm font-normal text-neutral-500 font-sans"> / jam</span>
                </span>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">👤 1 Orang</span>
                  <span className="flex items-center gap-1">📶 100 Mbps</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Jalan Raya Legian, Kuta, Bali</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
                <Link
                  className="px-4 py-2 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-semibold rounded-lg transition-colors"
                  href="/spaces"
                >
                  Pesan Meja Ini →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="workspace-card group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-100">
              <img
                alt="Ruang Kerja Tangga Kayu Petitenget"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHW5lUpJzmiyImd-hXKkTfRXVAFMg8xdqRqxvNc6lAkB24QlEw9DesQ0Pxx_zRGLJmSrXHRg8kSL08tFrX2MQQubfXK6vAb1a7wfCvJyQHTPV-7GjfNnVS3S_rFkZUXhzvgFE19BprTXlR2zzF-GtqSNcc2jAsjDFZ9dwwNi6W6aWxbHb_wkN6luaHh3nAdfCU1DGQpw14HX4XIXoaggY9BGlAngUEpp4d5L0kAtrwJTCzKsSdlWqtEg"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-emerald-700 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight">
                  Rp 20.000<span className="text-sm font-normal text-neutral-500 font-sans"> / jam</span>
                </span>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">👤 1 Orang</span>
                  <span className="flex items-center gap-1">📶 100 Mbps</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Jalan Petitenget, Seminyak, Bali</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
                <Link
                  className="px-4 py-2 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold rounded-lg transition-colors"
                  href="/spaces"
                >
                  Pesan Meja Ini →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="workspace-card group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-100">
              <img
                alt="Ruang Kerja Pod Kaca Ubud"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6RLLAyxWIpB9bkYJz2R087X3O1vjR5FWuHXOTfxz7Q5vi4vgO9sJ5NVyu0WOgZu6hCKyHPiV2X2nrsgWLJm5_tVF7jaryb3ZSVlQaRBo7FelTS68C3lrOO-EDjbpjY3jUWJ_nOIAZGmw6U8fH1kRWurdWQE1lx5Y6ZXcEVMR4_nAPEI6vK8TuH9BNZwep0XbOEmWK1QH0quhBwyT2qKNzAZEmP0L81zPREqvyNc4pmIwTxm7DCyC6Qw"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-emerald-700 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight">
                  Rp 20.000<span className="text-sm font-normal text-neutral-500 font-sans"> / jam</span>
                </span>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">👤 1 Orang</span>
                  <span className="flex items-center gap-1">📶 100 Mbps</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Jalan Monkey Forest, Ubud, Bali</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
                <Link
                  className="px-4 py-2 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold rounded-lg transition-colors"
                  href="/spaces"
                >
                  Pesan Meja Ini →
                </Link>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="workspace-card group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-100">
              <img
                alt="Coworking Modern Beach Street Seminyak"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTW--bE9JX12HG9aC2aeJxyi8HISMd0h6FYXIY_Mxrq2dpyM7O2773PMB3rnstVGwEnZ5898VpHA-H_lfRcalcVDWSp-NzjAJYbi5FDw_Hz1h2eC1uoH6eC13b9olsvQvzBOLmboNjCl50juij8iK61ZwngK4gley4nIHHtrOOUKnYi9v5Enaz2PdCTDgjKH2IYEI28Zi3SpaxuQ-Nc5xadj6ATBO6XTb8iziMnHypbocgRw5A7YkjA"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-[11px] font-semibold text-emerald-700 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-neutral-950 font-mono tracking-tight">
                  Rp 20.000<span className="text-sm font-normal text-neutral-500 font-sans"> / jam</span>
                </span>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">👤 1 Orang</span>
                  <span className="flex items-center gap-1">📶 100 Mbps</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Beach Street, Seminyak, Bali</p>
              <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Tersedia Hari Ini
                </span>
                <Link
                  className="px-4 py-2 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-semibold rounded-lg transition-colors"
                  href="/spaces"
                >
                  Pesan Meja Ini →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. TYPOGRAPHIC STATEMENT SECTION (SOLID VERMILION ORANGE #FF4612) ─── */}
      <section
        ref={orangeBannerRef}
        className="w-full bg-brand-orange py-24 sm:py-32 md:py-44 lg:py-52 flex items-center justify-center overflow-hidden scroll-mt-16"
        id="community"
      >
        <span id="komunitas" className="sr-only" />
        <div className="text-center px-4 w-full flex items-center justify-center">
          <h2
            className="font-sans font-bold text-white text-center leading-none tracking-tight select-none"
            style={{ fontSize: "clamp(4.5rem, 14vw, 11rem)" }}
          >
            Komunitas
          </h2>
        </div>
      </section>

      {/* ─── 6. CONSULTATION MATCHING FORM SECTION ────────────────────────────── */}
      <section
        className="relative py-24 sm:py-32 px-6 flex items-center justify-center bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB2R5NWPHzKstc4mkqmhd0vbcDKbrba7-MQgep3PR0h68LZvBtAH6t7fcaF7IUSJ49vRGJCaM_QhAyqMppXL32Ttp1mQTA9HcGzgSM65bOhjr4BkJALdISvGpVZLz3d87Pj5lrp5FNlnaNrm8JsEJxAaA4diFGuTywJd6y4vPgOT6U2nh1bYbIdKI5r1tu70w2n8xHZKuuij6r1gSP8S2EaKi_3j3A3eZE1p-0bzn-AZryCyS6Xun5Tng")`,
        }}
      >
        {/* Elevated Floating Form Card */}
        <div
          ref={consultCardRef}
          className="relative z-10 w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-neutral-100"
        >
          <div className="text-center max-w-lg mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
              Biarkan kami membantu menemukan ruang kerja ideal Anda
            </h3>
            <p className="mt-2.5 text-xs text-neutral-500 leading-relaxed">
              Tuliskan kebutuhan tim Anda dan tim kami akan memberikan kurasi lokasi terbaik.
            </p>
          </div>

          {/* 2-Column Form Fields */}
          <form className="space-y-4" onSubmit={handleConsultationSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Nama Lengkap*"
                  required
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Alamat Email*"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Nama Perusahaan*"
                  type="text"
                  value={formData.perusahaan}
                  onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Nomor Telepon*"
                  required
                  type="tel"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Pilihan Lokasi*"
                  required
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                />
              </div>
              <div>
                <input
                  className="w-full text-xs px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple placeholder:text-neutral-400 focus:outline-none transition-all"
                  placeholder="Jumlah Anggota Tim*"
                  type="text"
                  value={formData.anggota}
                  onChange={(e) => setFormData({ ...formData, anggota: e.target.value })}
                />
              </div>
            </div>
            <p className="text-[11px] text-center text-neutral-400 pt-2 leading-relaxed">
              Dengan mengklik tombol di atas, Anda menyetujui Ketentuan Layanan
              <br className="hidden sm:inline" />
              {" "}dan Kebijakan Privasi kami.
            </p>
            <div className="pt-2">
              <button
                className="w-full py-4 bg-brand-purple hover:bg-brand-purple-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-purple/25 transition duration-150 disabled:opacity-50"
                type="submit"
                disabled={isSubmittingConsultation}
              >
                {isSubmittingConsultation ? "Mengirim Permintaan..." : "Dapatkan Rekomendasi Ruang"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── 7. TESTIMONIAL & COMMUNITY STORY STRIP SECTION ──────────────────── */}
      <section className="bg-white pt-20 pb-0 overflow-hidden">
        {/* Testimonial Quote Area */}
        <div className="max-w-4xl mx-auto px-6 text-center relative mb-16">
          {/* Quotation Glyph */}
          <div className="flex justify-center mb-8">
            <svg className="w-10 h-10 text-neutral-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"></path>
            </svg>
          </div>
          {/* Left & Right Arrow Buttons flanking the quote */}
          <div className="flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 px-2 sm:px-0 pointer-events-none">
            <button
              aria-label="Testimoni sebelumnya"
              className="pointer-events-auto w-11 h-11 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition-colors shadow-sm"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
            <button
              aria-label="Testimoni selanjutnya"
              className="pointer-events-auto w-11 h-11 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:border-neutral-400 transition-colors shadow-sm"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
          {/* Testimonial Text & Author */}
          <p className="text-xl sm:text-2xl font-normal text-neutral-800 leading-relaxed max-w-2xl mx-auto tracking-tight">
            Bekerja secara nomaden bersama tim membutuhkan kepastian fasilitas. Urspace memastikan kami selalu mendapatkan meja yang bersih, tenang, dan internet berkecepatan tinggi.
          </p>
          <p className="mt-8 text-sm font-medium text-neutral-400 tracking-normal">
            Sophia William
          </p>
        </div>

        {/* Flush 5-Column Community Portrait & Story Strip (Edge-to-Edge) */}
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-0 border-t border-neutral-100">
          {/* Column 1: Asian Male nomad in beanie/jacket */}
          <div className="w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-neutral-200 relative">
            <img
              alt="Potret anggota nomad"
              className="w-full h-full object-cover grayscale contrast-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_o-kHBggvQhNKap2If35Mv5ZOJIXhes19yjW4f1m7eI0EFtAdxhqIFWdOgSMMg8QCtJT8QxByZHDP1QPlw61bOOUnJp6QYS25meOsTBTpGhAESrwTkVRZ5S7S3j_JdaDrg6qxDXu2iYLECK3I8MG8tMQeWzimm9nbYzWi0T_NffPIzeVSTphwjQrtBGNRsglDpKCkKfJwmyjMfqDSy97v2GijZOKKylSQmPPgxakRA8apaYjo1soOZA"
            />
          </div>
          {/* Column 2: Female nomad portrait (grayscale) */}
          <div className="w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-neutral-200 relative">
            <img
              alt="Potret anggota nomad"
              className="w-full h-full object-cover grayscale contrast-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwLeVBjwnz9-PHDFPuSRuvn6gA0XVb0AwKVRIdltz39QoIWdfM-nMOlU13tuclp6c1EmdH9rxjnXZpeWRdlWNe0-pbkNCgKWiFIau-RjKW-UJh0uKULlFd77-dGTkzaesFVp3YaWh_-R4qFvxgAJIFsgHR_UZ1MywcHfSx9E1IwtnkAIk6ewztLjk_jzIjKw8AikhY503GyP-tpEzW0bZal3Q0A1tyKo9i81dOgD8Hht91v4aPEn1NXg"
            />
          </div>
          {/* Column 3: Male nomad portrait with cap/hoodie */}
          <div className="w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-neutral-200 relative">
            <img
              alt="Potret anggota nomad"
              className="w-full h-full object-cover grayscale contrast-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKfaBOO-mAmrZRI3UXEexYatnvkGYTro5n6054NEJ3TQGOwqJyCm_tXQW78Vp2lymNELdMTQSELxKFZese0hxD7YyE_2Bl-OIyA-h8tMlR9Jb4aOgFAJt_ewJl-hEgaHHBBIHG_GjlJXUzkJwL1fKZH5rQqGUFvF8MkBluVz1eIYCUBKDZiqCah8OgDN_yBSxpIH34PidjWyF7tUuljy4oDcwMN7IB9DwjaZOn2sdODC2InXimp_9cmw"
            />
          </div>
          {/* Column 4: Tell us your story Purple Card */}
          <div className="w-full h-72 sm:h-80 md:h-96 bg-brand-purple p-8 sm:p-10 flex flex-col justify-between text-white relative">
            <h4 className="text-3xl sm:text-4xl font-bold leading-[1.15] text-white tracking-tight pt-2 font-display">
              Bagikan
              <br />
              Cerita Anda
            </h4>
            <div className="pb-2">
              <Link
                href="/register"
                className="w-full py-3 px-6 bg-neutral-950 hover:bg-black text-white text-xs font-semibold rounded-full tracking-wide transition duration-150 inline-block text-center"
              >
                Gabung Komunitas →
              </Link>
            </div>
          </div>
          {/* Column 5: Female nomad portrait */}
          <div className="w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-neutral-200 relative col-span-2 md:col-span-1">
            <img
              alt="Potret anggota nomad"
              className="w-full h-full object-cover grayscale contrast-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiQHva10bzOoM6bPl8bQrUi4UQDb_FpViBaikPCrWjTNS8h0sIZXZ4WzOfhrXLlZXnEjXLdlagDw85c8UdGVTAKXcdaXmFAGwP7WgeSIbNgzbzo1-mhg4YQ3M2vfP6wdQhesdeaG98gEPMQDygpAN49ywJjQOO5TuVK1N8RSJmgwLRHvD5C1A6R25wgAu3gLDvb3rmQdnTwbQOxbqsAtF1Zx-sxsGO_tagWISDOwLz0vHgTE3Ty9cBvQ"
            />
          </div>
        </div>
      </section>

      {/* ─── 8. EDITORIAL FOOTER ─────────────────────────────────────────────── */}
      <GlobalFooter />
    </div>
  );
}
