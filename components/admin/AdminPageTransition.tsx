"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

interface AdminPageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}

export default function AdminPageTransition({
  children,
  pageKey,
  className = "w-full space-y-7",
}: AdminPageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Instant display without motion offsets
      gsap.set(
        container.querySelectorAll(
          ".admin-header-animate, .admin-kpi-card, .admin-toolbar-animate, .admin-table-row, .admin-card-animate"
        ),
        { opacity: 1, x: 0, y: 0, scale: 1, clearProps: "all" }
      );
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 1. Header & Tombol Aksi (0ms - 200ms)
      const headerEls = container.querySelectorAll(".admin-header-animate");
      if (headerEls.length > 0) {
        tl.fromTo(
          headerEls,
          { opacity: 0, y: -8, willChange: "transform, opacity" },
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            clearProps: "all",
          }
        );
      }

      // 2. Kartu Metrik KPI (Stagger 0.07s) (100ms - 350ms)
      const kpiEls = container.querySelectorAll(".admin-kpi-card");
      if (kpiEls.length > 0) {
        tl.fromTo(
          kpiEls,
          {
            opacity: 0,
            y: 14,
            scale: 0.98,
            willChange: "transform, opacity",
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.35,
            stagger: 0.07,
            ease: "back.out(1.15)",
            clearProps: "all",
          },
          "-=0.15"
        );
      }

      // 3. Toolbar & Kontrol Filter (220ms - 400ms)
      const toolbarEls = container.querySelectorAll(".admin-toolbar-animate");
      if (toolbarEls.length > 0) {
        tl.fromTo(
          toolbarEls,
          { opacity: 0, x: -6, willChange: "transform, opacity" },
          {
            opacity: 1,
            x: 0,
            duration: 0.25,
            clearProps: "all",
          },
          "-=0.2"
        );
      }

      // 4. Baris Data Tabel / Kontainer Form Grids (300ms - 550ms)
      const tableRowEls = container.querySelectorAll(".admin-table-row");
      if (tableRowEls.length > 0) {
        tl.fromTo(
          tableRowEls,
          { opacity: 0, y: 10, willChange: "transform, opacity" },
          {
            opacity: 1,
            y: 0,
            duration: 0.28,
            stagger: 0.035,
            clearProps: "all",
          },
          "-=0.15"
        );
      }

      // 5. Card / Form Grid Elements (Jika ada)
      const cardEls = container.querySelectorAll(".admin-card-animate");
      if (cardEls.length > 0) {
        tl.fromTo(
          cardEls,
          { opacity: 0, y: 12, willChange: "transform, opacity" },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.06,
            clearProps: "all",
          },
          "-=0.15"
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [pageKey]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
