import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import BookingCalendar from '../components/BookingCalendar.jsx'
import Icon from '../components/Icon.jsx'
import BookingCard from '../components/BookingCard.jsx'
import { daysUntil, formatDate, formatTime, googleCalendarLink, todayIso } from '../lib/bookings.js'
import PaymentHistory from '../components/PaymentHistory.jsx'
import { payDp, paymentsEnabled, syncPayment } from '../lib/payments.js'
import { supabase } from '../lib/supabase.js'

const neutralButton =
  'rounded-full border border-white/15 px-4 py-1.5 text-sm text-blush-100 transition hover:border-wine-400 disabled:opacity-50'
const secondaryButton =
  'rounded-full border border-wine-400/40 px-4 py-1.5 text-sm text-wine-300 transition hover:bg-wine-900/50'

function ClientHome() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const firstName = (profile?.full_name || user.email).split(/[ @]/)[0]
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)
  const [payingId, setPayingId] = useState(null)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    supabase
      .from('bookings')
      .select('*, mua_profiles(name, slug), payments(*)')
      .eq('client_id', user.id)
      .order('event_date')
      .then(({ data, error: loadError }) => {
        if (ignore) return
        if (loadError) setError(loadError.message)
        else setBookings(data)
      })
    return () => {
      ignore = true
    }
  }, [user.id, version])

  // Jadwal aktif terdekat (terkonfirmasi / menunggu DP) untuk banner pengingat.
  const today = todayIso()
  const nextBooking = (bookings ?? [])
    .filter((b) => b.event_date >= today && ['confirmed', 'pending_payment'].includes(b.status))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0]
  const nextIn = nextBooking ? daysUntil(nextBooking.event_date) : null

  async function pay(booking) {
    setError(null)
    setPayingId(booking.id)
    try {
      await payDp(booking.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setPayingId(null)
      reload()
    }
  }

  async function checkStatus(booking) {
    setError(null)
    setPayingId(booking.id)
    try {
      await syncPayment(booking.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setPayingId(null)
      reload()
    }
  }

  async function cancel(booking) {
    if (!window.confirm('Batalkan booking ini?')) return
    const { error: updateError } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    if (updateError) return setError(updateError.message)
    reload()
  }

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

      {location.state?.booked && (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-900/30 p-4 text-sm text-emerald-300">
          Booking berhasil dibuat. Statusnya “Menunggu DP” sampai DP 5% dibayar.
        </p>
      )}

      {nextBooking && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-wine-400/40 bg-wine-900/40 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-wine-300">
              {nextIn === 0 ? 'hari ini' : nextIn === 1 ? 'besok' : `${nextIn} hari lagi`}
            </p>
            <p className="mt-1 font-display text-3xl text-blush-50">
              {nextBooking.package_name} · {nextBooking.mua_profiles?.name}
            </p>
            <p className="text-sm text-blush-300">
              {formatDate(nextBooking.event_date)}, jam {formatTime(nextBooking.event_time)}
            </p>
          </div>
          <a
            href={googleCalendarLink(nextBooking, `Makeup bareng ${nextBooking.mua_profiles?.name}`)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-blush-50 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-white"
          >
            <Icon name="calendar" /> Simpan ke Google Calendar
          </a>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <BookingCalendar bookings={bookings} nameOf={(b) => `MUA: ${b.mua_profiles?.name ?? '-'}`} />
      )}

      <section className="rounded-[2rem] border border-white/10 bg-ink-900/80 p-6 sm:p-8">
        <h2 className="font-display text-4xl text-blush-50">Booking kamu</h2>
        {error && <p className="mt-3 text-sm text-wine-300">{error}</p>}
        {bookings === null ? (
          <p className="mt-4 text-sm text-blush-300">Memuat…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-4 text-sm text-blush-300">
            Belum ada booking. Buka profil MUA favoritmu lalu klik <span className="text-blush-50">Booking</span>.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                viewer="client"
                actions={
                  b.status === 'pending_payment' && (
                    <>
                      <button
                        type="button"
                        onClick={() => pay(b)}
                        disabled={!paymentsEnabled || payingId !== null}
                        className="rounded-full bg-wine-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-wine-700/30 transition hover:brightness-110 disabled:opacity-50"
                      >
                        {payingId === b.id ? 'Memproses…' : <><Icon name="card" /> Bayar DP</>}
                      </button>
                      {b.payments?.some((p) => p.status === 'pending') && (
                        <button type="button" onClick={() => checkStatus(b)} disabled={payingId !== null} className={neutralButton}>
                          Cek status bayar
                        </button>
                      )}
                      <button type="button" onClick={() => cancel(b)} className={secondaryButton}>
                        Batalkan
                      </button>
                    </>
                  )
                }
              />
            ))}
          </ul>
        )}
        {!paymentsEnabled && (
          <p className="mt-4 text-xs text-blush-400">Pembayaran belum aktif (VITE_MIDTRANS_CLIENT_KEY belum diisi).</p>
        )}
      </section>

      {bookings && bookings.length > 0 && <PaymentHistory bookings={bookings} />}

    </div>
  )
}

export default ClientHome
