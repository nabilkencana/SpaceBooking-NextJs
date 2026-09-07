"use client";

import { z } from "zod";
import type { SpaceType } from "@/types";

export const spaceSchema = z.object({
  nama_space: z.string().min(1, "Nama space wajib diisi"),
  tipe: z.enum(["desk", "meeting_room", "private_office"], {
    message: "Tipe space wajib dipilih",
  }),
  harga_per_jam: z
    .number({ message: "Harga wajib diisi" })
    .min(1000, "Harga minimal Rp 1.000"),
  kapasitas: z
    .number({ message: "Kapasitas wajib diisi" })
    .int("Kapasitas harus bilangan bulat")
    .min(1, "Kapasitas minimal 1")
    .max(100, "Kapasitas maksimal 100"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
});

export type SpaceFormValues = z.infer<typeof spaceSchema>;
export type CreateSpaceInput = z.output<typeof spaceSchema>;

/**
 * Validation rules for the admin Diskon CRUD form.
 *
 * - nama_diskon wajib
 * - persentase_diskon 1 - 100
 * - tanggal_awal / tanggal_akhir wajib, tanggal_akhir > tanggal_awal
 */
export const diskonSchema = z
  .object({
    nama_diskon: z.string().min(1, "Nama diskon wajib diisi"),
    persentase_diskon: z
      .number({ message: "Persentase wajib diisi" })
      .int("Persentase harus bilangan bulat")
      .min(1, "Persentase minimal 1%")
      .max(100, "Persentase maksimal 100%"),
    tanggal_awal: z.string().min(1, "Tanggal awal wajib diisi"),
    tanggal_akhir: z.string().min(1, "Tanggal akhir wajib diisi"),
  })
  .refine(
    (d) => new Date(d.tanggal_akhir) > new Date(d.tanggal_awal),
    {
      message: "Tanggal akhir harus setelah tanggal awal",
      path: ["tanggal_akhir"],
    },
  );

export type DiskonFormValues = z.infer<typeof diskonSchema>;

/**
 * Convert validated diskon form values into the API payload.
 * Backend expects datetime strings (append T00:00:00 to the date-only value).
 */
export function toCreateDiskonPayload(
  values: DiskonFormValues,
): {
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
} {
  return {
    nama_diskon: values.nama_diskon,
    persentase_diskon: values.persentase_diskon,
    tanggal_awal: `${values.tanggal_awal}T00:00:00`,
    tanggal_akhir: `${values.tanggal_akhir}T00:00:00`,
  };
}

/**
 * Extract just the date-only part (YYYY-MM-DD) for pre-filling a date input.
 */
export function toDateInputValue(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export type { SpaceType };