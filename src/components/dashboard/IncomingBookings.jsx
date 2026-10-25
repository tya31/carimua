import { useState } from 'react'
import { todayIso } from '../../lib/bookings.js'
import { supabase } from '../../lib/supabase.js'
import BookingCard from '../BookingCard.jsx'
import { cardClass, dangerButton, secondaryButton } from './ui.js'

// Booking yang masuk ke MUA. MUA bisa menandai selesai atau membatalkan.
function IncomingBookings({ bookings, onChanged }) {
  const [error, setError] = useState(null)

  async function setStatus(booking, status, confirmText) {
    if (!window.confirm(confirmText)) return
    setError(null)
    const { error: updateError } = await supabase.from('bookings').update({ status }).eq('id', booking.id)
    if (updateError) return setError(updateError.message)
    onChanged()
  }

  const today = todayIso()
  const upcoming = bookings.filter((b) => b.event_date >= today && ['pending_payment', 'confirmed'].includes(b.status))
  const others = bookings.filter((b) => !upcoming.includes(b))

  const renderList = (list) =>
    list.map((b) => (
      <BookingCard
        key={b.id}
        booking={b}
        viewer="mua"
        actions={
          <>
            {b.status === 'confirmed' && (
              <button type="button" onClick={() => setStatus(b, 'completed', 'Tandai booking ini selesai?')} className={secondaryButton}>
                Tandai selesai
              </button>
            )}
            {['pending_payment', 'confirmed'].includes(b.status) && (
              <button type="button" onClick={() => setStatus(b, 'cancelled', 'Batalkan booking ini?')} className={dangerButton}>
                Batalkan
              </button>
            )}
          </>
        }
      />
    ))

  return (
    <section className={cardClass}>
      <h2 className="font-display text-4xl text-blush-50">Booking Masuk</h2>
      <p className="mt-1 text-sm text-blush-300">Booking berstatus “Menunggu DP” akan terkonfirmasi otomatis setelah klien membayar DP 5%.</p>
      {error && <p className="mt-3 text-sm text-wine-300">{error}</p>}

      {bookings.length === 0 ? (
        <p className="mt-5 text-sm text-blush-300">Belum ada booking. Bagikan link profilmu biar klien makin banyak ✨</p>
      ) : (
        <>
          <h3 className="mt-6 text-xs uppercase tracking-[0.25em] text-wine-300">akan datang</h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-blush-300">Tidak ada jadwal mendatang.</p>
          ) : (
            <ul className="mt-3 space-y-3">{renderList(upcoming)}</ul>
          )}
          {others.length > 0 && (
            <>
              <h3 className="mt-8 text-xs uppercase tracking-[0.25em] text-blush-400">riwayat</h3>
              <ul className="mt-3 space-y-3">{renderList(others)}</ul>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default IncomingBookings
