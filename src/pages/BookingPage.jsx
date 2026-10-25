import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker.jsx'
import { getMuaBySlug } from '../lib/api.js'
import { formatDate, tomorrowIso } from '../lib/bookings.js'
import { formatRupiah } from '../lib/format.js'
import { distanceKm, DP_PERCENT, dpAmount, transportFee } from '../lib/geo.js'
import { supabase } from '../lib/supabase.js'

const inputClass =
  'mt-1.5 w-full rounded-2xl border border-white/10 bg-ink-800 px-4 py-3 text-sm text-blush-50 placeholder:text-blush-400 focus:border-wine-400 focus:outline-none'
const labelClass = 'block text-xs font-medium uppercase tracking-wider text-blush-300'
const stepTitle = 'font-display text-3xl text-blush-50'

function BookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [mua, setMua] = useState(null)
  const [busyDates, setBusyDates] = useState([])
  const [loadError, setLoadError] = useState(null)

  const [packageId, setPackageId] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('08:00')
  const [point, setPoint] = useState(null)
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    getMuaBySlug(slug)
      .then(async (data) => {
        if (!data) throw new Error('MUA tidak ditemukan.')
        const { data: dates, error: datesError } = await supabase.rpc('mua_busy_dates', { p_mua: data.id })
        if (datesError) throw datesError
        if (!ignore) {
          setMua(data)
          setBusyDates(dates)
          setPackageId(data.packages[0]?.id ?? null)
        }
      })
      .catch((err) => !ignore && setLoadError(err))
    return () => {
      ignore = true
    }
  }, [slug])

  // Ringkasan biaya (perkiraan; angka final dihitung ulang oleh server saat disimpan).
  const summary = useMemo(() => {
    if (!mua) return null
    const pkg = mua.packages.find((p) => p.id === packageId)
    if (!pkg) return null
    const km = point && mua.base_lat != null ? distanceKm(mua.base_lat, mua.base_lng, point.lat, point.lng) : null
    const fee = km == null ? null : transportFee(km, mua.transport_rate_per_km, mua.free_km)
    const total = fee == null ? null : pkg.price + fee
    return { pkg, km, fee, total, dp: total == null ? null : dpAmount(total) }
  }, [mua, packageId, point])

  if (loadError) return <p className="text-wine-300">{loadError.message}</p>
  if (!mua) return <div className="h-80 animate-pulse rounded-[2.5rem] bg-white/5" />

  const dateTaken = busyDates.includes(date)
  const noLocation = mua.base_lat == null
  const noPackages = mua.packages.length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!point) return setError('Tandai lokasi acara di peta dulu ya.')
    if (dateTaken) return setError('Tanggal itu sudah terisi. Pilih tanggal lain.')
    setBusy(true)
    const { error: insertError } = await supabase.from('bookings').insert({
      mua_id: mua.id,
      package_id: packageId,
      event_date: date,
      event_time: time,
      address: address.trim(),
      lat: point.lat,
      lng: point.lng,
      notes: notes.trim() || null,
      // client_id, harga, jarak, ongkos, total, dan DP sengaja TIDAK dikirim:
      // trigger bookings_before_insert di server yang mengisinya.
    })
    setBusy(false)
    if (insertError) {
      return setError(
        insertError.code === '23505' ? 'Tanggal itu baru saja dibooking orang lain. Pilih tanggal lain.' : insertError.message,
      )
    }
    navigate('/akun', { replace: true, state: { booked: true } })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Link to={`/mua/${mua.slug}`} className="text-sm text-blush-300 hover:text-white">
            ← {mua.name}
          </Link>
          <h1 className="mt-3 font-display text-5xl text-blush-50 sm:text-6xl">
            book <span className="italic text-gradient">your glam.</span>
          </h1>
        </div>

        {(noLocation || noPackages) && (
          <p className="rounded-2xl border border-amber-400/30 bg-amber-900/20 p-4 text-sm text-amber-200">
            {noPackages ? 'MUA ini belum punya paket.' : 'MUA ini belum mengatur lokasi, jadi booking belum bisa dibuat.'}{' '}
            Coba hubungi lewat WhatsApp di profilnya.
          </p>
        )}

        {/* 1. Paket */}
        <section className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6">
          <h2 className={stepTitle}>1. Pilih paket</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {mua.packages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className={`rounded-3xl border p-4 text-left transition ${
                  packageId === p.id ? 'border-wine-400 bg-wine-900/50' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <p className="font-semibold text-blush-50">{p.name}</p>
                <p className="font-display text-2xl text-wine-300">{formatRupiah(p.price)}</p>
                {p.description && <p className="mt-1 text-xs text-blush-300">{p.description}</p>}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Jadwal */}
        <section className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6">
          <h2 className={stepTitle}>2. Tanggal & jam</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Tanggal acara
              <input type="date" required min={tomorrowIso()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              Jam mulai makeup
              <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
            </label>
          </div>
          {dateTaken && <p className="mt-3 text-sm text-wine-300">Tanggal ini sudah terisi, pilih tanggal lain ya.</p>}
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-blush-400">jadwal {mua.name.split(' ')[0]} yang sudah terisi</p>
            {busyDates.length === 0 ? (
              <p className="mt-2 text-sm text-emerald-300">Masih kosong semua ✨</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {busyDates.map((d) => (
                  <span key={d} className="rounded-full bg-wine-900/60 px-3 py-1 text-xs text-blush-100 line-through decoration-wine-400">
                    {formatDate(d)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Lokasi */}
        <section className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6">
          <h2 className={stepTitle}>3. Lokasi acara</h2>
          <p className="mt-1 text-sm text-blush-300">Ongkos transport dihitung otomatis dari jarak MUA ke titik ini.</p>
          <div className="mt-4">
            <LocationPicker
              value={point}
              onChange={({ lat, lng, address: found }) => {
                setPoint({ lat, lng })
                if (found) setAddress(found)
              }}
            />
          </div>
          <label className={`${labelClass} mt-4`}>
            Alamat lengkap (nomor rumah, patokan)
            <textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </label>
          <label className={`${labelClass} mt-4`}>
            Catatan untuk MUA (opsional)
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: pakai hijab, ada 2 orang tambahan, dll."
              className={inputClass}
            />
          </label>
        </section>
      </form>

      {/* Ringkasan biaya (lengket di samping saat scroll) */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine-800 via-wine-900 to-ink-900 p-6">
          <div className="halftone absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-40" />
          <p className="text-xs uppercase tracking-[0.3em] text-wine-300">ringkasan</p>
          <div className="mt-4 flex items-center gap-3">
            {mua.avatar_url && <img src={mua.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div>
              <p className="font-semibold text-blush-50">{mua.name}</p>
              <p className="text-xs text-blush-300">{mua.city}</p>
            </div>
          </div>

          <dl className="relative mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-blush-300">{summary?.pkg.name ?? 'Paket'}</dt>
              <dd className="text-blush-50">{summary ? formatRupiah(summary.pkg.price) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-blush-300">
                Transport {summary?.km != null && `(± ${summary.km} km)`}
                {mua.free_km > 0 && <span className="block text-xs text-blush-400">gratis {mua.free_km} km pertama</span>}
              </dt>
              <dd className="text-blush-50">{summary?.fee != null ? formatRupiah(summary.fee) : 'pilih lokasi'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="font-semibold text-blush-50">Total</dt>
              <dd className="font-display text-3xl text-blush-50">{summary?.total != null ? formatRupiah(summary.total) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 rounded-2xl bg-ink-950/50 px-4 py-3">
              <dt className="text-blush-200">DP {DP_PERCENT}% (dibayar sekarang)</dt>
              <dd className="font-semibold text-wine-300">{summary?.dp != null ? formatRupiah(summary.dp) : '—'}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-blush-400">
            Jarak = perkiraan jarak tempuh. Sisa pembayaran dilunasi langsung ke MUA di hari H.
          </p>

          {error && <p className="mt-4 text-sm text-wine-300">{error}</p>}
          <button
            type="submit"
            form="booking-form"
            disabled={busy || noLocation || noPackages || dateTaken}
            className="mt-5 w-full rounded-full bg-blush-50 py-3.5 font-semibold text-ink-950 transition hover:bg-white disabled:opacity-50"
          >
            {busy ? 'Menyimpan…' : 'Booking sekarang →'}
          </button>
          <p className="mt-2 text-center text-xs text-blush-400">Pembayaran DP tersedia di langkah berikutnya.</p>
        </div>
      </aside>
    </div>
  )
}

export default BookingPage
