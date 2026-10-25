-- =====================================================================
-- CariMUA — teks notifikasi tanpa emoji + perbaikan hapus paket
-- Jalankan SETELAH 07_notifications.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang. (Kalau setup dari awal, 07_notifications.sql sudah versi baru.)
-- =====================================================================

-- 1. Perbarui fungsi pembuat notifikasi booking (judul tanpa emoji).
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

-- 2. Bersihkan emoji dari notifikasi yang sudah terlanjur dibuat.
update public.notifications
set title = trim(regexp_replace(title, '\s*(✨|🎉|💳|💄)\s*$', ''))
where title ~ '(✨|🎉|💳|💄)\s*$';


-- 3. Perbaikan: MUA bisa menghapus paket yang pernah dibooking.
--    (Kolom package_id di booking otomatis jadi NULL; nama & harga paket tetap tersimpan.)
create or replace function public.bookings_guard_update()
returns trigger
language plpgsql
as $$
begin
  -- package_id boleh berubah jadi NULL (otomatis saat MUA menghapus paketnya);
  -- nama & harga paket sudah tersimpan di booking ini.
  if (to_jsonb(new) - 'status' - 'updated_at' - 'package_id') is distinct from (to_jsonb(old) - 'status' - 'updated_at' - 'package_id')
     or (new.package_id is not null and new.package_id is distinct from old.package_id) then
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
