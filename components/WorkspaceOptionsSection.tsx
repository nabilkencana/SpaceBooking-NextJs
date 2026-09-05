"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { User, Users } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface WorkspaceOption {
  id: number;
  title: string;
  category: string;
  desc: string;
  price: string;
  priceColor: string;
  capacity: string;
  isSingleUser?: boolean;
  href: string;
  illustrationType: "private_office" | "desk" | "meeting_room" | "dedicated_studio";
}

const SPACES_DATA: WorkspaceOption[] = [
  {
    id: 1,
    title: "Kantor Privat",
    category: "private_office",
    desc: "Ruang kerja mandiri kedap suara dengan sistem akses kunci digital dan fasilitas kantor eksklusif untuk tim kecil.",
    price: "Mulai Rp 75.000 / jam",
    priceColor: "text-brand-orange",
    capacity: "2–6 Orang",
    href: "/spaces?tipe=private_office",
    illustrationType: "private_office",
  },
  {
    id: 2,
    title: "Meja Mandiri",
    category: "desk",
    desc: "Meja kerja personal ergonomis dengan sambungan listrik mandiri, monitor tambahan, dan koneksi internet stabil.",
    price: "Mulai Rp 20.000 / jam",
    priceColor: "text-brand-purple",
    capacity: "1 Orang",
    isSingleUser: true,
    href: "/spaces?tipe=desk",
    illustrationType: "desk",
  },
  {
    id: 3,
    title: "Ruang Rapat",
    category: "meeting_room",
    desc: "Ruang presentasi kedap suara berkapasitas fleksibel dengan fasilitas smart screen 4K dan papan tulis kaca.",
    price: "Mulai Rp 100.000 / jam",
    priceColor: "text-brand-purple",
    capacity: "8–12 Orang",
    href: "/spaces?tipe=meeting_room",
    illustrationType: "meeting_room",
  },
  {
    id: 4,
    title: "Dedicated Studio",
    category: "private_office",
    desc: "Area kerja semi-terbuka berkonsep studio untuk lokakarya, sesi curah gagasan tim, dan presentasi produk.",
    price: "Mulai Rp 250.000 / jam",
    priceColor: "text-emerald-600",
    capacity: "10–25 Orang",
    href: "/spaces?tipe=private_office",
    illustrationType: "dedicated_studio",
  },
];

export function WorkspaceOptionsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textBlockRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const section = sectionRef.current;
        const textBlock = textBlockRef.current;
        const track = trackRef.current;

        if (!section || !track || !textBlock) return;

        // Total horizontal sweep distance to pull all cards across the full screen
        const getScrollDistance = () => {
          return track.scrollWidth - window.innerWidth + 140;
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: 1.4, // Silky smooth inertia damping
            start: "top top",
            end: () => `+=${track.scrollWidth + window.innerHeight * 0.45}`, // Cinematic pacing
            invalidateOnRefresh: true,
          },
        });

        // 1. Sweep jumbo cards from right across the entire viewport to the left with GPU acceleration
        tl.to(
          track,
          {
            x: () => -getScrollDistance(),
            ease: "none",
            force3D: true,
          },
          0
        );

        // 2. Softly dissolve text with optical depth as cards roll across on top of it
        tl.to(
          textBlock,
          {
            opacity: 0.05,
            x: -50,
            scale: 0.96,
            filter: "blur(6px)",
            ease: "power2.out",
            duration: 0.35,
          },
          0.05
        );

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });
    }, sectionRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const renderIllustration = (type: WorkspaceOption["illustrationType"]) => {
    switch (type) {
      case "private_office":
        return (
          <svg
            className="h-36 sm:h-40 w-auto"
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
        );
      case "desk":
        return (
          <svg
            className="h-36 sm:h-40 w-auto"
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
        );
      case "meeting_room":
        return (
          <svg
            className="h-36 sm:h-40 w-auto"
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
        );
      case "dedicated_studio":
        return (
          <svg
            className="h-36 sm:h-40 w-auto"
            fill="none"
            viewBox="0 0 200 160"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Emerald Accent Shape */}
            <rect
              fill="#10B981"
              fillOpacity="0.9"
              height="75"
              rx="12"
              width="88"
              x="45"
              y="28"
            />
            {/* Left Desk Screen */}
            <rect
              fill="#FFFFFF"
              height="36"
              rx="4"
              stroke="#111111"
              strokeWidth="3"
              width="50"
              x="32"
              y="36"
            />
            {/* Right Desk Screen */}
            <rect
              fill="#FFFFFF"
              height="36"
              rx="4"
              stroke="#111111"
              strokeWidth="3"
              width="50"
              x="95"
              y="36"
            />
            {/* Screen Stands */}
            <line stroke="#111111" strokeWidth="3" x1="57" x2="57" y1="72" y2="84" />
            <line stroke="#111111" strokeWidth="3" x1="120" x2="120" y1="72" y2="84" />
            {/* Main Studio Desk Surface */}
            <line
              stroke="#111111"
              strokeLinecap="round"
              strokeWidth="3.5"
              x1="20"
              x2="180"
              y1="86"
              y2="86"
            />
            {/* Desk Legs */}
            <line stroke="#111111" strokeWidth="3" x1="32" x2="32" y1="86" y2="138" />
            <line stroke="#111111" strokeWidth="3" x1="168" x2="168" y1="86" y2="138" />
            {/* Studio Partition Divider */}
            <line stroke="#111111" strokeWidth="2.5" strokeDasharray="3 3" x1="88" x2="88" y1="86" y2="138" />
            {/* Left Ergonomic Chair */}
            <rect
              fill="#FFFFFF"
              height="38"
              rx="6"
              stroke="#111111"
              strokeWidth="2.5"
              width="32"
              x="42"
              y="62"
            />
            <line stroke="#111111" strokeWidth="2.5" x1="58" x2="58" y1="100" y2="126" />
            <path
              d="M48 132 L58 126 L68 132"
              stroke="#111111"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            {/* Right Ergonomic Chair */}
            <rect
              fill="#FFFFFF"
              height="38"
              rx="6"
              stroke="#111111"
              strokeWidth="2.5"
              width="32"
              x="105"
              y="62"
            />
            <line stroke="#111111" strokeWidth="2.5" x1="121" x2="121" y1="100" y2="126" />
            <path
              d="M111 132 L121 126 L131 132"
              stroke="#111111"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        );
    }
  };

  return (
    <div className="relative z-10 w-full bg-[#FFD500] clear-both overflow-hidden">
      <section
        ref={sectionRef}
        id="options"
        className="w-full lg:h-screen bg-[#FFD500] flex flex-col lg:flex-row lg:items-center relative overflow-hidden py-16 lg:py-0"
      >
        {/* Layer 1: Teks Pengantar di Belakang (z-10 pada Desktop) */}
        <div
          ref={textBlockRef}
          className="w-full lg:w-auto lg:absolute left-6 sm:left-12 lg:left-20 xl:left-28 max-w-md z-10 select-none will-change-transform px-6 sm:px-8 lg:px-0 mb-10 lg:mb-0"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
            Pilihan Ruang Kerja
            <br />
            untuk Setiap Kebutuhan
          </h2>
          <p className="text-base text-[#111827]/85 mt-6 leading-relaxed font-medium">
            Tersedia beragam opsi ruang kerja fleksibel yang siap mendukung produktivitas individu hingga kolaborasi tim besar.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link
              href="#workspaces"
              className="inline-block border-2 border-[#111827] text-[#111827] text-sm font-bold px-7 py-3.5 rounded-full hover:bg-[#111827] hover:text-white transition-all shadow-sm"
            >
              Lihat Semua Pilihan Ruang →
            </Link>
          </div>
        </div>

        {/* Layer 2: Track Kartu Jumbo Bergerak Melintasi Layar Penuh (z-20) */}
        <div className="w-full lg:h-full flex items-center z-20 pointer-events-none overflow-x-auto lg:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory lg:snap-none">
          <div
            ref={trackRef}
            className="flex items-center gap-8 will-change-transform pointer-events-auto px-6 lg:px-0 lg:pl-[48vw] xl:pl-[44vw] lg:pr-32 py-4 transform-gpu [backface-visibility:hidden]"
          >
            {SPACES_DATA.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-black/5 w-[340px] sm:w-[400px] lg:w-[440px] xl:w-[460px] shrink-0 snap-start flex flex-col justify-between h-[520px] sm:h-[560px] lg:h-[580px] transition-transform duration-300 hover:-translate-y-2 transform-gpu [backface-visibility:hidden]"
              >
                <div>
                  {/* Ilustrasi Garis Arsitektural */}
                  <div className="h-40 w-full flex items-center justify-center mb-6 pointer-events-none">
                    {renderIllustration(item.illustrationType)}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 mt-4 leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                  <p className={`text-base sm:text-lg font-bold mt-6 ${item.priceColor}`}>
                    {item.price}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                  <span className="font-semibold flex items-center gap-1.5">
                    {item.isSingleUser ? (
                      <User className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <Users className="w-4 h-4 text-neutral-400" />
                    )}
                    {item.capacity}
                  </span>
                  <Link
                    href={item.href}
                    className="font-bold text-[#111827] hover:text-[#5E43F3] transition-colors inline-flex items-center gap-1.5"
                  >
                    Lihat Rincian →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkspaceOptionsSection;
