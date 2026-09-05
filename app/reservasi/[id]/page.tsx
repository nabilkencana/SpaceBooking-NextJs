"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import {
  useReservation,
  useCancelReservation,
} from "@/hooks/useReservasi";
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
  CalendarDays,
  Clock,
  CreditCard,
  QrCode,
  Ticket,
  User,
} from "lucide-react";
import type { ReservasiStatus } from "@/types";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

const CANCELABLE: ReservasiStatus[] = ["belum_dikonfirm", "disetujui"];
const E_TICKET: ReservasiStatus[] = ["disetujui", "aktif"];

function errorMessage(e: unknown) {
  if (e instanceof ApiRequestError) return e.message;
  return "Terjadi kesalahan, silakan coba lagi";
}

export default function ReservasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reservasiId = Number(id);

  useRequireAuth("/login");
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useReservation(reservasiId);
  const cancelReservation = useCancelReservation();

  const onCancel = async () => {
    try {
      await cancelReservation.mutateAsync(reservasiId);
      toast.success("Reservasi berhasil dibatalkan");
      router.push("/reservasi");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const canCancel = data ? CANCELABLE.includes(data.status) : false;
  const canETicket = data ? E_TICKET.includes(data.status) : false;

  if (isLoading) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-2xl p-4 md:p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-6 h-40 w-full rounded-xl" />
          <Skeleton className="mt-4 h-56 w-full rounded-xl" />
        </main>
      </>
    );
  }

  if (!data || isError) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-2xl p-4 md:p-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p
                className={
                  isError
                    ? "text-sm text-destructive"
                    : "text-muted-foreground"
                }
              >
                {isError
                  ? "Gagal memuat detail reservasi."
                  : "Reservasi tidak ditemukan."}
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

  const isCancelling = cancelReservation.isPending;

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-2xl p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground"
          onClick={() => router.push("/reservasi")}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {data.kode_booking}
            </p>
            <h1 className="text-2xl font-bold">Detail Reservasi</h1>
          </div>
          <StatusBadge status={data.status} />
        </div>

        {/* Space */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="size-4" />
              Space
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              {data.space?.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.space.foto_url}
                  alt={data.space.nama_space}
                  className="h-24 w-32 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Ticket className="size-8" />
                </div>
              )}
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{data.space?.nama_space}</p>
                <p className="text-muted-foreground">
                  Tipe: {data.space?.tipe}
                </p>
                <p className="text-muted-foreground">
                  Harga: {formatRupiah(data.space?.harga_per_jam ?? 0)} / jam
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal</span>
              <span>{data.tanggal_reservasi}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waktu</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {data.jam_mulai} — {data.jam_selesai}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durasi</span>
              <span>{data.durasi_jam} jam</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Harga awal ({data.durasi_jam} jam)
              </span>
              <span>{formatRupiah(data.total_harga_awal)}</span>
            </div>
            {data.potongan_diskon > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Potongan diskon
                </span>
                <span className="text-green-600 dark:text-green-400">
                  -{formatRupiah(data.potongan_diskon)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Bayar</span>
              <span>{formatRupiah(data.total_bayar)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {canETicket && (
          <Button
            className="mb-3 w-full gap-2"
            onClick={() => router.push(`/reservasi/${data.id}/e-ticket`)}
          >
            <QrCode className="size-4" />
            Lihat E-Ticket
          </Button>
        )}
        {canCancel && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Membatalkan..." : "Batalkan Reservasi"}
          </Button>
        )}

        {data.member && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4" />
                Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-semibold">{data.member.nama_member}</p>
              <p className="text-muted-foreground">
                {data.member.instansi} · {data.member.telp}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}