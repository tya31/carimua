-- =====================================================================
-- CariMUA — FASE 5: pembayaran DP 5% (Midtrans Sandbox)
-- Jalankan SETELAH 04_bookings.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabel payments = riwayat SEMUA transaksi DP (berhasil, gagal, kedaluwarsa).
--    Baris dibuat & diubah HANYA oleh server (Edge Function, pakai service role),
--    jadi browser tidak bisa memalsukan status "lunas".
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  booking_id       uuid not null references public.bookings (id) on delete cascade,
  order_id         text not null unique,
  amount           integer not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'paid', 'expired', 'failed')),
  payment_type     text,            -- qris, bank_transfer, gopay, dll (dari Midtrans)
  midtrans_status  text,            -- status mentah dari Midtrans (settlement, pending, expire, …)
  snap_token       text,
  paid_at          timestamptz,
  raw              jsonb,           -- respons terakhir dari Midtrans, untuk audit
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id, created_at desc);

alter table public.payments enable row level security;

-- Klien & MUA dari booking terkait boleh MELIHAT. Tidak ada policy insert/update:
-- hanya service role (Edge Function) yang bisa menulis.
drop policy if exists "Klien & MUA melihat pembayaran booking mereka" on public.payments;
create policy "Klien & MUA melihat pembayaran booking mereka"
  on public.payments for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and (select auth.uid()) in (b.client_id, b.mua_id)
    )
  );
