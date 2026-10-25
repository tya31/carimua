-- =====================================================================
-- CariMUA — FASE 6: chat realtime klien ↔ MUA
-- Jalankan SETELAH 05_payments.sql. Cara: SQL Editor → New query → tempel → Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Percakapan: satu ruang chat per pasangan klien–MUA.
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.profiles (id) on delete cascade,
  mua_id             uuid not null references public.mua_profiles (id) on delete cascade,
  last_message       text,
  last_sender_id     uuid,
  last_message_at    timestamptz,
  created_at         timestamptz not null default now(),
  unique (client_id, mua_id)
);

create index if not exists conversations_client_idx on public.conversations (client_id, last_message_at desc);
create index if not exists conversations_mua_idx on public.conversations (mua_id, last_message_at desc);

-- ---------------------------------------------------------------------
-- 2. Pesan
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null check (char_length(trim(body)) between 1 and 2000),
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- Pesan baru → perbarui ringkasan di daftar percakapan.
create or replace function public.messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message = left(new.body, 120),
      last_sender_id = new.sender_id,
      last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function public.messages_after_insert();

-- ---------------------------------------------------------------------
-- 3. RLS: hanya 2 orang di dalam percakapan yang bisa melihat & mengirim.
-- ---------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Peserta melihat percakapan" on public.conversations;
create policy "Peserta melihat percakapan"
  on public.conversations for select to authenticated
  using ((select auth.uid()) in (client_id, mua_id));
-- Tidak ada policy insert/update: percakapan dibuat lewat fungsi start_conversation.

drop policy if exists "Peserta melihat pesan" on public.messages;
create policy "Peserta melihat pesan"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.mua_id)
    )
  );

drop policy if exists "Peserta mengirim pesan" on public.messages;
create policy "Peserta mengirim pesan"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and read_at is null
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.client_id, c.mua_id)
    )
  );

-- ---------------------------------------------------------------------
-- 4. Mulai / buka percakapan.
--    - Klien boleh chat MUA mana pun (misalnya tanya-tanya sebelum booking).
--    - MUA hanya boleh memulai chat dengan klien yang pernah booking dia.
--    Mengembalikan id percakapan (yang lama dipakai lagi kalau sudah ada).
-- ---------------------------------------------------------------------
create or replace function public.start_conversation(p_other uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  my_role text;
  v_client uuid;
  v_mua uuid;
  conv uuid;
begin
  select role into my_role from public.profiles where id = me;

  if my_role = 'client' then
    v_client := me;
    v_mua := p_other;
    if not exists (select 1 from public.mua_profiles where id = v_mua) then
      raise exception 'MUA tidak ditemukan';
    end if;
  elsif my_role = 'mua' then
    v_client := p_other;
    v_mua := me;
    if not exists (select 1 from public.bookings where client_id = v_client and mua_id = v_mua) then
      raise exception 'MUA hanya bisa memulai chat dengan klien yang pernah booking';
    end if;
  else
    raise exception 'Pilih peran akun dulu';
  end if;

  insert into public.conversations (client_id, mua_id)
  values (v_client, v_mua)
  on conflict (client_id, mua_id) do nothing;

  select id into conv from public.conversations where client_id = v_client and mua_id = v_mua;
  return conv;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Tandai pesan dari lawan bicara sebagai sudah dibaca.
-- ---------------------------------------------------------------------
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages m
  set read_at = now()
  from public.conversations c
  where m.conversation_id = p_conversation
    and c.id = m.conversation_id
    and (select auth.uid()) in (c.client_id, c.mua_id)
    and m.sender_id <> (select auth.uid())
    and m.read_at is null;
$$;

-- Jumlah pesan belum dibaca (untuk badge di navbar).
create or replace function public.unread_message_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where (select auth.uid()) in (c.client_id, c.mua_id)
    and m.sender_id <> (select auth.uid())
    and m.read_at is null;
$$;

-- ---------------------------------------------------------------------
-- 6. Realtime: kirim pesan baru & perubahan "dibaca" ke browser secara langsung.
--    (Realtime tetap mengikuti RLS: orang lain tidak bisa ikut mendengar.)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
