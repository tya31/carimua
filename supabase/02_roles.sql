-- =====================================================================
-- CariMUA — FASE 2: peran akun (Klien / MUA)
-- Jalankan SETELAH schema.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabel profiles: 1 baris per akun login, menyimpan PERAN akun.
--    role = 'client' (klien) atau 'mua'. NULL = belum memilih
--    (misalnya baru login pakai Google).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text check (role in ('client', 'mua')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Nama & foto akun boleh dibaca sesama user yang login (dipakai nanti di chat & booking).
drop policy if exists "Profil akun dibaca user login" on public.profiles;
create policy "Profil akun dibaca user login"
  on public.profiles for select to authenticated using (true);

drop policy if exists "User mengubah profil akunnya sendiri" on public.profiles;
create policy "User mengubah profil akunnya sendiri"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Tidak ada policy INSERT: baris dibuat otomatis oleh trigger di bawah.


-- ---------------------------------------------------------------------
-- 2. Peran hanya bisa dipilih SEKALI (tidak bisa ganti klien ↔ MUA).
-- ---------------------------------------------------------------------
create or replace function public.lock_role()
returns trigger
language plpgsql
as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    raise exception 'Peran akun tidak bisa diganti';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row execute function public.lock_role();


-- ---------------------------------------------------------------------
-- 3. Setiap ada user baru daftar (email ATAU Google), buat baris profiles.
--    Peran diambil dari data pendaftaran (options.data.role) kalau ada.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' in ('client', 'mua')
         then new.raw_user_meta_data ->> 'role' end,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User yang sudah ada sebelum fase 2: yang punya mua_profiles otomatis jadi 'mua'.
insert into public.profiles (id, role, full_name)
select u.id,
       case when m.id is not null then 'mua' end,
       m.name
from auth.users u
left join public.mua_profiles m on m.id = u.id
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 4. Hanya akun berperan MUA yang boleh membuat profil MUA.
-- ---------------------------------------------------------------------
create or replace function public.is_mua()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'mua'
  );
$$;

drop policy if exists "MUA membuat profilnya sendiri" on public.mua_profiles;
create policy "MUA membuat profilnya sendiri"
  on public.mua_profiles for insert to authenticated
  with check ((select auth.uid()) = id and (select public.is_mua()));
