# CariMUA 💄

Platform pencarian **Makeup Artist (MUA)**. Pengunjung bisa mencari MUA berdasarkan kota/area, kategori, dan budget, melihat portofolio dan paket harga, lalu menghubungi MUA langsung via WhatsApp. MUA bisa login untuk mengelola profil, paket, dan foto portofolionya sendiri.

**Stack:** React 19 (Vite) · Tailwind CSS v4 · React Router v7 · Supabase (Postgres, Auth, Storage, Row Level Security)

## Fitur

- **Beranda** dengan tombol "Cari MUA"
- **Daftar MUA**: kartu berisi foto, nama, lokasi, kisaran harga, dan kategori
- **Filter**: kota → area, kategori, rentang budget. Filter disimpan di URL, jadi hasilnya bisa di-share.
- **Profil MUA**: bio, paket & harga, galeri portofolio (klik untuk memperbesar), tombol WhatsApp dengan pesan otomatis
- **Login / daftar MUA** (Supabase Auth, email + password)
- **Dashboard MUA**: edit profil & kategori, upload foto profil, tambah/edit/hapus paket, upload/hapus foto portofolio (Supabase Storage)
- **Keamanan dengan RLS**: semua orang bisa membaca, tapi MUA hanya bisa mengubah datanya sendiri
- **Mode demo**: tanpa `.env`, website tetap jalan memakai data dummy

## Struktur project

```
supabase/schema.sql        ← tabel, view, RLS, bucket storage, kategori awal
scripts/seed.js            ← isi database dengan 8 MUA dummy (npm run seed)
src/
  data/demoData.js         ← data dummy (dipakai mode demo & seed)
  lib/supabase.js          ← koneksi Supabase + deteksi mode demo
  lib/api.js               ← query data publik (daftar, filter, profil)
  lib/storage.js           ← upload/hapus foto di Supabase Storage
  lib/format.js            ← format Rupiah, link WhatsApp, slug
  auth/                    ← status login (AuthProvider) & proteksi halaman
  components/              ← Layout, MuaCard, MuaFilters, komponen dashboard
  pages/                   ← Home, MuaList, MuaProfile, Login, Dashboard
```

### Desain database

| Tabel | Isi |
|---|---|
| `mua_profiles` | `id` (= id user Auth), name, slug, bio, city, area, whatsapp, avatar_url |
| `categories` | id, name (Wedding, Wisuda, Lamaran, …) |
| `mua_categories` | mua_id, category_id → relasi many-to-many |
| `packages` | id, mua_id, name, description, price |
| `portfolio_photos` | id, mua_id, image_url, caption |
| view `mua_list` | profil + `min_price`/`max_price` dari paket + kategori, dipakai halaman daftar & filter |

---

## Menjalankan di laptop

Butuh **Node.js 20+** (project ini dibuat dengan Node 24 LTS).

```bash
npm install
npm run dev
```

Buka http://localhost:5173. Tanpa `.env`, website berjalan dalam **mode demo** (ada banner kuning di atas).

---

## Menghubungkan Supabase (langkah demi langkah)

### 1. Buat project Supabase
1. Daftar / login di https://supabase.com, lalu klik **New project**.
2. Isi nama project (misalnya `carimua`), buat **database password** (simpan baik-baik), dan pilih region **Southeast Asia (Singapore)**.
3. Tunggu sekitar 2 menit sampai project siap.

### 2. Buat tabel, RLS, dan storage
1. Di menu kiri buka **SQL Editor**, lalu klik **New query**.
2. Salin **seluruh isi** `supabase/schema.sql`, tempel, lalu klik **Run**.
3. Cek di **Table Editor**: harus ada 5 tabel. Cek juga **Storage**: harus ada bucket `portfolio`.

### 3. Isi file `.env`
1. Salin `.env.example` menjadi `.env` (di folder yang sama).
2. Di Supabase klik **Connect** (atas) atau buka **Project Settings → API Keys**, lalu salin:
   - **Project URL** ke `VITE_SUPABASE_URL`
   - **Publishable key** (atau *anon public* key) ke `VITE_SUPABASE_PUBLISHABLE_KEY`. Key ini **aman** dipakai di browser karena data tetap dijaga oleh RLS.
   - **Secret key** (atau *service_role* key) ke `SUPABASE_SECRET_KEY`. Key ini **RAHASIA**: bisa melewati RLS, jadi hanya untuk script seed di laptop. Jangan pernah di-commit atau dimasukkan ke Vercel.
3. Matikan `npm run dev` (Ctrl+C) lalu jalankan lagi. Banner mode demo akan hilang.

### 4. Isi data dummy
```bash
npm run seed
```
Script ini membuat 8 akun MUA dummy beserta profil, paket, dan fotonya. Semua akun bisa dipakai login:
- email: `rina@carimua.test`, `sasa@carimua.test`, `dewi@carimua.test`, … (lihat `src/data/demoData.js`)
- password: `carimua123`

Nomor WhatsApp dummy sengaja memakai awalan `62800…` supaya tidak nyasar ke nomor orang sungguhan.

### 5. Coba login & dashboard
- Login di `/login` dengan salah satu akun dummy, lalu ubah profil, paket, atau upload foto.
- Atau klik **Daftar** untuk membuat akun baru. Secara default Supabase mengirim **email konfirmasi** dulu.
  > Catatan: email bawaan Supabase dibatasi beberapa email per jam. Untuk testing, kamu bisa mematikan konfirmasi di **Authentication → Sign In / Providers → Email → Confirm email**.

---

## Deploy ke Vercel

1. Push project ke GitHub:
   ```bash
   git remote add origin https://github.com/<username>/carimua.git
   git push -u origin main
   ```
2. Di https://vercel.com klik **Add New → Project**, lalu import repo tadi. Framework akan terdeteksi otomatis sebagai **Vite**.
3. Di **Environment Variables**, tambahkan **hanya** dua variabel ini:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Klik **Deploy**.
5. Kembali ke Supabase, buka **Authentication → URL Configuration**:
   - **Site URL**: `https://<nama-project>.vercel.app`
   - **Redirect URLs**: tambahkan `https://<nama-project>.vercel.app/**` (dan `http://localhost:5173/**` untuk development)

   Ini supaya link konfirmasi email mengarah ke website kamu, bukan ke localhost.

`vercel.json` sudah berisi aturan *rewrite*, jadi URL seperti `/mua/rina-makeup` tetap bisa dibuka langsung atau di-refresh tanpa error 404.

---

## Cara kerja keamanan (RLS)

Supabase bisa diakses langsung dari browser, jadi keamanan tidak bergantung pada kode React, melainkan pada **Row Level Security** di database (`supabase/schema.sql`):

- **SELECT**: semua tabel boleh dibaca siapa saja, karena website ini publik.
- **INSERT / UPDATE / DELETE**: hanya boleh kalau `auth.uid()` (id user yang login) sama dengan `id` / `mua_id` baris tersebut.
- **Storage**: MUA hanya boleh upload/hapus file di folder `portfolio/<id-nya-sendiri>/…`.
- Tabel `categories` hanya bisa diubah lewat SQL Editor (oleh admin).

## Belum termasuk (rencana berikutnya)

Booking & pembayaran, kalender ketersediaan, review & rating, analisis wajah.
