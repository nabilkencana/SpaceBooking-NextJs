"use client";

import { Users, DoorOpen, CalendarCheck, Wallet } from "lucide-react";
import { useDashboardStats } from "@/hooks/useAdmin";
import { StatCard } from "@/components/features/StatCard";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboardPage() {
  const { members, spaces, reservationsThisMonth, incomeThisMonth } =
    useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Selamat Datang Kembali</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan aktivitas coworking space Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Member"
          value={members.data?.length ?? 0}
          icon={<Users className="size-4" />}
          loading={members.isLoading}
        />
        <StatCard
          title="Total Space"
          value={spaces.data?.length ?? 0}
          icon={<DoorOpen className="size-4" />}
          loading={spaces.isLoading}
        />
        <StatCard
          title="Reservasi Bulan Ini"
          value={reservationsThisMonth.data?.length ?? 0}
          icon={<CalendarCheck className="size-4" />}
          loading={reservationsThisMonth.isLoading}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={
            incomeThisMonth.data
              ? formatRupiah(incomeThisMonth.data.realisasi_pendapatan_bersih)
              : 0
          }
          icon={<Wallet className="size-4" />}
          loading={incomeThisMonth.isLoading}
        />
      </div>
    </div>
  );
}