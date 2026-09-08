# 🖥️ Smart Space Booking — Frontend (Next.js)

> **Frontend web** untuk sistem Reservasi Coworking Space Cerdas (UKK RPL 2026/2027 — Paket B)
> Dibangun dengan **Next.js 16.3** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS v4**.

Frontend ini meng-consume backend REST API Laravel (`paketb-backend/` di repo root). Seluruh UI memakai bahasa Inggris dan seluruh data dirender dari API live, tanpa dummy data.

---

## 🚀 Tech Stack

| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16.3.4 (App Router) |
| UI Runtime | React 19.2.8 |
| Bahasa | TypeScript (strict) |
| Styling | Tailwind CSS v4 + komponen shadcn/ui |
| Font | Plus Jakarta Sans + Syne (via next/font) |
| Server State | TanStack Query v5 (`@tanstack/react-query`) |
| HTTP Client | axios (BFF via Route Handler) |
| Route Protection | `proxy.ts` (konvensi Next 16 pengganti `middleware.ts`) |
| Toast | sonner |
| Motion | framer-motion + GSAP (@gsap/react) + lenis |
| QR Code | qrcode.react |
| Form | React Hook Form + Zod (registrasi admin) |
| E2E Test | Playwright (devDependency saja) |

---

## 🔐 Arsitektur Auth (BFF Pattern)

Frontend **tidak pernah** menyimpan token di `localStorage`/`sessionStorage` (aman dari XSS). Access token hanya hidup di cookie httpOnly.

```
Browser ──▶ Next.js Route Handler (proxy) ──▶ Laravel API
              │
              └─ set/clear httpOnly cookie: sb_token
```

- **Login** → `POST /api/proxy-login` → forward ke Laravel `/auth/login` → set cookie `sb_token` (httpOnly, 7 hari) + `sb_role` (readable, dipakai proxy untuk routing role).
- **Register** → `POST /api/proxy-register` → forward ke register backend → set cookie yang sama. Tersedia dua alur: member (`/register`) dan admin space (`/register/admin`).
- **Semua request API** → `apiClient` (axios, baseURL `/api`) → ditangkap `app/api/[...path]/route.ts` yang otomatis melampirkan `Authorization: Bearer <sb_token>` dari cookie secara server-side (JSON dan multipart/form-data, termasuk query string).
- **Logout** → `POST /api/proxy-logout` → revoke token Sanctum di backend (best effort) + clear cookie.
- **Proteksi route** → `proxy.ts` membaca cookie `sb_token` + `sb_role`. Tanpa token → redirect ke `/login?redirect=...`. Role salah → redirect ke home sesuai role.

---

## 🛡️ Route Protection (`proxy.ts`)

Next 16 mengganti konvensi `middleware.ts` dengan `proxy.ts` (named export `proxy`, runtime `nodejs`). File `middleware.ts` sudah dihapus dari repo.

| Kategori | Route |
|---|---|
| Publik | `/` (landing), `/spaces`, `/spaces/[slug]`, `/login`, `/register`, `/register/admin` |
| Member (login `member`) | `/reservations`, `/reservations/[id]/ticket` |
| Admin (login `admin_space`) | `/admin/**` |
| Bypass | `/api/**` (BFF Route Handlers) |

- Home **member**: `/reservations`. Home **admin**: `/admin`.
- Legacy `/booking` sudah dihapus; booking dilakukan dari halaman detail space `/spaces/[slug]` (widget `workspace-detail-booking.tsx`).
- Matcher `proxy.ts` juga menjaga prefix legacy (`/dashboard`, `/member`, `/my`, `/panel`) sebagai alias proteksi.

### Halaman Admin (`/admin/**`, 6 halaman)

| Route | File | Fungsi |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard statistik |
| `/admin/reservations` | `app/admin/reservations/page.tsx` | Kelola reservasi: approve/reject, check-in via QR scanner (turnstile), check-out |
| `/admin/inventory` | `app/admin/inventory/page.tsx` | Inventaris/CRUD space |
| `/admin/coupons` | `app/admin/coupons/page.tsx` | Kelola kupon diskon |
| `/admin/members` | `app/admin/members/page.tsx` | Kelola member |
| `/admin/settings/location` | `app/admin/settings/location/page.tsx` | Profil lokasi coworking (nama, alamat, kontak) |

---

## 📁 Struktur Folder

```
paketb-frontend/
├── app/
│   ├── api/
│   │   ├── [...path]/route.ts      # BFF proxy umum → Laravel (Bearer dari cookie)
│   │   ├── proxy-login/route.ts    # POST login → set httpOnly cookie
│   │   ├── proxy-register/route.ts # POST register → set cookie
│   │   └── proxy-logout/route.ts   # POST logout → revoke + clear cookie
│   ├── (auth)/login|register/      # login, register member, register/admin
│   ├── admin/                      # 6 halaman admin (tabel di atas)
│   ├── reservations/               # member: daftar reservasi + [id]/ticket (e-ticket)
│   ├── spaces/                     # publik: katalog + [slug] detail + booking widget
│   ├── page.tsx                    # landing page
│   ├── layout.tsx                  # root layout (font, Toaster)
│   ├── providers.tsx / query-provider.tsx
├── components/                     # ui/ (shadcn), layout/, features/, admin/, auth/
├── contexts/                       # AuthContext
├── hooks/                          # useAuth, useAdmin, useSpaces, useReservasi, useDiskon
├── lib/                            # api-client (axios), api-server (cookie BFF), api, utils
├── schemas/                        # Zod schemas (admin, reservasi)
├── types/                          # TypeScript interfaces (mirror DTO backend)
├── proxy.ts                        # route protection by role (konvensi Next 16)
└── .env.local                      # konfigurasi
```

---

## 🕐 Zona Waktu & Jam Booking

- Backend berjalan pada zona **Asia/Jakarta (WIB, UTC+7)**, dikonfigurasi di `paketb-backend/config/app.php`. Frontend menampilkan jam dengan label WIB (e-ticket, admin reservasi, settings lokasi).
- Slot booking berupa jam penuh **08:00 sampai 20:00** (`TIME_OPTIONS` di `app/spaces/[slug]/workspace-detail-booking.tsx`).
- E-ticket juga mengekspor file kalender `.ics` (RFC 5545) dengan `TZID=Asia/Jakarta`.

---

## ⚙️ Instalasi & Menjalankan

### Prasyarat
- Backend Laravel berjalan di `http://localhost:8000/api` (lihat README backend di repo root).
- Node.js 20+ / 22+.

### 1. Install Dependensi
```bash
cd paketb-frontend
npm install
```

### 2. Konfigurasi Environment
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

### Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Production build |
| `npm run start` | Menjalankan build produksi |
| `npm run lint` | ESLint (saat ini exit 0, tanpa error) |
| `npx playwright test` | E2E journeys (lihat bagian E2E) |

---

## 🧪 E2E Test (Playwright, dev-only)

```bash
npx playwright test
```

- `playwright.config.ts` menjalankan **dua webServer otomatis**: Laravel API `:8000` (`php artisan serve` di `paketb-backend`) dan Next dev server **`:3001`** (port 3000 dipakai proses lain di mesin pengembang; bisa diganti lewat `baseURL`).
- `globalSetup` me-reset database dev dengan `php artisan migrate:fresh --seed` di `paketb-backend` (suite Pest memakai DB test terpisah, jadi tidak bentrok).
- Suite berjalan **serial** (`workers: 1`, `retries: 0`) karena J2 memakai `qr_payload` hasil J1 dan test memutasi state DB bersama.
- Tiga journey di `tests/e2e/journeys.spec.ts`:
  1. **J1** — member booking "Personal Desk - Flexi 01" hari ini dengan kupon `DISKONMEMBER20`, mendapat e-ticket QR.
  2. **J2** — admin approve booking, check-in via turnstile QR, lalu check-out.
  3. **J3** — admin membuat kupon `TESTE2E10`, validasi via `/diskon/check`, update lokasi, footer mencerminkan data baru.
- Journey memakai backend clock sungguhan, jadi dijalankan saat jam kerja **07:30 sampai 20:30 WIB** (guard ada di spec).

---

## 🔑 Akun Demo (dari seeder backend)

| Peran | Username | Password | Home |
|---|---|---|---|
| Admin Space | `admin_demo` | `Admin123!` | `/admin` |
| Member | `budi.member` | `Member123!` | `/reservations` |
| Member | `siti.member` | `Member123!` | `/reservations` |
| Member | `agus.member` | `Member123!` | `/reservations` |

---

## 🧭 Alur Fitur Utama

1. **Katalog Space** (`/spaces`) — jelajahi & cari coworking space (desk, meeting room, private office).
2. **Detail & Booking** (`/spaces/[slug]`) — pilih tanggal, jam (08:00–20:00), durasi, kupon diskon, submit booking.
3. **Reservasi Member** (`/reservations`) — daftar reservasi dengan status live, aksi batal kondisional.
4. **E-Ticket & QR** (`/reservations/[id]/ticket`) — QR verifikasi (`qrcode.react`), print to PDF via `window.print()`, dan unduh `.ics`.
5. **Panel Admin** (`/admin`) — dashboard, kelola reservasi (approve, check-in QR scanner, check-out), inventory space, kupon, member, dan profil lokasi.
6. **Footer Live Data** — `MotionFooter` (`components/ui/motion-footer.tsx`) menampilkan data lokasi live dari `GET /location/profile` via hook `usePublicLocation`.

---

## 🧪 Verifikasi

```bash
npm run lint        # eslint, exit 0
npx tsc --noEmit    # type check
npm run build       # production build harus sukses
npx playwright test # e2e journeys (butuh backend + jam kerja WIB)
```
