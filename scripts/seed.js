// Mengisi database Supabase dengan MUA dummy dari src/data/demoData.js.
// Jalankan: npm run seed   (butuh file .env berisi VITE_SUPABASE_URL & SUPABASE_SECRET_KEY)
//
// Untuk setiap MUA dummy, script ini:
// 1. membuat akun login (email di demoData.js, password = SEED_PASSWORD di bawah),
// 2. mengisi profil, kategori, paket, dan foto portofolionya.
// Aman dijalankan berulang kali: data MUA dummy lama ditimpa, bukan diduplikasi.

import { createClient } from '@supabase/supabase-js'
import { demoMuas } from '../src/data/demoData.js'

const SEED_PASSWORD = 'carimua123'

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

async function getOrCreateUser(email) {
  const existingId = await findUserIdByEmail(email)
  if (existingId) return existingId

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
  })
  check(error, `membuat user ${email}`)
  return data.user.id
}

const { data: categories, error: catError } = await supabase.from('categories').select('id, name')
check(catError, 'membaca kategori (sudah menjalankan supabase/schema.sql?)')
const categoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]))

for (const mua of demoMuas) {
  const id = await getOrCreateUser(mua.email)

  const { error: profileError } = await supabase.from('mua_profiles').upsert({
    id,
    name: mua.name,
    slug: mua.slug,
    bio: mua.bio,
    city: mua.city,
    area: mua.area,
    whatsapp: mua.whatsapp,
    avatar_url: mua.avatar_url,
  })
  check(profileError, `menyimpan profil ${mua.name}`)

  // Hapus data turunan lama, lalu isi ulang.
  for (const table of ['mua_categories', 'packages', 'portfolio_photos']) {
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

  const { error: photoError } = await supabase
    .from('portfolio_photos')
    .insert(mua.photos.map((p) => ({ ...p, mua_id: id })))
  check(photoError, `menyimpan foto ${mua.name}`)

  console.log(`✅ ${mua.name}  (login: ${mua.email})`)
}

console.log(`\nSelesai! Semua akun dummy memakai password: ${SEED_PASSWORD}`)
