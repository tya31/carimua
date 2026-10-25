import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import IncomingBookings from '../components/dashboard/IncomingBookings.jsx'
import InstagramLinkCard from '../components/dashboard/InstagramLinkCard.jsx'
import LooksManager from '../components/dashboard/LooksManager.jsx'
import PackagesManager from '../components/dashboard/PackagesManager.jsx'
import ProfileForm from '../components/dashboard/ProfileForm.jsx'
import TransportSettings from '../components/dashboard/TransportSettings.jsx'
import { MIN_LOOKS } from '../components/dashboard/ui.js'
import BookingCalendar from '../components/BookingCalendar.jsx'
import PaymentHistory from '../components/PaymentHistory.jsx'
import { normalizeLook } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'

// Ambil semua data milik MUA yang login. RLS tetap menjaga: walau query ini
// diubah-ubah, MUA tetap hanya bisa MENGUBAH baris dengan id/mua_id miliknya.
async function loadDashboard(userId) {
  const [profile, categories, myCategories, packages, looks, bookings] = await Promise.all([
    supabase.from('mua_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('categories').select('id, name').order('id'),
    supabase.from('mua_categories').select('category_id').eq('mua_id', userId),
    supabase.from('packages').select('*').eq('mua_id', userId).order('price'),
    supabase.from('looks').select('*, portfolio_photos(*)').eq('mua_id', userId).order('created_at'),
    supabase.from('bookings').select('*, profiles(full_name), payments(*)').eq('mua_id', userId).order('event_date'),
  ])
  const failed = [profile, categories, myCategories, packages, looks, bookings].find((r) => r.error)
  if (failed) throw failed.error

  return {
    profile: profile.data,
    categories: categories.data,
    categoryIds: myCategories.data.map((r) => r.category_id),
    packages: packages.data,
    looks: looks.data.map(normalizeLook),
    bookings: bookings.data,
  }
}

function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0) // naikkan untuk memuat ulang data

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    loadDashboard(user.id)
      .then((result) => !ignore && setData(result))
      .catch((err) => !ignore && setError(err))
    return () => {
      ignore = true
    }
  }, [user.id, version])

  if (error) return <p className="text-wine-300">Gagal memuat dashboard: {error.message}</p>
  if (!data) return <p className="text-blush-300">Memuat…</p>

  const lookCount = data.looks.filter((l) => l.media.length > 0).length
  const listed = lookCount >= MIN_LOOKS

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-800 via-wine-900 to-ink-900 p-7 sm:p-10">
        <div className="halftone absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-40" />
        <p className="text-xs uppercase tracking-[0.3em] text-wine-300">dashboard</p>
        <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-6xl">
          hi, <span className="italic">{data.profile?.name.split(' ')[0] ?? 'gorgeous'}</span> ✦
        </h1>
        <p className="mt-2 text-sm text-blush-300">Login sebagai {user.email}</p>
        {data.profile && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/mua/${data.profile.slug}`}
              className="rounded-full bg-blush-50 px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-white"
            >
              Lihat profil publik →
            </Link>
            <span className="glass rounded-full px-5 py-2.5 text-sm text-blush-200">
              {data.packages.length} paket · {lookCount} look
            </span>
            <span
              className={`rounded-full px-5 py-2.5 text-sm ${
                listed ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/30 text-amber-200'
              }`}
            >
              {listed ? '● Tampil di pencarian' : `○ Belum tampil (butuh ${MIN_LOOKS} look)`}
            </span>
          </div>
        )}
      </div>

      {data.bookings.length > 0 && (
        <BookingCalendar bookings={data.bookings} nameOf={(b) => `Klien: ${b.profiles?.full_name ?? '-'}`} />
      )}

      {data.profile && <IncomingBookings bookings={data.bookings} onChanged={reload} />}

      {data.bookings.length > 0 && <PaymentHistory bookings={data.bookings} />}

      {data.profile && <InstagramLinkCard slug={data.profile.slug} />}

      <ProfileForm
        // key: form di-reset dengan data terbaru setiap profil tersimpan
        key={data.profile ? `${data.profile.slug}-${data.profile.avatar_url}-${data.profile.instagram}` : 'new'}
        userId={user.id}
        profile={data.profile}
        categories={data.categories}
        categoryIds={data.categoryIds}
        onSaved={reload}
      />

      {data.profile && (
        <>
          <LooksManager userId={user.id} looks={data.looks} onChanged={reload} />
          <PackagesManager userId={user.id} packages={data.packages} onChanged={reload} />
          <TransportSettings key={`${data.profile.base_lat}-${data.profile.base_lng}`} userId={user.id} profile={data.profile} onSaved={reload} />
        </>
      )}
    </div>
  )
}

export default Dashboard
