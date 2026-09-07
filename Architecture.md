# Architecture.md — Arsitektur Sistem
### Smart Space Booking — Laravel API + Next.js

---

## 1. Ringkasan

Aplikasi dibangun dengan arsitektur **decoupled (terpisah)**:

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   Next.js Frontend   │ ─────────────────────────▶ │   Laravel Backend    │
│  (React, App Router) │ ◀───────────────────────── │   (REST API, PHP)    │
└─────────────────────┘                             └──────────┬───────────┘
                                                                 │
                                                                 ▼
                                                        ┌────────────────┐
                                                        │  MySQL Database │
                                                        └────────────────┘
```

**Penting:** API yang dikonsumsi adalah **API buatan sendiri** (Laravel, dijalankan lokal/hosting sendiri), **bukan** API panitia (`https://learn.smktelkom-mlg.sch.id/coworking/`). Tidak ada header `x-maker-key` yang digunakan — sistem auth & isolasi data memakai mekanisme sendiri (Laravel Sanctum + relasi `owner_id`/`member_id`).

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 11 (PHP 8.2+) |
| Auth API | Laravel Sanctum (token-based) |
| Database | MySQL (via XAMPP/MariaDB lokal) |
| Frontend | Next.js 14+ (App Router) + React |
| Styling | Tailwind CSS |
| HTTP Client (FE) | Axios / fetch API |
| State Management | React Context / Zustand (secukupnya) |
| QR Code | Library `simple-qrcode` (Laravel) atau generate di frontend (`qrcode.react`) |

## 3. Struktur Folder — Backend (Laravel)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       ├── AuthController.php
│   │   │       ├── SpaceController.php
│   │   │       ├── DiskonController.php
│   │   │       ├── ReservasiController.php
│   │   │       ├── Admin/
│   │   │       │   ├── ProfileController.php
│   │   │       │   ├── MemberController.php
│   │   │       │   ├── SpaceAdminController.php
│   │   │       │   ├── DiskonAdminController.php
│   │   │       │   ├── ReservasiAdminController.php
│   │   │       │   └── ReportController.php
│   │   │       └── UploadController.php
│   │   ├── Middleware/
│   │   │   └── EnsureRole.php
│   │   ├── Requests/         # Form Request validation per DTO
│   │   └── Resources/        # API Resource (format response konsisten)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Member.php
│   │   ├── SpaceOwner.php
│   │   ├── Space.php
│   │   ├── Diskon.php
│   │   └── Reservasi.php
│   └── Services/
│       ├── ReservasiService.php   # logika hitung harga, cek bentrok jadwal
│       └── DiskonService.php      # logika validasi promo
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
└── .env
```

## 4. Struktur Folder — Frontend (Next.js)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (member)/
│   │   ├── spaces/page.tsx              # katalog space
│   │   ├── spaces/[id]/page.tsx         # detail + form reservasi
│   │   ├── reservasi/page.tsx           # status pemesanan
│   │   ├── reservasi/history/page.tsx   # histori per bulan
│   │   └── reservasi/[id]/e-ticket/page.tsx
│   ├── (admin)/
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── members/page.tsx
│   │   ├── spaces/page.tsx
│   │   ├── diskon/page.tsx
│   │   ├── reservasi/page.tsx
│   │   └── reports/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/            # Button, Card, Badge, Modal, Table
│   ├── layout/         # Navbar, Sidebar, Footer
│   └── features/       # SpaceCard, BookingForm, StatusBadge, QRCodeView
├── lib/
│   ├── api.ts          # axios instance + interceptor token
│   └── auth.ts
├── types/               # TypeScript interfaces (mirror DTO backend)
└── .env.local
```

## 5. Alur Autentikasi

1. User login via `POST /api/auth/login` (Laravel) → server mengembalikan `access_token` (Sanctum Personal Access Token).
2. Next.js menyimpan token di **httpOnly cookie** (di-set lewat Next.js Route Handler sebagai proxy) — menghindari penyimpanan token di `localStorage` demi keamanan (XSS).
3. Setiap request ke API menyertakan header `Authorization: Bearer <token>` (ditambahkan otomatis oleh interceptor di `lib/api.ts`, token diambil dari cookie via server action / route handler).
4. Middleware Laravel (`auth:sanctum`) memverifikasi token; middleware tambahan (`EnsureRole`) memverifikasi kesesuaian role dengan endpoint yang diakses.

## 6. Konvensi API

- Prefix seluruh endpoint: `/api/...`
- Format response konsisten (lihat `Rules.md` bagian 8).
- Endpoint mengikuti pola dari Kontrak API resmi soal (Bagian III) sebagai referensi penamaan & struktur data, namun **tanpa** header `x-maker-key` dan **tanpa** endpoint `/api/maker/*`.
- Versioning opsional: bisa ditambahkan `/api/v1/...` bila ingin future-proof.

## 7. Environment Variables

**Backend (`.env`)**
```
APP_URL=http://localhost:8000
DB_DATABASE=coworking_space
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

**Frontend (`.env.local`)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 8. Deployment (opsional, untuk demo/pengumpulan)

- Backend: dijalankan lokal via `php artisan serve` atau di-deploy ke hosting yang mendukung PHP (mis. Railway, shared hosting cPanel).
- Frontend: `npm run build && npm run start`, atau deploy ke Vercel dengan `NEXT_PUBLIC_API_URL` diarahkan ke backend yang sudah live.
- Untuk penilaian offline (di komputer ujian), pastikan kedua server bisa dijalankan bersamaan secara lokal (`php artisan serve` di port 8000, `npm run dev` di port 3000).