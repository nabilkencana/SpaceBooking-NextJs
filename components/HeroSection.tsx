"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface HeroSectionProps {
  onLocationChange?: (loc: string) => void;
}

export function HeroSection({ onLocationChange }: HeroSectionProps) {
  const [selectedLocation, setSelectedLocation] = useState("Bali, Indonesia");

  // DOM Refs
  const sectionRef = useRef<HTMLElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const filterBoxRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);
  const narrativeRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLAnchorElement>(null);

  // Tasteful, subtle 3D tilt interaction (responsive & non-intrusive)
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || typeof window === "undefined") return;

    const section = sectionRef.current;
    if (!section || !heroCardRef.current) return;

    const rect = section.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    // Subtle 3D perspective tilt (max 5 degrees)
    gsap.to(heroCardRef.current, {
      rotateY: x * 5,
      rotateX: -y * 5,
      transformPerspective: 1000,
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
    });

    // Subtle background parallax response
    if (bgImageRef.current) {
      gsap.to(bgImageRef.current, {
        x: -x * 8,
        y: -y * 8,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handlePointerLeave = () => {
    if (heroCardRef.current) {
      gsap.to(heroCardRef.current, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: "power3.out",
        overwrite: "auto",
      });
    }

    if (bgImageRef.current) {
      gsap.to(bgImageRef.current, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        overwrite: "auto",
      });
    }
  };

  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLocation(val);
    onLocationChange?.(val);
  };

  // Ensure video plays smoothly across all browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be deferred until user interaction on strict browser policies
      });
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Background subtle entrance zoom & scroll parallax
      if (bgImageRef.current) {
        gsap.fromTo(
          bgImageRef.current,
          { scale: 1.08 },
          { scale: 1.02, duration: 1.8, ease: "power2.out" }
        );

        gsap.to(bgImageRef.current, {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // 2. Card Floating Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (heroCardRef.current) {
        tl.fromTo(
          heroCardRef.current,
          { opacity: 0, y: 35, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, delay: 0.1 }
        );
      }

      // 3. Staggered reveal for headline lines
      const lines = headlineRef.current?.querySelectorAll(".headline-line");
      if (lines && lines.length > 0) {
        tl.fromTo(
          lines,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: "power2.out" },
          "-=0.55"
        );
      }

      // 4. Staggered reveal for card body elements
      const bodyElements = [
        descRef.current,
        filterBoxRef.current,
        ctaBtnRef.current,
        narrativeRef.current,
      ].filter(Boolean);

      if (bodyElements.length > 0) {
        tl.fromTo(
          bodyElements,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" },
          "-=0.4"
        );
      }

      // 5. Scroll Down Indicator entrance & continuous gentle bobbing
      if (scrollIndicatorRef.current) {
        tl.fromTo(
          scrollIndicatorRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.8)" },
          "-=0.3"
        );

        gsap.to(scrollIndicatorRef.current, {
          y: 7,
          repeat: -1,
          yoyo: true,
          duration: 1.3,
          ease: "sine.inOut",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[820px] lg:min-h-[880px] flex items-center justify-center px-4 py-20 overflow-hidden"
    >
      {/* ─── 1. BACKGROUND VIDEO WITH SCROLL PARALLAX ───────────────────────── */}
      <div className="absolute inset-[-20px] z-0 overflow-hidden pointer-events-none">
        <div
          ref={bgImageRef}
          className="relative w-full h-full will-change-transform"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            poster="https://lh3.googleusercontent.com/aida-public/AB6AXuAS1FOOfdYAxXVlD7DtF6xRVNYvd2UyMR-VzvngwcqW2SBoboyI5LIR3BtbEQbqDgc7ucgN5mhTVxCY2KQR_JnMyVb3Om9LsVsTbjw7aK4zvnt0WZPyR51LZ2UbhBB6T2p6T9s1jqbo4ZqqsEa64yfcaNruXBKJsyfvww4sFj1dzUkoQj0u8GfUq3O7bl799Cv6SnjMq2IXI2vFFuRvTxWeu13nz4BTL4USLG9z6Miboz1t3WaNieG5zA"
          >
            <source src="/videos/video_preview_h264.mp4" type="video/mp4" />
          </video>
          {/* Subtle cinematic tint for optimal text & card contrast */}
          <div className="absolute inset-0 bg-black/25" />
        </div>
      </div>

      {/* ─── 2. HERO FLOATING ELEVATED CARD ─────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-xl mx-auto [perspective:1000px]">
        <div
          ref={heroCardRef}
          style={{ transformStyle: "preserve-3d" }}
          className="relative bg-white rounded-2xl p-8 sm:p-12 shadow-2xl text-center border border-white/60 transition-shadow duration-300 will-change-transform"
        >
          {/* Headline (Clean solid typography matching the website design) */}
          <h1
            ref={headlineRef}
            className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-neutral-950 leading-[1.2] tracking-tight"
          >
            <span className="headline-line block overflow-hidden pb-0.5">
              Temukan Ruang Kerja
            </span>
            <span className="headline-line block overflow-hidden pb-0.5">
              Ideal untuk
            </span>
            <span className="headline-line block overflow-hidden pb-0.5">
              Digital Nomad
            </span>
          </h1>

          {/* Subtitle Description */}
          <p
            ref={descRef}
            className="mt-4 text-sm text-neutral-600 max-w-md mx-auto leading-relaxed"
          >
            Akses meja kerja fleksibel, kantor privat, dan ruang rapat di pusat produktivitas terbaik.
          </p>

          {/* Filter Dropdown & Button Form */}
          <div
            ref={filterBoxRef}
            className="hero-filter-box mt-8 space-y-4 max-w-md mx-auto"
          >
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
                      onChange={handleLocationSelect}
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
              ref={ctaBtnRef}
              href="/spaces"
              className="hero-cta-btn w-full py-4 px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-purple/25 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2 group"
            >
              <span>Cari Ruang Kerja</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Descriptive Nomad Narrative */}
          <p
            ref={narrativeRef}
            className="mt-8 text-xs sm:text-[13px] leading-relaxed text-neutral-600 max-w-md mx-auto"
          >
            Nikmati kebebasan gaya hidup digital nomad seutuhnya dengan ruang kerja yang dirancang khusus untuk kenyamanan dan produktivitas Anda di berbagai penjuru nusantara.
          </p>
        </div>
      </div>

      {/* ─── 3. SCROLL DOWN PILL INDICATOR ──────────────────────────────────── */}
      <a
        ref={scrollIndicatorRef}
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
  );
}

export default HeroSection;
