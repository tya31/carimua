// Label & warna status booking (dipakai di halaman klien dan dashboard MUA).
export const BOOKING_STATUS = {
  pending_payment: { label: 'Menunggu DP', className: 'bg-amber-900/30 text-amber-200' },
  confirmed: { label: 'Terkonfirmasi', className: 'bg-emerald-900/40 text-emerald-300' },
  completed: { label: 'Selesai', className: 'bg-white/10 text-blush-200' },
  cancelled: { label: 'Dibatalkan', className: 'bg-wine-900/50 text-wine-300' },
}

const dateFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// "2026-11-02" → "Senin, 2 November 2026"
export const formatDate = (isoDate) => dateFormat.format(new Date(`${isoDate}T00:00:00`))

// "09:30:00" → "09.30"
export const formatTime = (time) => time.slice(0, 5).replace(':', '.')

// Hari ini dalam format YYYY-MM-DD (zona waktu perangkat).
export const todayIso = () => new Date().toLocaleDateString('en-CA')

// Besok dalam format YYYY-MM-DD (tanggal booking paling cepat).
export function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA')
}
