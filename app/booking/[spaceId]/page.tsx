"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useAuth";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { useSpace, useCheckAvailability } from "@/hooks/useSpaces";
import { useActiveDiskon, useCheckDiskon } from "@/hooks/useDiskon";
import { useCreateReservation } from "@/hooks/useReservasi";
import {
  bookingFormSchema,
  toCreateReservasiPayload,
  todayISO,
  type BookingFormValues,
} from "@/schemas/reservasi.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Minus, Plus, Search, Ticket } from "lucide-react";
import type { Diskon } from "@/types";

const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n);

/** Potongan = estimate × persentase diskon */
function potonganOf(estimate: number, diskon: Diskon | undefined | null) {
  if (!diskon) return 0;
  return Math.round((estimate * diskon.persentase_diskon) / 100);
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const id = Number(spaceId);

  useRequireAuth("/login");
  const router = useRouter();

  const spaceQuery = useSpace(id);
  const createReservation = useCreateReservation();

  // Form state
  const [durasi, setDurasi] = useState(1);
  const [tanggal, setTanggal] = useState(todayISO());
  const [jamMulai, setJamMulai] = useState("08:00");

  // Availability check control
  const [checking, setChecking] = useState(false);
  const availability = useCheckAvailability(
    {
      id_space: id,
      tanggal,
      jam_mulai: jamMulai,
      durasi_jam: durasi,
    },
    checking,
  );

  // Diskon state
  const activeDiskonQuery = useActiveDiskon();
  const checkDiskon = useCheckDiskon();
  const [selectedDiskon, setSelectedDiskon] = useState<number | "">("");
  const [kodePromo, setKodePromo] = useState("");
  const [validatedDiskon, setValidatedDiskon] = useState<Diskon | null>(null);

  // Form (kept for validation rules + payload shape)
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      id_space: id,
      tanggal_reservasi: todayISO(),
      jam_mulai: "08:00",
      durasi_jam: 1,
      id_diskon: null,
      kode_promo: null,
    },
  });

  const tanggalW = watch("tanggal_reservasi") ?? tanggal;
  const jamW = watch("jam_mulai") ?? jamMulai;
  const durasiW = watch("durasi_jam") ?? durasi;

  // ─── Derived pricing ─────────────────────────────────────────────────

  // Backend estimate when available
  const estimate = availability.data?.estimasi_total ?? null;
  const isAvailable = availability.data?.available ?? false;

  // The diskon that currently applies to the price estimate
  const appliedDiskon = useMemo<Diskon | null>(() => {
    // Explicit kode promo check wins; otherwise use the selected list item
    if (checkDiskon.data?.valid && checkDiskon.data.diskon) {
      return checkDiskon.data.diskon;
    }
    const found = activeDiskonQuery.data?.find(
      (d) => d.id === selectedDiskon,
    );
    return found ?? null;
  }, [checkDiskon.data, selectedDiskon, activeDiskonQuery.data]);

  const potongan = estimate !== null ? potonganOf(estimate, appliedDiskon) : 0;
  const finalEstimate = estimate !== null ? estimate - potongan : null;

  // ─── Actions ──────────────────────────────────────────────────────────

  const onCheckAvailability = (v: BookingFormValues) => {
    setTanggal(v.tanggal_reservasi);
    setJamMulai(v.jam_mulai);
    setDurasi(v.durasi_jam);
    setChecking(true);
  };

  const onCheckDiskonCode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Masukkan kode promo terlebih dahulu");
      return;
    }
    try {
      const res = await checkDiskon.mutateAsync(trimmed);
      if (res.valid && res.diskon) {
        setValidatedDiskon(res.diskon);
        toast.success("Kode promo valid!");
      } else {
        setValidatedDiskon(null);
        toast.error(res.pesan ?? "Kode promo tidak valid");
      }
    } catch (e) {
      setValidatedDiskon(null);
      toast.error(errorMessage(e));
    }
  };

  const onSubmit = async (v: BookingFormValues) => {
    try {
      await createReservation.mutateAsync(toCreateReservasiPayload(v));
      toast.success("Reservasi berhasil dibuat!");
      router.push("/reservasi");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  function errorMessage(e: unknown) {
    if (e instanceof ApiRequestError) return e.message;
    return "Terjadi kesalahan, silakan coba lagi";
  }

  const stepperBtn =
    "flex size-8 items-center justify-center rounded-lg border border-input";

  if (spaceQuery.isLoading) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-2xl p-4 md:p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="mt-6 h-64 w-full rounded-xl" />
        </main>
      </>
    );
  }

  if (!spaceQuery.data) {
    return (
      <>
        <MemberHeader />
        <main className="mx-auto max-w-2xl p-4 md:p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Space tidak ditemukan.
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const space = spaceQuery.data;

  return (
    <>
      <MemberHeader />
      <main className="mx-auto max-w-2xl p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-2 text-muted-foreground"
          onClick={() => router.push("/spaces")}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Spaces
        </Button>

        {/* Space summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{space.nama_space}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Kapasitas: {space.kapasitas} orang</p>
            <p>Harga: {formatRupiah(space.harga_per_jam)} / jam</p>
            {space.deskripsi && <p className="pt-1">{space.deskripsi}</p>}
          </CardContent>
        </Card>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Date / time / durasi */}
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Controller
                  control={control}
                  name="tanggal_reservasi"
                  render={({ field }) => (
                    <Input
                      id="tanggal"
                      type="date"
                      min={todayISO()}
                      value={tanggalW}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.tanggal_reservasi && (
                  <p className="text-xs text-destructive">
                    {errors.tanggal_reservasi.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jam">Jam Mulai</Label>
                <Controller
                  control={control}
                  name="jam_mulai"
                  render={({ field }) => (
                    <Input
                      id="jam"
                      type="time"
                      min="08:00"
                      max="20:00"
                      value={jamW}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.jam_mulai && (
                  <p className="text-xs text-destructive">
                    {errors.jam_mulai.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Durasi (jam)</Label>
                <Controller
                  control={control}
                  name="durasi_jam"
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={stepperBtn}
                        onClick={() =>
                          field.onChange(Math.max(1, (durasiW || 1) - 1))
                        }
                        aria-label="Kurangi durasi"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-12 text-center text-lg font-semibold">
                        {durasiW || 1}
                      </span>
                      <button
                        type="button"
                        className={stepperBtn}
                        onClick={() =>
                          field.onChange(
                            Math.min(24, (durasiW || 1) + 1),
                          )
                        }
                        aria-label="Tambah durasi"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                />
                {errors.durasi_jam && (
                  <p className="text-xs text-destructive">
                    {errors.durasi_jam.message}
                  </p>
                )}
              </div>

              {/* Availability check button */}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleSubmit(onCheckAvailability)}
                disabled={availability.isFetching}
              >
                <Search className="size-4" />
                Cek Ketersediaan
              </Button>

              {/* Availability result */}
              {checking && availability.isFetching && (
                <Skeleton className="h-10 w-full rounded-lg" />
              )}
              {checking &&
                !availability.isFetching &&
                availability.isError && (
                  <p className="text-sm text-destructive">
                    {availability.error instanceof ApiRequestError
                      ? availability.error.message
                      : "Gagal mengecek ketersediaan"}
                  </p>
                )}
              {checking &&
                !availability.isFetching &&
                availability.data &&
                isAvailable && (
                  <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    <p className="font-medium">
                      Tersedia — {space.nama_space}
                    </p>
                    <p>
                      {tanggalW} · {jamW} · {durasiW} jam
                    </p>
                    <p className="mt-1 font-semibold">
                      Estimasi: {formatRupiah(estimate ?? 0)}
                    </p>
                  </div>
                )}
              {checking &&
                !availability.isFetching &&
                availability.data &&
                !isAvailable && (
                  <p className="text-sm text-destructive">
                    Space sudah terisi pada jam tersebut.
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Diskon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="size-4" />
                Diskon / Promo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Promo Aktif</Label>
                <Controller
                  control={control}
                  name="id_diskon"
                  render={({ field }) => (
                    <Select
                      name={field.name}
                      value={
                        field.value != null ? String(field.value) : ""
                      }
                      onValueChange={(val) => {
                        const parsed = val === "" ? null : Number(val);
                        field.onChange(parsed);
                        setSelectedDiskon(parsed ?? "");
                        // switching to a list item clears the manual code
                        if (parsed) {
                          setKodePromo("");
                          setValidatedDiskon(null);
                          checkDiskon.reset();
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tanpa diskon" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="">Tanpa diskon</SelectItem>
                        {activeDiskonQuery.data?.map((d) => (
                          <SelectItem
                            key={d.id}
                            value={String(d.id)}
                          >
                            {d.nama_diskon} — {d.persentase_diskon}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kode-promo">Kode Promo</Label>
                <div className="flex gap-2">
                  <Input
                    id="kode-promo"
                    placeholder="Masukkan kode promo"
                    value={kodePromo}
                    onChange={(e) => {
                      setKodePromo(e.target.value);
                      setValidatedDiskon(null);
                      checkDiskon.reset();
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onCheckDiskonCode(kodePromo)}
                    disabled={checkDiskon.isPending}
                  >
                    Cek
                  </Button>
                </div>
              </div>

              {/* Valid code potongan */}
              {checkDiskon.data?.valid && validatedDiskon && (
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Promo {validatedDiskon.nama_diskon} — potongan{" "}
                  {validatedDiskon.persentase_diskon}%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Price summary */}
          {finalEstimate !== null && (
            <Card className="bg-primary/5 ring-primary/20">
              <CardContent className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimasi awal
                  </span>
                  <span>{formatRupiah(estimate ?? 0)}</span>
                </div>
                {potongan > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Potongan diskon
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatRupiah(potongan)}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total Estimasi</span>
                  <span>{formatRupiah(finalEstimate)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={createReservation.isPending}
          >
            Pesan Sekarang
          </Button>
        </form>
      </main>
    </>
  );
}