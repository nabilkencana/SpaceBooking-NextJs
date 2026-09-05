# Schema.md — Desain Database
### Smart Space Booking (Fullstack — Laravel + Next.js)

> Skema di bawah diadaptasi dari ERD resmi soal UKK (Bagian II). Tabel `reservasi` dan `detail_reservasi` pada ERD asli **digabung menjadi satu tabel `reservasis`**, karena setiap transaksi hanya melibatkan **satu space** dan **maksimal satu diskon** — tidak ada kebutuhan multi-item per reservasi. Penyesuaian ini tidak mengurangi fitur apa pun (sesuai catatan resmi: *"desain database boleh disesuaikan namun tidak mengurangi fitur yang telah dijabarkan"*).

---

## 1. Entity Relationship Overview

```
users (1) ────< (1) members
users (1) ────< (1) space_owners ────< (N) spaces
members (1) ──< (N) reservasis >── (1) spaces
diskons (1) ──< (0..N) reservasis
```

- 1 `users` → 1 `members` **atau** 1 `space_owners` (tergantung role).
- 1 `space_owners` → banyak `spaces`.
- 1 `members` → banyak `reservasis`.
- 1 `spaces` → banyak `reservasis`.
- 1 `diskons` → banyak `reservasis` (opsional, nullable).

---

## 2. Detail Tabel

### 2.1 `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| username | VARCHAR(50) UNIQUE | |
| password | VARCHAR(255) | Hashed (bcrypt) |
| role | ENUM('member','admin_space') | |
| created_at / updated_at | TIMESTAMP | |

### 2.2 `members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| user_id | BIGINT (FK → users.id, UNIQUE) | |
| nama_member | VARCHAR(100) | |
| instansi | VARCHAR(100) | |
| alamat | TEXT | |
| telp | VARCHAR(20) | |
| foto | VARCHAR(255) NULLABLE | path/nama file foto profil |
| created_at / updated_at | TIMESTAMP | |

### 2.3 `space_owners`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| user_id | BIGINT (FK → users.id, UNIQUE) | |
| nama_coworking | VARCHAR(100) | |
| nama_pemilik | VARCHAR(100) | |
| telp | VARCHAR(20) | |
| alamat | TEXT NULLABLE | dibutuhkan fitur A3 (update profil lokasi) |
| deskripsi | TEXT NULLABLE | deskripsi fasilitas lokasi |
| created_at / updated_at | TIMESTAMP | |

### 2.4 `spaces`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| owner_id | BIGINT (FK → space_owners.id) | |
| nama_space | VARCHAR(100) | |
| harga_per_jam | INTEGER | dalam Rupiah |
| tipe | ENUM('desk','meeting_room','private_office') | |
| kapasitas | INTEGER | jumlah orang |
| deskripsi | TEXT | fasilitas pendukung |
| foto | VARCHAR(255) NULLABLE | |
| created_at / updated_at | TIMESTAMP | |

### 2.5 `diskons`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| nama_diskon | VARCHAR(100) UNIQUE | kode promo |
| persentase_diskon | INTEGER | 1–100 |
| tanggal_awal | DATETIME | |
| tanggal_akhir | DATETIME | |
| created_at / updated_at | TIMESTAMP | |

### 2.6 `reservasis`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT (PK, AI) | |
| kode_booking | VARCHAR(50) UNIQUE | format: `BOOK-YYYYMMDD-XXXX` |
| member_id | BIGINT (FK → members.id) | |
| space_id | BIGINT (FK → spaces.id) | |
| diskon_id | BIGINT (FK → diskons.id) NULLABLE | |
| tanggal_reservasi | DATE | |
| jam_mulai | TIME | |
| jam_selesai | TIME | dihitung otomatis (jam_mulai + durasi_jam) |
| durasi_jam | INTEGER | minimal 1 |
| harga_per_jam | INTEGER | snapshot harga saat transaksi |
| total_harga_awal | INTEGER | harga_per_jam × durasi_jam |
| potongan_diskon | INTEGER | default 0 |
| total_bayar | INTEGER | total_harga_awal − potongan_diskon |
| status | ENUM('belum_dikonfirm','disetujui','aktif','selesai','dibatalkan') | default `belum_dikonfirm` |
| check_in_at | DATETIME NULLABLE | |
| check_out_at | DATETIME NULLABLE | |
| created_at / updated_at | TIMESTAMP | |

---

## 3. Indexing yang Disarankan

- `spaces (owner_id)`
- `reservasis (space_id, tanggal_reservasi)` — mempercepat pengecekan bentrok jadwal
- `reservasis (member_id)`
- `reservasis (status)`
- `diskons (nama_diskon)` — sudah unique, otomatis ter-index

## 4. Catatan Migrasi Laravel

- Gunakan `foreignId()->constrained()->cascadeOnDelete()` sesuai kebutuhan (misal: hapus space_owner tidak seharusnya menghapus reservasi historis → gunakan `restrictOnDelete()` untuk `spaces` dan `reservasis`).
- `harga_per_jam` di `reservasis` **wajib** disalin (snapshot) dari `spaces.harga_per_jam` pada saat pemesanan dibuat — supaya histori tidak berubah jika admin mengubah harga space di kemudian hari.