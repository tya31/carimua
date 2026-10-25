# CariMUA 💄

Platform pencarian **Makeup Artist (MUA)**. Pengunjung bisa mencari MUA berdasarkan kota/area, kategori, dan budget, melihat portofolio dan paket harga, lalu menghubungi MUA langsung via WhatsApp. MUA bisa login untuk mengelola profil, paket, dan foto portofolionya sendiri.

🔗 **Demo:** https://carimua-nine.vercel.app

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
2. Jalankan file SQL di folder `supabase/` **berurutan**, masing-masing di query baru (salin seluruh isi, tempel, klik **Run**):
   1. `schema.sql`: tabel MUA, paket, foto, RLS, storage
   2. `02_roles.sql`: tabel `profiles` (peran **Klien / MUA**) + trigger akun baru
   3. `03_looks.sql`: portofolio berbentuk **look** (foto/video, model & produk opsional), Instagram, aturan minimal 2 look agar tampil di pencarian
   4. `04_bookings.sql`: lokasi & tarif transport MUA, tabel `bookings`, harga/jarak/DP 5% dihitung di server (trigger), 1 jadwal per hari per MUA
   5. `05_payments.sql`: tabel `payments` (riwayat transaksi DP), hanya bisa ditulis server
   6. `06_chat.sql`: chat realtime klien ↔ MUA (`conversations`, `messages`, status dibaca, Supabase Realtime)
   7. `07_notifications.sql`: notifikasi di web (lonceng), trigger status booking, pg_cron: pengingat H-2 setiap 08.00 WIB & pembatalan otomatis booking yang tidak dibayar DP dalam 24 jam
3. Cek di **Table Editor**: harus ada 12 tabel. Cek juga **Storage**: harus ada bucket `portfolio`.

> **Ongkos transport:** jarak dihitung dengan rumus haversine (garis lurus) × 1.3 sebagai perkiraan jarak tempuh. Ongkos = (jarak − km gratis, dibulatkan ke atas) × tarif per km yang diatur MUA. Peta memakai tile standar OpenStreetMap dan pencarian alamat memakai Nominatim (gratis, tanpa API key).

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
Script ini membuat 8 akun MUA dummy beserta profil, paket, dan fotonya, plus 1 akun klien demo. Semua akun bisa dipakai login (juga lewat tombol **Demo Klien / Demo MUA** di halaman login):
- MUA: `rina@carimua.test`, `sasa@carimua.test`, `dewi@carimua.test`, … (lihat `src/data/demoData.js`)
- Klien: `klien@carimua.test`
- password: `carimua123`

Nomor WhatsApp dummy sengaja memakai awalan `62800…` supaya tidak nyasar ke nomor orang sungguhan.

### 5. (Opsional) Login dengan Google
1. Di https://console.cloud.google.com buat project, lalu buka **APIs & Services → Credentials → Create credentials → OAuth client ID** (tipe *Web application*).
2. Di **Authorized redirect URIs** isi `https://<project-ref>.supabase.co/auth/v1/callback`.
3. Salin **Client ID** & **Client secret** ke Supabase: **Authentication → Sign In / Providers → Google**, lalu aktifkan.

Akun yang pertama kali login lewat Google akan diminta memilih peran (Klien / MUA) di halaman `/pilih-peran`.

### 6. Pembayaran DP 5% (Midtrans Sandbox)
Alur: klien klik **Bayar DP** → Edge Function `payments` membuat transaksi Snap (nominal diambil dari database, bukan dari browser) → klien bayar di pop-up Midtrans → Midtrans memanggil Edge Function `midtrans-webhook` (dicek tanda tangan SHA-512 + status diambil ulang dari API Midtrans) → booking otomatis **Terkonfirmasi** dan transaksi tercatat di tabel `payments`.

1. Daftar di https://dashboard.midtrans.com, pilih environment **Sandbox**, lalu buka **Settings → Access Keys**.
2. **Client Key** → `.env` (dan Vercel) sebagai `VITE_MIDTRANS_CLIENT_KEY`.
3. **Server Key** → Supabase **Edge Functions → Secrets** sebagai `MIDTRANS_SERVER_KEY` (rahasia, jangan di `.env` website).
4. Deploy Edge Functions (sekali login dulu dengan `npx supabase login`):
   ```bash
   npx supabase functions deploy payments --project-ref <project-ref> --no-verify-jwt --use-api
   npx supabase functions deploy midtrans-webhook --project-ref <project-ref> --no-verify-jwt --use-api
   ```
5. Di Midtrans **Settings → Payment → Notification URL** isi `https://<project-ref>.supabase.co/functions/v1/midtrans-webhook`.
6. Tes bayar: pilih **BCA Virtual Account** di pop-up, lalu bayar nomor VA-nya di https://simulator.sandbox.midtrans.com/bca/va/index (uang simulasi).

### 7. Email pengingat H-2 (Resend)
1. Daftar di https://resend.com → **API Keys → Create API Key** (Sending access).
2. Simpan di Supabase **Edge Functions → Secrets** sebagai `RESEND_API_KEY`.
3. Deploy function: `npx supabase functions deploy send-reminders --project-ref <project-ref> --no-verify-jwt --use-api`

> Tanpa domain sendiri, Resend hanya mengirim dari `onboarding@resend.dev` **ke email pemilik akun Resend**. Untuk mengirim ke semua pengguna: verifikasi domain di Resend, lalu isi secret `EMAIL_FROM` (contoh `CariMUA <halo@domainkamu.com>`). Notifikasi di web tetap jalan untuk semua pengguna tanpa batasan ini.

### 8. Coba login & dashboard
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
3. Di **Environment Variables**, tambahkan **hanya** variabel berawalan `VITE_`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_MIDTRANS_CLIENT_KEY`
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
