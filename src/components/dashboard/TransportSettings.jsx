import { useState } from 'react'
import { formatRupiah } from '../../lib/format.js'
import { supabase } from '../../lib/supabase.js'
import LocationPicker from '../LocationPicker.jsx'
import { cardClass, inputClass, labelClass, primaryButton } from './ui.js'

// Lokasi dasar MUA (titik berangkat) + tarif transport per km.
function TransportSettings({ userId, profile, onSaved }) {
  const [point, setPoint] = useState(
    profile.base_lat != null ? { lat: profile.base_lat, lng: profile.base_lng } : null,
  )
  const [address, setAddress] = useState(profile.base_address ?? '')
  const [rate, setRate] = useState(String(profile.transport_rate_per_km ?? 0))
  const [freeKm, setFreeKm] = useState(String(profile.free_km ?? 0))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSave(e) {
    e.preventDefault()
    if (!point) return setMessage({ type: 'error', text: 'Tandai lokasimu di peta dulu.' })
    setBusy(true)
    setMessage(null)
    const { error } = await supabase
      .from('mua_profiles')
      .update({
        base_lat: point.lat,
        base_lng: point.lng,
        base_address: address.trim() || null,
        transport_rate_per_km: Number(rate) || 0,
        free_km: Number(freeKm) || 0,
      })
      .eq('id', userId)
    setBusy(false)
    if (error) return setMessage({ type: 'error', text: error.message })
    setMessage({ type: 'info', text: 'Tersimpan ✓' })
    onSaved()
  }

  return (
    <form onSubmit={handleSave} className={cardClass}>
      <h2 className="font-display text-4xl text-blush-50">Lokasi & Transport</h2>
      <p className="mt-1 text-sm text-blush-300">
        Titik berangkatmu. Ongkos transport ke klien dihitung otomatis: (jarak − km gratis) × tarif per km.
      </p>
      {profile.base_lat == null && (
        <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-900/20 p-3 text-sm text-amber-200">
          Klien belum bisa booking sebelum kamu mengatur lokasi.
        </p>
      )}

      <div className="mt-5">
        <LocationPicker
          value={point}
          onChange={({ lat, lng, address: found }) => {
            setPoint({ lat, lng })
            if (found) setAddress(found)
          }}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className={`${labelClass} sm:col-span-3`}>
          Alamat / patokan (hanya untuk kamu, tidak ditampilkan lengkap ke klien)
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Tarif per km (Rp)
          <input type="number" min={0} step={500} value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Gratis ongkos untuk (km pertama)
          <input type="number" min={0} value={freeKm} onChange={(e) => setFreeKm(e.target.value)} className={inputClass} />
        </label>
        <div className="flex items-end text-sm text-blush-300">
          Contoh 15 km: {formatRupiah(Math.ceil(Math.max(15 - (Number(freeKm) || 0), 0)) * (Number(rate) || 0))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Menyimpan…' : 'Simpan lokasi & tarif'}
        </button>
        {message && (
          <span className={`text-sm ${message.type === 'error' ? 'text-wine-300' : 'text-emerald-300'}`}>{message.text}</span>
        )}
      </div>
    </form>
  )
}

export default TransportSettings
