"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  Clock,
  Wallet,
  Percent,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import { StatCard } from "@/components/features/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

interface MonthlyReportData {
  month: number;
  year: number;
  total_transaksi: number;
  total_jam_terpakai: number;
  estimasi_pendapatan_kotor: number;
  total_potongan_diskon: number;
  realisasi_pendapatan_bersih: number;
  rincian_per_tipe_space: {
    tipe: string;
    label: string;
    total_booking: number;
    total_jam: number;
    total_pendapatan: number;
  }[];
}

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export default function AdminReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-monthly-report", month, year],
    queryFn: async () => {
      const res = await apiClient.get("/admin/reports/monthly", {
        params: { month, year },
      });
      return unwrapApi<MonthlyReportData>({ data: res.data });
    },
  });

  const monthly = data;

  const stats: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Total Transaksi", value: `${monthly?.total_transaksi ?? "—"}`, icon: CalendarCheck },
    { label: "Total Jam Terpakai", value: `${monthly?.total_jam_terpakai ?? "—"} jam`, icon: Clock },
    { label: "Pendapatan Kotor", value: monthly ? formatRp(monthly.estimasi_pendapatan_kotor) : "—", icon: Wallet },
    { label: "Potongan Diskon", value: monthly ? formatRp(monthly.total_potongan_diskon) : "—", icon: Percent },
    { label: "Realisasi Bersih", value: monthly ? formatRp(monthly.realisasi_pendapatan_bersih) : "—", icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laporan Bulanan</h1>
        <p className="text-muted-foreground">
          Rekapitulasi okupansi dan pendapatan coworking space
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Bulan</Label>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Tahun</Label>
          <Input
            type="number"
            className="w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2020}
            max={2030}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Muat Ulang
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Gagal memuat laporan.{" "}
          <Button variant="outline" onClick={() => refetch()} className="ml-2">
            Coba Lagi
          </Button>
        </div>
      ) : monthly ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                title={s.label}
                value={s.value}
                icon={<s.icon className="h-5 w-5" />}
              />
            ))}
          </div>

          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h2 className="font-semibold">
                Rincian per Tipe Space — {MONTHS[month - 1]} {year}
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Booking</TableHead>
                  <TableHead className="text-right">Total Jam</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthly.rincian_per_tipe_space?.map((item) => (
                  <TableRow key={item.tipe}>
                    <TableCell className="font-mono text-xs uppercase">
                      {item.tipe}
                    </TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell className="text-right">{item.total_booking}</TableCell>
                    <TableCell className="text-right">{item.total_jam} jam</TableCell>
                    <TableCell className="text-right">
                      {formatRp(item.total_pendapatan)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Tidak ada data laporan untuk periode ini.
        </div>
      )}
    </div>
  );
}