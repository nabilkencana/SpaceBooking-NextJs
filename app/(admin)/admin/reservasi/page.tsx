"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { unwrapApi } from "@/lib/api";
import { StatusBadge } from "@/components/features/StatusBadge";
import { DataTable, type Column } from "@/components/features/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Reservasi, ReservasiStatus } from "@/types";

// ─── Filter helpers ────────────────────────────────────────────────────────

const MONTH_NAMES = [
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

const STATUS_OPTIONS: { value: ReservasiStatus; label: string }[] = [
  { value: "belum_dikonfirm", label: "Belum Dikonfirmasi" },
  { value: "disetujui", label: "Disetujui" },
  { value: "aktif", label: "Aktif" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

interface ReservasiFilters {
  status: string;
  month: string;
  year: string;
}

const DEFAULT_FILTERS: ReservasiFilters = {
  status: "",
  month: "",
  year: "",
};

// ─── Format helpers ────────────────────────────────────────────────────────

const formatRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function formatJam(jam: string): string {
  return jam.length >= 5 ? jam.slice(0, 5) : jam;
}

// ─── Admin reservasi page ──────────────────────────────────────────────────

export default function AdminReservasiPage() {
  const [filters, setFilters] = useState<ReservasiFilters>(DEFAULT_FILTERS);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: reservas = [], isLoading, isError, refetch } = useQuery<Reservasi[]>({
    queryKey: ["admin-reservasi", filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;

      const { data } = await apiClient.get("/admin/reservasi", { params });
      return unwrapApi<Reservasi[]>({ data });
    },
  });

  // ─── Actions ─────────────────────────────────────────────────────────

  const approve = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/admin/reservasi/${id}/status`, {
        status: "disetujui",
      });
    },
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.patch(`/admin/reservasi/${id}/status`, {
        status: "dibatalkan",
      });
    },
  });

  const checkIn = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/admin/reservasi/${id}/check-in`);
    },
  });

  const checkOut = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/admin/reservasi/${id}/check-out`);
    },
  });

  const runAction = async (
    mutation: ReturnType<typeof useMutation<unknown, unknown, number>>,
    id: number,
    successMessage: string,
  ) => {
    if (pendingId !== null) return;
    setPendingId(id);
    try {
      await mutation.mutateAsync(id);
      toast.success(successMessage);
      await queryClient.invalidateQueries({ queryKey: ["admin-reservasi"] });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memproses reservasi",
      );
    } finally {
      setPendingId(null);
    }
  };

  const columns: Column<Reservasi>[] = [
    {
      key: "kode_booking",
      header: "Kode Booking",
      render: (r) => (
        <span className="font-medium tabular-nums">{r.kode_booking}</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      render: (r) => (
        <span>{r.member?.nama_member ?? "-"}</span>
      ),
    },
    {
      key: "space",
      header: "Space",
      render: (r) => <span>{r.space?.nama_space ?? "-"}</span>,
    },
    {
      key: "tanggal_reservasi",
      header: "Tanggal",
      render: (r) => <span className="text-sm">{formatDate(r.tanggal_reservasi)}</span>,
    },
    {
      key: "jam",
      header: "Jam",
      render: (r) => (
        <span className="tabular-nums text-sm">
          {formatJam(r.jam_mulai)} - {formatJam(r.jam_selesai)}
        </span>
      ),
    },
    {
      key: "durasi_jam",
      header: "Durasi",
      render: (r) => (
        <span className="tabular-nums text-sm">{r.durasi_jam} jam</span>
      ),
    },
    {
      key: "total_bayar",
      header: "Total",
      render: (r) => (
        <span className="font-medium tabular-nums">
          {formatRupiah.format(r.total_bayar)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (r) => {
        const disabled = pendingId !== null;
        if (r.status === "belum_dikonfirm") {
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                disabled={disabled}
                onClick={() =>
                  runAction(approve, r.id, "Reservasi disetujui")
                }
              >
                Setujui
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={disabled}
                onClick={() =>
                  runAction(reject, r.id, "Reservasi dibatalkan")
                }
              >
                Tolak
              </Button>
            </div>
          );
        }
        if (r.status === "disetujui") {
          return (
            <Button
              size="sm"
              disabled={disabled}
              onClick={() => runAction(checkIn, r.id, "Check-in berhasil")}
            >
              Check-In
            </Button>
          );
        }
        if (r.status === "aktif") {
          return (
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => runAction(checkOut, r.id, "Check-out berhasil")}
            >
              Check-Out
            </Button>
          );
        }
        return <span className="text-sm text-muted-foreground">-</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data Reservasi</h2>
        <p className="text-sm text-muted-foreground">
          Kelola dan pantau seluruh reservasi coworking space Anda.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, status: value ?? "" }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.month}
          onValueChange={(value) =>
            setFilters((f) => ({ ...f, month: value ?? "" }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua Bulan" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, idx) => (
              <SelectItem key={name} value={String(idx + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          min={2000}
          max={2100}
          value={filters.year}
          onChange={(e) =>
            setFilters((f) => ({ ...f, year: e.target.value }))
          }
          placeholder="Tahun"
          className="w-32"
        />
      </div>

      <DataTable
        columns={columns}
        data={reservas}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyMessage="Tidak ada reservasi"
        rowKey={(r) => String(r.id)}
      />
    </div>
  );
}