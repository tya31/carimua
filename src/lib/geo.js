// Hitungan jarak & biaya. HARUS sama dengan fungsi di supabase/04_bookings.sql,
// supaya angka perkiraan di browser = angka final yang dihitung server.

// Jarak garis lurus dikali 1.3 = perkiraan jarak tempuh jalan raya.
export const ROAD_FACTOR = 1.3
export const DP_PERCENT = 5

const toRad = (deg) => (deg * Math.PI) / 180

export function distanceKm(lat1, lng1, lat2, lng2) {
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2
  const km = 2 * 6371 * Math.asin(Math.sqrt(a)) * ROAD_FACTOR
  return Math.round(km * 10) / 10
}

// Ongkos = (jarak − km gratis, dibulatkan ke atas) × tarif per km.
export function transportFee(km, ratePerKm, freeKm = 0) {
  return Math.ceil(Math.max(km - freeKm, 0)) * ratePerKm
}

export const dpAmount = (total) => Math.ceil((total * DP_PERCENT) / 100)

// ---------- Pencarian alamat (OpenStreetMap Nominatim, gratis) ----------
// Aturan pakai Nominatim: maksimal 1 permintaan per detik, jadi hanya dipanggil
// saat user menekan tombol "Cari", bukan setiap ketikan.
const NOMINATIM = 'https://nominatim.openstreetmap.org'

export async function searchPlace(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '5', countrycodes: 'id', 'accept-language': 'id' })
  const res = await fetch(`${NOMINATIM}/search?${params}`)
  if (!res.ok) throw new Error('Pencarian alamat gagal, coba lagi sebentar.')
  const rows = await res.json()
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({ lat, lon: lng, format: 'json', 'accept-language': 'id', zoom: '17' })
  const res = await fetch(`${NOMINATIM}/reverse?${params}`)
  if (!res.ok) return null
  const row = await res.json()
  return row.display_name ?? null
}

// ---------- Saran alamat saat mengetik (Photon, berbasis OpenStreetMap, gratis) ----------
// Nominatim tidak boleh dipakai untuk autocomplete, jadi saran otomatis memakai Photon.
// near: { lat, lng } → hasil yang dekat titik itu diutamakan (misalnya area MUA).
const PHOTON = 'https://photon.komoot.io/api/'
const INDONESIA_BBOX = '95,-11.5,141.5,6.5'

function photonLabel(p) {
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const parts = [p.name, street, p.district ?? p.locality, p.city ?? p.county, p.state]
  return [...new Set(parts.filter(Boolean))].join(', ')
}

export async function suggestPlaces(query, near, signal) {
  const params = new URLSearchParams({ q: query, limit: '6', bbox: INDONESIA_BBOX })
  if (near) {
    params.set('lat', near.lat)
    params.set('lon', near.lng)
  }
  const res = await fetch(`${PHOTON}?${params}`, { signal })
  if (!res.ok) throw new Error('Saran alamat sedang tidak tersedia.')
  const json = await res.json()
  return json.features.map((f) => ({
    label: photonLabel(f.properties),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }))
}

// Titik tengah Indonesia (dipakai kalau belum ada lokasi).
export const INDONESIA_CENTER = { lat: -2.5, lng: 118, zoom: 5 }
