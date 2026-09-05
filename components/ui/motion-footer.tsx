"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Compass, Users, ArrowRight, ArrowUp } from "lucide-react";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES (URSPACE WHITE ARCHITECTURAL PALETTE)
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255, 70, 18, 0.45)); }
  15%, 45% { transform: scale(1.22); filter: drop-shadow(0 0 10px rgba(255, 70, 18, 0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 36s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

/* Light Architectural Grid Background with Urspace Neutral Tone */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(17, 24, 39, 0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(17, 24, 39, 0.035) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}

/* Soft Ambient Aurora (Urspace Brand Purple #5E43F3 + Canary Yellow #FFD500 + Vermilion #FF4612) */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(94, 67, 243, 0.09) 0%, 
    rgba(255, 213, 0, 0.05) 32%, 
    rgba(255, 70, 18, 0.025) 55%,
    transparent 72%
  );
}

/* White Glass Pill Theming matching reference image */
.footer-glass-pill {
  background: linear-gradient(145deg, #ffffff 0%, #f9fafb 100%);
  box-shadow: 
      0 6px 20px -2px rgba(17, 24, 39, 0.05), 
      inset 0 1px 1px rgba(255, 255, 255, 0.9),
      inset 0 -1px 2px rgba(17, 24, 39, 0.02);
  border: 1px solid #E5E7EB;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  /* ONLY transition non-transform properties so GSAP 3D physics runs at 120fps with zero jitter */
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, color 0.3s ease;
}

.footer-glass-pill:hover {
  background: #ffffff;
  border-color: #5E43F3;
  box-shadow: 
      0 14px 34px -4px rgba(94, 67, 243, 0.18), 
      0 4px 12px -2px rgba(17, 24, 39, 0.04),
      inset 0 1px 1px #ffffff;
  color: #111827;
}

/* Giant Background Text Masking in Subtle Outline (Urspace Palette) */
.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.74;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(17, 24, 39, 0.07);
  background: linear-gradient(180deg, rgba(94, 67, 243, 0.06) 0%, rgba(17, 24, 39, 0.02) 55%, transparent 80%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Charcoal Metallic Glow for Title */
.footer-text-glow {
  background: linear-gradient(180deg, #111827 0%, #374151 70%, #6B7280 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 3px 20px rgba(17, 24, 39, 0.07));
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency with Natural Elastic Rebound)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          (localRef as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT (WHITE LIGHT THEME + URSPACE BRAND COLOR PALETTE)
// -------------------------------------------------------------------------
const MarqueeItem = ({ items }: { items?: string[] }) => {
  const defaultItems = [
    "WORKSTATION FLEKSIBEL",
    "INTERNET FIBER 200 MBPS",
    "RESERVASI INSTAN 24/7",
    "KOMUNITAS DIGITAL NOMAD",
    "SUASANA KERJA TENANG",
    "RUANG RAPAT & PRIVATE OFFICE",
  ];
  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="flex items-center space-x-12 px-6">
      {list.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="text-[#4B5563] font-bold text-xs sm:text-sm tracking-[0.28em]">
            {item}
          </span>
          <span className="text-[#5E43F3] text-sm">✦</span>
        </React.Fragment>
      ))}
    </div>
  );
};

export interface CinematicFooterProps {
  brandName?: string;
  giantText?: string;
  heading?: string;
  marqueeItems?: string[];
  copyrightText?: string;
  creatorName?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function CinematicFooter({
  brandName = "Urspace",
  giantText = "URSPACE",
  heading = "Siap Mulai Bekerja?",
  marqueeItems,
  copyrightText = "© 2026 URSPACE. SELURUH HAK CIPTA DILINDUNGI.",
  creatorName = "Urspace",
  primaryButtonText = "Eksplorasi Ruang Kerja",
  primaryButtonHref = "/spaces",
  secondaryButtonText = "Daftar Member Komunitas",
  secondaryButtonHref = "/register",
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // React strict mode compatible GSAP context cleanup
    const ctx = gsap.context(() => {
      // Background Parallax
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.82, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      // Staggered Content Reveal
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 42%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* 
        The "Curtain Reveal" Wrapper:
        It sits in standard flow. Because it has clip-path, its contents
        are ONLY visible within its bounding box. 
      */}
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        {/* The actual footer stays fixed to the viewport underneath everything in White Light Theme */}
        <footer className="fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#FAFAFA] text-[#111827] cinematic-footer-wrapper border-t border-[#E5E7EB]">
          
          {/* Ambient Light & Urspace Color Aurora Glow */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text (Outline Watermark) */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[4vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            {giantText}
          </div>

          {/* 1. Diagonal Sleek Marquee (Top of footer) */}
          <div className="absolute top-10 sm:top-12 left-0 w-full overflow-hidden border-y border-[#E5E7EB]/90 bg-white/80 backdrop-blur-md py-4 z-10 -rotate-1 scale-105 shadow-xs">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-bold tracking-[0.28em] text-[#6B7280] uppercase">
              <MarqueeItem items={marqueeItems} />
              <MarqueeItem items={marqueeItems} />
            </div>
          </div>

          {/* 2. Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 mt-16 sm:mt-20 w-full max-w-5xl mx-auto text-center">
            <h2
              ref={headingRef}
              className="text-5xl md:text-8xl font-black footer-text-glow tracking-tighter mb-12 text-center"
            >
              {heading}
            </h2>

            {/* Interactive Magnetic Pills Layout */}
            <div ref={linksRef} className="flex flex-col items-center gap-6 w-full">
              {/* Tombol Aksi Utama Urspace (Eksplorasi Ruang & Daftar Member) */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
                <MagneticButton
                  as={Link}
                  href={primaryButtonHref}
                  className="footer-glass-pill px-8 sm:px-10 py-4.5 sm:py-5 rounded-full text-[#111827] font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <Compass className="w-5 h-5 text-[#5E43F3] group-hover:rotate-45 transition-transform duration-300" />
                  <span>{primaryButtonText}</span>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:translate-x-1 group-hover:text-[#5E43F3] transition-all" />
                </MagneticButton>
                
                <MagneticButton
                  as={Link}
                  href={secondaryButtonHref}
                  className="footer-glass-pill px-8 sm:px-10 py-4.5 sm:py-5 rounded-full text-[#111827] font-bold text-sm md:text-base flex items-center gap-3 group"
                >
                  <Users className="w-5 h-5 text-[#5E43F3] group-hover:scale-110 transition-transform duration-300" />
                  <span>{secondaryButtonText}</span>
                </MagneticButton>
              </div>

              {/* Secondary Text Links */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 w-full mt-2">
                <MagneticButton
                  as={Link}
                  href="/spaces"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#4B5563] font-medium text-xs md:text-sm hover:text-[#5E43F3]"
                >
                  Pilihan Ruang
                </MagneticButton>
                <MagneticButton
                  as={Link}
                  href="/#ruang-sekitar"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#4B5563] font-medium text-xs md:text-sm hover:text-[#5E43F3]"
                >
                  Workstation Terdekat
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="mailto:hello@homa.app"
                  className="footer-glass-pill px-6 py-3 rounded-full text-[#4B5563] font-medium text-xs md:text-sm hover:text-[#5E43F3]"
                >
                  Pusat Bantuan & Kontak
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* 3. Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-8 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Copyright */}
            <div className="text-[#6B7280] text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1">
              {copyrightText}
            </div>

            {/* "Crafted with Love" Badge */}
            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-[#E5E7EB]">
              <span className="text-[#6B7280] text-[10px] md:text-xs font-bold uppercase tracking-widest">Dirancang dengan</span>
              <span className="animate-footer-heartbeat text-sm md:text-base text-[#FF4612]">❤</span>
              <span className="text-[#6B7280] text-[10px] md:text-xs font-bold uppercase tracking-widest">oleh</span>
              <span className="text-[#111827] font-black text-xs md:text-sm tracking-normal ml-1">{creatorName}</span>
            </div>

            {/* Back to top */}
            <MagneticButton
              as="button"
              onClick={scrollToTop}
              aria-label="Kembali ke atas"
              className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-[#4B5563] hover:text-[#5E43F3] group order-3 shadow-xs"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>

          </div>
        </footer>
      </div>
    </>
  );
}

export const MotionFooter = CinematicFooter;
export default CinematicFooter;
