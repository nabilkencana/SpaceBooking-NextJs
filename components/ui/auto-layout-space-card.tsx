'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Wifi, Users, MapPin, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export type Step = 1 | 2 | 3;

export interface SpaceData {
  id: number;
  nama: string;
  tipe: string;
  lokasi: string;
  hargaPerJam: number;
  kapasitas: string;
  wifiSpeed: string;
  coverImage: string;
  galleryImages: [string, string, string];
  fasilitas: string[];
}

// Pegas kritis (critically damped) agar animasi buka & tutup bebas loncatan (zero jitter/overshoot)
const transitionSpring = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 28,
  mass: 0.8,
};

const collapseSpring = {
  type: 'spring' as const,
  stiffness: 250,
  damping: 30,
  mass: 0.7,
};

const fannedGalleryVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 24,
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.22,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  },
};

const galleryItemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.94,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 22,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 6,
    transition: {
      duration: 0.18,
      ease: 'easeInOut' as const,
    },
  },
};

export interface AutoLayoutSpaceCardProps {
  space: SpaceData;
  className?: string;
}

export const AutoLayoutSpaceCard = React.forwardRef<HTMLDivElement, AutoLayoutSpaceCardProps>(
  ({ space, className }, ref) => {
    const [step, setStep] = useState<Step>(1);

    const handleStepCycle = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      setStep((prev) => ((prev % 3) + 1) as Step);
    };

    return (
      <motion.div
        ref={ref}
        layout
        onClick={handleStepCycle}
        transition={transitionSpring}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-3xl bg-white p-5 border border-[#E5E7EB] select-none will-change-transform transition-shadow duration-300',
          step === 3 ? 'shadow-xl ring-1 ring-black/5' : 'shadow-sm hover:border-gray-300 hover:shadow-md',
          className
        )}
      >
        {/* Gambar Utama (Cover Foto Bersih Tanpa Badge) */}
        <motion.div
          layout
          transition={transitionSpring}
          className={cn(
            'relative w-full overflow-hidden rounded-2xl bg-gray-100',
            step === 1 && 'h-[230px]',
            step === 2 && 'h-[260px]',
            step === 3 && 'h-[240px]'
          )}
        >
          <img
            src={space.coverImage}
            alt={space.nama}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </motion.div>

        {/* Baris Harga & Kapasitas */}
        <motion.div
          layout
          transition={transitionSpring}
          className="mt-4 flex items-baseline justify-between border-b border-gray-100 pb-3"
        >
          <div>
            <span className="text-xl font-extrabold text-[#111827] tracking-tight font-mono">
              Rp {space.hargaPerJam.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-[#6B7280] font-normal ml-1">/ jam</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#6B7280] font-medium">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {space.kapasitas}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              {space.wifiSpeed}
            </span>
          </div>
        </motion.div>

        {/* Informasi Nama & Lokasi */}
        <motion.div layout transition={transitionSpring} className="mt-3">
          <motion.h4 layout className="text-lg font-bold text-[#111827] leading-snug">
            {space.nama}
          </motion.h4>
          <motion.p layout className="flex items-center gap-1 text-xs text-[#6B7280] mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {space.lokasi}
          </motion.p>
        </motion.div>

        {/* Detail Fasilitas Tambahan (Muncul & Menutup Halus dengan Masking Overflow) */}
        <AnimatePresence initial={false}>
          {step >= 2 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={collapseSpring}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                {space.fasilitas.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                  >
                    <Zap className="w-3 h-3 text-[#5E43F3]" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Baris Status & Tombol Aksi */}
        <motion.div
          layout
          transition={transitionSpring}
          className="mt-5 flex items-center justify-between pt-3 border-t border-gray-100"
        >
          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Siap Reservasi Instan
          </span>

          <Link
            href={`/booking/${space.id}`}
            className="inline-flex items-center gap-1.5 bg-[#5E43F3] hover:bg-[#4A32D6] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <span>Pesan Meja Ini</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        {/* Galeri Sudut Ruang (Muncul & Menutup Halus pada Step 3 dengan Masking Overflow) */}
        <AnimatePresence initial={false}>
          {step === 3 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={collapseSpring}
              className="overflow-hidden"
            >
              <motion.div
                variants={fannedGalleryVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-3 pb-1"
              >
                <motion.img
                  variants={galleryItemVariants}
                  src={space.galleryImages[0]}
                  alt="Sudut Meja 1"
                  className="w-24 h-28 object-cover rounded-xl shadow-md border border-gray-100 -rotate-3 transition-transform hover:rotate-0 duration-300"
                />
                <motion.img
                  variants={galleryItemVariants}
                  src={space.galleryImages[1]}
                  alt="Sudut Meja 2"
                  className="w-28 h-32 object-cover rounded-xl shadow-lg border border-gray-100 z-10 transition-transform hover:scale-105 duration-300"
                />
                <motion.img
                  variants={galleryItemVariants}
                  src={space.galleryImages[2]}
                  alt="Sudut Meja 3"
                  className="w-24 h-28 object-cover rounded-xl shadow-md border border-gray-100 rotate-3 transition-transform hover:rotate-0 duration-300"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

AutoLayoutSpaceCard.displayName = 'AutoLayoutSpaceCard';

export default AutoLayoutSpaceCard;
