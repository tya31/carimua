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
      <h1 className="text-2xl font-bold text-gray-900">Cari MUA</h1>
      <p className="mt-1 text-gray-500">Filter berdasarkan lokasi, kategori, dan budget.</p>

      <div className="mt-6">
        <MuaFilters
          filters={filters}
          onChange={updateFilters}
          locations={options.locations}
          categories={options.categories}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-gray-500">Memuat…</p>
        ) : result.error ? (
          <p className="text-red-600">Gagal memuat data: {result.error.message}</p>
        ) : result.muas.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-gray-500 ring-1 ring-rose-100">
            Belum ada MUA yang cocok dengan filter ini. Coba longgarkan filternya.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">{result.muas.length} MUA ditemukan</p>
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
