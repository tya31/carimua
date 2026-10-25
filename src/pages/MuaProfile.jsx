import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import StartChatButton from '../components/chat/StartChatButton.jsx'
import Icon from '../components/Icon.jsx'
import LookModal from '../components/LookModal.jsx'
import MediaView from '../components/MediaView.jsx'
import { getMuaBySlug } from '../lib/api.js'
import { formatPriceRange, formatRupiah, instagramLink, whatsappLink } from '../lib/format.js'

function SectionTitle({ serif, bold }) {
  return (
    <h2 className="leading-none">
      <span className="font-display text-4xl italic text-blush-200 sm:text-5xl">{serif} </span>
      <span className="text-3xl font-extrabold uppercase tracking-tight text-blush-50 sm:text-4xl">{bold}</span>
    </h2>
  )
}

function MuaProfile() {
  // :slug di rute /mua/:slug, misalnya /mua/rina-makeup → slug = "rina-makeup"
  const { slug } = useParams()
  const { role } = useAuth()
  const [result, setResult] = useState({ slug: null, mua: null, error: null })
  const [openLook, setOpenLook] = useState(null)
  const [copied, setCopied] = useState(false)
  const closeLook = useCallback(() => setOpenLook(null), [])

  useEffect(() => {
    let ignore = false
    getMuaBySlug(slug)
      .then((mua) => !ignore && setResult({ slug, mua, error: null }))
      .catch((error) => !ignore && setResult({ slug, mua: null, error }))
    return () => {
      ignore = true
    }
  }, [slug])

  if (result.slug !== slug) {
    return <div className="h-80 animate-pulse rounded-[2.5rem] bg-white/5" />
  }
  if (result.error) return <p className="text-wine-300">Gagal memuat profil: {result.error.message}</p>
  if (!result.mua) {
    return (
      <section className="py-20 text-center">
        <h1 className="font-display text-5xl text-blush-50">MUA tidak ditemukan</h1>
        <Link to="/mua" className="mt-6 inline-block text-wine-300 hover:underline">
          ← Kembali ke daftar MUA
        </Link>
      </section>
    )
  }

  const { mua } = result
  const prices = mua.packages.map((p) => p.price)
  const firstName = mua.name.split(' ')[0]
  // Semua video dari semua look, untuk bagian "Videography".
  const videos = mua.looks.flatMap((look) =>
    look.media.filter((m) => m.type === 'video').map((media) => ({ media, look })),
  )

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className="space-y-6">
      <Link to="/mua" className="text-sm text-blush-300 hover:text-white">
        ← Kembali
      </Link>

      {/* ---------- HEADER ala "Portfolio" ---------- */}
      <header className="relative grid overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-800 via-wine-900 to-ink-900 md:grid-cols-[1.4fr_1fr]">
        <div className="halftone absolute -left-10 -top-10 h-56 w-56 rounded-full opacity-30" />
        <div className="relative flex flex-col justify-between gap-8 p-7 sm:p-10">
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-widest">
            {['Portofolio', 'Paket', 'Kontak'].map((label) => (
              <a key={label} href={`#${label.toLowerCase()}`} className="rounded-full border border-white/15 px-3 py-1 text-blush-200 hover:text-white">
                {label}
              </a>
            ))}
          </div>
          <div>
            <p className="font-display text-5xl italic leading-none text-blush-200 sm:text-6xl">{firstName}&apos;s</p>
            <h1 className="text-5xl font-extrabold uppercase leading-none tracking-tight text-blush-50 sm:text-7xl">
              Portfolio
            </h1>
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-blush-300">
              {mua.name} · Makeup Artist
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-blush-200">
            <span className="flex items-center gap-1.5"><Icon name="pin" className="h-3.5 w-3.5" /> {mua.area ? `${mua.area}, ${mua.city}` : mua.city}</span>
            <span className="font-semibold text-wine-300">
              {prices.length ? formatPriceRange(Math.min(...prices), Math.max(...prices)) : 'Belum ada paket'}
            </span>
          </div>
        </div>
        <div className="relative min-h-72">
          {mua.avatar_url ? (
            <img src={mua.avatar_url} alt={mua.name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="halftone absolute inset-0 flex items-center justify-center bg-wine-950 font-display text-9xl text-blush-100">
              {mua.name.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-wine-900/80 via-transparent to-transparent md:from-wine-900" />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        {/* ---------- KONTAK & LINK ---------- */}
        <section id="kontak" className="glass flex flex-col gap-3 rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-wine-300">let&apos;s talk</p>
          {role !== 'mua' && (
            <Link
              to={`/mua/${mua.slug}/booking`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-wine-gradient px-6 py-3.5 text-center font-semibold text-white shadow-lg shadow-wine-700/40 transition hover:brightness-110"
            >
              <Icon name="calendar" /> Booking sekarang
            </Link>
          )}
          {role !== 'mua' && (
            <StartChatButton
              otherId={mua.id}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-center text-sm text-blush-100 transition hover:border-wine-400"
            >
              <Icon name="chat" /> Chat MUA
            </StartChatButton>
          )}
          {mua.whatsapp && (
            <a
              href={whatsappLink(mua.whatsapp, mua.name)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-center text-sm text-blush-100 transition hover:border-wine-400"
            >
              <Icon name="phone" /> Hubungi via WhatsApp
            </a>
          )}
          {mua.transport_rate_per_km > 0 && (
            <p className="text-center text-xs text-blush-400">
              Transport {formatRupiah(mua.transport_rate_per_km)}/km
              {mua.free_km > 0 && ` · gratis ${mua.free_km} km pertama`}
            </p>
          )}
          {mua.instagram && (
            <a
              href={instagramLink(mua.instagram)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-center text-sm text-blush-100 transition hover:border-wine-400"
            >
              <Icon name="instagram" /> @{mua.instagram}
            </a>
          )}
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm text-blush-100 transition hover:border-wine-400"
          >
            <Icon name={copied ? 'check' : 'link'} /> {copied ? 'Link tersalin' : 'Salin link profil'}
          </button>
        </section>

        {/* ---------- BIO & SPESIALISASI ---------- */}
        <section className="glass rounded-[2rem] p-6">
          <SectionTitle serif="my niche &" bold="specialities" />
          <div className="mt-5 flex flex-wrap gap-2">
            {mua.categories.map((c) => (
              <span key={c.id} className="rounded-full bg-wine-800/70 px-4 py-1.5 text-sm text-blush-50">
                {c.name}
              </span>
            ))}
          </div>
          {mua.bio && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-blush-200">{mua.bio}</p>}
        </section>
      </div>

      {/* ---------- PAKET ---------- */}
      <section id="paket" className="rounded-[2.5rem] bg-ink-800 p-6 sm:p-10">
        <SectionTitle serif="price" bold="list" />
        {mua.packages.length === 0 ? (
          <p className="mt-4 text-blush-300">MUA ini belum menambahkan paket.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mua.packages.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-3xl p-6 ${i === mua.packages.length - 1 ? 'bg-wine-gradient text-white' : 'border border-white/10 bg-ink-900'}`}
              >
                <p className="text-sm uppercase tracking-widest text-blush-200">{p.name}</p>
                <p className="mt-3 font-display text-4xl text-blush-50">{formatRupiah(p.price)}</p>
                {p.description && <p className="mt-3 text-sm text-blush-200">{p.description}</p>}
              </div>
            ))}
          </div>
        )}
      </section>


      {/* ---------- VIDEO (ala "Recent Videography") ---------- */}
      {videos.length > 0 && (
        <section className="rounded-[2.5rem] bg-ink-800 p-6 sm:p-10">
          <div className="text-center">
            <p className="font-display text-5xl italic text-blush-200 sm:text-6xl">Recent</p>
            <p className="-mt-2 text-4xl font-extrabold uppercase tracking-tight text-blush-50 sm:text-5xl">Videography</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map(({ media, look }) => (
              <button key={media.id} type="button" onClick={() => setOpenLook(look)} className="group text-center">
                {/* Bingkai HP */}
                <div className="mx-auto overflow-hidden rounded-[1.8rem] border-[6px] border-ink-950 bg-ink-950 shadow-xl shadow-black/50">
                  <MediaView media={media} preview className="aspect-[9/16] w-full transition duration-500 group-hover:scale-105" />
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-blush-50">{look.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---------- LOOKS (ala "Photography Snapshot") ---------- */}
      <section id="portofolio" className="rounded-[2.5rem] bg-wine-950/60 p-6 sm:p-10">
        <div className="text-center">
          <p className="font-display text-5xl italic text-blush-200 sm:text-6xl">Makeup</p>
          <p className="-mt-2 text-4xl font-extrabold uppercase tracking-tight text-blush-50 sm:text-5xl">Looks</p>
          <p className="mt-2 text-sm text-blush-300">Klik look untuk lihat semua foto, model, & produk yang dipakai.</p>
        </div>
        {mua.looks.length === 0 ? (
          <p className="mt-6 text-center text-blush-300">Belum ada portofolio.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mua.looks.map((look) => (
              <button
                key={look.id}
                type="button"
                onClick={() => setOpenLook(look)}
                className="group overflow-hidden rounded-3xl bg-ink-800 p-2 text-left transition hover:bg-ink-700"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <MediaView
                    media={look.media[0]}
                    alt={look.title}
                    preview
                    className="h-full w-full transition duration-500 group-hover:scale-105"
                  />
                  {look.media.length > 1 && (
                    <span className="glass absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] text-blush-50">
                      +{look.media.length - 1}
                    </span>
                  )}
                </div>
                <div className="px-2 pb-1 pt-2">
                  <p className="truncate text-sm font-semibold text-blush-50">{look.title}</p>
                  <p className="truncate text-xs text-blush-300">
                    {[look.model_name, look.products.length ? `${look.products.length} produk` : null]
                      .filter(Boolean)
                      .join(' · ') || '✦'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {openLook && <LookModal look={openLook} onClose={closeLook} />}
    </article>
  )
}

export default MuaProfile
