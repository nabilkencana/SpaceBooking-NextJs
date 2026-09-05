"use client";

import { z } from "zod";
import type { CreateReservasiPayload } from "@/types";

/**
 * Minimal validation rules that mirror the booking form's constraints.
 *
 * - tanggal minimal hari ini
 * - jam_mulai antara 08:00 - 20:00
 * - durasi_jam 1 - 24
 */

// Reusable message helpers
const MESSAGE_TANGGAL_MIN = "Tanggal tidak boleh sebelum hari ini";
const MESSAGE_JAM_RANGE =
  "Jam mulai harus antara 08:00 dan 20:00";
const MESSAGE_DURASI_MIN = "Durasi minimal 1 jam";
const MESSAGE_DURASI_MAX = "Durasi maksimal 24 jam";

/** Today's date (local) as YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * Type of the raw booking form values collected on the client.
 * id_diskon / kode_promo are optional and nullable.
 */
export const bookingFormSchema = z.object({
  id_space: z.number(),
  tanggal_reservasi: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .refine((v) => v >= todayISO(), {
      message: MESSAGE_TANGGAL_MIN,
    }),
  jam_mulai: z
    .string()
    .min(1, "Jam mulai wajib diisi")
    .regex(/^\d{2}:\d{2}$/, "Format jam tidak valid")
    .refine((v) => v >= "08:00" && v <= "20:00", {
      message: MESSAGE_JAM_RANGE,
    }),
  durasi_jam: z
    .number({ message: "Durasi wajib diisi" })
    .int(MESSAGE_DURASI_MIN)
    .min(1, MESSAGE_DURASI_MIN)
    .max(24, MESSAGE_DURASI_MAX),
  id_diskon: z.number().nullable().optional(),
  kode_promo: z.string().nullable().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

/**
 * Shape expected by POST /api/reservasi. Derived from the form type so the
 * two can never drift apart.
 */
export type CreateReservasiInput = z.output<typeof bookingFormSchema>;

/**
 * Convert validated booking form values into the API payload type.
 */
export function toCreateReservasiPayload(
  values: BookingFormValues,
): CreateReservasiPayload {
  return {
    id_space: values.id_space,
    tanggal_reservasi: values.tanggal_reservasi,
    jam_mulai: values.jam_mulai,
    durasi_jam: values.durasi_jam,
    id_diskon: values.id_diskon ?? null,
    kode_promo: values.kode_promo ?? null,
  };
}