export interface CatalogSpace {
  id: number;
  nama: string;
  tipe: 'desk' | 'meeting_room' | 'private_office' | 'focus_pod';
  lokasi: string;
  hargaPerJam: number;
  kapasitas: number;
  wifiSpeed: number;
  luasRuang?: number; // m²
  foto: string;
  badge?: string; // 'Diskon 20% Member' | 'BARU'
  ctaText: string;
  slug: string;
}
