import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import PackagesManager from '../components/dashboard/PackagesManager.jsx'
import PhotosManager from '../components/dashboard/PhotosManager.jsx'
import ProfileForm from '../components/dashboard/ProfileForm.jsx'
import { supabase } from '../lib/supabase.js'

// Ambil semua data milik MUA yang login. RLS tetap menjaga: walau query ini
// diubah-ubah, MUA tetap hanya bisa MENGUBAH baris dengan id/mua_id miliknya.
async function loadDashboard(userId) {
  const [profile, categories, myCategories, packages, photos] = await Promise.all([
    supabase.from('mua_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('categories').select('id, name').order('id'),
    supabase.from('mua_categories').select('category_id').eq('mua_id', userId),
    supabase.from('packages').select('*').eq('mua_id', userId).order('price'),
    supabase.from('portfolio_photos').select('*').eq('mua_id', userId).order('created_at'),
  ])
  const failed = [profile, categories, myCategories, packages, photos].find((r) => r.error)
  if (failed) throw failed.error

  return {
    profile: profile.data,
    categories: categories.data,
    categoryIds: myCategories.data.map((r) => r.category_id),
    packages: packages.data,
    photos: photos.data,
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
              {data.packages.length} paket · {data.photos.length} foto
            </span>
          </div>
        )}
      </div>

      <ProfileForm
        // key: form di-reset dengan data terbaru setiap profil tersimpan
        key={data.profile ? `${data.profile.slug}-${data.profile.avatar_url}` : 'new'}
        userId={user.id}
        profile={data.profile}
        categories={data.categories}
        categoryIds={data.categoryIds}
        onSaved={reload}
      />

      {data.profile && (
        <>
          <PackagesManager userId={user.id} packages={data.packages} onChanged={reload} />
          <PhotosManager userId={user.id} photos={data.photos} onChanged={reload} />
        </>
      )}
    </div>
  )
}

export default Dashboard
