# PRD — Smart Space Booking
### (Aplikasi Reservasi Coworking Space & Workstation)
**Proyek:** UKK RPL 2026/2027 — Paket B
**Kategori:** Fullstack (Laravel API + Next.js/React)
**Versi Dokumen:** 1.0

---

## 1. Latar Belakang

Pengelola coworking space membutuhkan sistem reservasi online untuk menyewakan ruangan dan meja kerja (Personal Desk, Private Office, Meeting Room) kepada freelancer, mahasiswa, startup, dan pekerja profesional. Sistem saat ini masih manual sehingga pengelola kesulitan memantau ketersediaan ruangan, transaksi, dan pendapatan secara real-time.

## 2. Tujuan Produk

- Memberi kemudahan bagi Member untuk melihat, memesan, dan melacak status reservasi space secara online.
- Memberi Admin Pengelola Space alat untuk mengelola data master (member, space, promo) serta memantau transaksi dan pendapatan.
- Menyediakan mekanisme check-in/check-out digital berbasis kode reservasi/QR.

## 3. Target Pengguna (Role)

| Role | Deskripsi |
|---|---|
| **Member / Pengunjung** | Pelanggan yang mendaftar, mencari space, melakukan reservasi, dan melihat histori transaksinya. |
| **Admin Pengelola Space** | Pemilik/pengelola lokasi coworking yang mengatur data space, promo, member, dan memproses reservasi masuk. |

## 4. Ruang Lingkup Fitur

### 4.1 Member / Pengunjung

| # | Fitur | Deskripsi |
|---|---|---|
| M1 | Register Akun | Nama lengkap, instansi, no. telp, alamat, username, password, foto profil |
| M2 | Login | Autentikasi menggunakan username & password |
| M3 | Lihat Ketersediaan Space | Katalog space (Personal Desk, Private Office, Meeting Room) dengan foto, kapasitas, fasilitas, harga per jam |
| M4 | Reservasi Space | Pilih tanggal, jam mulai, durasi (jam), input kode promo (opsional) |
| M5 | Lihat Status Pemesanan | Status: Belum Dikonfirmasi, Disetujui, Aktif/Digunakan, Selesai, Dibatalkan |
| M6 | Histori Pemesanan | Filter berdasarkan bulan |
| M7 | Cetak E-Ticket | Nota reservasi berisi kode reservasi + QR Code untuk check-in di lokasi |

### 4.2 Admin Pengelola Space

| # | Fitur | Deskripsi |
|---|---|---|
| A1 | Register Pengelola | Daftar lokasi coworking, profil pengelola, akun admin |
| A2 | Login | Autentikasi admin |
| A3 | Update Profil Lokasi | Nama space, nama pemilik, alamat, telepon, deskripsi fasilitas |
| A4 | CRUD Member | Kelola data pelanggan |
| A5 | CRUD Space | Kelola ruangan/meja: tipe, kapasitas, harga/jam, deskripsi, foto |
| A6 | CRUD Promo/Diskon | Nama diskon, persentase, tanggal awal & akhir berlaku |
| A7 | Kelola Reservasi | Konfirmasi status, proses check-in & check-out tamu |
| A8 | Lihat Semua Reservasi | Filter berdasarkan status & bulan |
| A9 | Rekap Pendapatan | Estimasi pendapatan per bulan & distribusi per jenis space |

## 5. User Stories (Contoh)

- Sebagai **Member**, saya ingin melihat daftar space yang tersedia beserta harganya, agar saya bisa membandingkan sebelum memesan.
- Sebagai **Member**, saya ingin memasukkan kode promo saat reservasi, agar saya mendapat potongan harga.
- Sebagai **Member**, saya ingin mengunduh e-ticket berisi QR Code, agar proses check-in di lokasi lebih cepat.
- Sebagai **Admin**, saya ingin mengonfirmasi reservasi yang masuk, agar hanya pesanan valid yang diproses.
- Sebagai **Admin**, saya ingin melihat rekap pendapatan bulanan per jenis space, agar saya bisa mengevaluasi performa bisnis.

## 6. Kebutuhan Non-Fungsional

- Responsive untuk layar desktop & tablet (minimal).
- Password di-hash (bcrypt), tidak disimpan plaintext.
- Validasi input di sisi backend (tidak hanya frontend).
- Perhitungan harga (total, diskon, total bayar) dihitung ulang di server, tidak dipercaya dari input klien.
- Waktu respons API wajar untuk operasi CRUD standar.

## 7. Di Luar Cakupan (Out of Scope)

- Pembayaran online (payment gateway) — cukup simulasi status pembayaran/reservasi.
- Aplikasi mobile native (fokus web).
- Notifikasi push/email real-time (opsional, bukan wajib).
- Multi-bahasa (cukup Bahasa Indonesia).

## 8. Kriteria Sukses (Definition of Done)

- Seluruh fitur M1–M7 dan A1–A9 berjalan end-to-end tanpa error kritis.
- Data tersimpan konsisten di database sendiri (bukan API panitia).
- Alur reservasi (booking → konfirmasi → check-in → check-out) dapat didemokan penuh.
- E-ticket menampilkan QR Code yang valid dan bisa dipindai/diverifikasi.