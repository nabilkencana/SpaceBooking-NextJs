"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CommunityConsultationCurtain() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orangeSectionRef = useRef<HTMLElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    perusahaan: "",
    telepon: "",
    lokasi: "",
    anggota: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    const orange = orangeSectionRef.current;
    const form = formSectionRef.current;

    if (!orange || !form) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // Kunci seksi oranye di posisi top: 0 saat masuk viewport
        // Gunakan endTrigger seksi formulir agar seksi oranye tetap terkunci sampai formulir menutupinya penuh
        ScrollTrigger.create({
          trigger: orange,
          start: "top top",
          endTrigger: form,
          end: "top top",
          pin: true,
          pinSpacing: false, // Kunci utama agar seksi formulir di bawahnya naik menimpa seksi oranye
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });
      });
    }, containerRef);

    // Sinkronisasi urutan trigger dengan seksi kuning sebelumnya setelah DOM siap
    const timer = setTimeout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }, 250);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Permintaan konsultasi Anda berhasil dikirim!", {
        description: "Tim konsultan Urspace akan segera menghubungi Anda.",
      });
      setFormData({
        nama: "",
        email: "",
        perusahaan: "",
        telepon: "",
        lokasi: "",
        anggota: "",
      });
    }, 500);
  };

  return (
    <div ref={containerRef} className="relative w-full clear-both bg-white">
      {/* SEKSI 5: KOMUNITAS (Z-10, DIKUNCI DI VIEWPORT OLEH GSAP DENGAN pinSpacing: false) */}
      <section
        ref={orangeSectionRef}
        id="community"
        className="relative z-10 w-full h-screen bg-[#FF4612] flex items-center justify-center overflow-hidden select-none"
      >
        <span id="komunitas" className="sr-only">
          Komunitas
        </span>
        <h2
          className="text-white font-extrabold text-center leading-none tracking-tight px-4 select-none"
          style={{ fontSize: "clamp(4.5rem, 14vw, 13rem)" }}
        >
          Komunitas
        </h2>
      </section>

      {/* SEKSI 6: FORMULIR KONSULTASI (Z-20, NAIK MENUTUPI SEKSI ORANYE SEPERTI TIRAI) */}
      <section
        ref={formSectionRef}
        id="consultation"
        className="relative z-20 w-full min-h-screen flex items-center justify-center py-20 px-6 sm:px-8 bg-cover bg-center shadow-[0_-30px_60px_rgba(0,0,0,0.35)]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB2R5NWPHzKstc4mkqmhd0vbcDKbrba7-MQgep3PR0h68LZvBtAH6t7fcaF7IUSJ49vRGJCaM_QhAyqMppXL32Ttp1mQTA9HcGzgSM65bOhjr4BkJALdISvGpVZLz3d87Pj5lrp5FNlnaNrm8JsEJxAaA4diFGuTywJd6y4vPgOT6U2nh1bYbIdKI5r1tu70w2n8xHZKuuij6r1gSP8S2EaKi_3j3A3eZE1p-0bzn-AZryCyS6Xun5Tng")`,
        }}
      >
        {/* Overlay peredam foto */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        {/* Kartu Formulir Putih Melayang */}
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-100 text-center">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
            Biarkan kami membantu menemukan ruang kerja ideal Anda
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
            Tuliskan kebutuhan tim Anda dan tim kami akan memberikan kurasi lokasi terbaik.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap*"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <input
                  type="email"
                  required
                  placeholder="Alamat Email*"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Nama Perusahaan*"
                  value={formData.perusahaan}
                  onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Nomor Telepon*"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Pilihan Lokasi*"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Jumlah Anggota Tim*"
                  value={formData.anggota}
                  onChange={(e) => setFormData({ ...formData, anggota: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E43F3] transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center pt-2 leading-relaxed">
              Dengan mengeklik tombol di atas, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
            </p>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#5E43F3] hover:bg-[#4A32D6] text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim Permintaan..." : "Dapatkan Rekomendasi Ruang"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default CommunityConsultationCurtain;
