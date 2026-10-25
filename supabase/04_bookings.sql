-- =====================================================================
-- CariMUA — FASE 4: booking + ongkos transport otomatis
-- Jalankan SETELAH 03_looks.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lokasi dasar & tarif transport MUA
-- ---------------------------------------------------------------------
alter table public.mua_profiles add column if not exists base_lat double precision;
alter table public.mua_profiles add column if not exists base_lng double precision;
alter table public.mua_profiles add column if not exists base_address text;
alter table public.mua_profiles add column if not exists transport_rate_per_km integer not null default 0
  check (transport_rate_per_km >= 0);
alter table public.mua_profiles add column if not exists free_km integer not null default 0
  check (free_km >= 0);

-- ---------------------------------------------------------------------
-- 2. Jarak (km) antara 2 titik.
--    Rumus haversine = jarak garis lurus, dikali 1.3 sebagai PERKIRAAN
--    jarak tempuh jalan raya. Rumus yang sama dipakai di src/lib/geo.js.
-- ---------------------------------------------------------------------
create or replace function public.distance_km(lat1 double precision, lng1 double precision,
                                               lat2 double precision, lng2 double precision)
returns numeric
language sql
immutable
as $$
  select round((
    2 * 6371 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )) * 1.3
  )::numeric, 1);
$$;

-- ---------------------------------------------------------------------
-- 3. Tabel bookings
--    status: pending_payment (menunggu DP) → confirmed (DP lunas)
--            → completed (selesai) | cancelled (batal)
-- ---------------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles (id) on delete cascade,
  mua_id         uuid not null references public.mua_profiles (id) on delete cascade,
  package_id     uuid references public.packages (id) on delete set null,
  package_name   text not null,
  event_date     date not null,
  event_time     time not null,
  address        text not null,
  lat            double precision not null,
  lng            double precision not null,
  notes          text,
  distance_km    numeric not null,
  package_price  integer not null,
  transport_fee  integer not null,
  total          integer not null,
  dp_amount      integer not null,
  status         text not null default 'pending_payment'
                 check (status in ('pending_payment', 'confirmed', 'completed', 'cancelled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists bookings_client_idx on public.bookings (client_id, event_date);
create index if not exists bookings_mua_idx on public.bookings (mua_id, event_date);

-- 1 MUA hanya bisa punya 1 jadwal aktif per tanggal.
create unique index if not exists bookings_one_per_day
  on public.bookings (mua_id, event_date)
  where status in ('pending_payment', 'confirmed');

-- ---------------------------------------------------------------------
-- 4. Saat booking dibuat, SERVER yang menghitung harga, jarak, ongkos,
--    total, dan DP 5%. Angka dari browser diabaikan → tidak bisa dicurangi.
-- ---------------------------------------------------------------------
create or replace function public.bookings_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pkg public.packages%rowtype;
  mua public.mua_profiles%rowtype;
  km numeric;
begin
  select * into pkg from public.packages where id = new.package_id;
  if not found or pkg.mua_id <> new.mua_id then
    raise exception 'Paket tidak ditemukan untuk MUA ini';
  end if;

  select * into mua from public.mua_profiles where id = new.mua_id;
  if mua.base_lat is null or mua.base_lng is null then
    raise exception 'MUA belum mengatur lokasi, booking belum bisa dibuat';
  end if;

  if new.event_date < current_date + 1 then
    raise exception 'Tanggal booking minimal besok';
  end if;

  km := public.distance_km(mua.base_lat, mua.base_lng, new.lat, new.lng);

  new.client_id     := auth.uid();
  new.status        := 'pending_payment';
  new.package_name  := pkg.name;
  new.package_price := pkg.price;
  new.distance_km   := km;
  new.transport_fee := ceil(greatest(km - mua.free_km, 0)) * mua.transport_rate_per_km;
  new.total         := new.package_price + new.transport_fee;
  new.dp_amount     := ceil(new.total * 0.05);
  new.created_at    := now();
  new.updated_at    := now();
  return new;
end;
$$;

drop trigger if exists bookings_before_insert on public.bookings;
create trigger bookings_before_insert
  before insert on public.bookings
  for each row execute function public.bookings_before_insert();

-- ---------------------------------------------------------------------
-- 5. Aturan perubahan: detail booking tidak bisa diubah, hanya STATUS,
--    dan hanya perpindahan status tertentu:
--    - klien: menunggu DP → batal
--    - MUA  : menunggu DP → batal, terkonfirmasi → selesai / batal
--    - server (pembayaran, fase 5): bebas
-- ---------------------------------------------------------------------
create or replace function public.bookings_guard_update()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'Detail booking tidak bisa diubah';
  end if;

  new.updated_at := now();
  if new.status = old.status or auth.uid() is null then
    return new;
  end if;

  if auth.uid() = old.client_id and old.status = 'pending_payment' and new.status = 'cancelled' then
    return new;
  end if;
  if auth.uid() = old.mua_id and old.status = 'pending_payment' and new.status = 'cancelled' then
    return new;
  end if;
  if auth.uid() = old.mua_id and old.status = 'confirmed' and new.status in ('completed', 'cancelled') then
    return new;
  end if;

  raise exception 'Perubahan status booking tidak diizinkan';
end;
$$;

drop trigger if exists bookings_guard_update on public.bookings;
create trigger bookings_guard_update
  before update on public.bookings
  for each row execute function public.bookings_guard_update();

-- ---------------------------------------------------------------------
-- 6. RLS: klien lihat booking-nya, MUA lihat booking yang masuk ke dia.
-- ---------------------------------------------------------------------
alter table public.bookings enable row level security;

drop policy if exists "Klien & MUA melihat booking mereka" on public.bookings;
create policy "Klien & MUA melihat booking mereka"
  on public.bookings for select to authenticated
  using ((select auth.uid()) in (client_id, mua_id));

drop policy if exists "Klien membuat booking" on public.bookings;
create policy "Klien membuat booking"
  on public.bookings for insert to authenticated
  with check (
    (select auth.uid()) = client_id
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'client')
  );

drop policy if exists "Klien & MUA mengubah status booking" on public.bookings;
create policy "Klien & MUA mengubah status booking"
  on public.bookings for update to authenticated
  using ((select auth.uid()) in (client_id, mua_id));

-- ---------------------------------------------------------------------
-- 7. Jadwal MUA yang sudah terisi (hanya TANGGAL, tanpa detail klien),
--    supaya klien bisa lihat tanggal mana yang masih kosong.
-- ---------------------------------------------------------------------
create or replace function public.mua_busy_dates(p_mua uuid)
returns setof date
language sql
stable
security definer
set search_path = ''
as $$
  select event_date
  from public.bookings
  where mua_id = p_mua
    and status in ('pending_payment', 'confirmed')
    and event_date >= current_date
  order by event_date;
$$;
