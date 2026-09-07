"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAdminProfile, useUpdateAdminProfile } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
  nama_coworking: z.string().min(1, "Nama coworking wajib diisi"),
  nama_pemilik: z.string().min(1, "Nama pemilik wajib diisi"),
  telp: z.string().min(1, "Nomor telepon wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  deskripsi: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const { data: profile, isLoading, isError } = useAdminProfile();
  const updateProfile = useUpdateAdminProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama_coworking: "",
      nama_pemilik: "",
      telp: "",
      alamat: "",
      deskripsi: "",
    },
  });

  // Pre-fill form when profile data loads
  useEffect(() => {
    if (profile) {
      reset({
        nama_coworking: profile.nama_coworking,
        nama_pemilik: profile.nama_pemilik,
        telp: profile.telp,
        alamat: profile.alamat,
        deskripsi: profile.deskripsi ?? "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values);
      toast.success("Profil berhasil diperbarui");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memperbarui profil";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Gagal memuat profil</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profil Coworking Space</h2>
        <p className="text-sm text-muted-foreground">
          Kelola informasi profil coworking space Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_coworking">Nama Coworking Space</Label>
              <Input id="nama_coworking" {...register("nama_coworking")} />
              {errors.nama_coworking && (
                <p className="text-xs text-destructive">
                  {errors.nama_coworking.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_pemilik">Nama Pemilik</Label>
              <Input id="nama_pemilik" {...register("nama_pemilik")} />
              {errors.nama_pemilik && (
                <p className="text-xs text-destructive">
                  {errors.nama_pemilik.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telp">Nomor Telepon</Label>
              <Input id="telp" type="tel" {...register("telp")} />
              {errors.telp && (
                <p className="text-xs text-destructive">
                  {errors.telp.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea id="alamat" rows={3} {...register("alamat")} />
              {errors.alamat && (
                <p className="text-xs text-destructive">
                  {errors.alamat.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={4}
                placeholder="Deskripsikan coworking space Anda..."
                {...register("deskripsi")}
              />
              {errors.deskripsi && (
                <p className="text-xs text-destructive">
                  {errors.deskripsi.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}