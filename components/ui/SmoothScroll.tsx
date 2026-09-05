"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll() {
  useEffect(() => {
    // Pastikan GSAP ScrollTrigger terdaftar
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Inisialisasi Lenis dengan inertia floating berbobot (efek tebal & sinematik)
    const lenis = new Lenis({
      lerp: 0.055, // Nilai lerp rendah memberikan sensasi luncuran yang tebal, empuk, dan terasa jelas
      wheelMultiplier: 1.15, // Jarak luncur lebih mantap dan berbobot
      smoothWheel: true,
      syncTouch: true, // Mengaktifkan efek inertia halus pada Trackpad Mac & sentuhan
      syncTouchLerp: 0.06,
      touchInertiaExponent: 1.8,
      orientation: "vertical",
      gestureOrientation: "vertical",
    });


    if (typeof window !== "undefined") {
      (window as unknown as { lenisInstance?: Lenis }).lenisInstance = lenis;
    }


    // 1. Sinkronisasi Lenis dengan GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 2. Tautkan loop render Lenis ke GSAP ticker utama
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // 3. Tangani navigasi anchor link internal (misal: #options)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, {
            offset: -20,
            duration: 1.2,
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    // Refresh ScrollTrigger setelah layout dan font siap
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);

    return () => {
      clearTimeout(refreshTimer);
      document.removeEventListener("click", handleAnchorClick);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      delete (window as unknown as { lenisInstance?: Lenis }).lenisInstance;
    };

  }, []);

  return null;
}
