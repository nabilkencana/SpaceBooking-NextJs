"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Bell, ChevronDown, LogOut, Menu, UserCheck, X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Jelajah Space", href: "/spaces" },
  { label: "Opsi Sewa", href: "/#options" },
  { label: "Komunitas", href: "/#community" },
  { label: "Reservasi Saya", href: "/reservasi/my/history" },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const memberName = user?.member?.nama_member ?? user?.username ?? "Member";
  const memberInstansi =
    user?.member?.instansi ??
    (user?.role === "admin_space" ? "Admin Coworking" : "Member Urspace");
  const memberPhoto = user?.member?.foto_url;
  const initial = memberName.charAt(0).toUpperCase();

  const isLinkActive = (href: string) => {
    if (href === "/spaces") {
      return pathname.startsWith("/spaces");
    }
    if (href === "/reservasi/my/history") {
      return pathname.startsWith("/reservasi");
    }
    if (href.startsWith("/#")) {
      return false;
    }
    return pathname === href;
  };

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <nav
        aria-label="Navigasi Utama"
        className="h-[72px] max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between"
      >
        {/* ─── ZONE 1: SISI KIRI (LOGO IDENTITAS MEREK) ────────────────────────── */}
        <Link
          href="/"
          className="font-bold text-2xl tracking-tight text-[#0F172A] flex items-center font-sans hover:opacity-90 transition-opacity"
        >
          <span>Urspace</span>
        </Link>

        {/* ─── ZONE 2: SISI TENGAH (NAVIGASI UTAMA) ───────────────────────────── */}
        <div className="hidden md:flex items-center gap-8 text-sm font-normal">
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={
                  active
                    ? "text-[#0F172A] font-semibold relative py-2 after:content-[''] after:absolute after:bottom-[-24px] after:left-0 after:w-full after:h-[2px] after:bg-[#0F172A]"
                    : "text-[#64748B] hover:text-[#0F172A] transition-colors py-2 font-normal"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* ─── ZONE 3: SISI KANAN (UTILITY & AUTENTIKASI PENGGUNA) ─────────────── */}
        <div className="hidden md:flex items-center">
          {!isAuthenticated ? (
            /* State A: Tamu Publik (Default Guest / Unauthenticated) */
            <div className="flex items-center">
              <span className="text-xs sm:text-[13px] font-normal text-[#475569] hidden lg:block mr-6">
                (+62) 812 9876 5432
              </span>
              <Link
                href="/login"
                className="text-sm font-medium text-[#0F172A] hover:text-black px-3 py-1.5 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-[#0F172A] border border-[#0F172A] rounded-xl px-4 py-1.5 hover:bg-[#0F172A] hover:text-white transition-all ml-3"
              >
                Daftar
              </Link>
            </div>
          ) : (
            /* State B: Member Terotentikasi (Logged-in Member) */
            <div className="flex items-center gap-3">
              {/* Ikon Notifikasi */}
              <button
                type="button"
                aria-label="Pemberitahuan"
                className="p-2 text-[#4B5563] hover:text-brand-dark relative transition-colors rounded-full hover:bg-gray-50"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-purple" />
              </button>

              {/* Profil Pill Pengguna */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 pl-3 pr-2 py-1 rounded-full border border-[#E5E7EB] hover:border-gray-300 transition-all bg-white"
                >
                  {/* Foto Avatar 34x34px */}
                  <div className="w-[34px] h-[34px] rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                    {memberPhoto ? (
                      <img
                        src={memberPhoto}
                        alt={memberName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-brand-dark">{initial}</span>
                    )}
                  </div>

                  {/* Info Member */}
                  <div className="text-left pr-1">
                    <span className="text-xs font-bold text-brand-dark leading-tight block max-w-[120px] truncate">
                      {memberName}
                    </span>
                    <span className="text-[10px] text-[#6B7280] block max-w-[120px] truncate">
                      {memberInstansi}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-900 truncate">{memberName}</p>
                      <p className="text-[11px] text-gray-500 truncate">@{user?.username}</p>
                    </div>

                    {user?.role === "admin_space" && (
                      <Link
                        href="/admin/spaces"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-brand-purple" />
                        <span>Panel Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/reservasi/my/history"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>Riwayat Reservasi</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── MOBILE HAMBURGER BUTTON ─────────────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            className="text-brand-dark p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ─── MOBILE NAVIGATION DRAWER ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`min-h-[48px] flex items-center text-sm font-medium px-3 rounded-lg transition-colors ${
                    active
                      ? "text-brand-dark font-semibold bg-gray-50"
                      : "text-[#6B7280] hover:text-brand-dark hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-[#E5E7EB]">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#4B5563] text-center">
                  Hotline: (+62) 812 9876 5432
                </span>
                <Link
                  href="/login"
                  className="min-h-[48px] flex items-center justify-center w-full text-center text-sm font-medium text-brand-dark border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="min-h-[48px] flex items-center justify-center w-full text-center text-sm font-semibold text-white bg-brand-dark rounded-lg hover:bg-black transition-colors"
                >
                  Daftar
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0">
                    {memberPhoto ? (
                      <img
                        src={memberPhoto}
                        alt={memberName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-brand-dark">{initial}</span>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-brand-dark leading-tight truncate">
                      {memberName}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate">{memberInstansi}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {user?.role === "admin_space" && (
                    <Link
                      href="/admin/spaces"
                      className="min-h-[48px] flex items-center px-3 text-xs font-semibold text-brand-purple bg-purple-50 rounded-lg"
                    >
                      Panel Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-[48px] flex items-center justify-center w-full text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Keluar dari Akun
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default GlobalHeader;
