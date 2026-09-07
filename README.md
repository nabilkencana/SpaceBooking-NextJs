# 🖥️ Smart Space Booking — Frontend (Next.js)

> **Frontend web** untuk sistem Reservasi Coworking Space Cerdas (UKK RPL 2026/2027 — Paket B)  
> Dibangun dengan **Next.js 16.3** (App Router) + **TypeScript** + **Tailwind CSS v4** + **shadcn/ui**.

Frontend ini meng-consume backend REST API Laravel yang sudah terpasang. Lihat backend `paketb-backend/` di repo root untuk API-nya.

---

## 🚀 Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16.3 (App Router) |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Font | Plus Jakarta Sans (via next/font) |
| Auth | BFF Pattern — httpOnly cookie via Route Handler proxy |
| Server State | TanStack Query (@tanstack/react-query) |
| Form | React Hook Form + Zod |
| Toast | sonner |
| QR Code | qrcode.react |
| E-Ticket PDF | html2canvas + jspdf |
| HTTP Client | axios |

---

## 🔐 Arsitektur Auth (BFF Pattern)

Frontend **tidak pernah** menyimpan token di `localStorage`/`sessionStorage` (aman dari XSS).

```
Browser ──▶ Next.js Route Handler (proxy) ──▶ Laravel API
              │
              └─ set/reset httpOnly cookie: sb_token
```

- **Login** → `POST /api/proxy-login` → forward ke Laravel `/auth/login` → set cookie `sb_token` (httpOnly) + `sb_role`.
- **Register** → `POST /api/proxy-register` → forward ke register backend → set cookie yang sama.
- **Semua request API** → `apiClient` (axios, base `/api`) → ditangkap route handler `app/api/[...path]/route.ts` yang otomatis melampirkan `Authorization: Bearer <sb_token>` dari cookie (termasuk query params).
- **Logout** → `POST /api/proxy-logout` → clear cookie + revoke token backend.
- **Proteksi route** → `middleware.ts` membaca cookie `sb_token` + `sb_role`, redirect ke `/login` bila invalid, redirect cross-role ke home masing-masing.

### Tokens & Proteksi
- **Member** home: `/reservasi`
- **Admin** home: `/admin/dashboard`
- Route `/booking/*`, `/reservasi/*` → hanya member
- Route `/admin/*`, `/dashboard/*` → hanya admin_space
- Public: `/` (landing), `/spaces`, `/login`, `/register`

---

## 📁 Struktur Folder

```
paketb-frontend/
├── app/
│   ├── api/
│   │   ├── proxy-login/          # POST login → set httpOnly cookie
│   │   ├── proxy-register/       # POST register → set cookie
│   │   ├── proxy-logout/         # POST logout → clear cookie
│   │   └── [...path]/            # generic BFF proxy → forward ke backend
│   ├── (auth)/login|register/    # halaman login & register
│   ├── booking/[spaceId]/        # form reservasi (member)
│   ├── reservasi/                # status reservasi, [id], history, e-ticket
│   ├── spaces/                   # katalog & detail space (publik)
│   ├── (admin)/admin/            # panel admin (dashboard, profil, member, space, diskon, reservasi, laporan)
│   ├── page.tsx                  # landing page
│   └── layout.tsx                # root layout (Providers + Toaster)
├── components/                   # ui/ (shadcn), layout/, features/
├── contexts/                     # AuthContext
├── hooks/                        # useAuth, useAdmin, useSpaces, useReservasi, useDiskon
├── lib/                          # api-client, api-server, api (unwrapApi), utils
├── schemas/                      # Zod schemas
├── types/                        # TypeScript interfaces (mirror backend DTO)
├── middleware.ts                 # route protection by role
└── .env.local                    # konfigurasi
```

---

## ⚙️ Instalasi & Menjalankan

### Prasyarat
- Backend Laravel sudah berjalan di `http://localhost:8000/api` (lihat README backend di repo root).
- Node.js 20+ / 22+.

### 1. Install Dependensi
```bash
cd paketb-frontend
npm install
```

### 2. Konfigurasi Environment
```bash
touch .env.local
```
Isi file `.env.local`:
```env
BACKEND_API_URL=http://localhost:8000/api
```

### 3. Jalankan Dev Server
```bash
npm run dev
```
Akses di **http://localhost:3000**

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 🔑 Akun Demo

| Peran | Username | Password | Home |
|---|---|---|---|
| Admin Space | `admin_demo` | `Admin123!` | `/admin/dashboard` |
| Member | `budi.member` | `Member123!` | `/reservasi` |
| Member | `siti.member` | `Member123!` | `/reservasi` |

---

## 🧭 Alur Fitur Utama

1. **Katalog Space** (`/spaces`) — Jelajahi & cari coworking space (tipe: desk, meeting room, private office).
2. **Reservasi Member** — Pilih space → tanggal/jam/durasi → cek ketersediaan → promo diskon → submit booking.
3. **Status Reservasi** — Tab filter per status, badge warna, tombol aksi kondisional (batal hanya jika belum dikonfirmasi/disetujui).
4. **E-Ticket & QR** — Unduh PDF berisi QR Code verifikasi (`qrcode.react` + `html2canvas` + `jspdf`).
5. **Panel Admin** — Dashboard statistik, CRUD member/space/diskon, kelola reservasi (Setujui/Tolak, Check-In, Check-Out), laporan bulanan per tipe space.

---

## 🎨 Tema Warna

- **Primary** indigo `#4F46E5`
- **Accent** amber `#F59E0B`
- Status badge: amber (pending), sky (approved), hijau (aktif), slate (selesai), merah (dibatalkan)

---

## 🧪 Verifikasi

```bash
npx tsc --noEmit   # type check
npm run build      # production build
```

`npm run build` harus berhasil tanpa error. Semua halaman publik (`/`, `/spaces`, `/login`, `/register`) dan halaman protected (member/admin) ter-render dengan baik setelah login via proxy.
