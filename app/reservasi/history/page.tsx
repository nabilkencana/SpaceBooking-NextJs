"use client";

import { useState } from "react";
import { useRequireAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { useHistory } from "@/hooks/useReservasi";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Clock, Wallet } from "lucide-react";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const now = new Date();

export default function HistoryPage() {
  useRequireAuth("/login");

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useHistory(month, year);

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-4xl p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Riwayat Reservasi</h1>
          <p className="text-sm text-muted-foreground">
            Lihat dan unduh riwayat pemesanan berdasarkan bulan.
          </p>
        </div>

        {/* Month / Year picker */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-end gap-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="month">Bulan</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
              >
                <SelectTrigger id="month" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((label, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Tahun</Label>
              <Input
                id="year"
                type="number"
                min={2020}
                max={2099}
                className="w-24"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || year)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Stat card */}
            <Card className="mb-6 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <CalendarDays className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Reservasi
                    </p>
                    <p className="text-2xl font-bold">
                      {data.total_reservasi}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-600/10">
                    <Wallet className="size-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Pengeluaran
                    </p>
                    <p className="text-2xl font-bold">
                      {formatRupiah(data.total_pengeluaran)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {data.items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Belum ada riwayat reservasi untuk periode ini.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daftar Reservasi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jam</TableHead>
                        <TableHead>Space</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">
                            {item.kode_booking}
                          </TableCell>
                          <TableCell>{item.tanggal_reservasi}</TableCell>
                          <TableCell className="inline-flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {item.jam_mulai} — {item.jam_selesai}
                          </TableCell>
                          <TableCell>{item.space_name}</TableCell>
                          <TableCell className="font-medium">
                            {formatRupiah(item.total_bayar)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}