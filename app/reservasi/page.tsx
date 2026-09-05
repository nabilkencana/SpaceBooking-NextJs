"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { useMyReservations } from "@/hooks/useReservasi";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import type { ReservasiStatus } from "@/types";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

type FilterKey = "semua" | ReservasiStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum_dikonfirm", label: "Belum Dikonfirmasi" },
  { key: "disetujui", label: "Disetujui" },
  { key: "aktif", label: "Aktif" },
  { key: "selesai", label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
];

export default function ReservasiPage() {
  useRequireAuth("/login");

  const [filter, setFilter] = useState<FilterKey>("semua");
  const { data, isLoading, isError, refetch } = useMyReservations();

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (filter === "semua") return list;
    return list.filter((r) => r.status === filter);
  }, [data, filter]);

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reservasi Saya</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan pantau seluruh pemesanan ruangan kamu.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="mb-3 h-4 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && isError && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-destructive">
                Gagal memuat daftar reservasi.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarDays className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="font-medium">Belum ada reservasi</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data && data.length > 0
                  ? "Tidak ada reservasi untuk filter ini."
                  : "Mulai pesan ruangan pertamamu sekarang."}
              </p>
              <Button
                className="mt-6"
                onClick={() => (window.location.href = "/spaces")}
              >
                Jelajahi Spaces
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reservation list */}
        {!isLoading && !isError &&
          filtered.map((r) => (
            <Link key={r.id} href={`/reservasi/${r.id}`}>
              <Card className="mb-4 transition-colors hover:bg-muted/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-mono text-xs text-muted-foreground">
                        {r.kode_booking}
                      </p>
                      <p className="text-base font-semibold">
                        {r.space?.nama_space ?? "Space"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" />
                          {r.tanggal_reservasi}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-4" />
                          {r.jam_mulai}
                        </span>
                        <span>{r.durasi_jam} jam</span>
                      </div>
                      <p className="font-semibold text-primary">
                        {formatRupiah(r.total_bayar)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </main>
    </>
  );
}