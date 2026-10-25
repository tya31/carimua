-- =====================================================================
-- CariMUA — FASE 3: portofolio berbentuk "look" (foto/video + model + produk)
-- Jalankan SETELAH 02_roles.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabel looks: satu "look" makeup = satu hasil karya.
--    Model & produk yang dipakai OPSIONAL.
-- ---------------------------------------------------------------------
create table if not exists public.looks (
  id           uuid primary key default gen_random_uuid(),
  mua_id       uuid not null references public.mua_profiles (id) on delete cascade,
  title        text not null,
  description  text,
  model_name   text,
  products     text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists looks_mua_id_idx on public.looks (mua_id);

-- ---------------------------------------------------------------------
-- 2. Tabel portfolio_photos sekarang menyimpan FOTO maupun VIDEO,
--    dan setiap file milik satu look.
-- ---------------------------------------------------------------------
alter table public.portfolio_photos
  add column if not exists look_id uuid references public.looks (id) on delete cascade;

alter table public.portfolio_photos
  add column if not exists media_type text not null default 'image';

alter table public.portfolio_photos drop constraint if exists portfolio_photos_media_type_check;
alter table public.portfolio_photos
  add constraint portfolio_photos_media_type_check check (media_type in ('image', 'video'));

create index if not exists portfolio_photos_look_id_idx on public.portfolio_photos (look_id);

-- Foto lama (sebelum fase 3) dijadikan 1 look per foto.
do $$
declare
  r record;
  new_look uuid;
begin
  for r in select * from public.portfolio_photos where look_id is null loop
    insert into public.looks (mua_id, title, created_at)
    values (r.mua_id, coalesce(r.caption, 'Look'), r.created_at)
    returning id into new_look;
    update public.portfolio_photos set look_id = new_look where id = r.id;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Username Instagram MUA (opsional).
-- ---------------------------------------------------------------------
alter table public.mua_profiles add column if not exists instagram text;

-- ---------------------------------------------------------------------
-- 4. RLS: semua orang boleh lihat look, MUA hanya mengatur miliknya.
-- ---------------------------------------------------------------------
alter table public.looks enable row level security;

drop policy if exists "Look bisa dibaca semua orang" on public.looks;
create policy "Look bisa dibaca semua orang"
  on public.looks for select using (true);

drop policy if exists "MUA mengatur look-nya sendiri" on public.looks;
create policy "MUA mengatur look-nya sendiri"
  on public.looks for all to authenticated
  using ((select auth.uid()) = mua_id)
  with check ((select auth.uid()) = mua_id);

-- File hanya boleh ditempel ke look milik sendiri.
drop policy if exists "MUA mengatur fotonya sendiri" on public.portfolio_photos;
create policy "MUA mengatur fotonya sendiri"
  on public.portfolio_photos for all to authenticated
  using ((select auth.uid()) = mua_id)
  with check (
    (select auth.uid()) = mua_id
    and (
      look_id is null
      or exists (select 1 from public.looks l where l.id = look_id and l.mua_id = (select auth.uid()))
    )
  );

-- ---------------------------------------------------------------------
-- 5. View daftar MUA: hanya MUA dengan MINIMAL 2 look (yang punya foto/video)
--    yang tampil di pencarian.
-- ---------------------------------------------------------------------
drop view if exists public.mua_list;
create view public.mua_list
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
  ) as category_names,
  lc.look_count
from public.mua_profiles p
cross join lateral (
  select count(*)::int as look_count
  from public.looks l
  where l.mua_id = p.id
    and exists (select 1 from public.portfolio_photos m where m.look_id = l.id)
) lc
where lc.look_count >= 2;

-- ---------------------------------------------------------------------
-- 6. Storage: izinkan video (mp4/webm/mov) sampai 50 MB per file.
-- ---------------------------------------------------------------------
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'portfolio';
