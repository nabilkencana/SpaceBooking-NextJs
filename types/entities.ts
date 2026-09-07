// ─── Enums ─────────────────────────────────────────────────────────────────

export type Role = "member" | "admin_space";

export type SpaceType =
  | "desk"
  | "meeting_room"
  | "private_office"
  | "focus_pod";

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  desk: "Personal Desk",
  meeting_room: "Meeting Room",
  private_office: "Private Office",
  focus_pod: "Focus Pod",
};

export type ReservasiStatus =
  | "belum_dikonfirm"
  | "disetujui"
  | "aktif"
  | "selesai"
  | "dibatalkan";

export const STATUS_LABELS: Record<ReservasiStatus, string> = {
  belum_dikonfirm: "Belum Dikonfirmasi",
  disetujui: "Disetujui",
  aktif: "Aktif",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export type PaymentMethod = "qris" | "virtual_account" | "manual_transfer";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

// ─── Pagination ───────────────────────────────────────────────────────────

export interface PaginatedMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

// ─── Auth & User ──────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  role: Role;
  member: Member | null;
  space_owner: SpaceOwner | null;
}

export interface Member {
  id: number;
  user_id: number;
  nama_member: string;
  instansi: string;
  alamat: string;
  telp: string;
  foto: string | null;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpaceOwner {
  id: number;
  user_id: number;
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
  alamat: string;
  deskripsi: string;
  hotline: string | null;
  latitude: string | null;
  longitude: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Space ────────────────────────────────────────────────────────────────

export interface SpaceOwnerBrief {
  id: number;
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
}

export interface Space {
  id: number;
  id_owner: number;
  nama_space: string;
  slug: string | null;
  harga_per_jam: number;
  tipe: SpaceType;
  kapasitas: number;
  zona_lantai: string | null;
  wifi_speed: number | null;
  ukuran_m2: string | null;
  badge: string | null;
  amenities: (string | null)[] | null;
  photos: string[] | null;
  deskripsi: string;
  foto: string | null;
  foto_url: string | null;
  owner: SpaceOwnerBrief | null;
  created_at: string;
}

export interface SpaceDetail {
  id: number;
  id_owner: number;
  nama_space: string;
  slug: string | null;
  harga_per_jam: number;
  tipe: SpaceType;
  kapasitas: number;
  zona_lantai: string | null;
  wifi_speed: number | null;
  ukuran_m2: string | null;
  badge: string | null;
  amenities: (string | null)[] | null;
  photos: string[] | null;
  deskripsi: string;
  foto: string | null;
  foto_url: string | null;
  owner: {
    id: number;
    nama_coworking: string;
    nama_pemilik: string;
    telp: string;
    alamat: string;
    deskripsi: string;
  } | null;
  created_at: string;
}

export interface SpaceBrief {
  id: number;
  nama_space: string;
  tipe: SpaceType;
}

export interface SpaceWithFoto {
  id: number;
  nama_space: string;
  tipe: SpaceType;
  foto_url: string | null;
}

// ─── Diskon ───────────────────────────────────────────────────────────────

export interface Diskon {
  id: number;
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  is_active: boolean;
  nama_event?: string | null;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  times_used?: number;
  is_aktif?: boolean;
}

// ─── Reservasi ────────────────────────────────────────────────────────────

export interface MemberBrief {
  id: number;
  nama_member: string;
  telp: string;
}

export interface MemberBriefDetail {
  id: number;
  nama_member: string;
  instansi: string;
  telp: string;
}

export interface SpaceBriefDetail {
  id: number;
  nama_space: string;
  harga_per_jam: number;
  tipe: SpaceType;
  foto_url: string | null;
}

export interface DiskonApplied {
  id: number;
  nama_diskon: string;
  persentase_diskon: number;
}

export interface Reservasi {
  id: number;
  kode_booking: string;
  id_member: number;
  id_space: number;
  id_diskon: number | null;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  harga_per_jam: number;
  total_harga_awal: number;
  potongan_diskon: number;
  biaya_layanan: number;
  total_bayar: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: ReservasiStatus;
  check_in_at: string | null;
  check_out_at: string | null;
  space: SpaceBrief | null;
  member: MemberBrief | null;
  created_at: string;
  updated_at: string;
}

export interface ReservasiDetail {
  id: number;
  kode_booking: string;
  id_member: number;
  id_space: number;
  id_diskon: number | null;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  harga_per_jam: number;
  total_harga_awal: number;
  potongan_diskon: number;
  biaya_layanan: number;
  total_bayar: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: ReservasiStatus;
  check_in_at: string | null;
  check_out_at: string | null;
  member: MemberBriefDetail | null;
  space: SpaceBriefDetail | null;
  diskon: DiskonApplied | null;
  created_at: string;
  updated_at: string;
}

// ─── History ──────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: number;
  kode_booking: string;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  total_bayar: number;
  status: ReservasiStatus;
  space_name: string;
}

export interface HistoryResponse {
  month: number;
  year: number;
  total_reservasi: number;
  total_pengeluaran: number;
  items: HistoryItem[];
}

// ─── E-Ticket ─────────────────────────────────────────────────────────────

export interface ETicket {
  e_ticket_number: string;
  kode_booking: string;
  coworking_space: {
    nama: string;
    telepon: string;
    alamat: string;
  } | null;
  member: {
    nama: string;
    instansi: string;
    telp: string;
  } | null;
  space: {
    nama: string;
    tipe: string;
    harga_per_jam: number;
  } | null;
  jadwal: {
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi: string;
  };
  rincian_pembayaran: {
    tarif_kotor: number;
    diskon_promo: string | null;
    potongan: number;
    total_dibayar: number;
  };
  status_reservasi: ReservasiStatus;
  qr_code_payload: string;
  check_in_at: string | null;
  check_out_at: string | null;
}

// ─── Login ────────────────────────────────────────────────────────────────

export interface LoginResponse {
  id: number;
  username: string;
  role: Role;
  member: Member | null;
  space_owner: SpaceOwner | null;
  access_token: string;
}

// ─── Create Reservasi Payload ─────────────────────────────────────────────

export interface CreateReservasiPayload {
  id_space: number;
  tanggal_reservasi: string;
  jam_mulai: string;
  durasi_jam: number;
  id_diskon?: number | null;
  kode_promo?: string | null;
  payment_method?: PaymentMethod;
}

// ─── Coupon Validation ────────────────────────────────────────────────────

export interface ValidateCouponPayload {
  kode: string;
  subtotal?: number;
}

export interface ValidateCouponResponse {
  id: number;
  nama_diskon: string;
  persentase_diskon: number;
  tanggal_awal: string;
  tanggal_akhir: string;
  is_active: boolean;
  potongan?: number;
}

// ─── Availability ─────────────────────────────────────────────────────────

export interface AvailableSlot {
  available: boolean;
  id_space: number;
  nama_space: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  harga_per_jam: number;
  estimasi_total: number;
}

export type AvailabilityResponse = AvailableSlot;

// ─── Admin Profile ────────────────────────────────────────────────────────

export type AdminProfile = SpaceOwner;

// ─── Reports ──────────────────────────────────────────────────────────────

export interface RincianPerTipe {
  tipe: SpaceType;
  label: string;
  total_booking: number;
  total_jam: number;
  total_pendapatan: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  total_transaksi: number;
  total_jam_terpakai: number;
  estimasi_pendapatan_kotor: number;
  total_potongan_diskon: number;
  realisasi_pendapatan_bersih: number;
  rincian_per_tipe_space: RincianPerTipe[];
}

export interface IncomeReport {
  month: number;
  year: number;
  realisasi_pendapatan_bersih: number;
}