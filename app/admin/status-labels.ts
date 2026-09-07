import type { PaymentStatus, ReservasiStatus } from "@/types";

// B6 status label mapping (display only) + page-local action colors.
// Page-local because types/entities.ts STATUS_LABELS predates the B6 strings
// ("Menunggu Konfirmasi" / "Aktif / Digunakan") and is shared with other pages.
export const STATUS_ACTION_LABELS: Record<
  ReservasiStatus,
  { label: string; textClass: string }
> = {
  belum_dikonfirm: { label: "Menunggu Konfirmasi", textClass: "text-amber-700" },
  disetujui: { label: "Disetujui", textClass: "text-emerald-700" },
  aktif: { label: "Aktif / Digunakan", textClass: "text-blue-700" },
  selesai: { label: "Selesai", textClass: "text-gray-500" },
  dibatalkan: { label: "Dibatalkan", textClass: "text-rose-600" },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Lunas",
  unpaid: "Belum Bayar",
  refunded: "Dana Kembali",
};
