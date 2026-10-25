import { useMemo, useState } from 'react'
import { BOOKING_STATUS, formatDate, formatTime, todayIso } from '../lib/bookings.js'

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const monthFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })

const DOT = {
  pending_payment: 'bg-amber-300',
  confirmed: 'bg-emerald-400',
  completed: 'bg-blush-300',
  cancelled: 'bg-wine-400/60',
}

const iso = (d) => d.toLocaleDateString('en-CA')

// Kalender bulanan berisi titik-titik booking. Klik tanggal → daftar booking hari itu.
// nameOf(booking) → teks nama lawan (nama MUA untuk klien, nama klien untuk MUA).
function BookingCalendar({ bookings, nameOf }) {
  const today = todayIso()
  // Mulai dari bulan booking aktif terdekat, kalau tidak ada → bulan ini.
  const firstUpcoming = bookings
    .filter((b) => b.event_date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0]
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${firstUpcoming?.event_date ?? today}T00:00:00`)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState(firstUpcoming?.event_date ?? null)

  const byDate = useMemo(() => {
    const map = {}
    for (const b of bookings) (map[b.event_date] ??= []).push(b)
    return map
  }, [bookings])

  // Sel kalender: kosong di awal supaya tanggal 1 jatuh di hari yang benar (Senin = kolom pertama).
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const lead = (first.getDay() + 6) % 7
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return [
      ...Array(lead).fill(null),
      ...Array.from({ length: days }, (_, i) => iso(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))),
    ]
  }, [cursor])

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))
  const dayBookings = selected ? byDate[selected] ?? [] : []


  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-ink-900/80 p-5 sm:p-6 md:grid-cols-[300px_1fr]">
      {/* Kalender kecil */}
      <div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="rounded-full px-2 py-1 text-blush-300 hover:text-white" aria-label="Bulan sebelumnya">
            ‹
          </button>
          <span className="text-sm font-semibold capitalize text-blush-50">{monthFmt.format(cursor)}</span>
          <button type="button" onClick={() => shift(1)} className="rounded-full px-2 py-1 text-blush-300 hover:text-white" aria-label="Bulan berikutnya">
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-[10px] uppercase tracking-wider text-blush-400">
          {DAYS.map((d) => (
            <span key={d}>{d.slice(0, 2)}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {cells.map((date, i) =>
            date === null ? (
              <span key={`x${i}`} />
            ) : (
              <button
                key={date}
                type="button"
                onClick={() => setSelected(date)}
                className={`relative flex h-9 items-center justify-center rounded-lg text-xs transition ${
                  selected === date
                    ? 'bg-wine-gradient font-semibold text-white'
                    : date === today
                      ? 'border border-wine-400/60 text-blush-50'
                      : 'text-blush-200 hover:bg-white/5'
                }`}
              >
                {Number(date.slice(8))}
                {byDate[date] && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {byDate[date].slice(0, 3).map((b) => (
                      <span key={b.id} className={`h-1 w-1 rounded-full ${DOT[b.status]}`} />
                    ))}
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-blush-400">
          {['confirmed', 'pending_payment', 'completed'].map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[s]}`} /> {BOOKING_STATUS[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Jadwal di tanggal terpilih */}
      <div className="min-w-0 md:border-l md:border-white/10 md:pl-5">
        <p className="text-xs uppercase tracking-[0.25em] text-wine-300">jadwal</p>
        <p className="mt-1 font-display text-2xl text-blush-50">{selected ? formatDate(selected) : 'Pilih tanggal'}</p>
        {selected &&
          (dayBookings.length === 0 ? (
            <p className="mt-3 text-sm text-blush-400">Tidak ada jadwal di tanggal ini.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {dayBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
                  <span className="min-w-0 text-blush-50">
                    {formatTime(b.event_time)} · {b.package_name}
                    <span className="block truncate text-xs text-blush-300">{nameOf(b)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${BOOKING_STATUS[b.status].className}`}>
                    {BOOKING_STATUS[b.status].label}
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </section>
  )
}

export default BookingCalendar