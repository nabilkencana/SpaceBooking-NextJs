'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import AutoLayoutSpaceCard, { SpaceData } from '@/components/ui/auto-layout-space-card';
import { useSpacesQuery } from '@/hooks/useSpaces';
import type { Space } from '@/types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function mapSpaceToCardData(space: Space): SpaceData {
  return {
    id: space.id,
    nama: space.nama_space,
    tipe: space.tipe,
    lokasi:
      [space.owner?.nama_coworking, space.zona_lantai].filter(Boolean).join(' • ') ||
      space.badge ||
      'Lokasi Moklet Hub',
    hargaPerJam: space.harga_per_jam,
    kapasitas: `${space.kapasitas} Orang`,
    wifiSpeed: space.wifi_speed ? `${space.wifi_speed} Mbps` : 'WiFi Tersedia',
    coverImage:
      space.foto_url ??
      space.foto ??
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      space.photos?.[0] ?? space.foto_url ?? space.foto,
      space.photos?.[1] ?? space.foto_url ?? space.foto,
      space.photos?.[2] ?? space.foto_url ?? space.foto,
    ].map((img) => img ?? 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80') as [string, string, string],
    fasilitas: (space.amenities ?? []).filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    ),
    slug: space.slug ?? undefined,
  };
}

export function AvailableSpacesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Live katalog: 4 space terbaru untuk grid 2x2 (menggantikan data statis)
  const spacesQuery = useSpacesQuery({ per_page: 4 });
  const availableSpacesData = useMemo(
    () => (spacesQuery.data?.items ?? []).slice(0, 4).map(mapSpaceToCardData),
    [spacesQuery.data],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof window === 'undefined') return;

    let timer: NodeJS.Timeout;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const lenis = (window as unknown as { lenisInstance?: { resize: () => void } }).lenisInstance;
        if (lenis) lenis.resize();
        ScrollTrigger.refresh();
      }, 50);
    });

    ro.observe(el);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ruang-sekitar"
      className="relative z-10 bg-white py-24 px-6 sm:px-8 border-t border-[#E5E7EB] scroll-mt-16"
    >
      <div id="workspaces" className="absolute -top-16 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Ruang Kerja di Sekitar Anda
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2">
              Pilih workstation terverifikasi dengan konfirmasi ketersediaan instan.
            </p>
          </div>

          <Link
            className="text-xs sm:text-sm font-semibold text-[#111827] hover:text-[#5E43F3] transition-colors inline-flex items-center gap-1 group"
            href="/spaces"
          >
            <span>Lihat Selengkapnya</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {availableSpacesData.map((space) => (
            <AutoLayoutSpaceCard key={space.id} space={space} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AvailableSpacesSection;
