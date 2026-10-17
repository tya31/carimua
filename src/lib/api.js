// Semua cara website MEMBACA data publik ada di sini.
// Tiap fungsi punya 2 jalur: Supabase (asli) atau data dummy (mode demo).
import { demoCategories, demoMuas } from '../data/demoData.js'
import { isDemoMode, supabase } from './supabase.js'

// ---------- Mode demo: ubah demoData.js jadi bentuk yang sama dengan database ----------
const demoCategoryRows = demoCategories.map((name, i) => ({ id: i + 1, name }))
const demoCategoryId = Object.fromEntries(demoCategoryRows.map((c) => [c.name, c.id]))

const demoProfiles = demoMuas.map((m) => {
  const prices = m.packages.map((p) => p.price)
  return {
    id: `demo-${m.slug}`,
    name: m.name,
    slug: m.slug,
    bio: m.bio,
    city: m.city,
    area: m.area,
    whatsapp: m.whatsapp,
    avatar_url: m.avatar_url,
    min_price: prices.length ? Math.min(...prices) : null,
    max_price: prices.length ? Math.max(...prices) : null,
    category_ids: m.categories.map((name) => demoCategoryId[name]),
    category_names: [...m.categories].sort(),
    categories: m.categories.map((name) => ({ id: demoCategoryId[name], name })),
    packages: m.packages.map((p, i) => ({ id: `${m.slug}-pkg-${i}`, ...p })),
    photos: m.photos.map((p, i) => ({ id: `${m.slug}-photo-${i}`, ...p })),
  }
})

// ---------- Fungsi publik ----------

export async function listCategories() {
  if (isDemoMode) return demoCategoryRows

  const { data, error } = await supabase.from('categories').select('id, name').order('id')
  if (error) throw error
  return data
}

// Daftar pasangan kota → area yang ada, untuk isi dropdown filter.
export async function listLocations() {
  const rows = isDemoMode
    ? demoProfiles
    : await supabase
        .from('mua_profiles')
        .select('city, area')
        .then(({ data, error }) => {
          if (error) throw error
          return data
        })

  const map = {}
  for (const { city, area } of rows) {
    map[city] ??= new Set()
    if (area) map[city].add(area)
  }
  return Object.keys(map)
    .sort()
    .map((city) => ({ city, areas: [...map[city]].sort() }))
}

// filters: { city, area, category (id), minPrice, maxPrice } — semua opsional.
// Filter harga: MUA lolos kalau kisaran harganya BERIRISAN dengan rentang yang dicari,
// artinya ada kemungkinan paketnya masuk budget.
export async function listMuas({ city, area, category, minPrice, maxPrice } = {}) {
  if (isDemoMode) {
    return demoProfiles
      .filter((m) => !city || m.city === city)
      .filter((m) => !area || m.area === area)
      .filter((m) => !category || m.category_ids.includes(Number(category)))
      .filter((m) => !minPrice || (m.max_price ?? -1) >= Number(minPrice))
      .filter((m) => !maxPrice || (m.min_price ?? Infinity) <= Number(maxPrice))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  let query = supabase.from('mua_list').select('*').order('name')
  if (city) query = query.eq('city', city)
  if (area) query = query.eq('area', area)
  if (category) query = query.contains('category_ids', [Number(category)])
  if (minPrice) query = query.gte('max_price', Number(minPrice))
  if (maxPrice) query = query.lte('min_price', Number(maxPrice))

  const { data, error } = await query
  if (error) throw error
  return data
}

// Profil lengkap 1 MUA (bio, kategori, paket, foto). null kalau slug tidak ada.
export async function getMuaBySlug(slug) {
  if (isDemoMode) return demoProfiles.find((m) => m.slug === slug) ?? null

  const { data, error } = await supabase
    .from('mua_profiles')
    .select('*, packages(*), portfolio_photos(*), mua_categories(categories(id, name))')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const { packages, portfolio_photos, mua_categories, ...profile } = data
  return {
    ...profile,
    packages: [...packages].sort((a, b) => a.price - b.price),
    photos: [...portfolio_photos].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    categories: mua_categories.map((mc) => mc.categories),
  }
}
