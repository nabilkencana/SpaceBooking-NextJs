"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { useETicket } from "@/hooks/useReservasi";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  CreditCard,
  Download,
  QrCode,
  Ticket,
  User,
} from "lucide-react";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

export default function ETicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ticketId = Number(id);

  useRequireAuth("/login");
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useETicket(ticketId);
  const [pdfLoading, setPdfLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const onDownloadPdf = async () => {
    if (!cardRef.current || !data) return;

    setPdfLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`e-ticket-${data.kode_booking}.pdf`);
      toast.success("E-Ticket berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-xl p-4 md:p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-6 h-96 w-full rounded-xl" />
        </main>
      </>
    );
  }

  if (!data || isError) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-xl p-4 md:p-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p
                className={
                  isError ? "text-sm text-destructive" : "text-muted-foreground"
                }
              >
                {isError
                  ? "Gagal memuat E-Ticket."
                  : "E-Ticket tidak ditemukan."}
              </p>
              {isError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  Coba Lagi
                </Button>
              )}
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const eTicketNum = data.e_ticket_number;

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-xl p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground"
          onClick={() => router.push(`/reservasi/${ticketId}`)}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Detail
        </Button>

        {/* E-Ticket Card */}
        <div id="e-ticket-card" ref={cardRef}>
          <Card className="overflow-hidden border-2">
            {/* Brand header */}
            <div className="bg-primary p-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5" />
                  <span className="font-bold">Smart Space Booking</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  E-Ticket
                </span>
              </div>
              {eTicketNum && (
                <p className="mt-2 font-mono text-xs opacity-80">
                  #{eTicketNum}
                </p>
              )}
            </div>

            <CardContent className="space-y-6 p-5">
              {/* Coworking space info */}
              {data.coworking_space && (
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-semibold">
                      {data.coworking_space.nama}
                    </p>
                    <p className="text-muted-foreground">
                      {data.coworking_space.telepon}
                    </p>
                    <p className="text-muted-foreground">
                      {data.coworking_space.alamat}
                    </p>
                  </div>
                </div>
              )}

              {/* Member info */}
              {data.member && (
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-semibold">{data.member.nama}</p>
                    <p className="text-muted-foreground">
                      {data.member.instansi} · {data.member.telp}
                    </p>
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="border-t" />

              {/* Space info */}
              <div className="flex items-start gap-3">
                <Ticket className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-semibold">
                    {data.space?.nama ?? "Space"}
                  </p>
                  <p className="text-muted-foreground">
                    Tipe: {data.space?.tipe} · Harga:{" "}
                    {formatRupiah(data.space?.harga_per_jam ?? 0)} / jam
                  </p>
                </div>
              </div>

              {/* Jadwal */}
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="space-y-1 text-sm">
                  <p>{data.jadwal.tanggal}</p>
                  <p className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {data.jadwal.jam_mulai} — {data.jadwal.jam_selesai}
                  </p>
                  <p className="text-muted-foreground">
                    Durasi: {data.jadwal.durasi}
                  </p>
                </div>
              </div>

              {/* Rincian pembayaran */}
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="w-full space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tarif kotor
                    </span>
                    <span>
                      {formatRupiah(data.rincian_pembayaran.tarif_kotor)}
                    </span>
                  </div>
                  {data.rincian_pembayaran.potongan > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Potongan
                        {data.rincian_pembayaran.diskon_promo
                          ? ` (${data.rincian_pembayaran.diskon_promo})`
                          : ""}
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        -{formatRupiah(data.rincian_pembayaran.potongan)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total Dibayar</span>
                    <span>
                      {formatRupiah(
                        data.rincian_pembayaran.total_dibayar,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t" />

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border bg-white p-3">
                  <QRCodeSVG
                    value={data.qr_code_payload}
                    size={160}
                    level="M"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Scan QR code ini saat check-in
                </p>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <StatusBadge status={data.status_reservasi} />
              </div>

              {/* Check-in / Check-out timestamps */}
              {(data.check_in_at || data.check_out_at) && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {data.check_in_at && (
                    <p>Check-in: {data.check_in_at}</p>
                  )}
                  {data.check_out_at && (
                    <p>Check-out: {data.check_out_at}</p>
                  )}
                </div>
              )}

              {/* Kode booking */}
              <p className="text-center font-mono text-xs text-muted-foreground">
                Kode Booking: {data.kode_booking}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Download PDF button */}
        <Button
          className="mt-4 w-full gap-2"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
        >
          <Download className="size-4" />
          {pdfLoading ? "Mengunduh..." : "Unduh PDF"}
        </Button>
      </main>
    </>
  );
}