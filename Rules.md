# Rules.md — Aturan Bisnis & Validasi
### Smart Space Booking

---

## 1. Autentikasi & Otorisasi

- Hanya ada 2 role: `member` dan `admin_space`.
- Password minimal 6 karakter, disimpan dengan hash (bcrypt via `Hash::make()`).
- `username` unik lintas seluruh tabel `users` (member maupun admin tidak boleh bentrok).
- Endpoint API dilindungi middleware `auth:sanctum` + role-check tambahan (mis. `role:admin_space`) sesuai kebutuhan.
- Member **hanya** boleh mengakses/mengubah data miliknya sendiri (reservasi, profil).
- Admin **hanya** boleh mengelola data milik `space_owner`-nya sendiri (space, reservasi masuk ke space-nya, member yang pernah bertransaksi dengannya) — bukan data admin/pemilik coworking lain.

## 2. Aturan Ketersediaan Space (Anti-Bentrok Jadwal)

Sebuah space **tidak boleh** dipesan jika terdapat reservasi lain pada `space_id` yang sama, `tanggal_reservasi` yang sama, dengan rentang jam yang **overlap**, selama status reservasi tersebut **bukan** `dibatalkan`.

Rumus overlap (dua rentang waktu A dan B tumpang tindih jika):
```
A.jam_mulai < B.jam_selesai  DAN  B.jam_mulai < A.jam_selesai
```

`jam_selesai` selalu dihitung otomatis di server:
```
jam_selesai = jam_mulai + durasi_jam
```
Frontend **tidak** mengirim `jam_selesai` secara manual.

## 3. Aturan Kode Promo / Diskon

- Diskon dianggap **aktif** hanya jika: `tanggal_awal <= now() <= tanggal_akhir`.
- `persentase_diskon` bernilai 1–100.
- Perhitungan otomatis di server (tidak boleh dihitung di frontend saja):
  ```
  total_harga_awal = harga_per_jam × durasi_jam
  potongan_diskon  = ROUND(total_harga_awal × persentase_diskon / 100)
  total_bayar      = total_harga_awal - potongan_diskon
  ```
- Jika kode promo tidak ditemukan / sudah kedaluwarsa → request reservasi **ditolak** dengan pesan error yang jelas, atau diskon diabaikan (potongan = 0) sesuai keputusan tim (disarankan: tolak agar user sadar kodenya salah).

## 4. Alur Status Reservasi (State Machine)

```
belum_dikonfirm ──(admin approve)──▶ disetujui ──(admin check-in)──▶ aktif ──(admin check-out)──▶ selesai
       │                                  │
       └──────────(member/admin cancel)───┴──▶ dibatalkan
```

Aturan transisi:
- **Member** hanya boleh mengubah status ke `dibatalkan`, dan **hanya** jika status saat ini `belum_dikonfirm` atau `disetujui` (belum check-in).
- **Admin** yang mengubah status ke `disetujui` atau `dibatalkan` melalui endpoint konfirmasi.
- **Check-in** (`aktif`) hanya valid dari status `disetujui`.
- **Check-out** (`selesai`) hanya valid dari status `aktif`.
- Status `selesai` dan `dibatalkan` bersifat final (tidak bisa diubah lagi).

## 5. Aturan Upload File

- Format diterima: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Ukuran maksimal disarankan: 2MB per file.
- File disimpan di `storage/app/public/...` lalu diakses via `php artisan storage:link`, dikembalikan sebagai URL penuh di response API (mis. `foto_url`).

## 6. Aturan Kode Booking & E-Ticket

- `kode_booking` dibuat otomatis, unik, format: `BOOK-YYYYMMDD-XXXX` (4 digit sequence/random).
- QR Code pada e-ticket berisi payload verifikasi, minimal memuat: `id_reservasi` + `kode_booking` (contoh: `RESV-{id}-{kode_booking}`), digunakan admin untuk verifikasi saat check-in di lokasi.
- E-ticket hanya bisa diakses oleh member pemilik reservasi atau admin pemilik space terkait.

## 7. Validasi Umum Input (ringkasan dari struktur DTO)

| Entitas | Field Wajib | Catatan |
|---|---|---|
| Register Member | nama_member, instansi, alamat, telp, username, password | foto opsional |
| Register Admin | nama_coworking, nama_pemilik, telp, username, password | |
| Space | nama_space, harga_per_jam, tipe, kapasitas, deskripsi | tipe harus salah satu dari enum |
| Diskon | nama_diskon (unik), persentase_diskon (1–100), tanggal_awal, tanggal_akhir | tanggal_akhir > tanggal_awal |
| Reservasi | id_space, tanggal_reservasi, jam_mulai, durasi_jam (≥1) | id_diskon/kode_promo opsional |

## 8. Format Response API (Konsisten)

Sukses:
```json
{ "status": true, "statusCode": 200, "message": "...", "data": { ... }, "timestamp": "..." }
```

Error:
```json
{ "status": false, "statusCode": 400, "message": "...", "error": "NamaError", "timestamp": "..." }
```