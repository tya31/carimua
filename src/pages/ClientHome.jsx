import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'

// Halaman "rumah" klien. Booking, jadwal, dan chat diisi di fase berikutnya.
const UPCOMING = [
  { emoji: '📅', title: 'Jadwal & booking', text: 'Semua booking-mu dan tanggalnya, plus pengingat H-2.' },
  { emoji: '💬', title: 'Chat MUA', text: 'Ngobrol langsung sama MUA yang kamu booking.' },
  { emoji: '🧾', title: 'Riwayat transaksi', text: 'Catatan DP & pembayaran kamu.' },
]

function ClientHome() {
  const { user, profile } = useAuth()
  const firstName = (profile?.full_name || user.email).split(/[ @]/)[0]

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-800 via-wine-900 to-ink-900 p-7 sm:p-10">
        <div className="halftone absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-40" />
        <p className="text-xs uppercase tracking-[0.3em] text-wine-300">akun klien</p>
        <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
          hi, <span className="italic">{firstName}</span> ✦
        </h1>
        <p className="mt-2 text-sm text-blush-300">Siap glow up? Cari MUA yang cocok buat acaramu.</p>
        <Link
          to="/mua"
          className="mt-6 inline-block rounded-full bg-blush-50 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-white"
        >
          Cari MUA →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {UPCOMING.map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6">
            <span className="text-3xl">{item.emoji}</span>
            <p className="mt-3 font-display text-3xl text-blush-50">{item.title}</p>
            <p className="mt-1 text-sm text-blush-300">{item.text}</p>
            <span className="mt-4 inline-block rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-blush-400">
              segera hadir
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ClientHome
