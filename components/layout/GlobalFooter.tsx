"use client";

import Link from "next/link";
import { usePublicLocation } from "@/hooks/useAdmin";

const MASK_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBKfaBOO-mAmrZRI3UXEexYatnvkGYTro5n6054NEJ3TQGOwqJyCm_tXQW78Vp2lymNELdMTQSELxKFZese0hxD7YyE_2Bl-OIyA-h8tMlR9Jb4aOgFAJt_ewJl-hEgaHHBBIHG_GjlJXUzkJwL1fKZH5rQqGUFvF8MkBluVz1eIYCUBKDZiqCah8OgDN_yBSxpIH34PidjWyF7tUuljy4oDcwMN7IB9DwjaZOn2sdODC2InXimp_9cmw";

const PANORAMA_IMAGE_URL =
  "/images/coworking-hero.jpg";

// Teks statis hanya fallback terakhir (kontrak: live data dari GET /location/profile adalah sumber utama).
const FALLBACK_NAME = "Moklet Hub, Sawojajar, Malang";
const FALLBACK_HOTLINE = "(+62) 812 9876 5432";
const FALLBACK_ADDRESS = "Jl. Danau Ranau No. 01, Sawojajar, Kota Malang 65139";

/**
 * GlobalFooter Component
 * Master Editorial Footer precisely matching the reference mockup layout:
 * - Huge architectural photo-masked "Urspace" wordmark
 * - Right-aligned 3-column clean navigation (Let's Talk, Communities, About)
 * - Clean address on bottom-left and 4 rounded social icons on bottom-right
 * - Horizontal divider line with centered copyright "Odama. All right reserved. © 2023"
 * - Full-bleed bottom panoramic coworking table photo banner
 */
export function GlobalFooter() {
  const { data: location } = usePublicLocation();
  const coworkingName = location?.nama_coworking ?? FALLBACK_NAME;
  const hotline = location?.hotline ?? location?.telp ?? FALLBACK_HOTLINE;
  const address = location?.alamat ?? FALLBACK_ADDRESS;
  return (
    <footer className="w-full bg-white pt-10 sm:pt-14 md:pt-18 pb-0 overflow-hidden border-t border-[#E5E7EB] mt-0">
      {/* ─── MAIN FOOTER CONTENT WRAPPER ──────────────────────────────────── */}
      <div className="max-w-350 mx-auto px-6 sm:px-10 lg:px-14">
        {/* ─── TIER 1: WORDMARK URSPACE & 3-COLUMN NAVIGATION ROW ──────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-16 md:pb-24">
          {/* Sisi Kiri: Wordmark Urspace yang Proporsional & Huruf 'p' Tidak Terpotong */}
          <div className="shrink-0">
            <Link href="/" className="inline-block group">
              <h2
                className="font-medium font-sans text-5xl sm:text-6xl md:text-7xl lg:text-[88px] xl:text-[100px] tracking-[-0.03em] leading-[1.15] pb-2 select-none"
                style={{
                  backgroundImage: `url('${MASK_IMAGE_URL}')`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                Urspace
              </h2>
            </Link>
          </div>

          {/* Sisi Kanan: 3 Kolom Tautan yang Sejajar Cantik di Bawah */}
          <div className="grid grid-cols-3 gap-8 sm:gap-12 lg:gap-16 text-left w-full lg:w-auto lg:pb-3">
            {/* Kolom 1: Kontak */}
            <div>
              <div className="text-[11px] sm:text-[12px] text-neutral-800 space-y-1.5 leading-relaxed font-normal pt-0 sm:pt-7">
                <p>
                  <a
                    href="mailto:hello@urspace.id"
                    className="hover:text-black transition-colors"
                  >
                    hello@urspace.id
                  </a>
                </p>
                <p>{coworkingName}</p>
                <p>{hotline}</p>              </div>
            </div>

            {/* Kolom 2: Komunitas */}
            <div>
              <h4 className="text-[12px] sm:text-[13px] font-semibold text-neutral-900 mb-3 tracking-tight">
                Komunitas
              </h4>
              <div className="text-[11px] sm:text-[12px] text-neutral-800 space-y-1.5 leading-relaxed font-normal">
                <p>
                  <Link href="/spaces" className="hover:text-black transition-colors">
                    Search
                  </Link>
                </p>
                <p>
                  <Link href="/spaces?tipe=desk" className="hover:text-black transition-colors">
                    Personal Desk
                  </Link>
                </p>
                <p>
                  <Link
                    href="/spaces?tipe=meeting_room"
                    className="hover:text-black transition-colors"
                  >
                    Meeting Room
                  </Link>
                </p>
                <p>
                  <Link
                    href="/spaces?tipe=private_office"
                    className="hover:text-black transition-colors"
                  >
                    Private Office
                  </Link>
                </p>
              </div>
            </div>

            {/* Kolom 3: Tentang Kami */}
            <div>
              <h4 className="text-[12px] sm:text-[13px] font-semibold text-neutral-900 mb-3 tracking-tight">
                Tentang Kami
              </h4>
              <div className="text-[11px] sm:text-[12px] text-neutral-800 space-y-1.5 leading-relaxed font-normal">
                <p>
                  <Link href="/career" className="hover:text-black transition-colors">
                    Career
                  </Link>
                </p>
                <p>
                  <Link href="/blog" className="hover:text-black transition-colors">
                    Blog
                  </Link>
                </p>
                <p>
                  <Link href="/contact" className="hover:text-black transition-colors">
                    Contact
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TIER 2: ALAMAT LOKASI & IKON MEDIA SOSIAL BULAT ─────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-10 md:pb-12">
          {/* Sisi Kiri: Alamat 4 Baris Rapi */}
          <div className="text-[11px] sm:text-[12px] text-neutral-800 leading-[1.65] space-y-0.5 text-left font-normal">
            <p>{address}</p>
            <p>{hotline}</p>
            <p>
              <a
                href="mailto:info@urspace.id"
                className="hover:text-black transition-colors"
              >
                info@urspace.id
              </a>
            </p>
          </div>

          {/* Sisi Kanan: 4 Tombol Ikon Sosial Bulat Halus */}
          <div className="flex items-center gap-3 sm:gap-3.5">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center text-neutral-900 hover:border-black hover:bg-neutral-50 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center text-neutral-900 hover:border-black hover:bg-neutral-50 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center text-neutral-900 hover:border-black hover:bg-neutral-50 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-full border border-[#E5E7EB] flex items-center justify-center text-neutral-900 hover:border-black hover:bg-neutral-50 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ─── TIER 3: GARIS PEMBATAS HORIZONTAL & HAK CIPTA TENGAH ─────────── */}
        <div className="border-t border-[#E5E7EB] py-5 text-center">
          <p className="text-[11px] sm:text-xs text-neutral-800 tracking-normal font-normal">
            Urspace. Hak Cipta Dilindungi Undang-Undang. © 2026
          </p>
        </div>
      </div>

      {/* ─── TIER 4: SPANDUK FOTO PANORAMA MEJA PANJANG (SLIM BANNER SESUAI REFERENSI) ─── */}
      <div className="w-full overflow-hidden block m-0 p-0 leading-none">
        <img
          src={PANORAMA_IMAGE_URL}
          alt="Interior Meja Rapat Kayu Urspace"
          className="w-full h-44 sm:h-56 md:h-72 lg:h-80 object-cover object-center block m-0 p-0"
        />
      </div>
    </footer>
  );
}

export default GlobalFooter;
