-- =====================================================================
-- CariMUA — FASE 7: notifikasi di web, pengingat H-2, booking kedaluwarsa
-- Jalankan SETELAH 06_chat.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabel notifikasi (lonceng di navbar)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  booking_id   uuid references public.bookings (id) on delete cascade,
  type         text not null,  -- booking_new, booking_confirmed, booking_cancelled, booking_completed, reminder_h2
  title        text not null,
  body         text,
  link         text,
  read_at      timestamptz,
  emailed_at   timestamptz,
  email_error  text,
  created_at   timestamptz not null default now(),
  -- Notifikasi jenis yang sama untuk booking yang sama hanya dikirim sekali.
  unique (user_id, type, booking_id)
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "User melihat notifikasinya" on public.notifications;
create policy "User melihat notifikasinya"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

-- Tandai semua notifikasi milik user sebagai dibaca.
create or replace function public.mark_notifications_read()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.notifications set read_at = now()
  where user_id = (select auth.uid()) and read_at is null;
$$;

-- Realtime untuk lonceng
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Notifikasi otomatis setiap ada booking baru / status berubah
-- ---------------------------------------------------------------------
create or replace function public.notify(p_user uuid, p_booking uuid, p_type text, p_title text, p_body text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, booking_id, type, title, body, link)
  values (p_user, p_booking, p_type, p_title, p_body, p_link)
  on conflict (user_id, type, booking_id) do nothing;
$$;

create or replace function public.bookings_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mua_name text;
  client_name text;
  tanggal text := to_char(new.event_date, 'DD-MM-YYYY');
begin
  select name into mua_name from public.mua_profiles where id = new.mua_id;
  select coalesce(full_name, 'Klien') into client_name from public.profiles where id = new.client_id;

  if tg_op = 'INSERT' then
    perform public.notify(new.mua_id, new.id, 'booking_new',
      'Booking baru masuk',
      client_name || ' booking ' || new.package_name || ' untuk ' || tanggal || '. Menunggu DP.',
      '/dashboard');
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status = 'confirmed' then
    perform public.notify(new.client_id, new.id, 'booking_confirmed',
      'DP diterima, booking terkonfirmasi',
      new.package_name || ' bersama ' || mua_name || ' pada ' || tanggal || '.',
      '/akun');
    perform public.notify(new.mua_id, new.id, 'booking_confirmed',
      'DP sudah dibayar',
      client_name || ' membayar DP untuk ' || new.package_name || ' (' || tanggal || ').',
      '/dashboard');
  elsif new.status = 'cancelled' then
    perform public.notify(new.client_id, new.id, 'booking_cancelled',
      'Booking dibatalkan',
      new.package_name || ' bersama ' || mua_name || ' (' || tanggal || ') dibatalkan.',
      '/akun');
    perform public.notify(new.mua_id, new.id, 'booking_cancelled',
      'Booking dibatalkan',
      'Booking ' || client_name || ' untuk ' || tanggal || ' dibatalkan. Tanggal itu kosong lagi.',
      '/dashboard');
  elsif new.status = 'completed' then
    perform public.notify(new.client_id, new.id, 'booking_completed',
      'Terima kasih sudah glow up bareng ' || mua_name,
      'Semoga acaramu lancar!',
      '/akun');
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_notify on public.bookings;
create trigger bookings_notify
  after insert or update of status on public.bookings
  for each row execute function public.bookings_notify();

-- ---------------------------------------------------------------------
-- 3. Jadwal otomatis (pg_cron) — waktu cron dalam UTC.
--    a. Setiap jam: booking "Menunggu DP" lebih dari 24 jam → dibatalkan,
--       supaya tanggal MUA tidak terkunci selamanya.
--    b. Setiap hari 01:00 UTC (08:00 WIB): panggil Edge Function
--       send-reminders untuk pengingat H-2 (notifikasi + email).
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job
where jobname in ('carimua-expire-pending', 'carimua-reminder-h2');

select cron.schedule(
  'carimua-expire-pending',
  '0 * * * *',
  $$ update public.bookings set status = 'cancelled'
     where status = 'pending_payment' and created_at < now() - interval '24 hours' $$
);

select cron.schedule(
  'carimua-reminder-h2',
  '0 1 * * *',
  $$ select net.http_post(
       url := 'https://jbcwqovzmszfnemromyv.supabase.co/functions/v1/send-reminders',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
