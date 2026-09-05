'use client';

import React from 'react';
import Link from 'next/link';
import AutoLayoutSpaceCard, { SpaceData } from '@/components/ui/auto-layout-space-card';

const availableSpacesData: SpaceData[] = [
  {
    id: 1,
    nama: 'Personal Desk - Quiet Pod 01',
    tipe: 'desk',
    lokasi: 'Moklet Hub • Lantai 2 (Silentium Zone)',
    hargaPerJam: 20000,
    kapasitas: '1 Orang',
    wifiSpeed: '100 Mbps',
    coverImage:
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80',
    ],
    fasilitas: ['Stopkontak Mandiri', 'Kursi Ergonomis', 'Monitor Eksternal 24"'],
  },
  {
    id: 2,
    nama: 'Meeting Room Alpha',
    tipe: 'meeting_room',
    lokasi: 'Moklet Hub • Lantai 3 (Collaboration Wing)',
    hargaPerJam: 100000,
    kapasitas: '8 Orang',
    wifiSpeed: '200 Mbps',
    coverImage:
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80',
    ],
    fasilitas: ['Smart TV 55"', 'Whiteboard Kaca', 'Soundbar Konferensi'],
  },
  {
    id: 3,
    nama: 'Private Glass Suite 4B',
    tipe: 'private_office',
    lokasi: 'Moklet Hub • Lantai 2 (East Wing)',
    hargaPerJam: 150000,
    kapasitas: '4 Orang',
    wifiSpeed: '150 Mbps',
    coverImage:
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=400&q=80',
    ],
    fasilitas: ['Kunci Akses Pintar', 'Standing Desk Elektrik', 'Meja Rapat Mini'],
  },
  {
    id: 4,
    nama: 'Personal Desk - Window View 04',
    tipe: 'desk',
    lokasi: 'Moklet Hub • Lantai 1 (Garden Terrace)',
    hargaPerJam: 25000,
    kapasitas: '1 Orang',
    wifiSpeed: '100 Mbps',
    coverImage:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=400&q=80',
    ],
    fasilitas: ['Pencahayaan Alami', 'Stopkontak Ganda', 'Aroma Diffuser'],
  },
];

export function AvailableSpacesSection() {
  return (
    <section
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
