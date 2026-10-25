// Mengisi database Supabase dengan MUA dummy dari src/data/demoData.js.
// Jalankan: npm run seed   (butuh file .env berisi VITE_SUPABASE_URL & SUPABASE_SECRET_KEY)
//
// Untuk setiap MUA dummy, script ini:
// 1. membuat akun login (email di demoData.js, password = SEED_PASSWORD di bawah),
// 2. mengisi profil, kategori, paket, lokasi/tarif transport, dan look portofolionya.
// Lalu untuk akun Klien Demo: contoh booking, riwayat DP, dan chat.
// Aman dijalankan berulang kali: data dummy lama ditimpa, bukan diduplikasi.

import { createClient } from '@supabase/supabase-js'
import { demoMuas, demoTransport } from '../src/data/demoData.js'

const SEED_PASSWORD = 'carimua123'
const DEMO_CLIENT = { email: 'klien@carimua.test', name: 'Klien Demo' }

const url = process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey || secretKey.includes('xxxx')) {
  console.error('❌ Isi VITE_SUPABASE_URL dan SUPABASE_SECRET_KEY di file .env dulu (lihat .env.example).')
  process.exit(1)
}

// Secret key melewati RLS, makanya HANYA boleh dipakai di script lokal seperti ini.
const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function check(error, what) {
  if (error) {
    console.error(`❌ Gagal ${what}:`, error.message)
    process.exit(1)
  }
}

async function findUserIdByEmail(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    check(error, 'membaca daftar user')
    const user = data.users.find((u) => u.email === email)
    if (user) return user.id
    if (data.users.length < 1000) return null
  }
}

// Membuat akun login (kalau belum ada) dan memastikan perannya di tabel profiles.
async function getOrCreateUser(email, role, fullName) {
  let id = await findUserIdByEmail(email)

  if (!id) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { role, full_name: fullName },
    })
    check(error, `membuat user ${email}`)
    id = data.user.id
  }

  const { error } = await supabase.from('profiles').upsert({ id, role, full_name: fullName })
  check(error, `menyimpan peran ${email} (sudah menjalankan supabase/02_roles.sql?)`)
  return id
}

const { data: categories, error: catError } = await supabase.from('categories').select('id, name')
check(catError, 'membaca kategori (sudah menjalankan supabase/schema.sql?)')
const categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]))

for (const mua of demoMuas) {
  const id = await getOrCreateUser(mua.email, 'mua', mua.name)

  const { error: profileError } = await supabase.from('mua_profiles').upsert({
    id,
    name: mua.name,
    slug: mua.slug,
    bio: mua.bio,
    city: mua.city,
    area: mua.area,
    whatsapp: mua.whatsapp,
    avatar_url: mua.avatar_url,
    ...demoTransport[mua.slug],
  })
  check(profileError, `menyimpan profil ${mua.name}`)

  // Hapus data turunan lama, lalu isi ulang.
  for (const table of ['mua_categories', 'packages', 'portfolio_photos', 'looks']) {
    const { error } = await supabase.from(table).delete().eq('mua_id', id)
    check(error, `membersihkan ${table} ${mua.name}`)
  }

  const { error: mcError } = await supabase
    .from('mua_categories')
    .insert(mua.categories.map((name) => ({ mua_id: id, category_id: categoryId[name] })))
  check(mcError, `menyimpan kategori ${mua.name}`)

  const { error: pkgError } = await supabase
    .from('packages')
    .insert(mua.packages.map((p) => ({ ...p, mua_id: id })))
  check(pkgError, `menyimpan paket ${mua.name}`)

  // Look + file foto/videonya.
  for (const look of mua.looks) {
    const { data: lookRow, error: lookError } = await supabase
      .from('looks')
      .insert({ mua_id: id, title: look.title, model_name: look.model_name, products: look.products })
      .select('id')
      .single()
    check(lookError, `menyimpan look ${look.title} (sudah menjalankan supabase/03_looks.sql?)`)

    const { error: mediaError } = await supabase.from('portfolio_photos').insert(
      look.media.map((m) => ({ mua_id: id, look_id: lookRow.id, image_url: m.url, media_type: m.type })),
    )
    check(mediaError, `menyimpan foto look ${look.title}`)
  }

  console.log(`✅ ${mua.name}  (login: ${mua.email})`)
}

// Akun klien demo (tombol "Demo Klien" di halaman login).
const clientId = await getOrCreateUser(DEMO_CLIENT.email, 'client', DEMO_CLIENT.name)
console.log(`✅ ${DEMO_CLIENT.name}  (login: ${DEMO_CLIENT.email})`)

// ---------------------------------------------------------------------------
// Aktivitas demo untuk Klien Demo: booking, riwayat DP, dan chat,
// supaya pengunjung portofolio langsung melihat fitur yang "hidup".
// ---------------------------------------------------------------------------
const muaIdBySlug = {}
for (const mua of demoMuas) muaIdBySlug[mua.slug] = await findUserIdByEmail(mua.email)

// Bersihkan aktivitas demo lama (payments & notifikasi ikut terhapus lewat cascade).
check((await supabase.from('bookings').delete().eq('client_id', clientId)).error, 'membersihkan booking demo')
check((await supabase.from('conversations').delete().eq('client_id', clientId)).error, 'membersihkan chat demo')

// Booking dibuat SEBAGAI Klien Demo (bukan secret key), karena harga, jarak, dan DP
// dihitung trigger di server berdasarkan user yang login.
const clientApi = createClient(url, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
check((await clientApi.auth.signInWithPassword({ email: DEMO_CLIENT.email, password: SEED_PASSWORD })).error, 'login Klien Demo')

const daysFromNow = (n) => {
  const d = new Date(Date.now() + 7 * 3600 * 1000) // WIB
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const DEMO_BOOKINGS = [
  { slug: 'rina-makeup', days: 12, time: '07:00', address: 'Gedung Sate, Jl. Diponegoro, Bandung', lat: -6.9025, lng: 107.6188, paidVia: 'qris', status: 'confirmed' },
  { slug: 'sasa-beauty', days: 30, time: '10:00', address: 'Universitas Indonesia, Depok', lat: -6.3606, lng: 106.8272, paidVia: 'bank_transfer', status: 'confirmed' },
  { slug: 'nadia-mua', days: 18, time: '13:00', address: 'Rawamangun, Jakarta Timur', lat: -6.1946, lng: 106.8915, status: 'cancelled' },
]

for (const demo of DEMO_BOOKINGS) {
  const muaId = muaIdBySlug[demo.slug]
  const { data: pkg } = await supabase.from('packages').select('id').eq('mua_id', muaId).order('price').limit(1).single()
  const { data: booking, error } = await clientApi
    .from('bookings')
    .insert({ mua_id: muaId, package_id: pkg.id, event_date: daysFromNow(demo.days), event_time: demo.time, address: demo.address, lat: demo.lat, lng: demo.lng })
    .select('id, dp_amount')
    .single()
  check(error, `membuat booking demo ${demo.slug} (sudah menjalankan supabase/04_bookings.sql?)`)

  if (demo.paidVia) {
    check(
      (await supabase.from('payments').insert({
        booking_id: booking.id,
        order_id: `DEMO-${booking.id.slice(0, 8)}`,
        amount: booking.dp_amount,
        status: 'paid',
        payment_type: demo.paidVia,
        midtrans_status: 'settlement',
        paid_at: new Date().toISOString(),
      })).error,
      'mencatat pembayaran demo',
    )
  }
  check((await supabase.from('bookings').update({ status: demo.status }).eq('id', booking.id)).error, 'mengubah status booking demo')
}

// Chat demo Klien Demo ↔ Rina (pesan terakhir sengaja belum dibaca Rina → badge muncul di akun Demo MUA).
const { data: convId, error: convError } = await clientApi.rpc('start_conversation', { p_other: muaIdBySlug['rina-makeup'] })
check(convError, 'membuat chat demo (sudah menjalankan supabase/06_chat.sql?)')
const t0 = Date.now() - 60 * 60 * 1000
const chat = [
  [clientId, 'Halo kak Rina! Paket lamaran sudah termasuk hijab do belum?'],
  [muaIdBySlug['rina-makeup'], 'Halo kak, sudah termasuk hijab do + bulu mata ya.'],
  [clientId, 'Oke kak, aku booking akad aja deh. DP-nya udah aku bayar.'],
  [muaIdBySlug['rina-makeup'], 'Siap, sudah masuk! Nanti H-2 aku kabari lagi ya kak.'],
  [clientId, 'Makasih kak, ditunggu!'],
]
check(
  (await supabase.from('messages').insert(
    chat.map(([sender, body], i) => ({
      conversation_id: convId,
      sender_id: sender,
      body,
      created_at: new Date(t0 + i * 4 * 60 * 1000).toISOString(),
      read_at: i < chat.length - 1 ? new Date(t0 + i * 4 * 60 * 1000 + 60000).toISOString() : null,
    })),
  )).error,
  'mengisi chat demo',
)
console.log('✅ Aktivitas demo: 3 booking (2 lunas, 1 batal), riwayat DP, dan chat dengan Rina')

console.log(`\nSelesai! Semua akun dummy memakai password: ${SEED_PASSWORD}`)
