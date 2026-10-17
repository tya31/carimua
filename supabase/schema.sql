-- =====================================================================
-- CariMUA — skema database
-- Cara pakai: buka dashboard Supabase → SQL Editor → New query →
-- tempel SELURUH isi file ini → Run. Aman dijalankan ulang.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Profil MUA. id SAMA dengan id user di Supabase Auth (auth.users),
-- jadi satu akun login = satu profil MUA.
create table if not exists public.mua_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  bio         text,
  city        text not null,
  area        text,
  whatsapp    text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id    serial primary key,
  name  text not null unique
);

-- Tabel penghubung many-to-many: satu MUA bisa punya banyak kategori.
create table if not exists public.mua_categories (
  mua_id       uuid    not null references public.mua_profiles (id) on delete cascade,
  category_id  integer not null references public.categories (id) on delete cascade,
  primary key (mua_id, category_id)
);

create table if not exists public.packages (
  id           uuid primary key default gen_random_uuid(),
  mua_id       uuid not null references public.mua_profiles (id) on delete cascade,
  name         text not null,
  description  text,
  price        integer not null check (price >= 0),
  created_at   timestamptz not null default now()
);

create table if not exists public.portfolio_photos (
  id          uuid primary key default gen_random_uuid(),
  mua_id      uuid not null references public.mua_profiles (id) on delete cascade,
  image_url   text not null,
  caption     text,
  created_at  timestamptz not null default now()
);

create index if not exists packages_mua_id_idx         on public.packages (mua_id);
create index if not exists portfolio_photos_mua_id_idx on public.portfolio_photos (mua_id);


-- ---------------------------------------------------------------------
-- 2. VIEW untuk halaman daftar MUA
-- Menggabungkan profil + kisaran harga (min/max harga paket) + kategori,
-- supaya halaman daftar & filter cukup 1 query.
-- security_invoker = true → view ikut aturan RLS tabel aslinya.
-- ---------------------------------------------------------------------
create or replace view public.mua_list
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.slug,
  p.city,
  p.area,
  p.avatar_url,
  p.created_at,
  (select min(pk.price) from public.packages pk where pk.mua_id = p.id) as min_price,
  (select max(pk.price) from public.packages pk where pk.mua_id = p.id) as max_price,
  coalesce(
    (select array_agg(mc.category_id order by mc.category_id)
       from public.mua_categories mc where mc.mua_id = p.id),
    '{}'
  ) as category_ids,
  coalesce(
    (select array_agg(c.name order by c.name)
       from public.mua_categories mc
       join public.categories c on c.id = mc.category_id
      where mc.mua_id = p.id),
    '{}'
  ) as category_names
from public.mua_profiles p;


-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- Aturan: SEMUA orang boleh MEMBACA (website publik),
-- tapi MUA hanya boleh MENGUBAH data miliknya sendiri.
-- auth.uid() = id user yang sedang login.
-- ---------------------------------------------------------------------
alter table public.mua_profiles     enable row level security;
alter table public.categories       enable row level security;
alter table public.mua_categories   enable row level security;
alter table public.packages         enable row level security;
alter table public.portfolio_photos enable row level security;

-- mua_profiles
drop policy if exists "Profil bisa dibaca semua orang" on public.mua_profiles;
create policy "Profil bisa dibaca semua orang"
  on public.mua_profiles for select using (true);

drop policy if exists "MUA membuat profilnya sendiri" on public.mua_profiles;
create policy "MUA membuat profilnya sendiri"
  on public.mua_profiles for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "MUA mengubah profilnya sendiri" on public.mua_profiles;
create policy "MUA mengubah profilnya sendiri"
  on public.mua_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- categories (hanya dibaca; diisi admin lewat SQL)
drop policy if exists "Kategori bisa dibaca semua orang" on public.categories;
create policy "Kategori bisa dibaca semua orang"
  on public.categories for select using (true);

-- mua_categories
drop policy if exists "Kategori MUA bisa dibaca semua orang" on public.mua_categories;
create policy "Kategori MUA bisa dibaca semua orang"
  on public.mua_categories for select using (true);

drop policy if exists "MUA mengatur kategorinya sendiri" on public.mua_categories;
create policy "MUA mengatur kategorinya sendiri"
  on public.mua_categories for all to authenticated
  using ((select auth.uid()) = mua_id)
  with check ((select auth.uid()) = mua_id);

-- packages
drop policy if exists "Paket bisa dibaca semua orang" on public.packages;
create policy "Paket bisa dibaca semua orang"
  on public.packages for select using (true);

drop policy if exists "MUA mengatur paketnya sendiri" on public.packages;
create policy "MUA mengatur paketnya sendiri"
  on public.packages for all to authenticated
  using ((select auth.uid()) = mua_id)
  with check ((select auth.uid()) = mua_id);

-- portfolio_photos
drop policy if exists "Foto bisa dibaca semua orang" on public.portfolio_photos;
create policy "Foto bisa dibaca semua orang"
  on public.portfolio_photos for select using (true);

drop policy if exists "MUA mengatur fotonya sendiri" on public.portfolio_photos;
create policy "MUA mengatur fotonya sendiri"
  on public.portfolio_photos for all to authenticated
  using ((select auth.uid()) = mua_id)
  with check ((select auth.uid()) = mua_id);


-- ---------------------------------------------------------------------
-- 4. STORAGE (tempat file foto)
-- Bucket publik "portfolio". Setiap MUA hanya boleh upload/hapus file
-- di dalam folder bernama id-nya sendiri, contoh: "<user-id>/foto1.jpg".
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "MUA upload ke foldernya sendiri" on storage.objects;
create policy "MUA upload ke foldernya sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "MUA mengubah file di foldernya sendiri" on storage.objects;
create policy "MUA mengubah file di foldernya sendiri"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "MUA menghapus file di foldernya sendiri" on storage.objects;
create policy "MUA menghapus file di foldernya sendiri"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ---------------------------------------------------------------------
-- 5. DATA AWAL: kategori
-- (Data MUA dummy diisi lewat "npm run seed", lihat README.)
-- ---------------------------------------------------------------------
insert into public.categories (name) values
  ('Wedding'),
  ('Wisuda'),
  ('Lamaran'),
  ('Party'),
  ('Photoshoot'),
  ('Hijab')
on conflict (name) do nothing;
