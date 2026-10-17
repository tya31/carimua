import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMuaBySlug } from '../lib/api.js'
import { formatPriceRange, formatRupiah, whatsappLink } from '../lib/format.js'

function MuaProfile() {
  // :slug di rute /mua/:slug, misalnya /mua/rina-makeup → slug = "rina-makeup"
  const { slug } = useParams()
  const [result, setResult] = useState({ slug: null, mua: null, error: null })
  const [openPhoto, setOpenPhoto] = useState(null)

  useEffect(() => {
    let ignore = false
    getMuaBySlug(slug)
      .then((mua) => !ignore && setResult({ slug, mua, error: null }))
      .catch((error) => !ignore && setResult({ slug, mua: null, error }))
    return () => {
      ignore = true
    }
  }, [slug])

  if (result.slug !== slug) return <p className="text-gray-500">Memuat…</p>
  if (result.error) return <p className="text-red-600">Gagal memuat profil: {result.error.message}</p>
  if (!result.mua) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-2xl font-bold">MUA tidak ditemukan</h1>
        <Link to="/mua" className="mt-4 inline-block text-rose-600 hover:underline">
          ← Kembali ke daftar MUA
        </Link>
      </section>
    )
  }

  const { mua } = result
  const prices = mua.packages.map((p) => p.price)

  return (
    <article className="space-y-8">
      <Link to="/mua" className="text-sm text-rose-600 hover:underline">
        ← Kembali ke daftar MUA
      </Link>

      {/* Header profil */}
      <header className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-rose-100 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-rose-100">
          {mua.avatar_url ? (
            <img src={mua.avatar_url} alt={mua.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl font-bold text-rose-300">
              {mua.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{mua.name}</h1>
          <p className="mt-1 text-gray-500">📍 {mua.area ? `${mua.area}, ${mua.city}` : mua.city}</p>
          <p className="mt-1 font-semibold text-rose-600">
            {prices.length
              ? formatPriceRange(Math.min(...prices), Math.max(...prices))
              : 'Belum ada paket'}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mua.categories.map((c) => (
              <span key={c.id} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700">
                {c.name}
              </span>
            ))}
          </div>
        </div>
        {mua.whatsapp && (
          <a
            href={whatsappLink(mua.whatsapp, mua.name)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-green-600 px-6 py-3 text-center font-semibold text-white hover:bg-green-700"
          >
            Hubungi via WhatsApp
          </a>
        )}
      </header>

      {mua.bio && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900">Tentang</h2>
          <p className="mt-2 whitespace-pre-line text-gray-700">{mua.bio}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Paket & Harga</h2>
        {mua.packages.length === 0 ? (
          <p className="mt-2 text-gray-500">MUA ini belum menambahkan paket.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mua.packages.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-rose-100">
                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-xl font-bold text-rose-600">{formatRupiah(p.price)}</p>
                {p.description && <p className="mt-2 text-sm text-gray-600">{p.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Portofolio</h2>
        {mua.photos.length === 0 ? (
          <p className="mt-2 text-gray-500">Belum ada foto portofolio.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mua.photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setOpenPhoto(photo)}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-rose-100"
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption ?? `Portofolio ${mua.name}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
                {photo.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2 text-left text-xs text-white">
                    {photo.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox: foto diperbesar saat diklik */}
      {openPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpenPhoto(null)}
        >
          <figure className="max-h-full max-w-3xl">
            <img src={openPhoto.image_url} alt={openPhoto.caption ?? ''} className="max-h-[85vh] rounded-xl" />
            {openPhoto.caption && (
              <figcaption className="mt-2 text-center text-white">{openPhoto.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </article>
  )
}

export default MuaProfile
