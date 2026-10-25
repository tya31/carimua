import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { INDONESIA_CENTER, reverseGeocode, searchPlace } from '../lib/geo.js'

// Pin berbentuk tetesan merah (pakai HTML, supaya tidak perlu file gambar Leaflet).
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#e2485a,#7d1421);border:3px solid #fdf4f2;box-shadow:0 6px 16px rgba(0,0,0,.5)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

// Klik di peta → pindahkan pin.
function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// Geser tampilan peta setiap titik berubah dari luar (hasil pencarian / lokasi saya).
function FlyTo({ point }) {
  const map = useMap()
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
  }, [map, point])
  return null
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none'

// value: { lat, lng } atau null. onChange({ lat, lng, address? }) dipanggil setiap pin berpindah.
function LocationPicker({ value, onChange, height = 320 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [flyPoint, setFlyPoint] = useState(null)

  async function pick(lat, lng, address) {
    onChange({ lat, lng, address })
    if (!address) {
      const found = await reverseGeocode(lat, lng).catch(() => null)
      if (found) onChange({ lat, lng, address: found })
    }
  }

  async function handleSearch() {
    if (!query.trim()) return
    setBusy(true)
    setError(null)
    try {
      const rows = await searchPlace(query)
      setResults(rows)
      if (rows.length === 0) setError('Alamat tidak ketemu. Coba kata kunci lain, atau klik langsung di peta.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError('Browser tidak mendukung lokasi.')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setFlyPoint(point)
        pick(point.lat, point.lng)
      },
      () => setError('Izin lokasi ditolak. Cari alamat atau klik di peta saja.'),
    )
  }

  const center = value ?? INDONESIA_CENTER

  return (
    <div className="space-y-3">
      {/* Bukan <form>: komponen ini dipakai DI DALAM form lain (form tidak boleh bersarang). */}
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault() // jangan sampai mengirim form induk
              handleSearch()
            }
          }}
          placeholder="Cari alamat, gedung, atau kecamatan…"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button type="button" onClick={handleSearch} disabled={busy} className="rounded-full bg-wine-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? '…' : 'Cari'}
        </button>
        <button type="button" onClick={useMyLocation} className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-blush-100 hover:border-wine-400">
          📍 Lokasi saya
        </button>
      </div>

      {results.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-ink-800 text-sm">
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => {
                  setResults([])
                  setFlyPoint({ lat: r.lat, lng: r.lng })
                  pick(r.lat, r.lng, r.label)
                }}
                className="w-full px-4 py-2 text-left text-blush-200 hover:bg-white/5 hover:text-white"
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-wine-300">{error}</p>}

      <div className="overflow-hidden rounded-3xl border border-white/10" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 15 : INDONESIA_CENTER.zoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: '#0e0607' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <ClickToPlace onPick={(lat, lng) => pick(lat, lng)} />
          <FlyTo point={flyPoint} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng()
                  pick(p.lat, p.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-blush-400">Klik di peta atau geser pin untuk memperbaiki titik lokasi.</p>
    </div>
  )
}

export default LocationPicker
