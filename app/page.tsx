"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { User, Users, Wifi } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import MotionFooter from "@/components/ui/motion-footer";
import { WorkspaceOptionsSection } from "@/components/WorkspaceOptionsSection";
import { AvailableSpacesSection } from "@/components/AvailableSpacesSection";
import { CommunityConsultationCurtain } from "@/components/CommunityConsultationCurtain";
import { SplitText } from "@/components/ui/SplitText";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });

const TESTIMONIALS = [
  {
    quote:
      "Bekerja secara nomaden bersama tim membutuhkan kepastian fasilitas, dan ruang kerja ini memastikan kami selalu mendapatkan workstation yang andal di setiap destinasi. Fasilitas ini menjadi bagian penting bagi komunitas kami untuk terus terhubung, berkolaborasi, dan berkembang bersama.",
    author: "Sophia William",
  },
  {
    quote:
      "Bekerja secara nomaden bersama tim membutuhkan kepastian fasilitas. Urspace memastikan kami selalu mendapatkan meja yang bersih, tenang, dan internet berkecepatan tinggi di setiap destinasi.",
    author: "Dimas Prasetyo — Studio Lead",
  },
  {
    quote:
      "Suasana kerja di Urspace sangat mendukung produktivitas tinggi. Booking instan tanpa ribet, privasi terjaga, dan fasilitas rapat yang sangat representatif.",
    author: "Nadia Arisanti — Product Manager",
  },
];

export default function UrspaceLandingPage() {
  const [selectedLocation, setSelectedLocation] = useState("Bali, Indonesia");
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  const heroCardRef = useRef<HTMLDivElement>(null);
  const heroScrollIndicatorRef = useRef<HTMLAnchorElement>(null);
  const testimonialSectionRef = useRef<HTMLElement>(null);
  const testimonialContentRef = useRef<HTMLDivElement>(null);
  const isFirstTestimonialRender = useRef(true);
  const communityStripRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Card Floating Entrance & Staggered Elements
      if (heroCardRef.current) {
        gsap.fromTo(
          heroCardRef.current,
          { opacity: 0, y: 35, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", delay: 0.1 }
        );

        const heroElements = heroCardRef.current.querySelectorAll("h1, p, .hero-filter-box, .hero-cta-btn");
        if (heroElements.length > 0) {
          gsap.fromTo(
            heroElements,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.75, stagger: 0.09, ease: "power2.out", delay: 0.25 }
          );
        }
      }

      // Hero Scroll Down Indicator Subtle Bobbing
      if (heroScrollIndicatorRef.current) {
        gsap.to(heroScrollIndicatorRef.current, {
          y: 7,
          repeat: -1,
          yoyo: true,
          duration: 1.3,
          ease: "sine.inOut",
        });
      }



      // 6. Testimonial Section Entrance
      if (testimonialSectionRef.current) {
        const glyph = testimonialSectionRef.current.querySelector(".quote-glyph");
        const body = testimonialSectionRef.current.querySelector(".quote-body");

        if (glyph) {
          gsap.fromTo(
            glyph,
            { opacity: 0, y: -20, scale: 0.9 },
            {
              scrollTrigger: {
                trigger: testimonialSectionRef.current,
                start: "top 78%",
              },
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              ease: "power2.out",
            }
          );
        }

        if (body) {
          gsap.fromTo(
            body,
            { opacity: 0, y: 30 },
            {
              scrollTrigger: {
                trigger: testimonialSectionRef.current,
                start: "top 72%",
              },
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: "power2.out",
            }
          );
        }
      }

      // 7. Community 5-Column Strip Stagger Entrance
      if (communityStripRef.current) {
        const columns = communityStripRef.current.querySelectorAll(".community-col");
        if (columns.length > 0) {
          gsap.fromTo(
            columns,
            { opacity: 0, y: 40 },
            {
              scrollTrigger: {
                trigger: communityStripRef.current,
                start: "top 80%",
              },
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.09,
              ease: "power2.out",
              clearProps: "all",
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, []);

  // Micro-interaction: Smooth GSAP cross-fade when switching testimonials
  useEffect(() => {
    if (isFirstTestimonialRender.current) {
      isFirstTestimonialRender.current = false;
      return;
    }
    if (testimonialContentRef.current) {
      gsap.fromTo(
        testimonialContentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [activeTestimonialIndex]);


  const handlePrevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white text-neutral-900 font-sans antialiased overflow-x-hidden selection:bg-brand-purple selection:text-white min-h-screen flex flex-col">
      <SmoothScroll />
      {/* ─── MAIN CONTENT LAYER (ELEVATED Z-10 WITH BOTTOM SHADOW FOR CURTAIN REVEAL) ─── */}
      <div className="relative z-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
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
          <div className="hero-filter-box mt-8 space-y-4 max-w-md mx-auto">
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
              className="hero-cta-btn w-full py-4 px-6 bg-brand-purple hover:bg-brand-purple-hover text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-purple/25 transition-all duration-150 transform active:scale-[0.99] flex items-center justify-center gap-2"
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
          ref={heroScrollIndicatorRef}
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
      <WorkspaceOptionsSection />

      {/* ─── 4. WORKSPACES NEAR YOU SECTION (INTERACTIVE AUTO-LAYOUT CARDS) ────── */}
      <AvailableSpacesSection />

      {/* ─── 5 & 6. GSAP STACKING CURTAIN: KOMUNITAS TO CONSULTATION FORM ────── */}
      <CommunityConsultationCurtain />

      {/* ─── 7. TESTIMONIAL & COMMUNITY STORY STRIP SECTION ──────────────────── */}
      {/* 1. SEKSI TESTIMONI (QUOTE & CAROUSEL) */}
      <section
        ref={testimonialSectionRef}
        className="w-full bg-white py-28 sm:py-36 md:py-44 lg:py-48 px-6 sm:px-12 border-b border-[#E5E7EB] relative z-20"
      >
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Ikon Kutip Geometris Khas Sesuai Gambar Referensi */}
          <div className="quote-glyph flex justify-center mb-10 md:mb-12">
            <svg
              className="w-12 h-9 sm:w-14 sm:h-10 md:w-16 md:h-12 text-[#E2E8F0]"
              viewBox="0 0 46 34"
              fill="currentColor"
            >
              <path d="M18.5 0L11.5 34H0L7 0H18.5ZM45.5 0L38.5 34H27L34 0H45.5Z" />
            </svg>
          </div>

          {/* Tombol Navigasi Melingkar Kiri & Kanan */}
          <button
            onClick={handlePrevTestimonial}
            aria-label="Testimoni sebelumnya"
            className="hidden md:flex absolute -left-6 lg:-left-16 xl:-left-24 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all cursor-pointer shadow-xs"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={handleNextTestimonial}
            aria-label="Testimoni selanjutnya"
            className="hidden md:flex absolute -right-6 lg:-right-16 xl:-right-24 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full border border-gray-200 bg-white items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all cursor-pointer shadow-xs"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Teks Kutipan & Penulis dengan Animasi Kinetic SplitText (React Bits) */}
          <div ref={testimonialContentRef} className="quote-body">
            <SplitText
              key={`quote-${activeTestimonialIndex}`}
              text={TESTIMONIALS[activeTestimonialIndex].quote}
              className="text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] text-[#111827] font-normal leading-[1.38] md:leading-[1.42] tracking-tight max-w-4xl mx-auto block pb-1"
              delay={12}
              duration={0.75}
              ease="power3.out"
              splitType="words, chars"
              from={{ opacity: 0, y: 35 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-60px"
              textAlign="center"
              tag="p"
            />
            <div className="mt-8 md:mt-10">
              <SplitText
                key={`author-${activeTestimonialIndex}`}
                text={TESTIMONIALS[activeTestimonialIndex].author}
                className="text-sm sm:text-base md:text-lg font-medium text-[#9CA3AF] tracking-wide block"
                delay={25}
                duration={0.6}
                ease="power2.out"
                splitType="words"
                from={{ opacity: 0, y: 15 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-60px"
                textAlign="center"
                tag="span"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARIS KOMUNITAS 5 KOLOM (KOTAK-KOTAK PERSIS GAMBAR REFERENSI & INTERAKTIF HOVER) */}
      <section
        ref={communityStripRef}
        className="w-full bg-white overflow-hidden border-b border-[#E5E7EB]"
      >
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-0 items-stretch">
          {/* Kolom 1 (Foto): Foto potret pria berpenutup kepala */}
          <div className="community-col group relative h-64 sm:h-72 md:h-80 lg:h-[320px] xl:h-[350px] w-full overflow-hidden bg-neutral-100 cursor-pointer">
            <img
              alt="Potret anggota komunitas nomaden pria"
              className="w-full h-full object-cover object-top grayscale brightness-95 contrast-105 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_o-kHBggvQhNKap2If35Mv5ZOJIXhes19yjW4f1m7eI0EFtAdxhqIFWdOgSMMg8QCtJT8QxByZHDP1QPlw61bOOUnJp6QYS25meOsTBTpGhAESrwTkVRZ5S7S3j_JdaDrg6qxDXu2iYLECK3I8MG8tMQeWzimm9nbYzWi0T_NffPIzeVSTphwjQrtBGNRsglDpKCkKfJwmyjMfqDSy97v2GijZOKKylSQmPPgxakRA8apaYjo1soOZA"
            />
          </div>

          {/* Kolom 2 (Foto): Foto potret wanita profesional */}
          <div className="community-col group relative h-64 sm:h-72 md:h-80 lg:h-[320px] xl:h-[350px] w-full overflow-hidden bg-neutral-100 cursor-pointer">
            <img
              alt="Potret anggota komunitas profesional wanita"
              className="w-full h-full object-cover object-center grayscale brightness-95 contrast-105 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwLeVBjwnz9-PHDFPuSRuvn6gA0XVb0AwKVRIdltz39QoIWdfM-nMOlU13tuclp6c1EmdH9rxjnXZpeWRdlWNe0-pbkNCgKWiFIau-RjKW-UJh0uKULlFd77-dGTkzaesFVp3YaWh_-R4qFvxgAJIFsgHR_UZ1MywcHfSx9E1IwtnkAIk6ewztLjk_jzIjKw8AikhY503GyP-tpEzW0bZal3Q0A1tyKo9i81dOgD8Hht91v4aPEn1NXg"
            />
          </div>

          {/* Kolom 3 (Foto): Foto potret pria bekerja dengan hoodie */}
          <div className="community-col group relative h-64 sm:h-72 md:h-80 lg:h-[320px] xl:h-[350px] w-full overflow-hidden bg-neutral-100 cursor-pointer">
            <img
              alt="Potret anggota komunitas kreator digital"
              className="w-full h-full object-cover object-top grayscale brightness-95 contrast-105 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKfaBOO-mAmrZRI3UXEexYatnvkGYTro5n6054NEJ3TQGOwqJyCm_tXQW78Vp2lymNELdMTQSELxKFZese0hxD7YyE_2Bl-OIyA-h8tMlR9Jb4aOgFAJt_ewJl-hEgaHHBBIHG_GjlJXUzkJwL1fKZH5rQqGUFvF8MkBluVz1eIYCUBKDZiqCah8OgDN_yBSxpIH34PidjWyF7tUuljy4oDcwMN7IB9DwjaZOn2sdODC2InXimp_9cmw"
            />
          </div>

          {/* Kolom 4 (Kartu Ungu - Brand CTA) */}
          <div className="community-col group h-64 sm:h-72 md:h-80 lg:h-[320px] xl:h-[350px] w-full bg-[#5E43F3] hover:bg-[#5239e8] p-6 sm:p-7 lg:p-8 flex flex-col justify-between items-start text-white relative z-10 transition-colors duration-300">
            <div>
              <h4 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-bold text-white tracking-tight leading-[1.08] pt-1">
                Bagikan
                <br />
                Cerita Anda
              </h4>
            </div>
            <div className="w-full flex justify-center pb-1">
              <Link
                href="/register"
                className="w-full sm:w-auto px-7 py-2.5 sm:py-3 bg-black hover:bg-neutral-900 group-hover:scale-105 text-white text-xs sm:text-[13px] font-semibold rounded-full tracking-wide transition duration-150 text-center shadow-md inline-block"
              >
                Kirim Cerita →
              </Link>
            </div>
          </div>

          {/* Kolom 5 (Foto): Foto potret wanita kreatif */}
          <div className="community-col group relative h-64 sm:h-72 md:h-80 lg:h-[320px] xl:h-[350px] w-full overflow-hidden bg-neutral-100 cursor-pointer col-span-2 md:col-span-1">
            <img
              alt="Potret anggota komunitas kreatif wanita"
              className="w-full h-full object-cover object-top grayscale brightness-95 contrast-105 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ease-out block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiQHva10bzOoM6bPl8bQrUi4UQDb_FpViBaikPCrWjTNS8h0sIZXZ4WzOfhrXLlZXnEjXLdlagDw85c8UdGVTAKXcdaXmFAGwP7WgeSIbNgzbzo1-mhg4YQ3M2vfP6wdQhesdeaG98gEPMQDygpAN49ywJjQOO5TuVK1N8RSJmgwLRHvD5C1A6R25wgAu3gLDvb3rmQdnTwbQOxbqsAtF1Zx-sxsGO_tagWISDOwLz0vHgTE3Ty9cBvQ"
            />
          </div>
        </div>
      </section>
      </div>

      {/* ─── 8. CINEMATIC EDITORIAL MOTION FOOTER (CURTAIN REVEAL UNDERNEATH) ─ */}
      <MotionFooter />
    </div>
  );
}
