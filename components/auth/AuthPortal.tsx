"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AuthPortalProps {
  initialMode?: "login" | "register";
}

// ─── Konfigurasi Spring Physics Alami (Ultra Mulus & Bebas Jeda) ────────────
const smoothSpring = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.8,
} as const;

export default function AuthPortal({ initialMode = "login" }: AuthPortalProps) {
  const router = useRouter();
  const { login } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);

  // ─── State Mode Navigasi ──────────────────────────────────────────────────
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(
    undefined
  );

  // Sinkronisasi URL browser
  useEffect(() => {
    const syncFromUrl = () => {
      const isReg = window.location.pathname.includes("register");
      setMode(isReg ? "register" : "login");
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Sinkronisasi dan pengukuran tinggi otomatis (Seamless Height Transition)
  useEffect(() => {
    const updateHeight = () => {
      const activeEl = mode === "login" ? loginRef.current : registerRef.current;
      if (activeEl && activeEl.offsetHeight > 0) {
        setContainerHeight(activeEl.offsetHeight);
      }
    };

    updateHeight();

    const activeEl = mode === "login" ? loginRef.current : registerRef.current;
    if (!activeEl) return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(activeEl);

    return () => observer.disconnect();
  }, [mode]);

  const switchMode = (newMode: "login" | "register") => {
    if (newMode === mode) return;
    setMode(newMode);

    const targetUrl = newMode === "register" ? "/register" : "/login";
    window.history.pushState({ mode: newMode }, "", targetUrl);
  };

  // ─── Form State Login ──────────────────────────────────────────────────────
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── Form State Register ───────────────────────────────────────────────────
  const [registerData, setRegisterData] = useState({
    nama_lengkap: "",
    username: "",
    email: "",
    telp: "",
    instansi: "",
    password: "",
    alamat: "",
    foto: "",
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoName, setFotoName] = useState<string>("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  // ─── Handlers Login ────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username.trim() || !loginData.password) {
      toast.error("Silakan lengkapi username dan kata sandi.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const user = await login(loginData.username.trim(), loginData.password);
      toast.success("Berhasil masuk!");

      if (user.role === "admin_space") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/reservasi");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message || "Kredensial akun tidak valid");
      } else {
        toast.error("Terjadi kesalahan, silakan coba lagi");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ─── Handlers Register ─────────────────────────────────────────────────────
  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 2MB");
        return;
      }
      setFotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFotoPreview(result);
        setRegisterData((prev) => ({ ...prev, foto: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFotoPreview(null);
    setFotoName("");
    setRegisterData((prev) => ({ ...prev, foto: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAgreed) {
      toast.error("Anda harus menyetujui Ketentuan Layanan dan Kebijakan Privasi.");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsRegistering(true);
    try {
      await apiClient.post("/proxy-register", {
        type: "member",
        username: registerData.username.trim(),
        password: registerData.password,
        nama_member: registerData.nama_lengkap.trim(),
        instansi: registerData.instansi.trim(),
        alamat: registerData.alamat.trim(),
        telp: registerData.telp.trim(),
        foto: registerData.foto || undefined,
      });

      toast.success("Pendaftaran berhasil! Selamat datang di Urspace.");
      router.replace("/reservasi");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error(err.message || "Pendaftaran gagal, periksa kembali formulir Anda.");
      } else {
        toast.error("Terjadi kendala saat pendaftaran, silakan coba lagi.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. SISI KIRI: EDITORIAL VISUAL HERO BANNER (100% Persisten & Tanpa Kedip)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white min-h-screen overflow-hidden lg:col-span-6 xl:col-span-6 select-none">
        {/* Foto Arsitektur Coworking */}
        <img
          src="/images/coworking-hero.jpg"
          alt="Suasana Ruang Kerja Coworking Urspace"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient dark wash overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/25 z-10 pointer-events-none" />

        {/* Top Brand Lockup */}
        <div className="relative z-20">
          <Link
            href="/"
            className="font-black text-2xl tracking-[0.2em] text-white inline-flex items-center group"
          >
            URSPACE
            <span className="inline-block w-2 h-2 bg-brand-yellow ml-1 rounded-[1px] group-hover:scale-125 transition-transform" />
          </Link>
        </div>

        {/* Bottom Editorial Content */}
        <div className="relative z-20 max-w-xl">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] tracking-tight mb-4">
            Fleksibilitas penuh untuk cara kerja masa depan.
          </h1>
          <p className="text-sm xl:text-base text-gray-200 leading-relaxed font-normal mb-8">
            Akses jaringan workstation personal, private office, dan ruang kolaborasi tanpa komitmen jangka panjang. Reservasi cepat dengan konfirmasi instan.
          </p>

          {/* Feature Badges Row */}
          <div className="flex items-center gap-6 pt-4 border-t border-white/15 text-xs font-semibold text-gray-100">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-yellow" strokeWidth={2.5} />
              <span>Aktivasi Gate QR Otomatis</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
              <span>WIFI SLA 300 Mbps</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. SISI KANAN: FORMULIR AUTENTIKASI DENGAN SLIDER TRACK ULTRA-MULUS
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col justify-between p-8 sm:p-12 lg:p-14 xl:p-16 bg-white min-h-screen overflow-y-auto lg:col-span-6 xl:col-span-6">
        {/* Wrapper Tengah Terpadu */}
        <div className="w-full max-w-120 mx-auto my-auto py-6">
          {/* Brand khusus tampilan mobile */}
          <div className="lg:hidden mb-6">
            <Link
              href="/"
              className="font-black text-2xl tracking-[0.2em] text-brand-dark inline-flex items-center select-none"
            >
              URSPACE
              <span className="inline-block w-2 h-2 bg-brand-yellow ml-1 rounded-[1px]" />
            </Link>
          </div>

          {/* Navigasi Kembali */}
          <Link
            href="/spaces"
            className="text-xs font-medium text-gray-500 hover:text-black mb-6 inline-flex items-center gap-1.5 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Katalog Ruang Kerja</span>
          </Link>

          {/* Segmented Pill Switcher */}
          <div className="block mb-6">
            <div className="relative inline-flex items-center bg-gray-100 p-1 rounded-full border border-gray-200/80 select-none">
              {/* Tab 1: Masuk (Login) */}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={cn(
                  "relative z-10 text-xs font-medium px-5 py-2 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none",
                  mode === "login"
                    ? "text-white font-semibold"
                    : "text-gray-600 hover:text-black"
                )}
              >
                {mode === "login" && (
                  <motion.div
                    layoutId="authSegmentedPill"
                    className="absolute inset-0 bg-brand-dark rounded-full shadow-sm -z-10"
                    transition={smoothSpring}
                  />
                )}
                Masuk (Login)
              </button>

              {/* Tab 2: Daftar Member */}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={cn(
                  "relative z-10 text-xs font-medium px-5 py-2 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none",
                  mode === "register"
                    ? "text-white font-semibold"
                    : "text-gray-600 hover:text-black"
                )}
              >
                {mode === "register" && (
                  <motion.div
                    layoutId="authSegmentedPill"
                    className="absolute inset-0 bg-brand-dark rounded-full shadow-sm -z-10"
                    transition={smoothSpring}
                  />
                )}
                Daftar Member
              </button>
            </div>
          </div>

          {/* Kontainer Slide Track Terpadu (Kedua Form Selalu Berada di DOM = Zero Stutter) */}
          <motion.div
            animate={{ height: containerHeight ?? "auto" }}
            transition={smoothSpring}
            className="w-full overflow-hidden relative"
          >
            <motion.div
              animate={{ x: mode === "login" ? "0%" : "-50%" }}
              transition={smoothSpring}
              className="flex w-[200%] items-start"
            >
              {/* ─── PANEL 1: LOGIN ───────────────────────────────────────── */}
              <div
                ref={loginRef}
                className={cn(
                  "w-1/2 shrink-0 pr-4 transition-opacity duration-200",
                  mode === "login"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                )}
                inert={mode !== "login" ? true : undefined}
                aria-hidden={mode !== "login"}
              >
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight mb-2">
                    Selamat datang kembali
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    Masukkan akun Anda untuk melanjutkan reservasi workstation dan akses bukti tiket digital.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Username / Email */}
                  <div>
                    <label
                      htmlFor="login-username"
                      className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                    >
                      USERNAME ATAU EMAIL TERDAFTAR *
                    </label>
                    <div className="relative rounded-xl border border-gray-200 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all bg-white">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-username"
                        type="text"
                        required
                        placeholder="nama.pengguna atau email@domain.com"
                        autoComplete="username"
                        value={loginData.username}
                        onChange={(e) =>
                          setLoginData((p) => ({ ...p, username: e.target.value }))
                        }
                        className="w-full pl-10 pr-4 py-3 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Kata Sandi */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider"
                      >
                        KATA SANDI *
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-gray-500 hover:text-brand-purple transition-colors"
                      >
                        Lupa sandi?
                      </Link>
                    </div>
                    <div className="relative rounded-xl border border-gray-200 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all bg-white">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData((p) => ({ ...p, password: e.target.value }))
                        }
                        className="w-full pl-10 pr-10 py-3 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors focus:outline-none"
                        aria-label={showLoginPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Ingat Saya */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple h-4 w-4 cursor-pointer accent-brand-purple"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs text-gray-600 select-none cursor-pointer"
                    >
                      Ingat saya di perangkat ini
                    </label>
                  </div>

                  {/* Tombol Submit Masuk */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-semibold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? (
                      <span>Memproses autentikasi...</span>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Tautan ke Registrasi */}
                <p className="text-xs text-center text-gray-600 mt-6 block">
                  Belum memiliki akun member?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-bold text-brand-purple hover:underline cursor-pointer"
                  >
                    Daftar sekarang gratis
                  </button>
                </p>
              </div>

              {/* ─── PANEL 2: REGISTRASI ──────────────────────────────────── */}
              <div
                ref={registerRef}
                className={cn(
                  "w-1/2 shrink-0 pl-4 transition-opacity duration-200",
                  mode === "register"
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                )}
                inert={mode !== "register" ? true : undefined}
                aria-hidden={mode !== "register"}
              >
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight mb-2">
                    Buat Akun Member Baru
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    Daftarkan diri Anda untuk menikmati akses workstation instan, potongan kupon promo, dan e-tiket reservasi terintegrasi.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Baris 1: Nama Lengkap & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-nama"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        NAMA LENGKAP *
                      </label>
                      <input
                        id="reg-nama"
                        name="nama_lengkap"
                        type="text"
                        required
                        placeholder="e.g. Fajar Pratama"
                        value={registerData.nama_lengkap}
                        onChange={handleRegisterChange}
                        className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-username"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        USERNAME *
                      </label>
                      <input
                        id="reg-username"
                        name="username"
                        type="text"
                        required
                        placeholder="e.g. fajarpratama"
                        value={registerData.username}
                        onChange={handleRegisterChange}
                        className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Baris 2: Email Aktif & Nomor WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-email"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        EMAIL AKTIF *
                      </label>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        placeholder="nama@perusahaan.com"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-telp"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        NOMOR WHATSAPP *
                      </label>
                      <input
                        id="reg-telp"
                        name="telp"
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={registerData.telp}
                        onChange={handleRegisterChange}
                        className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Baris 3: Asal Instansi & Kata Sandi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-instansi"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        ASAL INSTANSI / PERUSAHAAN *
                      </label>
                      <input
                        id="reg-instansi"
                        name="instansi"
                        type="text"
                        required
                        placeholder="e.g. PT Inovasi Digital"
                        value={registerData.instansi}
                        onChange={handleRegisterChange}
                        className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-pass"
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                      >
                        KATA SANDI *
                      </label>
                      <div className="relative rounded-xl border border-gray-200 focus-within:border-brand-purple focus-within:ring-2 focus-within:ring-brand-purple/20 transition-all bg-white">
                        <input
                          id="reg-pass"
                          name="password"
                          type={showRegisterPassword ? "text" : "password"}
                          required
                          placeholder="Min. 8 karakter"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          className="w-full pl-4 pr-10 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl focus:outline-none bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((p) => !p)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors focus:outline-none"
                          aria-label={showRegisterPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        Minimal 8 karakter kombinasi huruf &amp; angka
                      </span>
                    </div>
                  </div>

                  {/* Baris 4: Alamat Domisili */}
                  <div>
                    <label
                      htmlFor="reg-alamat"
                      className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5"
                    >
                      ALAMAT DOMISILI *
                    </label>
                    <input
                      id="reg-alamat"
                      name="alamat"
                      type="text"
                      required
                      placeholder="Jl. Danau Ranau No. 01, Sawojajar, Malang"
                      value={registerData.alamat}
                      onChange={handleRegisterChange}
                      className="w-full px-4 py-2.5 text-sm text-brand-dark placeholder:text-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                    />
                  </div>

                  {/* Baris 5: Dropzone Foto Profil */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                      UNGGAH FOTO PROFIL (OPSIONAL)
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-brand-purple rounded-xl p-4 flex items-center gap-4 bg-gray-50/50 transition-colors cursor-pointer relative group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {fotoPreview ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                          <img
                            src={fotoPreview}
                            alt="Preview Foto Profil"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleClearFoto}
                            className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black text-white rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-purple/10 group-hover:text-brand-purple flex items-center justify-center text-gray-500 shrink-0 transition-colors">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-gray-700 block truncate">
                          {fotoName
                            ? `Terpilih: ${fotoName}`
                            : "Pilih foto JPG, PNG (Maks 2MB) atau seret ke sini"}
                        </span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          Foto profil ditampilkan pada bukti reservasi &amp; portal gate member.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Persetujuan Ketentuan */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="reg-terms"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="rounded border-gray-300 text-brand-purple focus:ring-brand-purple h-4 w-4 mt-0.5 cursor-pointer accent-brand-purple"
                    />
                    <label
                      htmlFor="reg-terms"
                      className="text-xs text-gray-600 select-none cursor-pointer"
                    >
                      Saya menyetujui{" "}
                      <a
                        href="#"
                        className="text-brand-purple font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ketentuan Layanan
                      </a>{" "}
                      dan{" "}
                      <a
                        href="#"
                        className="text-brand-purple font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Kebijakan Privasi
                      </a>{" "}
                      Urspace.
                    </label>
                  </div>

                  {/* Tombol Submit Pendaftaran */}
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-brand-purple hover:bg-brand-purple-hover text-white font-semibold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? (
                      <span>Mendaftarkan akun...</span>
                    ) : (
                      <>
                        <span>Daftar Akun Member Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Tautan ke Login */}
                <p className="text-xs text-center text-gray-600 mt-5 block">
                  Sudah memiliki akun member?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-bold text-brand-purple hover:underline cursor-pointer"
                  >
                    Masuk ke Akun
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer Metainformasi Bawah */}
        <div className="w-full max-w-120 mx-auto pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
          <span>© 2026 Urspace System: Terenkripsi 256-bit</span>
          <div className="flex items-center gap-2">
            <a href="#" className="hover:text-gray-600 transition-colors">
              Bantuan
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600 transition-colors">
              Keamanan Data
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
