import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import MuaCard from '../components/MuaCard.jsx'
import MuaFilters from '../components/MuaFilters.jsx'
import { listCategories, listLocations, listMuas } from '../lib/api.js'

const FILTER_KEYS = ['city', 'area', 'category', 'minPrice', 'maxPrice']

function MuaList() {
  // Filter disimpan di URL (?city=Bandung&category=1), jadi hasil filter bisa di-share
  // dan tetap ada saat tombol "Back" ditekan.
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, searchParams.get(k) ?? '']))
  const filterKey = searchParams.toString()

  const [options, setOptions] = useState({ locations: [], categories: [] })
  const [result, setResult] = useState({ key: null, muas: [], error: null })

  // Data dropdown filter: cukup diambil sekali.
  useEffect(() => {
    Promise.all([listLocations(), listCategories()])
      .then(([locations, categories]) => setOptions({ locations, categories }))
      .catch((error) => console.error(error))
  }, [])

  // Ambil ulang daftar MUA setiap filter di URL berubah.
  useEffect(() => {
    let ignore = false
    const current = Object.fromEntries(new URLSearchParams(filterKey))
    listMuas(current)
      .then((muas) => !ignore && setResult({ key: filterKey, muas, error: null }))
      .catch((error) => !ignore && setResult({ key: filterKey, muas: [], error }))
    return () => {
      ignore = true
    }
  }, [filterKey])

  function updateFilters(patch) {
    const next = { ...filters, ...patch }
    setSearchParams(
      Object.fromEntries(Object.entries(next).filter(([, value]) => value)),
      { replace: true },
    )
  }

  const loading = result.key !== filterKey

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.3em] text-wine-400">explore</p>
      <h1 className="mt-2 font-display text-5xl text-blush-50 sm:text-7xl">
        find your <span className="italic text-gradient">MUA.</span>
      </h1>
      <p className="mt-3 text-blush-300">Filter berdasarkan kategori, lokasi, dan budget.</p>

      <div className="mt-8">
        <MuaFilters
          filters={filters}
          onChange={updateFilters}
          locations={options.locations}
          categories={options.categories}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/6] animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : result.error ? (
          <p className="text-wine-300">Gagal memuat data: {result.error.message}</p>
        ) : result.muas.length === 0 ? (
          <div className="glass rounded-[2rem] p-10 text-center">
            <p className="font-display text-4xl text-blush-50">hmm, kosong 🥲</p>
            <p className="mt-2 text-blush-300">Belum ada MUA yang cocok. Coba longgarkan filternya.</p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-sm text-blush-300">
              <span className="font-semibold text-blush-50">{result.muas.length}</span> MUA ditemukan
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {result.muas.map((mua) => (
                <MuaCard key={mua.id} mua={mua} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default MuaList
