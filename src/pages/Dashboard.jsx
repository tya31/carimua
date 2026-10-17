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

  if (error) return <p className="text-red-600">Gagal memuat dashboard: {error.message}</p>
  if (!data) return <p className="text-gray-500">Memuat…</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard MUA</h1>
          <p className="text-sm text-gray-500">Login sebagai {user.email}</p>
        </div>
        {data.profile && (
          <Link to={`/mua/${data.profile.slug}`} className="text-sm font-semibold text-rose-600 hover:underline">
            Lihat profil publik →
          </Link>
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
