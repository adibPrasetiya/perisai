# Perisai

Aplikasi manajemen risiko berbasis web yang mendukung proses identifikasi, penilaian, dan pengelolaan risiko organisasi.

## Tech Stack

### Backend
- **Runtime:** Node.js (ESM)
- **Framework:** Express 5
- **ORM:** Prisma 7 + `@prisma/adapter-mariadb`
- **Database:** MariaDB
- **Auth:** JWT + TOTP (2FA wajib)
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** Vue 3 + TypeScript
- **Build Tool:** Vite
- **UI Library:** PrimeVue 4
- **State Management:** Pinia
- **HTTP Client:** Axios

## Struktur Proyek

```
perisai/
├── backend/        # REST API (Node.js + Express)
└── frontend/       # Web App (Vue 3 + TypeScript)
```

## Cara Menjalankan

### Prasyarat
- Node.js >= 18
- MariaDB

### Backend

```bash
cd backend

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
# Edit .env sesuai konfigurasi lokal

# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate deploy

# (Opsional) Seed data awal
npm run seed

# Jalankan server development
npm run dev
```

Server berjalan di `http://localhost:3000` (sesuai `APP_PORT` di `.env`).

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Environment Variables

Salin `backend/.env.example` menjadi `backend/.env` dan sesuaikan nilai berikut:

| Variable | Keterangan |
|---|---|
| `APP_PORT` | Port server (default: 3000) |
| `NODE_ENV` | Environment (`dev` / `production`) |
| `DATABASE_URL` | Connection string MariaDB |
| `DATABASE_USER` | Username database |
| `DATABASE_PASSWORD` | Password database |
| `DATABASE_NAME` | Nama database |
| `DATABASE_HOST` | Host database |
| `DATABASE_PORT` | Port database (default: 3306) |
| `ACCESS_TOKEN_SECRET` | Secret untuk JWT access token |
| `ACCESS_TOKEN_EXPIRY` | Masa berlaku access token (default: `15m`) |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Masa berlaku refresh token dalam hari (default: `7`) |
| `TOTP_ENCRYPTION_KEY` | Key enkripsi TOTP secret (hex 32 byte) |
| `JWT_TOTP_SECRET` | Secret JWT untuk pre-auth TOTP token |
| `ALLOWED_ORIGINS` | CORS allowed origins (contoh: `http://localhost:5173`) |

Generate nilai secret secara aman:
```bash
openssl rand -hex 32
```

## Fitur Utama

- **Autentikasi** — Login dengan username/email + password + TOTP (2FA wajib)
- **Manajemen Pengguna** — Role-based access control (Admin, User, Komite Pusat, Pengelola Risiko UKer)
- **Unit Kerja** — Pengelolaan unit kerja organisasi
- **Aset** — Inventarisasi aset per unit kerja dengan kategori
- **Proses Bisnis** — Pendataan proses bisnis per unit kerja
- **Framework** — Manajemen framework manajemen risiko
- **Program Risiko** — Pembuatan dan pengelolaan program risiko tahunan
- **Konfigurasi Sistem** — Pengaturan parameter aplikasi

## Testing

```bash
cd backend
npm test
```

## Alur Autentikasi

1. `POST /auth/login` → validasi kredensial → terima `totpToken`
2. Jika TOTP belum diaktifkan:
   - `POST /auth/totp/setup/init` → dapatkan QR code
   - `POST /auth/totp/setup/verify` → verifikasi & aktifkan TOTP
3. Jika TOTP sudah aktif:
   - `POST /auth/totp/verify` → verifikasi kode TOTP → login selesai

## Author

Muhammad Adib Prasetiya Aji
