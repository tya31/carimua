import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { distanceKm, INDONESIA_CENTER, reverseGeocode, suggestPlaces } from '../lib/geo.js'
import Icon from './Icon.jsx'

// Pin berbentuk tetesan merah (pakai HTML, supaya tidak perlu file gambar Leaflet).
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#e2485a,#7d1421);border:3px solid #fdf4f2;box-shadow:0 6px 16px rgba(0,0,0,.5)"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

// Lingkaran area berangkat MUA (sengaja tidak persis, supaya alamat rumah MUA tidak terlihat).
const ORIGIN_RADIUS_M = 800

// Klik di peta → pindahkan pin.
function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// Atur tampilan peta: kalau ada titik asal & tujuan → tampilkan keduanya; kalau tidak → terbang ke titik.
function ViewController({ focus, origin }) {
  const map = useMap()
  useEffect(() => {
    if (!focus) return
    if (origin) {
      map.flyToBounds(
        L.latLngBounds([origin.lat, origin.lng], [focus.lat, focus.lng]).pad(0.25),
        { duration: 0.8, maxZoom: 16 },
      )
    } else {
      map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
    }
  }, [map, focus, origin])
  return null
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-ink-800 px-4 py-2.5 text-sm text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none'

// value: { lat, lng } atau null. onChange({ lat, lng, address? }) dipanggil setiap pin berpindah.
// origin (opsional): { lat, lng, label } = titik berangkat MUA. Peta dibuka di sana, saran alamat
// diutamakan yang dekat, dan garis putus-putus menunjukkan jarak ke titik klien.
// distanceFrom (opsional): titik ASLI untuk angka jarak (origin boleh disamarkan untuk tampilan).
// Penting: kirim origin yang stabil (useMemo), supaya peta tidak bergerak ulang setiap render.
function LocationPicker({ value, onChange, origin = null, distanceFrom = origin, height = 340 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [focus, setFocus] = useState(null)
  const abortRef = useRef(null)
  const chosenRef = useRef(null) // teks alamat yang baru dipilih → jangan dicari ulang

  async function pick(lat, lng, address) {
    onChange({ lat, lng, address })
    if (!address) {
      const found = await reverseGeocode(lat, lng).catch(() => null)
      if (found) onChange({ lat, lng, address: found })
    }
  }

  // Saran alamat otomatis: dicari 400 ms setelah berhenti mengetik (minimal 3 huruf).
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3 || q === chosenRef.current) return
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(true)
      setError(null)
      try {
        const rows = await suggestPlaces(q, origin, controller.signal)
        setResults(rows)
        setOpen(true)
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        if (abortRef.current === controller) setBusy(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, origin])

  function choose(r) {
    setOpen(false)
    chosenRef.current = r.label
    setQuery(r.label)
    setFocus({ lat: r.lat, lng: r.lng })
    pick(r.lat, r.lng, r.label)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError('Browser tidak mendukung lokasi.')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setFocus(point)
        pick(point.lat, point.lng)
      },
      () => setError('Izin lokasi ditolak. Ketik alamat atau klik di peta saja.'),
    )
  }

  const start = value ?? origin ?? INDONESIA_CENTER
  const startZoom = value ? 15 : origin ? 12 : INDONESIA_CENTER.zoom
  const km = distanceFrom && value ? distanceKm(distanceFrom.lat, distanceFrom.lng, value.lat, value.lng) : null

  return (
    <div className="space-y-3">
      {/* Bukan <form>: komponen ini dipakai DI DALAM form lain (form tidak boleh bersarang). */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.trim().length < 3) setOpen(false)
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault() // jangan sampai mengirim form induk
                if (results[0]) choose(results[0])
              }
            }}
            placeholder="Ketik alamat, gedung, atau nama tempat…"
            className={inputClass}
            autoComplete="off"
          />
          {busy && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-blush-400">mencari…</span>}

          {/* Daftar rekomendasi alamat */}
          {open && results.length > 0 && (
            <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-ink-800 py-1 text-sm shadow-2xl">
              {results.map((r) => (
                <li key={`${r.lat},${r.lng}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(r)}
                    className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-blush-200 hover:bg-white/5 hover:text-white"
                  >
                    <Icon name="pin" className="mt-0.5 h-4 w-4 text-wine-300" />
                    <span className="min-w-0 flex-1">{r.label}</span>
                    {distanceFrom && (
                      <span className="shrink-0 text-xs text-blush-400">
                        ± {distanceKm(distanceFrom.lat, distanceFrom.lng, r.lat, r.lng)} km
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm text-blush-100 hover:border-wine-400"
        >
          <Icon name="locate" /> Lokasi saya
        </button>
      </div>
      {error && <p className="text-sm text-wine-300">{error}</p>}

      <div className="overflow-hidden rounded-3xl border border-white/10" style={{ height }}>
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={startZoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', background: '#f2efe9' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickToPlace onPick={(lat, lng) => pick(lat, lng)} />
          <ViewController focus={focus} origin={origin} />

          {origin && (
            <Circle
              center={[origin.lat, origin.lng]}
              radius={ORIGIN_RADIUS_M}
              pathOptions={{ color: '#a01b2b', weight: 1.5, fillColor: '#e2485a', fillOpacity: 0.15 }}
            >
              <Tooltip direction="top" permanent className="!rounded-full !border-0 !bg-ink-900 !px-3 !py-1 !text-xs !text-blush-50">
                {origin.label ?? 'Titik berangkat MUA'}
              </Tooltip>
            </Circle>
          )}
          {origin && value && (
            <Polyline
              positions={[
                [origin.lat, origin.lng],
                [value.lat, value.lng],
              ]}
              pathOptions={{ color: '#7d1421', weight: 2.5, dashArray: '6 8' }}
            />
          )}
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
      <p className="text-xs text-blush-400">
        {km != null
          ? `Perkiraan jarak dari area MUA: ± ${km} km. Klik di peta atau geser pin untuk menyesuaikan titik.`
          : 'Ketik alamat untuk melihat rekomendasi, klik di peta, atau pakai lokasimu sekarang.'}
      </p>
    </div>
  )
}

export default LocationPicker
