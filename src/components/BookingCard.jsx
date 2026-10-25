import { Link } from 'react-router-dom'
import { BOOKING_STATUS, formatDate, formatTime, googleCalendarLink } from '../lib/bookings.js'
import { formatRupiah } from '../lib/format.js'
import { formatPaymentType } from '../lib/payments.js'
import StartChatButton from './chat/StartChatButton.jsx'

// Kartu ringkas 1 booking. viewer = 'client' | 'mua' (menentukan siapa "lawan"-nya).
// actions: tombol tambahan (batal/selesai) dari parent. Tombol chat selalu ada.
function BookingCard({ booking, viewer, actions }) {
  const status = BOOKING_STATUS[booking.status]
  const paidPayment = booking.payments?.find((p) => p.status === 'paid')
  const other =
    viewer === 'client'
      ? { name: booking.mua_profiles?.name, link: `/mua/${booking.mua_profiles?.slug}` }
      : { name: booking.profiles?.full_name ?? 'Klien', link: null }

  return (
    <li className="rounded-3xl border border-white/10 bg-ink-800/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-blush-400">
            {formatDate(booking.event_date)} · {formatTime(booking.event_time)}
          </p>
          <p className="mt-1 font-display text-3xl text-blush-50">{booking.package_name}</p>
          <p className="text-sm text-blush-300">
            {viewer === 'client' ? 'MUA: ' : 'Klien: '}
            {other.link ? (
              <Link to={other.link} className="text-blush-100 underline-offset-4 hover:underline">
                {other.name}
              </Link>
            ) : (
              <span className="text-blush-100">{other.name}</span>
            )}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>

      <p className="mt-3 text-sm text-blush-300">📍 {booking.address}</p>
      {booking.notes && <p className="mt-1 text-sm text-blush-300">📝 {booking.notes}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-blush-400">Paket</dt>
          <dd className="text-blush-50">{formatRupiah(booking.package_price)}</dd>
        </div>
        <div>
          <dt className="text-blush-400">Transport ({booking.distance_km} km)</dt>
          <dd className="text-blush-50">{formatRupiah(booking.transport_fee)}</dd>
        </div>
        <div>
          <dt className="text-blush-400">Total</dt>
          <dd className="font-semibold text-blush-50">{formatRupiah(booking.total)}</dd>
        </div>
        <div>
          <dt className="text-blush-400">DP 5%</dt>
          <dd className="font-semibold text-wine-300">{formatRupiah(booking.dp_amount)}</dd>
        </div>
      </dl>

      {paidPayment && (
        <p className="mt-3 text-xs text-emerald-300">
          ✓ DP lunas via {formatPaymentType(paidPayment.payment_type)} ·{' '}
          {new Date(paidPayment.paid_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {actions}
        {['pending_payment', 'confirmed'].includes(booking.status) && (
          <a
            href={googleCalendarLink(
              booking,
              viewer === 'client' ? `Makeup bareng ${other.name}` : `Makeup klien ${other.name}`,
            )}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-blush-100 transition hover:border-wine-400"
          >
            📅 Google Calendar
          </a>
        )}
        <StartChatButton
          otherId={viewer === 'client' ? booking.mua_id : booking.client_id}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-blush-100 transition hover:border-wine-400 disabled:opacity-50"
        >
          💬 Chat {viewer === 'client' ? 'MUA' : 'klien'}
        </StartChatButton>
      </div>
    </li>
  )
}

export default BookingCard
